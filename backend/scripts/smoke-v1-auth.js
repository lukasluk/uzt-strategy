#!/usr/bin/env node

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';

function getBaseUrl() {
  const cli = process.argv.find((arg) => arg.startsWith('--base-url='));
  if (cli) return cli.split('=')[1];
  return process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL;
}

function ensureTrailingSlashRemoved(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_error) {
    json = null;
  }
  return {
    status: response.status,
    json,
    text
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertStatus(actual, expected, label) {
  const list = Array.isArray(expected) ? expected : [expected];
  assert(list.includes(actual), `${label}: expected ${list.join(' or ')}, got ${actual}`);
}

async function login(baseUrl, { email, password, institutionSlug }) {
  return request(baseUrl, '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, institutionSlug })
  });
}

async function run() {
  const baseUrl = ensureTrailingSlashRemoved(getBaseUrl());
  const checks = [];
  const startedAt = Date.now();

  async function check(name, fn) {
    try {
      await fn();
      checks.push({ name, ok: true });
      console.log(`PASS ${name}`);
    } catch (error) {
      checks.push({ name, ok: false, error: error.message });
      console.error(`FAIL ${name}: ${error.message}`);
    }
  }

  let institutions = [];
  await check('load institutions', async () => {
    const res = await request(baseUrl, '/api/v1/public/institutions');
    assertStatus(res.status, 200, 'institutions');
    assert(res.json && Array.isArray(res.json.institutions), 'institutions array is missing');
    institutions = res.json.institutions;
    assert(institutions.length > 0, 'no active institutions found');
  });

  const defaultSlug = institutions[0]?.slug || '';
  assert(defaultSlug, 'cannot continue without institution slug');

  await check('login fails with invalid credentials', async () => {
    const badEmail = `invalid-${Date.now()}@example.com`;
    const res = await login(baseUrl, {
      email: badEmail,
      password: 'invalid-password',
      institutionSlug: defaultSlug
    });
    assertStatus(res.status, 401, 'invalid login');
  });

  await check('invite accept rejects fake token', async () => {
    const res = await request(baseUrl, '/api/v1/invites/accept', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: `fake-token-${Date.now()}`,
        displayName: 'Smoke Test',
        password: 'does-not-matter'
      })
    });
    assertStatus(res.status, 404, 'invite accept fake token');
  });

  const adminEmail = process.env.SMOKE_ADMIN_EMAIL || '';
  const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || '';
  const adminSlug = process.env.SMOKE_ADMIN_SLUG || defaultSlug;

  if (adminEmail && adminPassword) {
    let adminToken = '';
    let adminCycleId = '';
    await check('admin login works', async () => {
      const res = await login(baseUrl, {
        email: adminEmail,
        password: adminPassword,
        institutionSlug: adminSlug
      });
      assertStatus(res.status, 200, 'admin login');
      assert(res.json && typeof res.json.token === 'string', 'admin token missing');
      assert(res.json && res.json.role === 'institution_admin', 'admin role must be institution_admin');
      adminToken = res.json.token;
    });

    await check('admin me/context and role', async () => {
      const res = await request(baseUrl, '/api/v1/me/context', {
        headers: { authorization: `Bearer ${adminToken}` }
      });
      assertStatus(res.status, 200, 'admin me/context');
      assert(res.json?.membership?.role === 'institution_admin', 'membership role is not institution_admin');
      adminCycleId = res.json?.cycle?.id || '';
    });

    if (adminCycleId) {
      await check('admin participants endpoint access', async () => {
        const res = await request(baseUrl, `/api/v1/admin/cycles/${adminCycleId}/participants`, {
          headers: { authorization: `Bearer ${adminToken}` }
        });
        assertStatus(res.status, 200, 'admin participants');
        assert(Array.isArray(res.json?.participants), 'participants array missing');
      });
    } else {
      console.log('SKIP admin participants endpoint access (no active cycle in admin context)');
    }
  } else {
    console.log('SKIP admin credential flow (set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD)');
  }

  const memberEmail = process.env.SMOKE_MEMBER_EMAIL || '';
  const memberPassword = process.env.SMOKE_MEMBER_PASSWORD || '';
  const memberSlug = process.env.SMOKE_MEMBER_SLUG || defaultSlug;

  if (memberEmail && memberPassword) {
    let memberToken = '';
    let memberCycleId = '';
    await check('member login works', async () => {
      const res = await login(baseUrl, {
        email: memberEmail,
        password: memberPassword,
        institutionSlug: memberSlug
      });
      assertStatus(res.status, 200, 'member login');
      assert(res.json && typeof res.json.token === 'string', 'member token missing');
      assert(res.json && res.json.role === 'member', 'member role must be member');
      memberToken = res.json.token;
    });

    await check('member me/context and role', async () => {
      const res = await request(baseUrl, '/api/v1/me/context', {
        headers: { authorization: `Bearer ${memberToken}` }
      });
      assertStatus(res.status, 200, 'member me/context');
      assert(res.json?.membership?.role === 'member', 'membership role is not member');
      memberCycleId = res.json?.cycle?.id || '';
    });

    if (memberCycleId) {
      await check('member can access own vote budget endpoint', async () => {
        const res = await request(baseUrl, `/api/v1/cycles/${memberCycleId}/my-votes`, {
          headers: { authorization: `Bearer ${memberToken}` }
        });
        assertStatus(res.status, 200, 'member my-votes');
        assert(typeof res.json?.budget === 'number', 'budget is missing');
      });

      await check('member blocked from admin endpoint', async () => {
        const res = await request(baseUrl, `/api/v1/admin/cycles/${memberCycleId}/participants`, {
          headers: { authorization: `Bearer ${memberToken}` }
        });
        assertStatus(res.status, 403, 'member admin endpoint guard');
      });
    } else {
      console.log('SKIP member cycle-scoped checks (no active cycle in member context)');
    }
  } else {
    console.log('SKIP member credential flow (set SMOKE_MEMBER_EMAIL and SMOKE_MEMBER_PASSWORD)');
  }

  const failed = checks.filter((item) => !item.ok);
  const passed = checks.length - failed.length;
  const durationMs = Date.now() - startedAt;
  console.log(`\nSmoke v1 auth finished: ${passed}/${checks.length} passed in ${durationMs}ms`);
  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error(`FATAL: ${error.message}`);
  process.exitCode = 1;
});

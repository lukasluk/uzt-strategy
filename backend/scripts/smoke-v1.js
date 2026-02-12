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

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  let bodyText = '';
  let bodyJson = null;
  try {
    bodyText = await response.text();
    bodyJson = bodyText ? JSON.parse(bodyText) : null;
  } catch (_error) {
    bodyJson = null;
  }
  return {
    status: response.status,
    headers: response.headers,
    bodyJson,
    bodyText
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertStatus(actual, allowed, label) {
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  assert(
    allowedList.includes(actual),
    `${label}: expected status ${allowedList.join(' or ')}, got ${actual}`
  );
}

async function run() {
  const baseUrl = ensureTrailingSlashRemoved(getBaseUrl());
  const checks = [];
  const started = Date.now();

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

  await check('health endpoint', async () => {
    const res = await requestJson(baseUrl, '/api/v1/health');
    assertStatus(res.status, 200, 'health');
    assert(res.bodyJson && res.bodyJson.ok === true, 'health response missing ok=true');
    assert(res.bodyJson && res.bodyJson.version === 'v1', 'health response missing version=v1');
  });

  await check('public institutions endpoint', async () => {
    const res = await requestJson(baseUrl, '/api/v1/public/institutions');
    assertStatus(res.status, 200, 'public institutions');
    assert(res.bodyJson && Array.isArray(res.bodyJson.institutions), 'institutions must be an array');
  });

  let institutions = [];
  await check('public strategy map endpoint', async () => {
    const res = await requestJson(baseUrl, '/api/v1/public/strategy-map');
    assertStatus(res.status, 200, 'public strategy map');
    assert(res.bodyJson && Array.isArray(res.bodyJson.institutions), 'strategy-map institutions must be an array');
    institutions = res.bodyJson.institutions;
    for (const institution of institutions) {
      assert(typeof institution.id === 'string' && institution.id.length > 0, 'institution.id missing');
      assert(typeof institution.slug === 'string' && institution.slug.length > 0, 'institution.slug missing');
      assert(typeof institution.name === 'string' && institution.name.length > 0, 'institution.name missing');
      assert(Array.isArray(institution.guidelines), 'institution.guidelines must be an array');
      assert(Array.isArray(institution.initiatives), 'institution.initiatives must be an array');
    }
  });

  await check('auth guard on /me/context', async () => {
    const res = await requestJson(baseUrl, '/api/v1/me/context');
    assertStatus(res.status, 401, 'me/context without token');
  });

  await check('auth guard on admin endpoint', async () => {
    const res = await requestJson(baseUrl, '/api/v1/admin/cycles/fake/participants');
    assertStatus(res.status, 401, 'admin endpoint without token');
  });

  const firstInstitution = institutions.find((item) => typeof item.slug === 'string' && item.slug.length > 0);
  if (firstInstitution) {
    const slug = firstInstitution.slug;

    await check(`public summary endpoint (${slug})`, async () => {
      const res = await requestJson(baseUrl, `/api/v1/public/institutions/${slug}/cycles/current/summary`);
      assertStatus(res.status, [200, 404], 'public summary');
      if (res.status === 404) {
        assert(res.bodyJson && res.bodyJson.error === 'cycle not found', 'expected cycle not found');
        return;
      }
      assert(res.bodyJson && res.bodyJson.institution, 'summary missing institution');
      assert(res.bodyJson && res.bodyJson.cycle, 'summary missing cycle');
      assert(res.bodyJson && res.bodyJson.summary, 'summary missing stats');
    });

    await check(`public guidelines endpoint (${slug})`, async () => {
      const res = await requestJson(baseUrl, `/api/v1/public/institutions/${slug}/cycles/current/guidelines`);
      assertStatus(res.status, [200, 404], 'public guidelines');
      if (res.status === 404) {
        assert(res.bodyJson && res.bodyJson.error === 'cycle not found', 'expected cycle not found');
        return;
      }
      assert(res.bodyJson && Array.isArray(res.bodyJson.guidelines), 'guidelines must be array');
    });

    await check(`public initiatives endpoint (${slug})`, async () => {
      const res = await requestJson(baseUrl, `/api/v1/public/institutions/${slug}/cycles/current/initiatives`);
      assertStatus(res.status, [200, 404], 'public initiatives');
      if (res.status === 404) {
        assert(res.bodyJson && res.bodyJson.error === 'cycle not found', 'expected cycle not found');
        return;
      }
      assert(res.bodyJson && Array.isArray(res.bodyJson.initiatives), 'initiatives must be array');
    });
  }

  const failed = checks.filter((item) => !item.ok);
  const passed = checks.length - failed.length;
  const durationMs = Date.now() - started;
  console.log(`\nSmoke v1 finished: ${passed}/${checks.length} passed in ${durationMs}ms`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(`FATAL: ${error.message}`);
  process.exitCode = 1;
});

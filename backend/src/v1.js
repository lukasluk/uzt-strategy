const crypto = require('crypto');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
}

function createAuthToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function readAuthToken(token, secret) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (expected !== sig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim();
}

async function getInstitutionBySlug(query, slug) {
  const res = await query(
    'select id, name, slug, status from institutions where slug = $1',
    [slug]
  );
  return res.rows[0] || null;
}

async function getCurrentCycle(query, institutionId) {
  const res = await query(
    `select id, institution_id, title, state, results_published, starts_at, ends_at, finalized_at, created_at
     from strategy_cycles
     where institution_id = $1 and state <> 'archived'
     order by created_at desc
     limit 1`,
    [institutionId]
  );
  return res.rows[0] || null;
}

function registerV1Routes({ app, query, broadcast, uuid }) {
  const SUPERADMIN_CODE = process.env.SUPERADMIN_CODE || 'change-me';
  const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-too';
  const META_ADMIN_PASSWORD = process.env.META_ADMIN_PASSWORD || 'Bedarbystės-ratas-sukasi';
  const VOTE_BUDGET = Number(process.env.VOTE_BUDGET || 10);
  const INVITE_TTL_HOURS = Number(process.env.INVITE_TTL_HOURS || 72);
  const AUTH_TTL_HOURS = Number(process.env.AUTH_TTL_HOURS || 12);

  function requireSuperAdmin(req, res, next) {
    const code = String(req.headers['x-superadmin-code'] || '').trim();
    if (!code || code !== SUPERADMIN_CODE) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  }

  function requireMetaAdmin(req, res, next) {
    const rawHeaderPassword = String(req.headers['x-meta-admin-password'] || '').trim();
    const rawBodyPassword = String(req.body?.password || '').trim();
    const password = decodePasswordCandidate(rawHeaderPassword) || decodePasswordCandidate(rawBodyPassword);
    if (!password || password !== META_ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  }

  function decodePasswordCandidate(value) {
    const candidate = String(value || '').trim();
    if (!candidate) return '';
    try {
      return decodeURIComponent(candidate);
    } catch {
      return candidate;
    }
  }

  function requireAuth(req, res, next) {
    const token = parseBearer(req);
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const payload = readAuthToken(token, AUTH_SECRET);
    if (!payload) return res.status(401).json({ error: 'invalid token' });
    req.auth = payload;
    next();
  }

  async function loadGuidelineContext(guidelineId) {
    const res = await query(
      `select g.id as guideline_id,
              g.title,
              g.description,
              g.status as guideline_status,
              c.id as cycle_id,
              c.state as cycle_state,
              c.institution_id
       from strategy_guidelines g
       join strategy_cycles c on c.id = g.cycle_id
       where g.id = $1`,
      [guidelineId]
    );
    return res.rows[0] || null;
  }

  function isCycleWritable(state) {
    return state === 'open' || state === 'review';
  }

  async function validateGuidelineRelationship({ guidelineId, cycleId, relationType, parentGuidelineId }) {
    if (!['orphan', 'parent', 'child'].includes(relationType)) {
      throw new Error('invalid relation type');
    }

    if (relationType !== 'child') {
      return null;
    }

    const parentId = String(parentGuidelineId || '').trim();
    if (!parentId) throw new Error('parent guideline required for child');
    if (parentId === guidelineId) throw new Error('child cannot be parent of itself');

    const parentRes = await query(
      `select id, cycle_id, relation_type
       from strategy_guidelines
       where id = $1`,
      [parentId]
    );
    const parent = parentRes.rows[0];
    if (!parent) throw new Error('parent guideline not found');
    if (parent.cycle_id !== cycleId) throw new Error('parent must be in same cycle');
    if (parent.relation_type !== 'parent') throw new Error('parent guideline must be parent');

    return parent.id;
  }

  function normalizeLineSide(value) {
    const side = String(value || 'auto').trim().toLowerCase();
    if (['auto', 'left', 'right', 'top', 'bottom'].includes(side)) return side;
    return null;
  }

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true, version: 'v1' });
  });

  app.get('/api/v1/public/institutions', async (_req, res) => {
    const institutions = await query(
      'select id, name, slug, status, created_at from institutions where status = $1 order by name asc',
      ['active']
    );
    res.json({ institutions: institutions.rows });
  });

  app.get('/api/v1/public/strategy-map', async (_req, res) => {
    const institutionsRes = await query(
      `select id, name, slug, status, created_at
       from institutions
       where status = 'active'
       order by name asc`
    );
    const institutions = institutionsRes.rows;
    if (!institutions.length) return res.json({ institutions: [] });

    const institutionIds = institutions.map((row) => row.id);
    const cyclesRes = await query(
      `select distinct on (institution_id)
          id, institution_id, title, state, finalized_at, created_at, map_x, map_y
       from strategy_cycles
       where institution_id = any($1::uuid[])
       order by institution_id, created_at desc`,
      [institutionIds]
    );
    const cyclesByInstitution = Object.fromEntries(cyclesRes.rows.map((row) => [row.institution_id, row]));
    const cycleIds = cyclesRes.rows.map((row) => row.id);

    const guidelinesByCycle = {};
    const voteByGuideline = {};
    if (cycleIds.length) {
      const guidelinesRes = await query(
        `select id, cycle_id, title, description, status, relation_type, parent_guideline_id, line_side, map_x, map_y, created_at
         from strategy_guidelines
         where cycle_id = any($1::uuid[])
           and status in ('active', 'merged')
         order by created_at asc`,
        [cycleIds]
      );

      const votesRes = await query(
        `select g.id as guideline_id,
                coalesce(sum(v.score), 0)::int as total_score,
                count(distinct v.voter_id)::int as voter_count
         from strategy_guidelines g
         left join strategy_votes v on v.guideline_id = g.id
         where g.cycle_id = any($1::uuid[])
           and g.status in ('active', 'merged')
         group by g.id`,
        [cycleIds]
      );
      votesRes.rows.forEach((row) => {
        voteByGuideline[row.guideline_id] = {
          totalScore: Number(row.total_score || 0),
          voterCount: Number(row.voter_count || 0)
        };
      });

      guidelinesRes.rows.forEach((row) => {
        if (!guidelinesByCycle[row.cycle_id]) guidelinesByCycle[row.cycle_id] = [];
        guidelinesByCycle[row.cycle_id].push({
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          relationType: row.relation_type || 'orphan',
          parentGuidelineId: row.parent_guideline_id || null,
          lineSide: normalizeLineSide(row.line_side) || 'auto',
          mapX: Number.isFinite(Number(row.map_x)) ? Number(row.map_x) : null,
          mapY: Number.isFinite(Number(row.map_y)) ? Number(row.map_y) : null,
          totalScore: voteByGuideline[row.id]?.totalScore || 0,
          voterCount: voteByGuideline[row.id]?.voterCount || 0,
          createdAt: row.created_at
        });
      });
    }

    res.json({
      institutions: institutions.map((institution) => {
        const cycle = cyclesByInstitution[institution.id] || null;
        return {
          id: institution.id,
          name: institution.name,
          slug: institution.slug,
          status: institution.status,
          createdAt: institution.created_at,
          cycle: cycle
            ? {
                id: cycle.id,
                title: cycle.title,
                state: cycle.state,
                finalizedAt: cycle.finalized_at,
                createdAt: cycle.created_at,
                mapX: Number.isFinite(Number(cycle.map_x)) ? Number(cycle.map_x) : null,
                mapY: Number.isFinite(Number(cycle.map_y)) ? Number(cycle.map_y) : null
              }
            : null,
          guidelines: cycle ? (guidelinesByCycle[cycle.id] || []) : []
        };
      })
    });
  });

  app.get('/api/v1/public/institutions/:slug/cycles/current/summary', async (req, res) => {
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const cycle = await getCurrentCycle(query, institution.id);
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });

    const stats = await query(
      `select
         (select count(*) from strategy_guidelines g where g.cycle_id = $1 and g.status = 'active') as guidelines_count,
         (select count(*) from strategy_comments c join strategy_guidelines g on g.id = c.guideline_id where g.cycle_id = $1 and c.status = 'visible') as comments_count,
         (select count(distinct v.voter_id) from strategy_votes v join strategy_guidelines g on g.id = v.guideline_id where g.cycle_id = $1) as participant_count`,
      [cycle.id]
    );

    res.json({
      institution,
      cycle,
      summary: stats.rows[0]
    });
  });

  app.get('/api/v1/public/institutions/:slug/cycles/current/guidelines', async (req, res) => {
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const cycle = await getCurrentCycle(query, institution.id);
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });

    const guidelines = await query(
      `select id, title, description, status, relation_type, parent_guideline_id, line_side, created_at
       from strategy_guidelines
       where cycle_id = $1 and status = 'active'
       order by created_at asc`,
      [cycle.id]
    );

    const votes = await query(
      `select g.id as guideline_id,
              coalesce(sum(v.score), 0)::int as total_score,
              count(distinct v.voter_id)::int as voter_count
       from strategy_guidelines g
       left join strategy_votes v on v.guideline_id = g.id
       where g.cycle_id = $1 and g.status = 'active'
       group by g.id`,
      [cycle.id]
    );

    const comments = await query(
      `select c.id, c.guideline_id, c.body, c.created_at,
              u.display_name as author_display_name,
              u.email as author_email
       from strategy_comments c
       join strategy_guidelines g on g.id = c.guideline_id
       left join platform_users u on u.id = c.author_id
       where g.cycle_id = $1 and c.status = 'visible'
       order by c.created_at asc`,
      [cycle.id]
    );

    const voteByGuideline = Object.fromEntries(
      votes.rows.map((row) => [row.guideline_id, { totalScore: row.total_score, voterCount: row.voter_count }])
    );
    const commentsByGuideline = comments.rows.reduce((acc, row) => {
      if (!acc[row.guideline_id]) acc[row.guideline_id] = [];
      acc[row.guideline_id].push({
        id: row.id,
        body: row.body,
        authorName: row.author_display_name || row.author_email || 'Nežinomas autorius',
        authorEmail: row.author_email || null,
        createdAt: row.created_at
      });
      return acc;
    }, {});

    res.json({
      institution,
      cycle,
      guidelines: guidelines.rows.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        relationType: g.relation_type || 'orphan',
        parentGuidelineId: g.parent_guideline_id || null,
        lineSide: normalizeLineSide(g.line_side) || 'auto',
        totalScore: voteByGuideline[g.id]?.totalScore || 0,
        voterCount: voteByGuideline[g.id]?.voterCount || 0,
        comments: commentsByGuideline[g.id] || []
      }))
    });
  });

  app.post('/api/v1/meta-admin/auth', (req, res) => {
    const password = decodePasswordCandidate(req.body?.password);
    if (!password || password !== META_ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'forbidden' });
    }
    res.json({ ok: true });
  });

  app.get('/api/v1/meta-admin/overview', requireMetaAdmin, async (_req, res) => {
    const institutionsRes = await query(
      'select id, name, slug, status, created_at from institutions order by created_at desc'
    );
    const usersRes = await query(
      'select id, email, display_name, status, created_at from platform_users order by created_at desc'
    );
    const membershipsRes = await query(
      `select m.id, m.user_id, m.institution_id, m.role, m.status, m.created_at,
              i.name as institution_name, i.slug as institution_slug
       from institution_memberships m
       join institutions i on i.id = m.institution_id
       order by m.created_at desc`
    );
    const invitesRes = await query(
      `select inv.id, inv.institution_id, inv.email, inv.role, inv.expires_at, inv.used_at, inv.revoked_at, inv.created_at,
              i.name as institution_name, i.slug as institution_slug
       from institution_invites inv
       join institutions i on i.id = inv.institution_id
       order by inv.created_at desc
       limit 300`
    );

    const membershipsByUser = membershipsRes.rows.reduce((acc, row) => {
      if (!acc[row.user_id]) acc[row.user_id] = [];
      acc[row.user_id].push({
        id: row.id,
        institutionId: row.institution_id,
        institutionName: row.institution_name,
        institutionSlug: row.institution_slug,
        role: row.role,
        status: row.status,
        createdAt: row.created_at
      });
      return acc;
    }, {});

    const pendingInvites = invitesRes.rows
      .filter((row) => !row.used_at && !row.revoked_at && new Date(row.expires_at).getTime() > Date.now())
      .map((row) => ({
        id: row.id,
        institutionId: row.institution_id,
        institutionName: row.institution_name,
        institutionSlug: row.institution_slug,
        email: row.email,
        role: row.role,
        expiresAt: row.expires_at,
        createdAt: row.created_at
      }));

    res.json({
      institutions: institutionsRes.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        createdAt: row.created_at
      })),
      users: usersRes.rows.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        status: row.status,
        createdAt: row.created_at,
        memberships: membershipsByUser[row.id] || []
      })),
      pendingInvites
    });
  });

  app.post('/api/v1/meta-admin/institutions', requireMetaAdmin, async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const slugInput = String(req.body?.slug || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });

    const slug = slugify(slugInput || name);
    if (!slug) return res.status(400).json({ error: 'invalid slug' });

    const existing = await query('select id from institutions where slug = $1', [slug]);
    if (existing.rowCount > 0) return res.status(409).json({ error: 'slug already exists' });

    const institutionId = uuid();
    const cycleId = uuid();
    await query(
      `insert into institutions (id, name, slug, status)
       values ($1, $2, $3, 'active')`,
      [institutionId, name, slug]
    );
    await query(
      `insert into strategy_cycles (id, institution_id, title, state, results_published, starts_at)
       values ($1, $2, $3, 'open', false, now())`,
      [cycleId, institutionId, `${name} strategijos ciklas`]
    );

    res.status(201).json({
      institutionId,
      cycleId,
      slug
    });
  });

  app.post('/api/v1/meta-admin/institutions/:institutionId/invites', requireMetaAdmin, async (req, res) => {
    const institutionId = String(req.params.institutionId || '').trim();
    const email = normalizeEmail(req.body?.email);
    const role = String(req.body?.role || 'member').trim();
    if (!institutionId || !email) return res.status(400).json({ error: 'institutionId and email required' });
    if (!['institution_admin', 'member'].includes(role)) return res.status(400).json({ error: 'invalid role' });

    const exists = await query('select id from institutions where id = $1', [institutionId]);
    if (exists.rowCount === 0) return res.status(404).json({ error: 'institution not found' });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(inviteToken);
    const inviteId = uuid();

    await query(
      `insert into institution_invites (id, institution_id, email, role, token_hash, expires_at)
       values ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval)`,
      [inviteId, institutionId, email, role, tokenHash, String(INVITE_TTL_HOURS)]
    );

    res.status(201).json({ inviteId, inviteToken, email, role });
  });

  app.put('/api/v1/meta-admin/users/:userId/status', requireMetaAdmin, async (req, res) => {
    const userId = String(req.params.userId || '').trim();
    const status = String(req.body?.status || '').trim();
    if (!userId || !['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'userId and valid status required' });
    }

    const result = await query(
      'update platform_users set status = $1 where id = $2',
      [status, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'user not found' });
    res.json({ ok: true, status });
  });

  app.put('/api/v1/meta-admin/memberships/:membershipId/status', requireMetaAdmin, async (req, res) => {
    const membershipId = String(req.params.membershipId || '').trim();
    const status = String(req.body?.status || '').trim();
    if (!membershipId || !['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'membershipId and valid status required' });
    }

    const result = await query(
      'update institution_memberships set status = $1 where id = $2',
      [status, membershipId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'membership not found' });
    res.json({ ok: true, status });
  });

  app.post('/api/v1/superadmin/institutions', requireSuperAdmin, async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const slugInput = String(req.body?.slug || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });

    const slug = slugify(slugInput || name);
    if (!slug) return res.status(400).json({ error: 'invalid slug' });

    const existing = await query('select id from institutions where slug = $1', [slug]);
    if (existing.rowCount > 0) return res.status(409).json({ error: 'slug already exists' });

    const institutionId = uuid();
    const cycleId = uuid();
    await query(
      `insert into institutions (id, name, slug, status)
       values ($1, $2, $3, 'active')`,
      [institutionId, name, slug]
    );
    await query(
      `insert into strategy_cycles (id, institution_id, title, state, results_published, starts_at)
       values ($1, $2, $3, 'open', false, now())`,
      [cycleId, institutionId, `${name} strategijos ciklas`]
    );

    res.status(201).json({
      institutionId,
      cycleId,
      slug
    });
  });

  app.post('/api/v1/superadmin/institutions/:institutionId/invites', requireSuperAdmin, async (req, res) => {
    const institutionId = String(req.params.institutionId || '').trim();
    const email = normalizeEmail(req.body?.email);
    const role = String(req.body?.role || 'institution_admin').trim();
    if (!institutionId || !email) return res.status(400).json({ error: 'institutionId and email required' });
    if (!['institution_admin', 'member'].includes(role)) return res.status(400).json({ error: 'invalid role' });

    const exists = await query('select id from institutions where id = $1', [institutionId]);
    if (exists.rowCount === 0) return res.status(404).json({ error: 'institution not found' });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(inviteToken);
    const inviteId = uuid();

    await query(
      `insert into institution_invites (id, institution_id, email, role, token_hash, expires_at)
       values ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval)`,
      [inviteId, institutionId, email, role, tokenHash, String(INVITE_TTL_HOURS)]
    );

    res.status(201).json({ inviteId, inviteToken, email, role });
  });

  app.post('/api/v1/invites/accept', async (req, res) => {
    const token = String(req.body?.token || '').trim();
    const displayName = String(req.body?.displayName || '').trim();
    const password = String(req.body?.password || '');
    if (!token || !displayName) return res.status(400).json({ error: 'token and displayName required' });

    const invite = await query(
      `select id, institution_id, email, role, expires_at, used_at, revoked_at
       from institution_invites
       where token_hash = $1`,
      [sha256(token)]
    );
    const row = invite.rows[0];
    if (!row) return res.status(404).json({ error: 'invite not found' });
    if (row.revoked_at) return res.status(403).json({ error: 'invite revoked' });
    if (row.used_at) return res.status(403).json({ error: 'invite already used' });
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(403).json({ error: 'invite expired' });

    const email = normalizeEmail(row.email);
    let user = await query('select id, email, display_name, password_salt, password_hash, status from platform_users where email = $1', [email]);
    let userRow = user.rows[0];

    if (!userRow) {
      if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 chars' });
      const userId = uuid();
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(password, salt);
      await query(
        `insert into platform_users (id, email, display_name, password_salt, password_hash, status)
         values ($1, $2, $3, $4, $5, 'active')`,
        [userId, email, displayName, salt, hash]
      );
      user = await query('select id, email, display_name, status from platform_users where id = $1', [userId]);
      userRow = user.rows[0];
    }

    await query(
      `insert into institution_memberships (id, institution_id, user_id, role, status)
       values ($1, $2, $3, $4, 'active')
       on conflict (institution_id, user_id) do update set role = excluded.role, status = 'active'`,
      [uuid(), row.institution_id, userRow.id, row.role]
    );

    await query('update institution_invites set used_at = now() where id = $1', [row.id]);

    const tokenPayload = {
      sub: userRow.id,
      email: userRow.email,
      institutionId: row.institution_id,
      role: row.role,
      exp: Date.now() + AUTH_TTL_HOURS * 60 * 60 * 1000
    };

    res.json({
      token: createAuthToken(tokenPayload, AUTH_SECRET),
      user: {
        id: userRow.id,
        email: userRow.email,
        displayName: userRow.display_name
      },
      institutionId: row.institution_id,
      role: row.role
    });
  });

  app.post('/api/v1/auth/login', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const institutionSlug = String(req.body?.institutionSlug || '').trim();
    if (!email || !password || !institutionSlug) {
      return res.status(400).json({ error: 'email, password, institutionSlug required' });
    }

    const institution = await getInstitutionBySlug(query, institutionSlug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const userRes = await query(
      'select id, email, display_name, password_salt, password_hash, status from platform_users where email = $1',
      [email]
    );
    const user = userRes.rows[0];
    if (!user || user.status !== 'active') return res.status(401).json({ error: 'invalid credentials' });

    const hash = hashPassword(password, user.password_salt);
    if (hash !== user.password_hash) return res.status(401).json({ error: 'invalid credentials' });

    const membershipRes = await query(
      `select role, status from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [institution.id, user.id]
    );
    const membership = membershipRes.rows[0];
    if (!membership || membership.status !== 'active') return res.status(403).json({ error: 'membership inactive' });

    const payload = {
      sub: user.id,
      email: user.email,
      institutionId: institution.id,
      role: membership.role,
      exp: Date.now() + AUTH_TTL_HOURS * 60 * 60 * 1000
    };

    res.json({
      token: createAuthToken(payload, AUTH_SECRET),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name
      },
      institution: {
        id: institution.id,
        slug: institution.slug,
        name: institution.name
      },
      role: membership.role
    });
  });

  app.get('/api/v1/me/context', requireAuth, async (req, res) => {
    const institution = await query(
      'select id, name, slug, status from institutions where id = $1',
      [req.auth.institutionId]
    );
    if (institution.rowCount === 0) return res.status(404).json({ error: 'institution not found' });

    const userRes = await query(
      'select id, email, display_name, status from platform_users where id = $1',
      [req.auth.sub]
    );
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'user not found' });
    if (userRes.rows[0].status !== 'active') return res.status(403).json({ error: 'user inactive' });

    const cycle = await getCurrentCycle(query, req.auth.institutionId);
    const membership = await query(
      `select role, status from institution_memberships where institution_id = $1 and user_id = $2`,
      [req.auth.institutionId, req.auth.sub]
    );
    if (membership.rowCount === 0) return res.status(403).json({ error: 'membership not found' });

    res.json({
      user: {
        id: userRes.rows[0].id,
        email: userRes.rows[0].email,
        displayName: userRes.rows[0].display_name
      },
      institution: institution.rows[0],
      membership: membership.rows[0],
      cycle,
      rules: {
        voteBudget: VOTE_BUDGET,
        minPerGuideline: 0,
        maxPerGuideline: 5
      }
    });
  });

  app.get('/api/v1/cycles/:cycleId/my-votes', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleRes = await query(
      'select id, institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const votesRes = await query(
      `select v.guideline_id, v.score
       from strategy_votes v
       join strategy_guidelines g on g.id = v.guideline_id
       where g.cycle_id = $1 and v.voter_id = $2`,
      [cycleId, req.auth.sub]
    );

    const votes = votesRes.rows.map((row) => ({
      guidelineId: row.guideline_id,
      score: row.score
    }));
    const totalUsed = votes.reduce((sum, row) => sum + row.score, 0);

    res.json({
      cycleId,
      budget: VOTE_BUDGET,
      totalUsed,
      votes
    });
  });

  app.post('/api/v1/admin/invites', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const email = normalizeEmail(req.body?.email);
    const role = String(req.body?.role || 'member').trim();
    if (!email) return res.status(400).json({ error: 'email required' });
    if (role !== 'member') return res.status(400).json({ error: 'institution admin can invite only members in v1' });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    await query(
      `insert into institution_invites (id, institution_id, email, role, token_hash, expires_at, created_by)
       values ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval, $7)`,
      [
        uuid(),
        req.auth.institutionId,
        email,
        role,
        sha256(inviteToken),
        String(INVITE_TTL_HOURS),
        req.auth.sub
      ]
    );
    res.status(201).json({ inviteToken, email, role });
  });

  app.post('/api/v1/cycles/:cycleId/guidelines', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    if (!cycleId || !title) return res.status(400).json({ error: 'cycleId and title required' });

    const cycleRes = await query(
      'select id, institution_id, state from strategy_cycles where id = $1',
      [cycleId]
    );
    const cycle = cycleRes.rows[0];
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });
    if (cycle.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(cycle.state)) return res.status(409).json({ error: 'cycle not writable' });

    const guidelineId = uuid();
    await query(
      `insert into strategy_guidelines (id, cycle_id, title, description, status, created_by)
       values ($1, $2, $3, $4, 'active', $5)`,
      [guidelineId, cycleId, title, description || null, req.auth.sub]
    );

    broadcast({ type: 'v1.guideline.created', institutionId: req.auth.institutionId, cycleId, guidelineId });
    res.status(201).json({ guidelineId });
  });

  app.post('/api/v1/guidelines/:guidelineId/comments', requireAuth, async (req, res) => {
    const guidelineId = String(req.params.guidelineId || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!guidelineId || !body) return res.status(400).json({ error: 'guidelineId and body required' });

    const context = await loadGuidelineContext(guidelineId);
    if (!context) return res.status(404).json({ error: 'guideline not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });

    const commentId = uuid();
    await query(
      `insert into strategy_comments (id, guideline_id, author_id, body, status)
       values ($1, $2, $3, $4, 'visible')`,
      [commentId, guidelineId, req.auth.sub, body]
    );

    broadcast({ type: 'v1.comment.created', institutionId: req.auth.institutionId, guidelineId, commentId });
    res.status(201).json({ commentId });
  });

  app.put('/api/v1/guidelines/:guidelineId/vote', requireAuth, async (req, res) => {
    const guidelineId = String(req.params.guidelineId || '').trim();
    const score = Number(req.body?.score);
    if (!guidelineId || !Number.isInteger(score) || score < 0 || score > 5) {
      return res.status(400).json({ error: 'guidelineId and score(0..5) required' });
    }

    const context = await loadGuidelineContext(guidelineId);
    if (!context) return res.status(404).json({ error: 'guideline not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });

    const currentVote = await query(
      'select score from strategy_votes where guideline_id = $1 and voter_id = $2',
      [guidelineId, req.auth.sub]
    );
    const currentScore = currentVote.rows[0]?.score || 0;

    const totalRes = await query(
      `select coalesce(sum(v.score), 0)::int as total_used
       from strategy_votes v
       join strategy_guidelines g on g.id = v.guideline_id
       where v.voter_id = $1 and g.cycle_id = $2`,
      [req.auth.sub, context.cycle_id]
    );
    const totalUsed = totalRes.rows[0].total_used;
    const nextTotal = totalUsed - currentScore + score;
    if (nextTotal > VOTE_BUDGET) {
      return res.status(400).json({ error: 'vote budget exceeded' });
    }

    if (currentVote.rowCount > 0) {
      await query(
        `update strategy_votes
         set score = $1, updated_at = now()
         where guideline_id = $2 and voter_id = $3`,
        [score, guidelineId, req.auth.sub]
      );
    } else {
      await query(
        `insert into strategy_votes (id, guideline_id, voter_id, score)
         values ($1, $2, $3, $4)`,
        [uuid(), guidelineId, req.auth.sub, score]
      );
    }

    broadcast({ type: 'v1.vote.updated', institutionId: req.auth.institutionId, guidelineId, score });
    res.json({ ok: true, score, totalUsed: nextTotal, budget: VOTE_BUDGET });
  });

  app.put('/api/v1/admin/cycles/:cycleId/state', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    const state = String(req.body?.state || '').trim();
    if (!['draft', 'open', 'review', 'final', 'archived'].includes(state)) {
      return res.status(400).json({ error: 'invalid state' });
    }

    const cycleRes = await query(
      'select id, institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    const cycle = cycleRes.rows[0];
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });
    if (cycle.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await query(
      `update strategy_cycles
       set state = $1,
           finalized_at = case when $1 = 'final' then now() else finalized_at end
       where id = $2`,
      [state, cycleId]
    );

    broadcast({ type: 'v1.cycle.state', institutionId: req.auth.institutionId, cycleId, state });
    res.json({ ok: true, state });
  });

  app.post('/api/v1/admin/cycles/:cycleId/results', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    const published = Boolean(req.body?.published);

    const cycleRes = await query('select institution_id from strategy_cycles where id = $1', [cycleId]);
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    await query(
      'update strategy_cycles set results_published = $1 where id = $2',
      [published, cycleId]
    );
    broadcast({ type: 'v1.cycle.results', institutionId: req.auth.institutionId, cycleId, published });
    res.json({ ok: true, published });
  });

  app.get('/api/v1/admin/cycles/:cycleId/participants', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();

    const cycleRes = await query(
      'select institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const participants = await query(
      `select u.id, u.email, u.display_name,
              coalesce(sum(case when g.id is not null then v.score else 0 end), 0)::int as total_score,
              case when count(g.id) > 0 then true else false end as has_voted
       from institution_memberships m
       join platform_users u on u.id = m.user_id
       left join strategy_votes v on v.voter_id = u.id
       left join strategy_guidelines g on g.id = v.guideline_id and g.cycle_id = $1
       where m.institution_id = $2 and m.status = 'active'
       group by u.id, u.email, u.display_name
       order by u.display_name asc`,
      [cycleId, req.auth.institutionId]
    );

    res.json({ participants: participants.rows });
  });

  app.put('/api/v1/admin/users/:userId/password', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const userId = String(req.params.userId || '').trim();
    const password = String(req.body?.password || '');
    if (!userId || password.length < 8) {
      return res.status(400).json({ error: 'userId and password(min 8) required' });
    }

    const membershipRes = await query(
      `select id
       from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [req.auth.institutionId, userId]
    );
    if (membershipRes.rowCount === 0) return res.status(404).json({ error: 'membership not found' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    await query(
      `update platform_users
       set password_salt = $1,
           password_hash = $2
       where id = $3`,
      [salt, hash, userId]
    );

    res.json({ ok: true });
  });

  app.delete('/api/v1/admin/users/:userId', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const userId = String(req.params.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (userId === req.auth.sub) return res.status(400).json({ error: 'cannot delete self' });

    const membershipRes = await query(
      `select id
       from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [req.auth.institutionId, userId]
    );
    if (membershipRes.rowCount === 0) return res.status(404).json({ error: 'membership not found' });

    await query(
      `delete from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [req.auth.institutionId, userId]
    );

    const leftRes = await query(
      `select count(*)::int as membership_count
       from institution_memberships
       where user_id = $1`,
      [userId]
    );
    const membershipsLeft = Number(leftRes.rows[0]?.membership_count || 0);
    let userDeleted = false;
    if (membershipsLeft === 0) {
      await query('delete from platform_users where id = $1', [userId]);
      userDeleted = true;
    }

    res.json({ ok: true, userDeleted, membershipsLeft });
  });

  app.get('/api/v1/admin/cycles/:cycleId/guidelines', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleRes = await query(
      'select institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const guidelinesRes = await query(
      `select g.id, g.title, g.description, g.status, g.relation_type, g.parent_guideline_id, g.line_side, g.created_at,
              coalesce(v.total_score, 0)::int as total_score,
              coalesce(v.voter_count, 0)::int as voter_count,
              coalesce(c.comment_count, 0)::int as comment_count
       from strategy_guidelines g
       left join (
         select guideline_id,
                coalesce(sum(score), 0)::int as total_score,
                count(distinct voter_id)::int as voter_count
         from strategy_votes
         group by guideline_id
       ) v on v.guideline_id = g.id
       left join (
         select guideline_id,
                count(*)::int as comment_count
         from strategy_comments
         where status = 'visible'
         group by guideline_id
       ) c on c.guideline_id = g.id
       where g.cycle_id = $1
       order by g.created_at asc`,
      [cycleId]
    );

    res.json({
      guidelines: guidelinesRes.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        relationType: row.relation_type || 'orphan',
        parentGuidelineId: row.parent_guideline_id || null,
        lineSide: normalizeLineSide(row.line_side) || 'auto',
        createdAt: row.created_at,
        totalScore: row.total_score,
        voterCount: row.voter_count,
        commentCount: row.comment_count
      }))
    });
  });

  app.put('/api/v1/admin/cycles/:cycleId/map-layout', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleRes = await query(
      'select id, institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const parseCoord = (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      return Math.round(parsed);
    };

    const institutionPosition = req.body?.institutionPosition || null;
    const rawGuidelinePositions = Array.isArray(req.body?.guidelinePositions) ? req.body.guidelinePositions : [];
    const guidelinePositions = rawGuidelinePositions
      .map((item) => ({
        guidelineId: String(item?.guidelineId || '').trim(),
        x: parseCoord(item?.x),
        y: parseCoord(item?.y)
      }))
      .filter((item) => item.guidelineId && item.x !== null && item.y !== null);

    const hasInstitutionPosition =
      institutionPosition &&
      parseCoord(institutionPosition.x) !== null &&
      parseCoord(institutionPosition.y) !== null;
    if (!hasInstitutionPosition && guidelinePositions.length === 0) {
      return res.status(400).json({ error: 'layout payload required' });
    }

    if (hasInstitutionPosition) {
      await query(
        `update strategy_cycles
         set map_x = $1, map_y = $2
         where id = $3`,
        [parseCoord(institutionPosition.x), parseCoord(institutionPosition.y), cycleId]
      );
    }

    if (guidelinePositions.length > 0) {
      const guidelineIds = [...new Set(guidelinePositions.map((item) => item.guidelineId))];
      const validRes = await query(
        `select id
         from strategy_guidelines
         where cycle_id = $1 and id = any($2::uuid[])`,
        [cycleId, guidelineIds]
      );
      const validIds = new Set(validRes.rows.map((row) => row.id));
      const invalid = guidelineIds.find((id) => !validIds.has(id));
      if (invalid) return res.status(400).json({ error: 'guideline not in cycle' });

      for (const item of guidelinePositions) {
        await query(
          `update strategy_guidelines
           set map_x = $1, map_y = $2
           where id = $3 and cycle_id = $4`,
          [item.x, item.y, item.guidelineId, cycleId]
        );
      }
    }

    broadcast({ type: 'v1.map.layout.updated', institutionId: req.auth.institutionId, cycleId });
    res.json({
      ok: true,
      updatedInstitution: Boolean(hasInstitutionPosition),
      updatedGuidelines: guidelinePositions.length
    });
  });

  app.put('/api/v1/admin/guidelines/:guidelineId', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const guidelineId = String(req.params.guidelineId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const status = String(req.body?.status || 'active').trim();
    const relationType = String(req.body?.relationType || 'orphan').trim().toLowerCase();
    const lineSide = normalizeLineSide(req.body?.lineSide);
    const parentGuidelineIdRaw = req.body?.parentGuidelineId;
    if (!guidelineId || !title) return res.status(400).json({ error: 'guidelineId and title required' });
    if (!['active', 'merged', 'hidden'].includes(status)) return res.status(400).json({ error: 'invalid status' });
    if (!lineSide) return res.status(400).json({ error: 'invalid line side' });

    const context = await loadGuidelineContext(guidelineId);
    if (!context) return res.status(404).json({ error: 'guideline not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    let parentGuidelineId = null;
    try {
      parentGuidelineId = await validateGuidelineRelationship({
        guidelineId,
        cycleId: context.cycle_id,
        relationType,
        parentGuidelineId: parentGuidelineIdRaw
      });
    } catch (error) {
      return res.status(400).json({ error: String(error?.message || 'invalid relation') });
    }

    if (relationType !== 'parent') {
      const childrenRes = await query(
        `select id from strategy_guidelines
         where parent_guideline_id = $1 and id <> $1
         limit 1`,
        [guidelineId]
      );
      if (childrenRes.rowCount > 0) {
        return res.status(400).json({ error: 'cannot demote parent with children' });
      }
    }

    await query(
      `update strategy_guidelines
       set title = $1,
           description = $2,
           status = $3,
           relation_type = $4,
           parent_guideline_id = $5,
           line_side = $6,
           updated_at = now()
       where id = $7`,
      [title, description || null, status, relationType, parentGuidelineId, lineSide, guidelineId]
    );

    broadcast({ type: 'v1.guideline.updated', institutionId: req.auth.institutionId, guidelineId });
    res.json({ ok: true });
  });
}

module.exports = { registerV1Routes };

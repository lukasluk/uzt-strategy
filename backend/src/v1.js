const crypto = require('crypto');
const {
  createRateLimiter,
  hashPassword,
  normalizeEmail,
  parseBearer,
  readAuthToken,
  resolveClientIp,
  sha256
} = require('./security');
const { registerMetaAdminRoutes } = require('./metaAdminRoutes');
const { registerPublicRoutes } = require('./publicRoutes');
const { registerAuthRoutes } = require('./authRoutes');
const { registerMemberRoutes } = require('./memberRoutes');
const { registerAdminRoutes } = require('./adminRoutes');

async function getInstitutionBySlug(query, slug) {
  const res = await query(
    'select id, name, slug, status from institutions where slug = $1',
    [slug]
  );
  return res.rows[0] || null;
}

async function getCurrentCycle(query, institutionId) {
  const res = await query(
    `select id, institution_id, title, state, results_published, starts_at, ends_at, finalized_at, mission_text, vision_text, created_at
     from strategy_cycles
     where institution_id = $1 and state in ('open', 'closed')
     order by created_at desc
     limit 1`,
    [institutionId]
  );
  return res.rows[0] || null;
}

function registerV1Routes({ app, query, broadcast, uuid }) {
  const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-too';
  const VOTE_BUDGET = Math.max(20, Number(process.env.VOTE_BUDGET || 20));
  const INVITE_TTL_HOURS = Number(process.env.INVITE_TTL_HOURS || 72);
  const AUTH_TTL_HOURS = Number(process.env.AUTH_TTL_HOURS || 12);
  const AUTH_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX || 20);
  const INVITE_ACCEPT_MAX_ATTEMPTS = Number(process.env.INVITE_ACCEPT_RATE_LIMIT_MAX || 20);

  const loginRateLimit = createRateLimiter({
    windowMs: AUTH_WINDOW_MS,
    max: LOGIN_MAX_ATTEMPTS,
    keyPrefix: 'auth-login',
    keyFn: (req) => `${resolveClientIp(req)}:${normalizeEmail(req.body?.email)}`
  });

  const inviteAcceptRateLimit = createRateLimiter({
    windowMs: AUTH_WINDOW_MS,
    max: INVITE_ACCEPT_MAX_ATTEMPTS,
    keyPrefix: 'invite-accept',
    keyFn: (req) => resolveClientIp(req)
  });

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

  async function loadCommentContext(commentId) {
    const res = await query(
      `select c.id as comment_id,
              c.guideline_id,
              c.status as comment_status,
              g.cycle_id,
              sc.institution_id
       from strategy_comments c
       join strategy_guidelines g on g.id = c.guideline_id
       join strategy_cycles sc on sc.id = g.cycle_id
       where c.id = $1`,
      [commentId]
    );
    return res.rows[0] || null;
  }

  async function loadInitiativeContext(initiativeId) {
    const res = await query(
      `select i.id as initiative_id,
              i.title,
              i.description,
              i.status as initiative_status,
              c.id as cycle_id,
              c.state as cycle_state,
              c.institution_id
       from strategy_initiatives i
       join strategy_cycles c on c.id = i.cycle_id
       where i.id = $1`,
      [initiativeId]
    );
    return res.rows[0] || null;
  }

  async function loadInitiativeCommentContext(commentId) {
    const res = await query(
      `select c.id as comment_id,
              c.initiative_id,
              c.status as comment_status,
              i.cycle_id,
              sc.institution_id
       from strategy_initiative_comments c
       join strategy_initiatives i on i.id = c.initiative_id
       join strategy_cycles sc on sc.id = i.cycle_id
       where c.id = $1`,
      [commentId]
    );
    return res.rows[0] || null;
  }

  function isCycleWritable(state) {
    return state === 'open';
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

  async function validateInitiativeGuidelineAssignments({ cycleId, guidelineIds }) {
    const normalized = [...new Set(
      (Array.isArray(guidelineIds) ? guidelineIds : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean)
    )];
    if (normalized.length === 0) {
      throw new Error('at least one guideline required');
    }

    const validRes = await query(
      `select id
       from strategy_guidelines
       where cycle_id = $1
         and id = any($2::uuid[])
         and status in ('active', 'disabled', 'merged')`,
      [cycleId, normalized]
    );
    const validIds = new Set(validRes.rows.map((row) => row.id));
    if (validIds.size !== normalized.length) {
      throw new Error('guideline not in cycle');
    }
    return normalized;
  }

  registerMetaAdminRoutes({
    app,
    query,
    uuid,
    authSecret: AUTH_SECRET,
    inviteTtlHours: INVITE_TTL_HOURS,
    authWindowMs: AUTH_WINDOW_MS
  });

  registerPublicRoutes({
    app,
    query,
    getInstitutionBySlug,
    getCurrentCycle,
    normalizeLineSide
  });

  registerAuthRoutes({
    app,
    query,
    uuid,
    inviteAcceptRateLimit,
    loginRateLimit,
    requireAuth,
    getInstitutionBySlug,
    getCurrentCycle,
    voteBudget: VOTE_BUDGET,
    authSecret: AUTH_SECRET,
    authTtlHours: AUTH_TTL_HOURS
  });

  registerMemberRoutes({
    app,
    query,
    broadcast,
    uuid,
    requireAuth,
    voteBudget: VOTE_BUDGET,
    isCycleWritable,
    normalizeLineSide,
    loadGuidelineContext,
    loadInitiativeContext,
    validateInitiativeGuidelineAssignments
  });

  registerAdminRoutes({
    app,
    query,
    broadcast,
    uuid,
    crypto,
    hashPassword,
    normalizeEmail,
    sha256,
    inviteTtlHours: INVITE_TTL_HOURS,
    requireAuth,
    isCycleWritable,
    normalizeLineSide,
    loadGuidelineContext,
    loadCommentContext,
    loadInitiativeContext,
    loadInitiativeCommentContext,
    validateGuidelineRelationship,
    validateInitiativeGuidelineAssignments
  });
}

module.exports = { registerV1Routes };


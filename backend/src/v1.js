const crypto = require('crypto');
const {
  createRateLimiter,
  hashPassword,
  normalizeEmail,
  resolveClientIp,
  sha256
} = require('./security');
const { registerMetaAdminRoutes } = require('./metaAdminRoutes');
const { registerPublicRoutes } = require('./publicRoutes');
const { registerAuthRoutes } = require('./authRoutes');
const { registerMemberRoutes } = require('./memberRoutes');
const { registerAdminRoutes } = require('./adminRoutes');
const { createV1Helpers } = require('./v1Helpers');

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

  const {
    getInstitutionBySlug,
    getCurrentCycle,
    requireAuth,
    verifyCycleAccess,
    loadGuidelineContext,
    loadCommentContext,
    loadInitiativeContext,
    loadInitiativeCommentContext,
    isCycleWritable,
    validateGuidelineRelationship,
    normalizeLineSide,
    validateInitiativeGuidelineAssignments,
    getUserCycleVotes,
    getCurrentGuidelineVote,
    getCurrentInitiativeVote,
    calculateUserCycleVoteTotal,
    upsertGuidelineVote,
    upsertInitiativeVote
  } = createV1Helpers({ query, authSecret: AUTH_SECRET });

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
    getInstitutionBySlug: (_query, slug) => getInstitutionBySlug(slug),
    getCurrentCycle: (_query, institutionId) => getCurrentCycle(institutionId),
    normalizeLineSide
  });

  registerAuthRoutes({
    app,
    query,
    uuid,
    inviteAcceptRateLimit,
    loginRateLimit,
    requireAuth,
    getInstitutionBySlug: (_query, slug) => getInstitutionBySlug(slug),
    getCurrentCycle: (_query, institutionId) => getCurrentCycle(institutionId),
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
    verifyCycleAccess,
    voteBudget: VOTE_BUDGET,
    isCycleWritable,
    normalizeLineSide,
    loadGuidelineContext,
    loadInitiativeContext,
    validateInitiativeGuidelineAssignments,
    getUserCycleVotes,
    getCurrentGuidelineVote,
    getCurrentInitiativeVote,
    calculateUserCycleVoteTotal,
    upsertGuidelineVote,
    upsertInitiativeVote
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
    verifyCycleAccess,
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


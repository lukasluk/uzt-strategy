const crypto = require('crypto');
const {
  createRateLimiter,
  hashPassword,
  normalizeEmail,
  resolveClientIp,
  sha256
} = require('./security');
const { trafficMonitor } = require('./trafficMonitor');
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
  const PUBLIC_RATE_LIMIT_WINDOW_MS = Number(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || 60 * 1000);
  const PUBLIC_RATE_LIMIT_MAX = Number(process.env.PUBLIC_RATE_LIMIT_MAX || 180);
  const MEMBER_WRITE_RATE_LIMIT_WINDOW_MS = Number(process.env.MEMBER_WRITE_RATE_LIMIT_WINDOW_MS || 60 * 1000);
  const MEMBER_WRITE_RATE_LIMIT_MAX = Number(process.env.MEMBER_WRITE_RATE_LIMIT_MAX || 90);
  const ADMIN_WRITE_RATE_LIMIT_WINDOW_MS = Number(process.env.ADMIN_WRITE_RATE_LIMIT_WINDOW_MS || 60 * 1000);
  const ADMIN_WRITE_RATE_LIMIT_MAX = Number(process.env.ADMIN_WRITE_RATE_LIMIT_MAX || 120);

  const rateLimitConfig = {
    auth: {
      windowMs: AUTH_WINDOW_MS,
      loginMax: LOGIN_MAX_ATTEMPTS,
      inviteAcceptMax: INVITE_ACCEPT_MAX_ATTEMPTS
    },
    publicRead: {
      windowMs: PUBLIC_RATE_LIMIT_WINDOW_MS,
      max: PUBLIC_RATE_LIMIT_MAX
    },
    memberWrite: {
      windowMs: MEMBER_WRITE_RATE_LIMIT_WINDOW_MS,
      max: MEMBER_WRITE_RATE_LIMIT_MAX
    },
    adminWrite: {
      windowMs: ADMIN_WRITE_RATE_LIMIT_WINDOW_MS,
      max: ADMIN_WRITE_RATE_LIMIT_MAX
    }
  };

  const onBlocked = (limiter) => ({ req, retryAfter }) => {
    trafficMonitor.trackRateLimitBlocked({
      limiter,
      ip: resolveClientIp(req),
      path: req.path || req.originalUrl || '',
      retryAfterSeconds: retryAfter
    });
  };

  const loginRateLimit = createRateLimiter({
    windowMs: AUTH_WINDOW_MS,
    max: LOGIN_MAX_ATTEMPTS,
    keyPrefix: 'auth-login',
    keyFn: (req) => `${resolveClientIp(req)}:${normalizeEmail(req.body?.email)}`,
    onBlocked: onBlocked('auth-login')
  });

  const inviteAcceptRateLimit = createRateLimiter({
    windowMs: AUTH_WINDOW_MS,
    max: INVITE_ACCEPT_MAX_ATTEMPTS,
    keyPrefix: 'invite-accept',
    keyFn: (req) => resolveClientIp(req),
    onBlocked: onBlocked('invite-accept')
  });

  const publicReadRateLimit = createRateLimiter({
    windowMs: PUBLIC_RATE_LIMIT_WINDOW_MS,
    max: PUBLIC_RATE_LIMIT_MAX,
    keyPrefix: 'public-read',
    keyFn: (req) => resolveClientIp(req),
    onBlocked: onBlocked('public-read')
  });

  const memberWriteRateLimit = createRateLimiter({
    windowMs: MEMBER_WRITE_RATE_LIMIT_WINDOW_MS,
    max: MEMBER_WRITE_RATE_LIMIT_MAX,
    keyPrefix: 'member-write',
    keyFn: (req) => `${resolveClientIp(req)}:${req.auth?.sub || 'unknown'}`,
    onBlocked: onBlocked('member-write')
  });

  const adminWriteRateLimit = createRateLimiter({
    windowMs: ADMIN_WRITE_RATE_LIMIT_WINDOW_MS,
    max: ADMIN_WRITE_RATE_LIMIT_MAX,
    keyPrefix: 'admin-write',
    keyFn: (req) => `${resolveClientIp(req)}:${req.auth?.sub || 'unknown'}`,
    onBlocked: onBlocked('admin-write')
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
    upsertInitiativeVote,
    createGuideline,
    createInitiativeWithGuidelines,
    createGuidelineComment,
    createInitiativeComment,
    createInstitutionInvite,
    setCycleState,
    setCycleSettings,
    setCycleResultsPublished,
    updatePlatformUserPassword,
    deleteInstitutionMembership,
    countUserMemberships,
    deletePlatformUser,
    setGuidelineCommentStatus,
    setInitiativeCommentStatus,
    setCycleMapPosition,
    listExistingGuidelineIds,
    setGuidelineMapPosition,
    listExistingInitiativeIds,
    setInitiativeMapPosition,
    hasGuidelineChildren,
    updateGuidelineRecord,
    updateInitiativeRecord,
    replaceInitiativeGuidelineLinks,
    deleteInitiativeByCycle,
    resetChildrenToOrphan,
    deleteGuidelineByCycle
  } = createV1Helpers({ query, authSecret: AUTH_SECRET });

  registerMetaAdminRoutes({
    app,
    query,
    uuid,
    authSecret: AUTH_SECRET,
    inviteTtlHours: INVITE_TTL_HOURS,
    authWindowMs: AUTH_WINDOW_MS,
    trafficMonitor,
    rateLimitConfig
  });

  registerPublicRoutes({
    app,
    query,
    publicReadRateLimit,
    trafficMonitor,
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
    broadcast,
    uuid,
    memberWriteRateLimit,
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
    upsertInitiativeVote,
    createGuideline,
    createInitiativeWithGuidelines,
    createGuidelineComment,
    createInitiativeComment
  });

  registerAdminRoutes({
    app,
    query,
    broadcast,
    uuid,
    adminWriteRateLimit,
    trafficMonitor,
    crypto,
    hashPassword,
    normalizeEmail,
    sha256,
    inviteTtlHours: INVITE_TTL_HOURS,
    requireAuth,
    verifyCycleAccess,
    normalizeLineSide,
    loadGuidelineContext,
    loadCommentContext,
    loadInitiativeContext,
    loadInitiativeCommentContext,
    validateGuidelineRelationship,
    validateInitiativeGuidelineAssignments,
    createInstitutionInvite,
    setCycleState,
    setCycleSettings,
    setCycleResultsPublished,
    updatePlatformUserPassword,
    deleteInstitutionMembership,
    countUserMemberships,
    deletePlatformUser,
    setGuidelineCommentStatus,
    setInitiativeCommentStatus,
    setCycleMapPosition,
    listExistingGuidelineIds,
    setGuidelineMapPosition,
    listExistingInitiativeIds,
    setInitiativeMapPosition,
    hasGuidelineChildren,
    updateGuidelineRecord,
    updateInitiativeRecord,
    replaceInitiativeGuidelineLinks,
    deleteInitiativeByCycle,
    resetChildrenToOrphan,
    deleteGuidelineByCycle
  });
}

module.exports = { registerV1Routes };


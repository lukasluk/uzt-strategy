const { parseBearer, readAuthToken } = require('./security');
const { createInstitutionCycleService } = require('./services/institutionCycleService');
const { createContextLookupService } = require('./services/contextLookupService');

function createV1Helpers({ query, authSecret }) {
  const institutionCycleService = createInstitutionCycleService({ query });
  const contextLookupService = createContextLookupService({ query });

  function requireAuth(req, res, next) {
    const token = parseBearer(req);
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const payload = readAuthToken(token, authSecret);
    if (!payload) return res.status(401).json({ error: 'invalid token' });
    req.auth = payload;
    next();
  }

  return {
    getInstitutionBySlug: institutionCycleService.getInstitutionBySlug,
    getCurrentCycle: institutionCycleService.getCurrentCycle,
    requireAuth,
    loadGuidelineContext: contextLookupService.loadGuidelineContext,
    loadCommentContext: contextLookupService.loadCommentContext,
    loadInitiativeContext: contextLookupService.loadInitiativeContext,
    loadInitiativeCommentContext: contextLookupService.loadInitiativeCommentContext,
    isCycleWritable: contextLookupService.isCycleWritable,
    validateGuidelineRelationship: contextLookupService.validateGuidelineRelationship,
    normalizeLineSide: contextLookupService.normalizeLineSide,
    validateInitiativeGuidelineAssignments: contextLookupService.validateInitiativeGuidelineAssignments
  };
}

module.exports = { createV1Helpers };

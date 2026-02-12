const { parseBearer, readAuthToken } = require('./security');
const { createInstitutionCycleService } = require('./services/institutionCycleService');
const { createContextLookupService } = require('./services/contextLookupService');
const { createVoteService } = require('./services/voteService');
const { createContentMutationService } = require('./services/contentMutationService');
const { createAdminMutationService } = require('./services/adminMutationService');

function createV1Helpers({ query, authSecret }) {
  const institutionCycleService = createInstitutionCycleService({ query });
  const contextLookupService = createContextLookupService({ query });
  const voteService = createVoteService({ query });
  const contentMutationService = createContentMutationService({ query });
  const adminMutationService = createAdminMutationService({ query });

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
    verifyCycleAccess: contextLookupService.verifyCycleAccess,
    loadGuidelineContext: contextLookupService.loadGuidelineContext,
    loadCommentContext: contextLookupService.loadCommentContext,
    loadInitiativeContext: contextLookupService.loadInitiativeContext,
    loadInitiativeCommentContext: contextLookupService.loadInitiativeCommentContext,
    isCycleWritable: contextLookupService.isCycleWritable,
    validateGuidelineRelationship: contextLookupService.validateGuidelineRelationship,
    normalizeLineSide: contextLookupService.normalizeLineSide,
    validateInitiativeGuidelineAssignments: contextLookupService.validateInitiativeGuidelineAssignments,
    getUserCycleVotes: voteService.getUserCycleVotes,
    getCurrentGuidelineVote: voteService.getCurrentGuidelineVote,
    getCurrentInitiativeVote: voteService.getCurrentInitiativeVote,
    calculateUserCycleVoteTotal: voteService.calculateUserCycleVoteTotal,
    upsertGuidelineVote: voteService.upsertGuidelineVote,
    upsertInitiativeVote: voteService.upsertInitiativeVote,
    createGuideline: contentMutationService.createGuideline,
    createInitiativeWithGuidelines: contentMutationService.createInitiativeWithGuidelines,
    createGuidelineComment: contentMutationService.createGuidelineComment,
    createInitiativeComment: contentMutationService.createInitiativeComment,
    createInstitutionInvite: adminMutationService.createInstitutionInvite,
    setCycleState: adminMutationService.setCycleState,
    setCycleSettings: adminMutationService.setCycleSettings,
    setCycleResultsPublished: adminMutationService.setCycleResultsPublished,
    updatePlatformUserPassword: adminMutationService.updatePlatformUserPassword,
    deleteInstitutionMembership: adminMutationService.deleteInstitutionMembership,
    countUserMemberships: adminMutationService.countUserMemberships,
    deletePlatformUser: adminMutationService.deletePlatformUser,
    setGuidelineCommentStatus: adminMutationService.setGuidelineCommentStatus,
    setInitiativeCommentStatus: adminMutationService.setInitiativeCommentStatus,
    setCycleMapPosition: adminMutationService.setCycleMapPosition,
    listExistingGuidelineIds: adminMutationService.listExistingGuidelineIds,
    setGuidelineMapPosition: adminMutationService.setGuidelineMapPosition,
    listExistingInitiativeIds: adminMutationService.listExistingInitiativeIds,
    setInitiativeMapPosition: adminMutationService.setInitiativeMapPosition,
    hasGuidelineChildren: adminMutationService.hasGuidelineChildren,
    updateGuidelineRecord: adminMutationService.updateGuidelineRecord,
    updateInitiativeRecord: adminMutationService.updateInitiativeRecord,
    replaceInitiativeGuidelineLinks: adminMutationService.replaceInitiativeGuidelineLinks,
    deleteInitiativeByCycle: adminMutationService.deleteInitiativeByCycle,
    resetChildrenToOrphan: adminMutationService.resetChildrenToOrphan,
    deleteGuidelineByCycle: adminMutationService.deleteGuidelineByCycle
  };
}

module.exports = { createV1Helpers };

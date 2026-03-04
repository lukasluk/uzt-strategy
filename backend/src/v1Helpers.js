const { parseBearer, readAuthToken } = require('./security');
const { pool } = require('./db');
const { createInstitutionCycleService } = require('./services/institutionCycleService');
const { createContextLookupService } = require('./services/contextLookupService');
const { createVoteService } = require('./services/voteService');
const { createContentMutationService } = require('./services/contentMutationService');
const { createAdminMutationService } = require('./services/adminMutationService');
const { createProposalModerationService } = require('./services/proposalModerationService');

function createV1Helpers({ query, authSecret }) {
  const institutionCycleService = createInstitutionCycleService({ query });
  const contextLookupService = createContextLookupService({ query });
  const voteService = createVoteService({ query });
  const contentMutationService = createContentMutationService({ query });
  const adminMutationService = createAdminMutationService({ query });
  const proposalModerationService = createProposalModerationService({ query, pool });

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
    getInstitutionStrategies: institutionCycleService.getInstitutionStrategies,
    resolveInstitutionStrategy: institutionCycleService.resolveInstitutionStrategy,
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
    createGuidelineProposal: proposalModerationService.createGuidelineProposal,
    createInitiativeProposal: proposalModerationService.createInitiativeProposal,
    loadGuidelineProposalContext: proposalModerationService.loadGuidelineProposalContext,
    loadInitiativeProposalContext: proposalModerationService.loadInitiativeProposalContext,
    createProposalComment: proposalModerationService.createProposalComment,
    listCycleProposalHistory: proposalModerationService.listCycleProposalHistory,
    listCyclePendingProposals: proposalModerationService.listCyclePendingProposals,
    loadPublicPendingProposals: proposalModerationService.loadPublicPendingProposals,
    listPublicProposalComments: proposalModerationService.listPublicProposalComments,
    resolveProposalAlias: proposalModerationService.resolveProposalAlias,
    reviewPendingProposal: proposalModerationService.reviewPendingProposal,
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
    deleteGuidelineByCycle: adminMutationService.deleteGuidelineByCycle,
    createGuidelineDeletionHistoryEntry: adminMutationService.createGuidelineDeletionHistoryEntry
  };
}

module.exports = { createV1Helpers };

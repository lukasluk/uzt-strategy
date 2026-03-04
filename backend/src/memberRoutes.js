function registerMemberRoutes({
  app,
  broadcast,
  uuid,
  memberWriteRateLimit,
  requireAuth,
  verifyCycleAccess,
  voteBudget,
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
  createInitiativeComment,
  createGuidelineProposal,
  createInitiativeProposal,
  loadGuidelineProposalContext,
  loadInitiativeProposalContext,
  createProposalComment,
  listCycleProposalHistory,
  listCycleHistoryRows
}) {
  const memberWriteGuard = typeof memberWriteRateLimit === 'function'
    ? memberWriteRateLimit
    : (_req, _res, next) => next();

  app.get('/api/v1/cycles/:cycleId/my-votes', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    const { votes, initiativeVotes, totalUsed } = await getUserCycleVotes(cycleId, req.auth.sub);

    res.json({
      cycleId,
      budget: voteBudget,
      totalUsed,
      votes,
      guidelineVotes: votes,
      initiativeVotes
    });
  });


  app.post('/api/v1/cycles/:cycleId/guidelines', requireAuth, memberWriteGuard, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const relationType = String(req.body?.relationType || 'orphan').trim().toLowerCase();
    const parentGuidelineId = String(req.body?.parentGuidelineId || '').trim();
    if (!cycleId || !title) return res.status(400).json({ error: 'cycleId and title required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const { cycle } = cycleAccess;
    if (!isCycleWritable(cycle.state)) return res.status(409).json({ error: 'cycle not writable' });

    let guidelineId = '';
    try {
      guidelineId = await createGuidelineProposal({
        institutionId: req.auth.institutionId,
        cycleId,
        strategyId: cycle.strategy_id || null,
        title,
        description,
        relationType,
        parentGuidelineId: parentGuidelineId || null,
        createdBy: req.auth.sub,
        uuid
      });
    } catch (error) {
      return res.status(400).json({ error: String(error?.message || 'invalid guideline proposal') });
    }

    broadcast({ type: 'v1.guideline.proposed', institutionId: req.auth.institutionId, cycleId, guidelineId });
    res.status(201).json({ guidelineId, status: 'pending' });
  });


  app.post('/api/v1/cycles/:cycleId/initiatives', requireAuth, memberWriteGuard, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const lineSide = normalizeLineSide(req.body?.lineSide);
    const guidelineIdsRaw = req.body?.guidelineIds;
    if (!cycleId || !title) return res.status(400).json({ error: 'cycleId and title required' });
    if (!lineSide) return res.status(400).json({ error: 'invalid line side' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const { cycle } = cycleAccess;
    if (!isCycleWritable(cycle.state)) return res.status(409).json({ error: 'cycle not writable' });

    let initiativeId = '';
    try {
      initiativeId = await createInitiativeProposal({
        institutionId: req.auth.institutionId,
        cycleId,
        strategyId: cycle.strategy_id || null,
        title,
        description,
        lineSide,
        guidelineIds: guidelineIdsRaw,
        createdBy: req.auth.sub,
        uuid
      });
    } catch (error) {
      return res.status(400).json({ error: String(error?.message || 'invalid initiative proposal') });
    }

    broadcast({ type: 'v1.initiative.proposed', institutionId: req.auth.institutionId, cycleId, initiativeId });
    res.status(201).json({ initiativeId, status: 'pending' });
  });


  app.post('/api/v1/guidelines/:guidelineId/comments', requireAuth, memberWriteGuard, async (req, res) => {
    const guidelineId = String(req.params.guidelineId || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!guidelineId || !body) return res.status(400).json({ error: 'guidelineId and body required' });

    const context = await loadGuidelineContext(guidelineId);
    if (context) {
      if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
      if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
      if (context.guideline_status !== 'active') return res.status(409).json({ error: 'guideline voting disabled' });

      const commentId = await createGuidelineComment({
        guidelineId,
        authorId: req.auth.sub,
        body,
        uuid
      });

      broadcast({ type: 'v1.comment.created', institutionId: req.auth.institutionId, guidelineId, commentId });
      return res.status(201).json({ commentId });
    }

    const proposalContext = await loadGuidelineProposalContext(guidelineId);
    if (!proposalContext) return res.status(404).json({ error: 'guideline not found' });
    if (proposalContext.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(proposalContext.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
    if (proposalContext.proposal_status !== 'pending') return res.status(409).json({ error: 'guideline voting disabled' });

    const commentId = await createProposalComment({
      proposalId: proposalContext.proposal_id,
      institutionId: proposalContext.institution_id,
      cycleId: proposalContext.cycle_id,
      authorId: req.auth.sub,
      body,
      uuid
    });

    broadcast({ type: 'v1.proposal.comment.created', institutionId: req.auth.institutionId, proposalId: proposalContext.proposal_id, commentId });
    return res.status(201).json({ commentId });
  });


  app.post('/api/v1/initiatives/:initiativeId/comments', requireAuth, memberWriteGuard, async (req, res) => {
    const initiativeId = String(req.params.initiativeId || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!initiativeId || !body) return res.status(400).json({ error: 'initiativeId and body required' });

    const context = await loadInitiativeContext(initiativeId);
    if (context) {
      if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
      if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
      if (context.initiative_status !== 'active') return res.status(409).json({ error: 'initiative voting disabled' });

      const commentId = await createInitiativeComment({
        initiativeId,
        authorId: req.auth.sub,
        body,
        uuid
      });

      broadcast({ type: 'v1.initiative.comment.created', institutionId: req.auth.institutionId, initiativeId, commentId });
      return res.status(201).json({ commentId });
    }

    const proposalContext = await loadInitiativeProposalContext(initiativeId);
    if (!proposalContext) return res.status(404).json({ error: 'initiative not found' });
    if (proposalContext.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(proposalContext.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
    if (proposalContext.proposal_status !== 'pending') return res.status(409).json({ error: 'initiative voting disabled' });

    const commentId = await createProposalComment({
      proposalId: proposalContext.proposal_id,
      institutionId: proposalContext.institution_id,
      cycleId: proposalContext.cycle_id,
      authorId: req.auth.sub,
      body,
      uuid
    });

    broadcast({ type: 'v1.proposal.comment.created', institutionId: req.auth.institutionId, proposalId: proposalContext.proposal_id, commentId });
    return res.status(201).json({ commentId });
  });


  app.put('/api/v1/guidelines/:guidelineId/vote', requireAuth, memberWriteGuard, async (req, res) => {
    const guidelineId = String(req.params.guidelineId || '').trim();
    const score = Number(req.body?.score);
    if (!guidelineId || !Number.isInteger(score) || score < 0 || score > 5) {
      return res.status(400).json({ error: 'guidelineId and score(0..5) required' });
    }

    const context = await loadGuidelineContext(guidelineId);
    if (!context) {
      const proposalContext = await loadGuidelineProposalContext(guidelineId);
      if (proposalContext && proposalContext.institution_id === req.auth.institutionId) {
        return res.status(409).json({ error: 'guideline voting disabled' });
      }
      return res.status(404).json({ error: 'guideline not found' });
    }
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
    if (context.guideline_status !== 'active') return res.status(409).json({ error: 'guideline voting disabled' });

    const currentVote = await getCurrentGuidelineVote(guidelineId, req.auth.sub);
    const currentScore = currentVote?.score || 0;
    const totalUsed = await calculateUserCycleVoteTotal(req.auth.sub, context.cycle_id);
    const nextTotal = totalUsed - currentScore + score;
    if (nextTotal > voteBudget) {
      return res.status(400).json({ error: 'vote budget exceeded' });
    }

    await upsertGuidelineVote({
      guidelineId,
      voterId: req.auth.sub,
      score,
      uuid
    });

    broadcast({ type: 'v1.vote.updated', institutionId: req.auth.institutionId, guidelineId, score });
    res.json({ ok: true, score, totalUsed: nextTotal, budget: voteBudget });
  });


  app.put('/api/v1/initiatives/:initiativeId/vote', requireAuth, memberWriteGuard, async (req, res) => {
    const initiativeId = String(req.params.initiativeId || '').trim();
    const score = Number(req.body?.score);
    if (!initiativeId || !Number.isInteger(score) || score < 0 || score > 5) {
      return res.status(400).json({ error: 'initiativeId and score(0..5) required' });
    }

    const context = await loadInitiativeContext(initiativeId);
    if (!context) {
      const proposalContext = await loadInitiativeProposalContext(initiativeId);
      if (proposalContext && proposalContext.institution_id === req.auth.institutionId) {
        return res.status(409).json({ error: 'initiative voting disabled' });
      }
      return res.status(404).json({ error: 'initiative not found' });
    }
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
    if (context.initiative_status !== 'active') return res.status(409).json({ error: 'initiative voting disabled' });

    const currentVote = await getCurrentInitiativeVote(initiativeId, req.auth.sub);
    const currentScore = currentVote?.score || 0;
    const totalUsed = await calculateUserCycleVoteTotal(req.auth.sub, context.cycle_id);
    const nextTotal = totalUsed - currentScore + score;
    if (nextTotal > voteBudget) {
      return res.status(400).json({ error: 'vote budget exceeded' });
    }

    await upsertInitiativeVote({
      initiativeId,
      voterId: req.auth.sub,
      score,
      uuid
    });

    broadcast({ type: 'v1.initiative.vote.updated', institutionId: req.auth.institutionId, initiativeId, score });
    res.json({ ok: true, score, totalUsed: nextTotal, budget: voteBudget });
  });

  app.get('/api/v1/cycles/:cycleId/history', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    const entries = await listCycleProposalHistory({ cycleId });
    const rows = typeof listCycleHistoryRows === 'function'
      ? await listCycleHistoryRows({ cycleId })
      : [];
    res.json({
      cycleId,
      entries,
      rows
    });
  });


}

module.exports = { registerMemberRoutes };


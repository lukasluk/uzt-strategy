function registerMemberRoutes({
  app,
  query,
  broadcast,
  uuid,
  requireAuth,
  voteBudget,
  isCycleWritable,
  normalizeLineSide,
  loadGuidelineContext,
  loadInitiativeContext,
  validateInitiativeGuidelineAssignments
}) {
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

    const initiativeVotesRes = await query(
      `select v.initiative_id, v.score
       from strategy_initiative_votes v
       join strategy_initiatives i on i.id = v.initiative_id
       where i.cycle_id = $1 and v.voter_id = $2`,
      [cycleId, req.auth.sub]
    );

    const votes = votesRes.rows.map((row) => ({
      guidelineId: row.guideline_id,
      score: row.score
    }));
    const initiativeVotes = initiativeVotesRes.rows.map((row) => ({
      initiativeId: row.initiative_id,
      score: row.score
    }));
    const totalUsed =
      votes.reduce((sum, row) => sum + row.score, 0) +
      initiativeVotes.reduce((sum, row) => sum + row.score, 0);

    res.json({
      cycleId,
      budget: voteBudget,
      totalUsed,
      votes,
      guidelineVotes: votes,
      initiativeVotes
    });
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


  app.post('/api/v1/cycles/:cycleId/initiatives', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const lineSide = normalizeLineSide(req.body?.lineSide);
    const guidelineIdsRaw = req.body?.guidelineIds;
    if (!cycleId || !title) return res.status(400).json({ error: 'cycleId and title required' });
    if (!lineSide) return res.status(400).json({ error: 'invalid line side' });

    const cycleRes = await query(
      'select id, institution_id, state from strategy_cycles where id = $1',
      [cycleId]
    );
    const cycle = cycleRes.rows[0];
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });
    if (cycle.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(cycle.state)) return res.status(409).json({ error: 'cycle not writable' });

    let guidelineIds = [];
    try {
      guidelineIds = await validateInitiativeGuidelineAssignments({ cycleId, guidelineIds: guidelineIdsRaw });
    } catch (error) {
      return res.status(400).json({ error: String(error?.message || 'invalid guideline assignment') });
    }

    const initiativeId = uuid();
    await query(
      `insert into strategy_initiatives (id, cycle_id, title, description, status, line_side, created_by)
       values ($1, $2, $3, $4, 'active', $5, $6)`,
      [initiativeId, cycleId, title, description || null, lineSide, req.auth.sub]
    );
    for (const guidelineId of guidelineIds) {
      await query(
        `insert into strategy_initiative_guidelines (id, initiative_id, guideline_id)
         values ($1, $2, $3)`,
        [uuid(), initiativeId, guidelineId]
      );
    }

    broadcast({ type: 'v1.initiative.created', institutionId: req.auth.institutionId, cycleId, initiativeId });
    res.status(201).json({ initiativeId });
  });


  app.post('/api/v1/guidelines/:guidelineId/comments', requireAuth, async (req, res) => {
    const guidelineId = String(req.params.guidelineId || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!guidelineId || !body) return res.status(400).json({ error: 'guidelineId and body required' });

    const context = await loadGuidelineContext(guidelineId);
    if (!context) return res.status(404).json({ error: 'guideline not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
    if (context.guideline_status !== 'active') return res.status(409).json({ error: 'guideline voting disabled' });

    const commentId = uuid();
    await query(
      `insert into strategy_comments (id, guideline_id, author_id, body, status)
       values ($1, $2, $3, $4, 'visible')`,
      [commentId, guidelineId, req.auth.sub, body]
    );

    broadcast({ type: 'v1.comment.created', institutionId: req.auth.institutionId, guidelineId, commentId });
    res.status(201).json({ commentId });
  });


  app.post('/api/v1/initiatives/:initiativeId/comments', requireAuth, async (req, res) => {
    const initiativeId = String(req.params.initiativeId || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!initiativeId || !body) return res.status(400).json({ error: 'initiativeId and body required' });

    const context = await loadInitiativeContext(initiativeId);
    if (!context) return res.status(404).json({ error: 'initiative not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
    if (context.initiative_status !== 'active') return res.status(409).json({ error: 'initiative voting disabled' });

    const commentId = uuid();
    await query(
      `insert into strategy_initiative_comments (id, initiative_id, author_id, body, status)
       values ($1, $2, $3, $4, 'visible')`,
      [commentId, initiativeId, req.auth.sub, body]
    );

    broadcast({ type: 'v1.initiative.comment.created', institutionId: req.auth.institutionId, initiativeId, commentId });
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
    if (context.guideline_status !== 'active') return res.status(409).json({ error: 'guideline voting disabled' });

    const currentVote = await query(
      'select score from strategy_votes where guideline_id = $1 and voter_id = $2',
      [guidelineId, req.auth.sub]
    );
    const currentScore = currentVote.rows[0]?.score || 0;

    const totalRes = await query(
      `select
         (
           coalesce((
             select sum(v.score)::int
             from strategy_votes v
             join strategy_guidelines g on g.id = v.guideline_id
             where v.voter_id = $1 and g.cycle_id = $2
           ), 0)
           +
           coalesce((
             select sum(v.score)::int
             from strategy_initiative_votes v
             join strategy_initiatives i on i.id = v.initiative_id
             where v.voter_id = $1 and i.cycle_id = $2
           ), 0)
         )::int as total_used`,
      [req.auth.sub, context.cycle_id]
    );
    const totalUsed = totalRes.rows[0].total_used;
    const nextTotal = totalUsed - currentScore + score;
    if (nextTotal > voteBudget) {
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
    res.json({ ok: true, score, totalUsed: nextTotal, budget: voteBudget });
  });


  app.put('/api/v1/initiatives/:initiativeId/vote', requireAuth, async (req, res) => {
    const initiativeId = String(req.params.initiativeId || '').trim();
    const score = Number(req.body?.score);
    if (!initiativeId || !Number.isInteger(score) || score < 0 || score > 5) {
      return res.status(400).json({ error: 'initiativeId and score(0..5) required' });
    }

    const context = await loadInitiativeContext(initiativeId);
    if (!context) return res.status(404).json({ error: 'initiative not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });
    if (!isCycleWritable(context.cycle_state)) return res.status(409).json({ error: 'cycle not writable' });
    if (context.initiative_status !== 'active') return res.status(409).json({ error: 'initiative voting disabled' });

    const currentVote = await query(
      'select score from strategy_initiative_votes where initiative_id = $1 and voter_id = $2',
      [initiativeId, req.auth.sub]
    );
    const currentScore = currentVote.rows[0]?.score || 0;

    const totalRes = await query(
      `select
         (
           coalesce((
             select sum(v.score)::int
             from strategy_votes v
             join strategy_guidelines g on g.id = v.guideline_id
             where v.voter_id = $1 and g.cycle_id = $2
           ), 0)
           +
           coalesce((
             select sum(v.score)::int
             from strategy_initiative_votes v
             join strategy_initiatives i on i.id = v.initiative_id
             where v.voter_id = $1 and i.cycle_id = $2
           ), 0)
         )::int as total_used`,
      [req.auth.sub, context.cycle_id]
    );
    const totalUsed = totalRes.rows[0].total_used;
    const nextTotal = totalUsed - currentScore + score;
    if (nextTotal > voteBudget) {
      return res.status(400).json({ error: 'vote budget exceeded' });
    }

    if (currentVote.rowCount > 0) {
      await query(
        `update strategy_initiative_votes
         set score = $1, updated_at = now()
         where initiative_id = $2 and voter_id = $3`,
        [score, initiativeId, req.auth.sub]
      );
    } else {
      await query(
        `insert into strategy_initiative_votes (id, initiative_id, voter_id, score)
         values ($1, $2, $3, $4)`,
        [uuid(), initiativeId, req.auth.sub, score]
      );
    }

    broadcast({ type: 'v1.initiative.vote.updated', institutionId: req.auth.institutionId, initiativeId, score });
    res.json({ ok: true, score, totalUsed: nextTotal, budget: voteBudget });
  });


}

module.exports = { registerMemberRoutes };


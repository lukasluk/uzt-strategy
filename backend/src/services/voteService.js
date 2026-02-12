function createVoteService({ query }) {
  async function getUserCycleVotes(cycleId, userId) {
    const votesRes = await query(
      `select v.guideline_id, v.score
       from strategy_votes v
       join strategy_guidelines g on g.id = v.guideline_id
       where g.cycle_id = $1 and v.voter_id = $2`,
      [cycleId, userId]
    );

    const initiativeVotesRes = await query(
      `select v.initiative_id, v.score
       from strategy_initiative_votes v
       join strategy_initiatives i on i.id = v.initiative_id
       where i.cycle_id = $1 and v.voter_id = $2`,
      [cycleId, userId]
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

    return { votes, initiativeVotes, totalUsed };
  }

  async function getCurrentGuidelineVote(guidelineId, voterId) {
    const res = await query(
      'select score from strategy_votes where guideline_id = $1 and voter_id = $2',
      [guidelineId, voterId]
    );
    return res.rows[0] || null;
  }

  async function getCurrentInitiativeVote(initiativeId, voterId) {
    const res = await query(
      'select score from strategy_initiative_votes where initiative_id = $1 and voter_id = $2',
      [initiativeId, voterId]
    );
    return res.rows[0] || null;
  }

  async function calculateUserCycleVoteTotal(userId, cycleId) {
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
      [userId, cycleId]
    );
    return Number(totalRes.rows[0]?.total_used || 0);
  }

  async function upsertGuidelineVote({ guidelineId, voterId, score, uuid }) {
    const existing = await getCurrentGuidelineVote(guidelineId, voterId);
    if (existing) {
      await query(
        `update strategy_votes
         set score = $1, updated_at = now()
         where guideline_id = $2 and voter_id = $3`,
        [score, guidelineId, voterId]
      );
      return;
    }

    await query(
      `insert into strategy_votes (id, guideline_id, voter_id, score)
       values ($1, $2, $3, $4)`,
      [uuid(), guidelineId, voterId, score]
    );
  }

  async function upsertInitiativeVote({ initiativeId, voterId, score, uuid }) {
    const existing = await getCurrentInitiativeVote(initiativeId, voterId);
    if (existing) {
      await query(
        `update strategy_initiative_votes
         set score = $1, updated_at = now()
         where initiative_id = $2 and voter_id = $3`,
        [score, initiativeId, voterId]
      );
      return;
    }

    await query(
      `insert into strategy_initiative_votes (id, initiative_id, voter_id, score)
       values ($1, $2, $3, $4)`,
      [uuid(), initiativeId, voterId, score]
    );
  }

  return {
    getUserCycleVotes,
    getCurrentGuidelineVote,
    getCurrentInitiativeVote,
    calculateUserCycleVoteTotal,
    upsertGuidelineVote,
    upsertInitiativeVote
  };
}

module.exports = { createVoteService };

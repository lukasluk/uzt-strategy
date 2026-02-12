function createContextLookupService({ query }) {
  async function verifyCycleAccess(cycleId, institutionId) {
    const cycleRes = await query(
      'select id, institution_id, state from strategy_cycles where id = $1',
      [cycleId]
    );
    const cycle = cycleRes.rows[0];
    if (!cycle) return { ok: false, status: 404, error: 'cycle not found' };
    if (cycle.institution_id !== institutionId) {
      return { ok: false, status: 403, error: 'cross-institution forbidden' };
    }
    return { ok: true, cycle };
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

  function normalizeLineSide(value) {
    const side = String(value || 'auto').trim().toLowerCase();
    if (['auto', 'left', 'right', 'top', 'bottom'].includes(side)) return side;
    return null;
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

  return {
    verifyCycleAccess,
    loadGuidelineContext,
    loadCommentContext,
    loadInitiativeContext,
    loadInitiativeCommentContext,
    isCycleWritable,
    normalizeLineSide,
    validateGuidelineRelationship,
    validateInitiativeGuidelineAssignments
  };
}

module.exports = { createContextLookupService };

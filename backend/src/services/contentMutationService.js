function createContentMutationService({ query }) {
  async function createGuideline({ cycleId, title, description, createdBy, uuid }) {
    const guidelineId = uuid();
    await query(
      `insert into strategy_guidelines (id, cycle_id, title, description, status, created_by)
       values ($1, $2, $3, $4, 'active', $5)`,
      [guidelineId, cycleId, title, description || null, createdBy]
    );
    return guidelineId;
  }

  async function createInitiativeWithGuidelines({
    cycleId,
    title,
    description,
    lineSide,
    guidelineIds,
    createdBy,
    uuid
  }) {
    const initiativeId = uuid();
    await query(
      `insert into strategy_initiatives (id, cycle_id, title, description, status, line_side, created_by)
       values ($1, $2, $3, $4, 'active', $5, $6)`,
      [initiativeId, cycleId, title, description || null, lineSide, createdBy]
    );
    for (const guidelineId of guidelineIds) {
      await query(
        `insert into strategy_initiative_guidelines (id, initiative_id, guideline_id)
         values ($1, $2, $3)`,
        [uuid(), initiativeId, guidelineId]
      );
    }
    return initiativeId;
  }

  async function createGuidelineComment({ guidelineId, authorId, body, uuid }) {
    const commentId = uuid();
    await query(
      `insert into strategy_comments (id, guideline_id, author_id, body, status)
       values ($1, $2, $3, $4, 'visible')`,
      [commentId, guidelineId, authorId, body]
    );
    return commentId;
  }

  async function createInitiativeComment({ initiativeId, authorId, body, uuid }) {
    const commentId = uuid();
    await query(
      `insert into strategy_initiative_comments (id, initiative_id, author_id, body, status)
       values ($1, $2, $3, $4, 'visible')`,
      [commentId, initiativeId, authorId, body]
    );
    return commentId;
  }

  return {
    createGuideline,
    createInitiativeWithGuidelines,
    createGuidelineComment,
    createInitiativeComment
  };
}

module.exports = { createContentMutationService };

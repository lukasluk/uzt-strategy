function createAdminMutationService({ query }) {
  async function createInstitutionInvite({
    institutionId,
    email,
    role,
    tokenHash,
    inviteTtlHours,
    createdBy,
    uuid
  }) {
    await query(
      `insert into institution_invites (id, institution_id, email, role, token_hash, expires_at, created_by)
       values ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval, $7)`,
      [uuid(), institutionId, email, role, tokenHash, String(inviteTtlHours), createdBy]
    );
  }

  async function setCycleState({ cycleId, state }) {
    await query(
      `update strategy_cycles
       set state = $1,
           finalized_at = case when $1 = 'closed' then now() else null end
       where id = $2`,
      [state, cycleId]
    );
  }

  async function setCycleSettings({ cycleId, missionProvided, missionText, visionProvided, visionText }) {
    const updated = await query(
      `update strategy_cycles
       set mission_text = case when $1::boolean then $2 else mission_text end,
           vision_text = case when $3::boolean then $4 else vision_text end
       where id = $5
       returning mission_text, vision_text`,
      [missionProvided, missionText, visionProvided, visionText, cycleId]
    );
    return updated.rows[0] || null;
  }

  async function setCycleResultsPublished({ cycleId, published }) {
    await query('update strategy_cycles set results_published = $1 where id = $2', [published, cycleId]);
  }

  async function updatePlatformUserPassword({ userId, salt, hash }) {
    await query(
      `update platform_users
       set password_salt = $1,
           password_hash = $2
       where id = $3`,
      [salt, hash, userId]
    );
  }

  async function deleteInstitutionMembership({ institutionId, userId }) {
    await query(
      `delete from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [institutionId, userId]
    );
  }

  async function countUserMemberships(userId) {
    const leftRes = await query(
      `select count(*)::int as membership_count
       from institution_memberships
       where user_id = $1`,
      [userId]
    );
    return Number(leftRes.rows[0]?.membership_count || 0);
  }

  async function deletePlatformUser(userId) {
    await query('delete from platform_users where id = $1', [userId]);
  }

  async function setGuidelineCommentStatus({ commentId, status }) {
    await query(
      `update strategy_comments
       set status = $1
       where id = $2`,
      [status, commentId]
    );
  }

  async function setInitiativeCommentStatus({ commentId, status }) {
    await query(
      `update strategy_initiative_comments
       set status = $1
       where id = $2`,
      [status, commentId]
    );
  }

  async function setCycleMapPosition({ cycleId, x, y }) {
    await query(
      `update strategy_cycles
       set map_x = $1, map_y = $2
       where id = $3`,
      [x, y, cycleId]
    );
  }

  async function listExistingGuidelineIds({ cycleId, guidelineIds }) {
    const validRes = await query(
      `select id
       from strategy_guidelines
       where cycle_id = $1 and id = any($2::uuid[])`,
      [cycleId, guidelineIds]
    );
    return new Set(validRes.rows.map((row) => row.id));
  }

  async function setGuidelineMapPosition({ cycleId, guidelineId, x, y }) {
    await query(
      `update strategy_guidelines
       set map_x = $1, map_y = $2
       where id = $3 and cycle_id = $4`,
      [x, y, guidelineId, cycleId]
    );
  }

  async function listExistingInitiativeIds({ cycleId, initiativeIds }) {
    const validRes = await query(
      `select id
       from strategy_initiatives
       where cycle_id = $1 and id = any($2::uuid[])`,
      [cycleId, initiativeIds]
    );
    return new Set(validRes.rows.map((row) => row.id));
  }

  async function setInitiativeMapPosition({ cycleId, initiativeId, x, y }) {
    await query(
      `update strategy_initiatives
       set map_x = $1, map_y = $2
       where id = $3 and cycle_id = $4`,
      [x, y, initiativeId, cycleId]
    );
  }

  async function hasGuidelineChildren(guidelineId) {
    const childrenRes = await query(
      `select id from strategy_guidelines
       where parent_guideline_id = $1 and id <> $1
       limit 1`,
      [guidelineId]
    );
    return childrenRes.rowCount > 0;
  }

  async function updateGuidelineRecord({
    guidelineId,
    title,
    description,
    status,
    relationType,
    parentGuidelineId,
    lineSide
  }) {
    await query(
      `update strategy_guidelines
       set title = $1,
           description = $2,
           status = $3,
           relation_type = $4,
           parent_guideline_id = $5,
           line_side = $6,
           updated_at = now()
       where id = $7`,
      [title, description || null, status, relationType, parentGuidelineId, lineSide, guidelineId]
    );
  }

  async function updateInitiativeRecord({ initiativeId, title, description, status, lineSide }) {
    await query(
      `update strategy_initiatives
       set title = $1,
           description = $2,
           status = $3,
           line_side = $4,
           updated_at = now()
       where id = $5`,
      [title, description || null, status, lineSide, initiativeId]
    );
  }

  async function replaceInitiativeGuidelineLinks({ initiativeId, guidelineIds, uuid }) {
    await query('delete from strategy_initiative_guidelines where initiative_id = $1', [initiativeId]);
    for (const guidelineId of guidelineIds) {
      await query(
        `insert into strategy_initiative_guidelines (id, initiative_id, guideline_id)
         values ($1, $2, $3)`,
        [uuid(), initiativeId, guidelineId]
      );
    }
  }

  async function deleteInitiativeByCycle({ initiativeId, cycleId }) {
    await query(
      `delete from strategy_initiatives
       where id = $1 and cycle_id = $2`,
      [initiativeId, cycleId]
    );
  }

  async function resetChildrenToOrphan(guidelineId) {
    await query(
      `update strategy_guidelines
       set relation_type = 'orphan',
           parent_guideline_id = null,
           updated_at = now()
       where parent_guideline_id = $1`,
      [guidelineId]
    );
  }

  async function deleteGuidelineByCycle({ guidelineId, cycleId }) {
    await query(
      `delete from strategy_guidelines
       where id = $1 and cycle_id = $2`,
      [guidelineId, cycleId]
    );
  }

  return {
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
  };
}

module.exports = { createAdminMutationService };

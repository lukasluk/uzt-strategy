function normalizeLineSide(value) {
  return 'auto';
}

function normalizeRelationType(value) {
  const relation = String(value || 'orphan').trim().toLowerCase();
  if (relation === 'parent' || relation === 'child' || relation === 'orphan') return relation;
  return null;
}

function normalizeGuidelineIds(value) {
  return [...new Set(
    (Array.isArray(value) ? value : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  )];
}

function parseGuidelineIdsJson(value) {
  if (Array.isArray(value)) return normalizeGuidelineIds(value);
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return normalizeGuidelineIds(parsed);
  } catch {
    return [];
  }
}

function parseJsonObject(value) {
  if (!value) return {};
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // ignore invalid json
  }
  return {};
}

function mapProposalRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    institutionId: row.institution_id,
    cycleId: row.cycle_id,
    strategyId: row.strategy_id || null,
    entityKind: row.entity_kind,
    status: row.status,
    title: row.title,
    description: row.description || null,
    relationType: row.relation_type || null,
    parentGuidelineId: row.parent_guideline_id || null,
    lineSide: normalizeLineSide(row.line_side),
    guidelineIds: parseGuidelineIdsJson(row.guideline_ids_json),
    sourceMeta: parseJsonObject(row.source_meta_json),
    reviewDecision: row.review_decision || null,
    reviewNote: row.review_note || null,
    requestedBy: row.requested_by || null,
    requestedByName: row.requested_by_name || null,
    reviewedBy: row.reviewed_by || null,
    reviewedByName: row.reviewed_by_name || null,
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at || null,
    finalEntityId: row.final_entity_id || null,
    finalTitle: row.final_title || null,
    finalDescription: row.final_description || null,
    finalRelationType: row.final_relation_type || null,
    finalParentGuidelineId: row.final_parent_guideline_id || null,
    finalLineSide: normalizeLineSide(row.final_line_side),
    finalGuidelineIds: parseGuidelineIdsJson(row.final_guideline_ids_json),
    commentCount: Number(row.comment_count || 0)
  };
}

function historyActorName(row, idField, nameField, emailField) {
  if (!row) return '-';
  const byName = String(row[nameField] || '').trim();
  if (byName) return byName;
  const byEmail = String(row[emailField] || '').trim();
  if (byEmail) return byEmail;
  const byId = String(row[idField] || '').trim();
  return byId || '-';
}

function historySortKey(row) {
  const action = String(row?.action || '').trim().toLowerCase();
  if (action === 'strategy_created') return -100;
  if (action === 'proposal_submitted') return -10;
  if (action.endsWith('_commented')) return 0;
  return 10;
}

function createProposalModerationService({ query, pool }) {
  async function validateActiveParentGuideline(client, { cycleId, guidelineId }) {
    const id = String(guidelineId || '').trim();
    if (!id) throw new Error('parent guideline required for child');

    const parentRes = await client.query(
      `select id
       from strategy_guidelines
       where id = $1
         and cycle_id = $2
         and status = 'active'
         and relation_type = 'parent'
       limit 1`,
      [id, cycleId]
    );
    if (!parentRes.rowCount) throw new Error('parent guideline not found');
    return parentRes.rows[0].id;
  }

  async function validateActiveGuidelines(client, { cycleId, guidelineIds }) {
    const normalizedIds = normalizeGuidelineIds(guidelineIds);
    if (!normalizedIds.length) throw new Error('at least one guideline required');

    const validRes = await client.query(
      `select id
       from strategy_guidelines
       where cycle_id = $1
         and status = 'active'
         and id = any($2::uuid[])`,
      [cycleId, normalizedIds]
    );
    if (validRes.rowCount !== normalizedIds.length) {
      throw new Error('guideline not in cycle');
    }
    return normalizedIds;
  }

  async function createGuidelineProposal({
    institutionId,
    cycleId,
    strategyId,
    title,
    description,
    relationType,
    parentGuidelineId,
    sourceMeta,
    createdBy,
    uuid
  }) {
    const relation = normalizeRelationType(relationType || 'orphan');
    if (!relation) throw new Error('invalid relation type');
    const normalizedTitle = String(title || '').trim();
    if (!normalizedTitle) throw new Error('title required');

    const client = await pool.connect();
    try {
      await client.query('begin');
      const proposalId = uuid();
      let parentId = null;
      if (relation === 'child') {
        parentId = await validateActiveParentGuideline(client, { cycleId, guidelineId: parentGuidelineId });
      }

      await client.query(
        `insert into strategy_card_proposals (
           id,
           institution_id,
           cycle_id,
           strategy_id,
           entity_kind,
           title,
           description,
           relation_type,
           parent_guideline_id,
           line_side,
           guideline_ids_json,
           source_meta_json,
           status,
           requested_by
         )
         values (
           $1, $2, $3, $4, 'guideline',
           $5, $6, $7, $8, 'auto', '[]'::jsonb, $9::jsonb,
           'pending', $10
         )`,
        [
          proposalId,
          institutionId,
          cycleId,
          strategyId || null,
          normalizedTitle,
          String(description || '').trim() || null,
          relation,
          parentId,
          JSON.stringify(parseJsonObject(sourceMeta)),
          createdBy
        ]
      );

      await client.query(
        `insert into strategy_card_proposal_events (
           id,
           proposal_id,
           institution_id,
           cycle_id,
           actor_id,
           event_type,
           payload_json
         )
         values ($1, $2, $3, $4, $5, 'created', $6::jsonb)`,
        [
          uuid(),
          proposalId,
          institutionId,
          cycleId,
          createdBy,
          JSON.stringify({
            entityKind: 'guideline',
            title: normalizedTitle,
            relationType: relation,
            parentGuidelineId: parentId || null,
            sourceMeta: parseJsonObject(sourceMeta)
          })
        ]
      );

      await client.query('commit');
      return proposalId;
    } catch (error) {
      try {
        await client.query('rollback');
      } catch {
        // ignore rollback errors
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async function createInitiativeProposal({
    institutionId,
    cycleId,
    strategyId,
    title,
    description,
    lineSide,
    guidelineIds,
    sourceMeta,
    createdBy,
    uuid
  }) {
    const normalizedTitle = String(title || '').trim();
    if (!normalizedTitle) throw new Error('title required');
    const normalizedLineSide = normalizeLineSide(lineSide);

    const client = await pool.connect();
    try {
      await client.query('begin');
      const proposalId = uuid();
      const normalizedGuidelineIds = await validateActiveGuidelines(client, { cycleId, guidelineIds });

      await client.query(
        `insert into strategy_card_proposals (
           id,
           institution_id,
           cycle_id,
           strategy_id,
           entity_kind,
           title,
           description,
           relation_type,
           parent_guideline_id,
           line_side,
           guideline_ids_json,
           source_meta_json,
           status,
           requested_by
         )
         values (
           $1, $2, $3, $4, 'initiative',
           $5, $6, null, null, $7, $8::jsonb, $9::jsonb,
           'pending', $10
         )`,
        [
          proposalId,
          institutionId,
          cycleId,
          strategyId || null,
          normalizedTitle,
          String(description || '').trim() || null,
          normalizedLineSide,
          JSON.stringify(normalizedGuidelineIds),
          JSON.stringify(parseJsonObject(sourceMeta)),
          createdBy
        ]
      );

      await client.query(
        `insert into strategy_card_proposal_events (
           id,
           proposal_id,
           institution_id,
           cycle_id,
           actor_id,
           event_type,
           payload_json
         )
         values ($1, $2, $3, $4, $5, 'created', $6::jsonb)`,
        [
          uuid(),
          proposalId,
          institutionId,
          cycleId,
          createdBy,
          JSON.stringify({
            entityKind: 'initiative',
            title: normalizedTitle,
            lineSide: normalizedLineSide,
            guidelineIds: normalizedGuidelineIds,
            sourceMeta: parseJsonObject(sourceMeta)
          })
        ]
      );

      await client.query('commit');
      return proposalId;
    } catch (error) {
      try {
        await client.query('rollback');
      } catch {
        // ignore rollback errors
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async function loadGuidelineProposalContext(proposalId) {
    const res = await query(
      `select p.id as proposal_id,
              p.status as proposal_status,
              c.id as cycle_id,
              c.state as cycle_state,
              c.institution_id
       from strategy_card_proposals p
       join strategy_cycles c on c.id = p.cycle_id
       where p.id = $1
         and p.entity_kind = 'guideline'
       limit 1`,
      [proposalId]
    );
    return res.rows[0] || null;
  }

  async function loadInitiativeProposalContext(proposalId) {
    const res = await query(
      `select p.id as proposal_id,
              p.status as proposal_status,
              c.id as cycle_id,
              c.state as cycle_state,
              c.institution_id
       from strategy_card_proposals p
       join strategy_cycles c on c.id = p.cycle_id
       where p.id = $1
         and p.entity_kind = 'initiative'
       limit 1`,
      [proposalId]
    );
    return res.rows[0] || null;
  }

  async function createProposalComment({
    proposalId,
    institutionId,
    cycleId,
    authorId,
    body,
    uuid
  }) {
    const commentId = uuid();
    await query(
      `insert into strategy_card_proposal_comments (id, proposal_id, author_id, body, status)
       values ($1, $2, $3, $4, 'visible')`,
      [commentId, proposalId, authorId, body]
    );

    await query(
      `insert into strategy_card_proposal_events (
         id,
         proposal_id,
         institution_id,
         cycle_id,
         actor_id,
         event_type,
         payload_json
       )
       values ($1, $2, $3, $4, $5, 'commented', null)`,
      [uuid(), proposalId, institutionId, cycleId, authorId]
    );
    return commentId;
  }

  async function listCycleProposalHistory({ cycleId }) {
    const res = await query(
      `select p.*,
              requester.display_name as requested_by_name,
              reviewer.display_name as reviewed_by_name,
              coalesce((
                select count(*)
                from strategy_card_proposal_comments c
                where c.proposal_id = p.id
                  and c.status = 'visible'
              ), 0)::int as comment_count
       from strategy_card_proposals p
       left join platform_users requester on requester.id = p.requested_by
       left join platform_users reviewer on reviewer.id = p.reviewed_by
       where p.cycle_id = $1
       order by p.requested_at desc`,
      [cycleId]
    );
    return res.rows.map((row) => mapProposalRow(row));
  }

  async function listCycleHistoryRows({ cycleId }) {
    const historyRows = [];

    const cycleRes = await query(
      `select c.id as cycle_id,
              c.title as cycle_title,
              c.created_at as cycle_created_at,
              c.strategy_id,
              s.title as strategy_title
       from strategy_cycles c
       left join institution_strategies s on s.id = c.strategy_id
       where c.id = $1
       limit 1`,
      [cycleId]
    );
    const cycle = cycleRes.rows[0] || null;
    if (cycle?.cycle_created_at) {
      historyRows.push({
        id: `strategy-created:${cycleId}`,
        occurredAt: cycle.cycle_created_at,
        entityKind: 'strategy',
        action: 'strategy_created',
        entityId: cycle.strategy_id || null,
        proposalId: null,
        title: String(cycle.strategy_title || cycle.cycle_title || 'Strategy').trim() || 'Strategy',
        details: String(cycle.cycle_title || '').trim() || null,
        actorId: null,
        actorName: 'System'
      });
    }

    const proposalRes = await query(
      `select p.*,
              requester.display_name as requested_by_name,
              requester.email as requested_by_email,
              reviewer.display_name as reviewed_by_name,
              reviewer.email as reviewed_by_email
       from strategy_card_proposals p
       left join platform_users requester on requester.id = p.requested_by
       left join platform_users reviewer on reviewer.id = p.reviewed_by
       where p.cycle_id = $1`,
      [cycleId]
    );
    proposalRes.rows.forEach((proposal) => {
      const proposalId = String(proposal.id || '').trim();
      const entityKind = String(proposal.entity_kind || '').trim().toLowerCase() || 'guideline';
      const proposalTitle = String(proposal.title || proposalId || '-').trim() || '-';
      const submittedAt = proposal.requested_at || null;
      const reviewedAt = proposal.reviewed_at || null;
      const status = String(proposal.status || '').trim().toLowerCase();
      const reviewDecision = String(proposal.review_decision || '').trim().toLowerCase();

      if (submittedAt) {
        historyRows.push({
          id: `${proposalId}:submitted`,
          occurredAt: submittedAt,
          entityKind,
          action: 'proposal_submitted',
          entityId: null,
          proposalId,
          title: proposalTitle,
          details: String(proposal.description || '').trim() || null,
          actorId: proposal.requested_by || null,
          actorName: historyActorName(proposal, 'requested_by', 'requested_by_name', 'requested_by_email')
        });
      }

      if (!reviewedAt) return;
      if (status !== 'approved' && status !== 'rejected' && status !== 'cancelled') return;

      let action = 'proposal_approved';
      if (status === 'rejected') action = 'proposal_rejected';
      if (status === 'cancelled') action = 'proposal_cancelled';
      if (status === 'approved' && reviewDecision === 'approved_with_changes') {
        action = 'proposal_approved_with_changes';
      }

      historyRows.push({
        id: `${proposalId}:${action}`,
        occurredAt: reviewedAt,
        entityKind,
        action,
        entityId: String(proposal.final_entity_id || '').trim() || null,
        proposalId,
        title: String(proposal.final_title || proposal.title || proposalId || '-').trim() || '-',
        details: String(proposal.review_note || proposal.final_description || proposal.description || '').trim() || null,
        actorId: proposal.reviewed_by || null,
        actorName: historyActorName(proposal, 'reviewed_by', 'reviewed_by_name', 'reviewed_by_email')
      });
    });

    const proposalCommentRes = await query(
      `select c.id,
              c.body,
              c.created_at,
              c.author_id,
              u.display_name as author_name,
              u.email as author_email,
              p.id as proposal_id,
              p.entity_kind,
              p.title as proposal_title
       from strategy_card_proposal_comments c
       join strategy_card_proposals p on p.id = c.proposal_id
       left join platform_users u on u.id = c.author_id
       where p.cycle_id = $1
         and c.status = 'visible'`,
      [cycleId]
    );
    proposalCommentRes.rows.forEach((row) => {
      const proposalId = String(row.proposal_id || '').trim();
      historyRows.push({
        id: `${row.id}:proposal-comment`,
        occurredAt: row.created_at,
        entityKind: String(row.entity_kind || '').trim().toLowerCase() || 'guideline',
        action: 'proposal_commented',
        entityId: null,
        proposalId: proposalId || null,
        title: String(row.proposal_title || proposalId || '-').trim() || '-',
        details: String(row.body || '').trim() || null,
        actorId: row.author_id || null,
        actorName: historyActorName(row, 'author_id', 'author_name', 'author_email')
      });
    });

    const guidelineCommentRes = await query(
      `select c.id,
              c.body,
              c.created_at,
              c.author_id,
              u.display_name as author_name,
              u.email as author_email,
              g.id as guideline_id,
              g.title as guideline_title
       from strategy_comments c
       join strategy_guidelines g on g.id = c.guideline_id
       left join platform_users u on u.id = c.author_id
       where g.cycle_id = $1
         and c.status = 'visible'`,
      [cycleId]
    );
    guidelineCommentRes.rows.forEach((row) => {
      const guidelineId = String(row.guideline_id || '').trim();
      historyRows.push({
        id: `${row.id}:guideline-comment`,
        occurredAt: row.created_at,
        entityKind: 'guideline',
        action: 'guideline_commented',
        entityId: guidelineId || null,
        proposalId: null,
        title: String(row.guideline_title || guidelineId || '-').trim() || '-',
        details: String(row.body || '').trim() || null,
        actorId: row.author_id || null,
        actorName: historyActorName(row, 'author_id', 'author_name', 'author_email')
      });
    });

    const initiativeCommentRes = await query(
      `select c.id,
              c.body,
              c.created_at,
              c.author_id,
              u.display_name as author_name,
              u.email as author_email,
              i.id as initiative_id,
              i.title as initiative_title
       from strategy_initiative_comments c
       join strategy_initiatives i on i.id = c.initiative_id
       left join platform_users u on u.id = c.author_id
       where i.cycle_id = $1
         and c.status = 'visible'`,
      [cycleId]
    );
    initiativeCommentRes.rows.forEach((row) => {
      const initiativeId = String(row.initiative_id || '').trim();
      historyRows.push({
        id: `${row.id}:initiative-comment`,
        occurredAt: row.created_at,
        entityKind: 'initiative',
        action: 'initiative_commented',
        entityId: initiativeId || null,
        proposalId: null,
        title: String(row.initiative_title || initiativeId || '-').trim() || '-',
        details: String(row.body || '').trim() || null,
        actorId: row.author_id || null,
        actorName: historyActorName(row, 'author_id', 'author_name', 'author_email')
      });
    });

    const gremlinAnalysisRes = await query(
      `select a.id,
              a.analysis_json,
              a.created_by,
              u.display_name as created_by_name,
              u.email as created_by_email
       from clarity_gremlin_analyses a
       left join platform_users u on u.id = a.created_by
       where a.cycle_id = $1`,
      [cycleId]
    );
    gremlinAnalysisRes.rows.forEach((row) => {
      const analysis = row.analysis_json && typeof row.analysis_json === 'object'
        ? row.analysis_json
        : {};
      const drafts = Array.isArray(analysis.proposalDrafts) ? analysis.proposalDrafts : [];
      drafts.forEach((draft, index) => {
        const implemented = draft && typeof draft.implemented === 'object'
          ? draft.implemented
          : null;
        const occurredAt = String(implemented?.appliedAt || '').trim();
        const entityKind = String(implemented?.entityKind || draft?.entityKind || '').trim().toLowerCase();
        const entityId = String(implemented?.entityId || '').trim();
        if (!implemented || !occurredAt || !entityId || (entityKind !== 'guideline' && entityKind !== 'initiative')) return;
        historyRows.push({
          id: `${row.id}:gremlin-draft:${index}`,
          occurredAt,
          entityKind,
          action: 'gremlin_draft_implemented',
          entityId,
          proposalId: null,
          title: String(implemented?.entityTitle || draft?.title || entityId || '-').trim() || '-',
          details: String(draft?.rationale || draft?.description || '').trim() || null,
          actorId: implemented?.appliedBy || row.created_by || null,
          actorName: historyActorName(
            {
              author_id: implemented?.appliedBy || row.created_by || null,
              author_name: row.created_by_name,
              author_email: row.created_by_email
            },
            'author_id',
            'author_name',
            'author_email'
          )
        });
      });
    });

    return historyRows.sort((left, right) => {
      const leftTs = Date.parse(String(left?.occurredAt || '')) || 0;
      const rightTs = Date.parse(String(right?.occurredAt || '')) || 0;
      if (leftTs !== rightTs) return leftTs - rightTs;
      const byWeight = historySortKey(left) - historySortKey(right);
      if (byWeight !== 0) return byWeight;
      return String(left?.id || '').localeCompare(String(right?.id || ''));
    });
  }

  async function listCyclePendingProposals({ cycleId }) {
    const res = await query(
      `select p.*,
              requester.display_name as requested_by_name,
              reviewer.display_name as reviewed_by_name,
              coalesce((
                select count(*)
                from strategy_card_proposal_comments c
                where c.proposal_id = p.id
                  and c.status = 'visible'
              ), 0)::int as comment_count
       from strategy_card_proposals p
       left join platform_users requester on requester.id = p.requested_by
       left join platform_users reviewer on reviewer.id = p.reviewed_by
       where p.cycle_id = $1
         and p.status = 'pending'
       order by p.requested_at asc`,
      [cycleId]
    );
    return res.rows.map((row) => mapProposalRow(row));
  }

  async function listPublicProposalComments({ cycleId, entityKind }) {
    const res = await query(
      `select c.id,
              c.proposal_id,
              c.body,
              c.created_at,
              u.display_name as author_display_name,
              u.email as author_email
       from strategy_card_proposal_comments c
       join strategy_card_proposals p on p.id = c.proposal_id
       left join platform_users u on u.id = c.author_id
       where p.cycle_id = $1
         and p.entity_kind = $2
         and p.status = 'pending'
         and c.status = 'visible'
       order by c.created_at asc`,
      [cycleId, entityKind]
    );
    return res.rows;
  }

  async function loadPublicPendingProposals({ cycleId, entityKind }) {
    const res = await query(
      `select p.*
       from strategy_card_proposals p
       where p.cycle_id = $1
         and p.entity_kind = $2
         and p.status = 'pending'
       order by p.requested_at asc`,
      [cycleId, entityKind]
    );
    return res.rows.map((row) => mapProposalRow(row));
  }

  async function resolveProposalAlias({ proposalId, institutionId, strategyId }) {
    const res = await query(
      `select id,
              institution_id,
              strategy_id,
              entity_kind,
              status,
              final_entity_id
       from strategy_card_proposals
       where id = $1
       limit 1`,
      [proposalId]
    );
    const row = res.rows[0] || null;
    if (!row) return null;
    if (institutionId && row.institution_id !== institutionId) return null;
    if (strategyId && row.strategy_id && row.strategy_id !== strategyId) return null;
    return {
      id: row.id,
      entityKind: row.entity_kind,
      status: row.status,
      finalEntityId: row.final_entity_id || null
    };
  }

  async function reviewPendingProposal({
    proposalId,
    institutionId,
    actorId,
    decision,
    reviewNote,
    patch = {},
    uuid
  }) {
    const normalizedDecision = String(decision || '').trim().toLowerCase();
    if (!['approved', 'approved_with_changes', 'rejected'].includes(normalizedDecision)) {
      throw new Error('invalid decision');
    }

    const client = await pool.connect();
    try {
      await client.query('begin');
      const proposalRes = await client.query(
        `select *
         from strategy_card_proposals
         where id = $1
         for update`,
        [proposalId]
      );
      const proposal = proposalRes.rows[0] || null;
      if (!proposal) {
        const notFound = new Error('proposal not found');
        notFound.status = 404;
        throw notFound;
      }
      if (proposal.institution_id !== institutionId) {
        const forbidden = new Error('cross-institution forbidden');
        forbidden.status = 403;
        throw forbidden;
      }
      if (proposal.status !== 'pending') {
        throw new Error('proposal already reviewed');
      }

      if (normalizedDecision === 'rejected') {
        await client.query(
          `update strategy_card_proposals
           set status = 'rejected',
               review_decision = 'rejected',
               review_note = $2,
               reviewed_by = $3,
               reviewed_at = now()
           where id = $1`,
          [proposal.id, String(reviewNote || '').trim() || null, actorId]
        );

        await client.query(
          `insert into strategy_card_proposal_events (
             id,
             proposal_id,
             institution_id,
             cycle_id,
             actor_id,
             event_type,
             payload_json
           )
           values ($1, $2, $3, $4, $5, 'rejected', $6::jsonb)`,
          [
            uuid(),
            proposal.id,
            proposal.institution_id,
            proposal.cycle_id,
            actorId,
            JSON.stringify({
              reviewNote: String(reviewNote || '').trim() || null
            })
          ]
        );

        await client.query('commit');
        return {
          proposalId: proposal.id,
          entityKind: proposal.entity_kind,
          status: 'rejected',
          decision: 'rejected',
          finalEntityId: null
        };
      }

      const finalTitle = String(
        (normalizedDecision === 'approved_with_changes' ? patch.title : null) || proposal.title || ''
      ).trim();
      if (!finalTitle) throw new Error('title required');
      const finalDescription = String(
        (normalizedDecision === 'approved_with_changes' ? patch.description : null) || proposal.description || ''
      ).trim() || null;

      let finalRelationType = null;
      let finalParentGuidelineId = null;
      let finalLineSide = null;
      let finalGuidelineIds = [];
      const finalEntityId = uuid();
      const sourceMeta = parseJsonObject(proposal.source_meta_json);

      if (proposal.entity_kind === 'guideline') {
        finalRelationType = normalizeRelationType(
          (normalizedDecision === 'approved_with_changes' ? patch.relationType : null) || proposal.relation_type || 'orphan'
        );
        if (!finalRelationType) throw new Error('invalid relation type');
        if (finalRelationType === 'child') {
          finalParentGuidelineId = await validateActiveParentGuideline(client, {
            cycleId: proposal.cycle_id,
            guidelineId: (normalizedDecision === 'approved_with_changes' ? patch.parentGuidelineId : null) || proposal.parent_guideline_id
          });
        }
        finalLineSide = 'auto';

        await client.query(
          `insert into strategy_guidelines (
             id,
             cycle_id,
             title,
             description,
             status,
             relation_type,
             parent_guideline_id,
             line_side,
             created_by
           )
           values ($1, $2, $3, $4, 'active', $5, $6, $7, $8)`,
          [
            finalEntityId,
            proposal.cycle_id,
            finalTitle,
            finalDescription,
            finalRelationType,
            finalParentGuidelineId,
            finalLineSide,
            proposal.requested_by || actorId
          ]
        );

        const sourceGuidelineId = String(sourceMeta?.sourceGuidelineId || '').trim();
        const sourceRelationType = String(sourceMeta?.sourceRelationType || '').trim().toLowerCase();
        if (finalRelationType === 'parent' && sourceRelationType === 'parent' && sourceGuidelineId && sourceGuidelineId !== finalEntityId) {
          const [firstId, secondId] = sourceGuidelineId < finalEntityId
            ? [sourceGuidelineId, finalEntityId]
            : [finalEntityId, sourceGuidelineId];
          await client.query(
            `insert into strategy_guideline_links (id, source_guideline_id, target_guideline_id, created_by)
             select $1, $2, $3, $4
             where exists (select 1 from strategy_guidelines where id = $2)
               and exists (select 1 from strategy_guidelines where id = $3)
             on conflict (source_guideline_id, target_guideline_id) do nothing`,
            [uuid(), firstId, secondId, actorId]
          );
        }
      } else {
        finalLineSide = 'auto';
        const sourceGuidelineIds = normalizedDecision === 'approved_with_changes' && Array.isArray(patch.guidelineIds)
          ? patch.guidelineIds
          : parseGuidelineIdsJson(proposal.guideline_ids_json);
        finalGuidelineIds = await validateActiveGuidelines(client, {
          cycleId: proposal.cycle_id,
          guidelineIds: sourceGuidelineIds
        });

        await client.query(
          `insert into strategy_initiatives (
             id,
             cycle_id,
             title,
             description,
             status,
             line_side,
             created_by
           )
           values ($1, $2, $3, $4, 'active', $5, $6)`,
          [
            finalEntityId,
            proposal.cycle_id,
            finalTitle,
            finalDescription,
            finalLineSide,
            proposal.requested_by || actorId
          ]
        );
        for (const guidelineId of finalGuidelineIds) {
          await client.query(
            `insert into strategy_initiative_guidelines (id, initiative_id, guideline_id)
             values ($1, $2, $3)`,
            [uuid(), finalEntityId, guidelineId]
          );
        }
      }

      await client.query(
        `update strategy_card_proposals
         set status = 'approved',
             review_decision = $2,
             review_note = $3,
             reviewed_by = $4,
             reviewed_at = now(),
             final_entity_id = $5,
             final_title = $6,
             final_description = $7,
             final_relation_type = $8,
             final_parent_guideline_id = $9,
             final_line_side = $10,
             final_guideline_ids_json = $11::jsonb
         where id = $1`,
        [
          proposal.id,
          normalizedDecision,
          String(reviewNote || '').trim() || null,
          actorId,
          finalEntityId,
          finalTitle,
          finalDescription,
          finalRelationType,
          finalParentGuidelineId,
          finalLineSide,
          JSON.stringify(finalGuidelineIds)
        ]
      );

      await client.query(
        `insert into strategy_card_proposal_events (
           id,
           proposal_id,
           institution_id,
           cycle_id,
           actor_id,
           event_type,
           payload_json
         )
         values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [
          uuid(),
          proposal.id,
          proposal.institution_id,
          proposal.cycle_id,
          actorId,
          normalizedDecision,
          JSON.stringify({
            reviewNote: String(reviewNote || '').trim() || null,
            finalEntityId,
            finalTitle,
            finalDescription,
            finalRelationType,
            finalParentGuidelineId,
            finalLineSide,
            finalGuidelineIds
          })
        ]
      );

      await client.query('commit');
      return {
        proposalId: proposal.id,
        entityKind: proposal.entity_kind,
        status: 'approved',
        decision: normalizedDecision,
        finalEntityId
      };
    } catch (error) {
      try {
        await client.query('rollback');
      } catch {
        // ignore rollback errors
      }
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    normalizeLineSide,
    createGuidelineProposal,
    createInitiativeProposal,
    loadGuidelineProposalContext,
    loadInitiativeProposalContext,
    createProposalComment,
    listCycleProposalHistory,
    listCycleHistoryRows,
    listCyclePendingProposals,
    loadPublicPendingProposals,
    listPublicProposalComments,
    resolveProposalAlias,
    reviewPendingProposal
  };
}

module.exports = { createProposalModerationService };

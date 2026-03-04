const { loadContentSettings } = require('./contentSettings');
const { parseBearer, readAuthToken } = require('./security');

function registerPublicRoutes({
  app,
  query,
  publicReadRateLimit,
  publicWriteRateLimit,
  trafficMonitor,
  normalizeEmail,
  getInstitutionBySlug,
  resolveInstitutionStrategy,
  getCurrentCycle,
  normalizeLineSide,
  authSecret,
  loadPublicPendingProposals,
  listPublicProposalComments,
  resolveProposalAlias
}) {
  const publicReadGuard = typeof publicReadRateLimit === 'function'
    ? publicReadRateLimit
    : (_req, _res, next) => next();
  const publicWriteGuard = typeof publicWriteRateLimit === 'function'
    ? publicWriteRateLimit
    : (_req, _res, next) => next();

  function resolveOptionalAuth(req) {
    if (!authSecret) return null;
    const token = parseBearer(req);
    if (!token) return null;
    return readAuthToken(token, authSecret);
  }

  function canViewCommentsForInstitution(auth, institutionId) {
    void institutionId;
    return Boolean(auth?.sub);
  }

  function normalizeStrategyOutput(strategy) {
    if (!strategy) return null;
    return {
      id: strategy.id,
      institutionId: strategy.institution_id,
      title: strategy.title,
      slug: strategy.slug,
      description: strategy.description || null,
      status: strategy.status,
      isDefault: Boolean(strategy.is_default),
      createdAt: strategy.created_at
    };
  }

  function normalizeCycleOutput(cycle) {
    if (!cycle) return null;
    return {
      id: cycle.id,
      title: cycle.title,
      state: cycle.state,
      finalizedAt: cycle.finalized_at,
      missionText: cycle.mission_text || null,
      visionText: cycle.vision_text || null,
      createdAt: cycle.created_at,
      mapX: Number.isFinite(Number(cycle.map_x)) ? Number(cycle.map_x) : null,
      mapY: Number.isFinite(Number(cycle.map_y)) ? Number(cycle.map_y) : null
    };
  }

  function proposalCommentsById(commentRows) {
    return (Array.isArray(commentRows) ? commentRows : []).reduce((acc, row) => {
      const proposalId = String(row.proposal_id || '').trim();
      if (!proposalId) return acc;
      if (!acc[proposalId]) acc[proposalId] = [];
      acc[proposalId].push({
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        authorName: row.author_display_name || null,
        authorEmail: row.author_email || null
      });
      return acc;
    }, {});
  }

  async function loadPendingGuidelinesForCycle(cycleId, commentsVisible) {
    const proposals = await loadPublicPendingProposals({ cycleId, entityKind: 'guideline' });
    const commentRows = commentsVisible
      ? await listPublicProposalComments({ cycleId, entityKind: 'guideline' })
      : [];
    const commentsByProposal = proposalCommentsById(commentRows);

    return proposals.map((proposal) => ({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      status: 'pending',
      relationType: proposal.relationType || 'orphan',
      parentGuidelineId: proposal.parentGuidelineId || null,
      lineSide: 'auto',
      totalScore: 0,
      voterCount: 0,
      strategyLinks: [],
      strategyLinkCount: 0,
      commentCount: commentsVisible ? (commentsByProposal[proposal.id] || []).length : 0,
      comments: commentsVisible ? (commentsByProposal[proposal.id] || []) : [],
      createdAt: proposal.requestedAt,
      pendingProposalId: proposal.id,
      pendingRequestedAt: proposal.requestedAt,
      pendingRequestedBy: proposal.requestedBy || null,
      pendingRequestedByName: proposal.requestedByName || null
    }));
  }

  async function loadPendingInitiativesForCycle(cycleId, commentsVisible) {
    const proposals = await loadPublicPendingProposals({ cycleId, entityKind: 'initiative' });
    const commentRows = commentsVisible
      ? await listPublicProposalComments({ cycleId, entityKind: 'initiative' })
      : [];
    const commentsByProposal = proposalCommentsById(commentRows);

    const allGuidelineIds = [...new Set(
      proposals.flatMap((proposal) => Array.isArray(proposal.guidelineIds) ? proposal.guidelineIds : [])
    )];
    let guidelineTitleById = {};
    if (allGuidelineIds.length) {
      const guidelineRes = await query(
        `select id, title
         from strategy_guidelines
         where cycle_id = $1
           and status = 'active'
           and id = any($2::uuid[])`,
        [cycleId, allGuidelineIds]
      );
      guidelineTitleById = Object.fromEntries(
        guidelineRes.rows.map((row) => [row.id, row.title || row.id])
      );
    }

    return proposals.map((proposal) => {
      const guidelineIds = (proposal.guidelineIds || []).filter((guidelineId) => Boolean(guidelineTitleById[guidelineId]));
      const guidelineLinks = guidelineIds.map((guidelineId) => ({
        guidelineId,
        guidelineTitle: guidelineTitleById[guidelineId] || guidelineId
      }));

      return {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        status: 'pending',
        lineSide: normalizeLineSide(proposal.lineSide) || 'auto',
        mapX: null,
        mapY: null,
        guidelineLinks,
        guidelineIds,
        totalScore: 0,
        voterCount: 0,
        commentCount: commentsVisible ? (commentsByProposal[proposal.id] || []).length : 0,
        comments: commentsVisible ? (commentsByProposal[proposal.id] || []) : [],
        createdAt: proposal.requestedAt,
        pendingProposalId: proposal.id,
        pendingRequestedAt: proposal.requestedAt,
        pendingRequestedBy: proposal.requestedBy || null,
        pendingRequestedByName: proposal.requestedByName || null
      };
    });
  }

  async function loadGuidelineStrategyLinksByGuidelineIds(guidelineIds) {
    const ids = Array.isArray(guidelineIds) ? guidelineIds.filter(Boolean) : [];
    if (!ids.length) return {};

    const linksRes = await query(
      `select l.id,
              l.created_at,
              l.source_guideline_id,
              l.target_guideline_id,
              sg.title as source_guideline_title,
              tg.title as target_guideline_title,
              sc.id as source_cycle_id,
              tc.id as target_cycle_id,
              si.id as source_institution_id,
              si.name as source_institution_name,
              si.slug as source_institution_slug,
              ti.id as target_institution_id,
              ti.name as target_institution_name,
              ti.slug as target_institution_slug,
              ss.id as source_strategy_id,
              ss.title as source_strategy_title,
              ss.slug as source_strategy_slug,
              ts.id as target_strategy_id,
              ts.title as target_strategy_title,
              ts.slug as target_strategy_slug
       from strategy_guideline_links l
       join strategy_guidelines sg on sg.id = l.source_guideline_id
       join strategy_guidelines tg on tg.id = l.target_guideline_id
       join strategy_cycles sc on sc.id = sg.cycle_id
       join strategy_cycles tc on tc.id = tg.cycle_id
       join institutions si on si.id = sc.institution_id
       join institutions ti on ti.id = tc.institution_id
       left join institution_strategies ss on ss.id = sc.strategy_id
       left join institution_strategies ts on ts.id = tc.strategy_id
       where l.source_guideline_id = any($1::uuid[])
          or l.target_guideline_id = any($1::uuid[])
       order by l.created_at asc`,
      [ids]
    );

    const linksByGuideline = {};
    const pushForGuideline = (guidelineId, payload) => {
      if (!linksByGuideline[guidelineId]) linksByGuideline[guidelineId] = [];
      linksByGuideline[guidelineId].push(payload);
    };

    linksRes.rows.forEach((row) => {
      const sourceId = row.source_guideline_id;
      const targetId = row.target_guideline_id;
      const sourcePayload = {
        id: row.id,
        direction: 'outgoing',
        otherGuidelineId: targetId,
        otherGuidelineTitle: row.target_guideline_title,
        otherCycleId: row.target_cycle_id,
        otherInstitutionId: row.target_institution_id,
        otherInstitutionName: row.target_institution_name,
        otherInstitutionSlug: row.target_institution_slug,
        otherStrategyId: row.target_strategy_id,
        otherStrategyTitle: row.target_strategy_title || 'default',
        otherStrategySlug: row.target_strategy_slug || 'default',
        isCrossInstitution: row.source_institution_id !== row.target_institution_id,
        isCrossStrategy: row.source_strategy_id !== row.target_strategy_id,
        createdAt: row.created_at
      };
      const targetPayload = {
        id: row.id,
        direction: 'incoming',
        otherGuidelineId: sourceId,
        otherGuidelineTitle: row.source_guideline_title,
        otherCycleId: row.source_cycle_id,
        otherInstitutionId: row.source_institution_id,
        otherInstitutionName: row.source_institution_name,
        otherInstitutionSlug: row.source_institution_slug,
        otherStrategyId: row.source_strategy_id,
        otherStrategyTitle: row.source_strategy_title || 'default',
        otherStrategySlug: row.source_strategy_slug || 'default',
        isCrossInstitution: row.source_institution_id !== row.target_institution_id,
        isCrossStrategy: row.source_strategy_id !== row.target_strategy_id,
        createdAt: row.created_at
      };

      pushForGuideline(sourceId, sourcePayload);
      pushForGuideline(targetId, targetPayload);
    });

    return linksByGuideline;
  }

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true, version: 'v1' });
  });

  app.get('/api/v1/public/institutions/:slug/proposals/:proposalId/resolve', publicReadGuard, async (req, res) => {
    const proposalId = String(req.params.proposalId || '').trim();
    if (!proposalId) return res.status(400).json({ error: 'proposalId required' });

    const requestedStrategySlug = String(req.query?.strategy || '').trim().toLowerCase();
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const resolved = await resolveInstitutionStrategy(query, institution.id, requestedStrategySlug);
    const strategy = resolved.strategy || null;
    if (requestedStrategySlug && !strategy) return res.status(404).json({ error: 'strategy not found' });

    const alias = await resolveProposalAlias({
      proposalId,
      institutionId: institution.id,
      strategyId: strategy?.id || null
    });
    if (!alias) return res.status(404).json({ error: 'proposal not found' });

    res.json({
      proposalId: alias.id,
      entityKind: alias.entityKind,
      status: alias.status,
      finalEntityId: alias.finalEntityId || null,
      shouldRedirect: Boolean(alias.status === 'approved' && alias.finalEntityId)
    });
  });

  app.get('/api/v1/public/institutions', publicReadGuard, async (_req, res) => {
    const institutions = await query(
      'select id, name, slug, country_code, website_url, status, created_at from institutions where status = $1 order by name asc',
      ['active']
    );

    const institutionIds = institutions.rows.map((item) => item.id);
    let strategiesByInstitution = {};
    if (institutionIds.length) {
      const strategiesRes = await query(
        `select id, institution_id, title, slug, description, status, is_default, created_at
         from institution_strategies
         where institution_id = any($1::uuid[]) and status = 'active'
         order by institution_id asc, is_default desc, created_at asc`,
        [institutionIds]
      );
      strategiesByInstitution = strategiesRes.rows.reduce((acc, item) => {
        if (!acc[item.institution_id]) acc[item.institution_id] = [];
        acc[item.institution_id].push(normalizeStrategyOutput(item));
        return acc;
      }, {});
    }

    res.json({
      institutions: institutions.rows.map((institution) => ({
        ...institution,
        strategies: strategiesByInstitution[institution.id] || []
      }))
    });
  });

  app.get('/api/v1/public/content-settings', publicReadGuard, async (_req, res) => {
    const contentSettings = await loadContentSettings(query);
    res.json({ contentSettings });
  });

  app.post('/api/v1/public/access-requests', publicWriteGuard, async (req, res) => {
    const institutionId = String(req.body?.institutionId || '').trim();
    const institutionNameInput = String(req.body?.institutionName || '').trim();
    const fullName = String(req.body?.fullName || '').trim();
    const workEmail = normalizeEmail ? normalizeEmail(req.body?.workEmail) : String(req.body?.workEmail || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const notes = String(req.body?.notes || '').trim();

    if (!institutionNameInput) return res.status(400).json({ error: 'institutionName required' });
    if (!fullName) return res.status(400).json({ error: 'fullName required' });
    if (!workEmail) return res.status(400).json({ error: 'workEmail required' });
    if (!phone) return res.status(400).json({ error: 'phone required' });
    if (institutionNameInput.length > 200) return res.status(400).json({ error: 'institutionName too long' });
    if (fullName.length > 160) return res.status(400).json({ error: 'fullName too long' });
    if (workEmail.length > 160) return res.status(400).json({ error: 'workEmail too long' });
    if (phone.length > 80) return res.status(400).json({ error: 'phone too long' });
    if (notes.length > 3000) return res.status(400).json({ error: 'notes too long' });

    let resolvedInstitutionId = null;
    let resolvedInstitutionName = institutionNameInput;
    if (institutionId) {
      const institutionRes = await query(
        `select id, name
         from institutions
         where id = $1 and status = 'active'
         limit 1`,
        [institutionId]
      );
      if (!institutionRes.rowCount) return res.status(404).json({ error: 'institution not found' });
      const institution = institutionRes.rows[0];
      resolvedInstitutionId = institution.id;
      resolvedInstitutionName = String(institution.name || institutionNameInput).trim() || institutionNameInput;
    }

    const createdRes = await query(
      `insert into access_requests (
         id,
         request_code,
         institution_id,
         institution_name,
         full_name,
         work_email,
         phone,
         notes,
         status
       )
       values (
         gen_random_uuid(),
         ('REQ-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         'pending'
       )
       returning id, request_code, status, created_at`,
      [resolvedInstitutionId, resolvedInstitutionName, fullName, workEmail, phone, notes || null]
    );
    const created = createdRes.rows[0];

    res.status(201).json({
      ok: true,
      requestId: created.id,
      requestCode: created.request_code,
      status: created.status,
      createdAt: created.created_at
    });
  });

  app.get('/api/v1/public/strategy-map', publicReadGuard, async (req, res) => {
    const requestedInstitutionSlug = String(req.query?.institution || '').trim().toLowerCase();
    const requestedStrategySlug = String(req.query?.strategy || '').trim().toLowerCase();
    const source = String(req.query?.source || '').trim().toLowerCase();
    const hasRequestedInstitutionSlug = Boolean(requestedInstitutionSlug && /^[a-z0-9-]+$/.test(requestedInstitutionSlug));
    const viewerAuth = resolveOptionalAuth(req);

    if (source === 'embed' && hasRequestedInstitutionSlug && trafficMonitor) {
      trafficMonitor.trackEmbedView({ institutionSlug: requestedInstitutionSlug });
    }

    const institutionsRes = hasRequestedInstitutionSlug
      ? await query(
        `select id, name, slug, country_code, website_url, status, created_at
         from institutions
         where status = 'active' and slug = $1
         order by name asc`,
        [requestedInstitutionSlug]
      )
      : await query(
        `select id, name, slug, country_code, website_url, status, created_at
         from institutions
         where status = 'active'
         order by name asc`
      );
    const institutions = institutionsRes.rows;
    if (!institutions.length) return res.json({ institutions: [] });

    const selectedStrategiesByInstitution = {};
    const strategiesByInstitution = {};
    for (const institution of institutions) {
      const strategySlug = hasRequestedInstitutionSlug && institution.slug === requestedInstitutionSlug
        ? requestedStrategySlug
        : '';
      const resolved = await resolveInstitutionStrategy(query, institution.id, strategySlug);
      if (strategySlug && !resolved.strategy) {
        return res.status(404).json({ error: 'strategy not found' });
      }
      selectedStrategiesByInstitution[institution.id] = resolved.strategy || null;
      strategiesByInstitution[institution.id] = Array.isArray(resolved.strategies) ? resolved.strategies : [];
    }

    const cycleList = await Promise.all(
      institutions.map(async (institution) => {
        const selectedStrategy = selectedStrategiesByInstitution[institution.id] || null;
        const cycle = await getCurrentCycle(query, institution.id, {
          strategyId: selectedStrategy?.id || null,
          allowInstitutionFallback: !selectedStrategy?.id
        });
        if (!cycle) return null;
        return {
          institutionId: institution.id,
          cycle
        };
      })
    );
    const cyclesByInstitution = cycleList.reduce((acc, item) => {
      if (!item) return acc;
      acc[item.institutionId] = item.cycle;
      return acc;
    }, {});
    const cycleIds = cycleList.filter(Boolean).map((item) => item.cycle.id);
    const commentVisibilityByCycle = cycleList.reduce((acc, item) => {
      if (!item?.cycle?.id) return acc;
      acc[item.cycle.id] = canViewCommentsForInstitution(viewerAuth, item.institutionId);
      return acc;
    }, {});
    const commentVisibleCycleIds = cycleIds.filter((cycleId) => commentVisibilityByCycle[cycleId]);

    const guidelinesByCycle = {};
    const guidelineLookupByCycle = {};
    const voteByGuideline = {};
    const commentsByGuideline = {};
    const initiativesByCycle = {};
    const initiativeLinksByInitiative = {};
    const voteByInitiative = {};
    const commentsByInitiative = {};
    const strategyLinksByGuideline = {};
    if (cycleIds.length) {
      const guidelinesRes = await query(
        `select id, cycle_id, title, description, status, relation_type, parent_guideline_id, line_side, map_x, map_y, created_at
         from strategy_guidelines
         where cycle_id = any($1::uuid[])
           and status in ('active', 'disabled', 'merged')
         order by created_at asc`,
        [cycleIds]
      );

      const votesRes = await query(
        `select g.id as guideline_id,
                coalesce(sum(v.score), 0)::int as total_score,
                count(distinct v.voter_id)::int as voter_count
         from strategy_guidelines g
         left join strategy_votes v on v.guideline_id = g.id
         where g.cycle_id = any($1::uuid[])
           and g.status in ('active', 'disabled', 'merged', 'hidden')
         group by g.id`,
        [cycleIds]
      );
      votesRes.rows.forEach((row) => {
        voteByGuideline[row.guideline_id] = {
          totalScore: Number(row.total_score || 0),
          voterCount: Number(row.voter_count || 0)
        };
      });

      if (commentVisibleCycleIds.length) {
        const commentsRes = await query(
          `select c.id,
                  c.guideline_id,
                  c.body,
                  c.created_at,
                  u.display_name as author_display_name,
                  u.email as author_email
           from strategy_comments c
           join strategy_guidelines g on g.id = c.guideline_id
           left join platform_users u on u.id = c.author_id
           where g.cycle_id = any($1::uuid[])
             and c.status = 'visible'
           order by c.created_at asc`,
          [commentVisibleCycleIds]
        );
        commentsRes.rows.forEach((row) => {
          if (!commentsByGuideline[row.guideline_id]) commentsByGuideline[row.guideline_id] = [];
          commentsByGuideline[row.guideline_id].push({
            id: row.id,
            body: row.body,
            createdAt: row.created_at,
            authorName: row.author_display_name || null,
            authorEmail: row.author_email || null
          });
        });
      }

      const initiativesRes = await query(
        `select id, cycle_id, title, description, status, line_side, map_x, map_y, created_at
         from strategy_initiatives
         where cycle_id = any($1::uuid[])
           and status in ('active', 'disabled', 'merged', 'hidden')
         order by created_at asc`,
        [cycleIds]
      );

      const linksRes = await query(
        `select ig.initiative_id, ig.guideline_id
         from strategy_initiative_guidelines ig
         join strategy_initiatives i on i.id = ig.initiative_id
         where i.cycle_id = any($1::uuid[])`,
        [cycleIds]
      );
      linksRes.rows.forEach((row) => {
        if (!initiativeLinksByInitiative[row.initiative_id]) initiativeLinksByInitiative[row.initiative_id] = [];
        initiativeLinksByInitiative[row.initiative_id].push(row.guideline_id);
      });

      const initiativeVotesRes = await query(
        `select i.id as initiative_id,
                coalesce(sum(v.score), 0)::int as total_score,
                count(distinct v.voter_id)::int as voter_count
         from strategy_initiatives i
         left join strategy_initiative_votes v on v.initiative_id = i.id
         where i.cycle_id = any($1::uuid[])
           and i.status in ('active', 'disabled', 'merged', 'hidden')
         group by i.id`,
        [cycleIds]
      );
      initiativeVotesRes.rows.forEach((row) => {
        voteByInitiative[row.initiative_id] = {
          totalScore: Number(row.total_score || 0),
          voterCount: Number(row.voter_count || 0)
        };
      });

      if (commentVisibleCycleIds.length) {
        const initiativeCommentsRes = await query(
          `select c.id,
                  c.initiative_id,
                  c.body,
                  c.created_at,
                  u.display_name as author_display_name,
                  u.email as author_email
           from strategy_initiative_comments c
           join strategy_initiatives i on i.id = c.initiative_id
           left join platform_users u on u.id = c.author_id
           where i.cycle_id = any($1::uuid[])
             and c.status = 'visible'
           order by c.created_at asc`,
          [commentVisibleCycleIds]
        );
        initiativeCommentsRes.rows.forEach((row) => {
          if (!commentsByInitiative[row.initiative_id]) commentsByInitiative[row.initiative_id] = [];
          commentsByInitiative[row.initiative_id].push({
            id: row.id,
            body: row.body,
            createdAt: row.created_at,
            authorName: row.author_display_name || null,
            authorEmail: row.author_email || null
          });
        });
      }

      const loadedLinks = await loadGuidelineStrategyLinksByGuidelineIds(
        guidelinesRes.rows.map((row) => row.id)
      );
      Object.assign(strategyLinksByGuideline, loadedLinks);

      guidelinesRes.rows.forEach((row) => {
        if (!guidelinesByCycle[row.cycle_id]) guidelinesByCycle[row.cycle_id] = [];
        const visibleComments = commentVisibilityByCycle[row.cycle_id]
          ? (commentsByGuideline[row.id] || [])
          : [];
        const guidelineItem = {
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          relationType: row.relation_type || 'orphan',
          parentGuidelineId: row.parent_guideline_id || null,
          lineSide: normalizeLineSide(row.line_side) || 'auto',
          mapX: Number.isFinite(Number(row.map_x)) ? Number(row.map_x) : null,
          mapY: Number.isFinite(Number(row.map_y)) ? Number(row.map_y) : null,
          totalScore: voteByGuideline[row.id]?.totalScore || 0,
          voterCount: voteByGuideline[row.id]?.voterCount || 0,
          strategyLinks: strategyLinksByGuideline[row.id] || [],
          strategyLinkCount: (strategyLinksByGuideline[row.id] || []).length,
          commentCount: visibleComments.length,
          comments: visibleComments,
          createdAt: row.created_at
        };
        guidelinesByCycle[row.cycle_id].push(guidelineItem);
        if (!guidelineLookupByCycle[row.cycle_id]) guidelineLookupByCycle[row.cycle_id] = {};
        guidelineLookupByCycle[row.cycle_id][row.id] = guidelineItem;
      });

      initiativesRes.rows.forEach((row) => {
        if (!initiativesByCycle[row.cycle_id]) initiativesByCycle[row.cycle_id] = [];
        const guidelineIds = (initiativeLinksByInitiative[row.id] || []).filter((guidelineId) =>
          Boolean(guidelineLookupByCycle[row.cycle_id]?.[guidelineId])
        );
        const visibleComments = commentVisibilityByCycle[row.cycle_id]
          ? (commentsByInitiative[row.id] || [])
          : [];
        initiativesByCycle[row.cycle_id].push({
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          lineSide: normalizeLineSide(row.line_side) || 'auto',
          mapX: Number.isFinite(Number(row.map_x)) ? Number(row.map_x) : null,
          mapY: Number.isFinite(Number(row.map_y)) ? Number(row.map_y) : null,
          guidelineIds,
          totalScore: voteByInitiative[row.id]?.totalScore || 0,
          voterCount: voteByInitiative[row.id]?.voterCount || 0,
          commentCount: visibleComments.length,
          comments: visibleComments,
          createdAt: row.created_at
        });
      });

      const pendingByCycle = await Promise.all(
        cycleIds.map(async (cycleId) => {
          const commentsVisible = Boolean(commentVisibilityByCycle[cycleId]);
          const [pendingGuidelines, pendingInitiatives] = await Promise.all([
            loadPendingGuidelinesForCycle(cycleId, commentsVisible),
            loadPendingInitiativesForCycle(cycleId, commentsVisible)
          ]);
          return {
            cycleId,
            pendingGuidelines,
            pendingInitiatives
          };
        })
      );
      pendingByCycle.forEach((item) => {
        if (!guidelinesByCycle[item.cycleId]) guidelinesByCycle[item.cycleId] = [];
        if (!initiativesByCycle[item.cycleId]) initiativesByCycle[item.cycleId] = [];
        guidelinesByCycle[item.cycleId].push(...item.pendingGuidelines);
        initiativesByCycle[item.cycleId].push(...item.pendingInitiatives);
      });
    }

    res.json({
      institutions: institutions.map((institution) => {
        const cycle = cyclesByInstitution[institution.id] || null;
        return {
          id: institution.id,
          name: institution.name,
          slug: institution.slug,
          countryCode: institution.country_code || null,
          websiteUrl: institution.website_url || null,
          status: institution.status,
          createdAt: institution.created_at,
          strategies: (strategiesByInstitution[institution.id] || []).map((item) => normalizeStrategyOutput(item)),
          strategy: normalizeStrategyOutput(selectedStrategiesByInstitution[institution.id] || null),
          cycle: normalizeCycleOutput(cycle),
          guidelines: cycle ? (guidelinesByCycle[cycle.id] || []) : [],
          initiatives: cycle ? (initiativesByCycle[cycle.id] || []) : []
        };
      })
    });
  });

  app.get('/api/v1/public/institutions/:slug/cycles/current/summary', publicReadGuard, async (req, res) => {
    const requestedStrategySlug = String(req.query?.strategy || '').trim().toLowerCase();
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });
    const viewerAuth = resolveOptionalAuth(req);
    const commentsVisible = canViewCommentsForInstitution(viewerAuth, institution.id);

    const resolved = await resolveInstitutionStrategy(query, institution.id, requestedStrategySlug);
    const strategy = resolved.strategy || null;
    const strategies = Array.isArray(resolved.strategies) ? resolved.strategies : [];
    if (requestedStrategySlug && !strategy) return res.status(404).json({ error: 'strategy not found' });

    const cycle = await getCurrentCycle(query, institution.id, {
      strategyId: strategy?.id || null,
      allowInstitutionFallback: !strategy?.id
    });
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });

    const stats = await query(
      `select
         (
           (select count(*) from strategy_guidelines g where g.cycle_id = $1 and g.status in ('active', 'disabled'))
           + (select count(*) from strategy_card_proposals p where p.cycle_id = $1 and p.entity_kind = 'guideline' and p.status = 'pending')
         ) as guidelines_count,
         (
           (select count(*) from strategy_initiatives i where i.cycle_id = $1 and i.status in ('active', 'disabled'))
           + (select count(*) from strategy_card_proposals p where p.cycle_id = $1 and p.entity_kind = 'initiative' and p.status = 'pending')
         ) as initiatives_count,
         (
           (select count(*) from strategy_comments c join strategy_guidelines g on g.id = c.guideline_id where g.cycle_id = $1 and c.status = 'visible')
           + (select count(*) from strategy_card_proposal_comments c join strategy_card_proposals p on p.id = c.proposal_id where p.cycle_id = $1 and p.entity_kind = 'guideline' and p.status = 'pending' and c.status = 'visible')
         ) as comments_count,
         (
           (select count(*) from strategy_initiative_comments c join strategy_initiatives i on i.id = c.initiative_id where i.cycle_id = $1 and c.status = 'visible')
           + (select count(*) from strategy_card_proposal_comments c join strategy_card_proposals p on p.id = c.proposal_id where p.cycle_id = $1 and p.entity_kind = 'initiative' and p.status = 'pending' and c.status = 'visible')
         ) as initiative_comments_count,
         (
           select count(distinct voter_id)
           from (
             select v.voter_id
             from strategy_votes v
             join strategy_guidelines g on g.id = v.guideline_id
             where g.cycle_id = $1
             union
             select iv.voter_id
             from strategy_initiative_votes iv
             join strategy_initiatives i on i.id = iv.initiative_id
             where i.cycle_id = $1
           ) as voters
         ) as participant_count`,
      [cycle.id]
    );

    const summary = stats.rows[0] || {};
    if (!commentsVisible) {
      summary.comments_count = '0';
      summary.initiative_comments_count = '0';
    }

    res.json({
      institution,
      strategy: normalizeStrategyOutput(strategy),
      strategies: strategies.map((item) => normalizeStrategyOutput(item)),
      cycle: normalizeCycleOutput(cycle),
      commentsVisible,
      summary
    });
  });

  app.get('/api/v1/public/institutions/:slug/cycles/current/guidelines', publicReadGuard, async (req, res) => {
    const requestedStrategySlug = String(req.query?.strategy || '').trim().toLowerCase();
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });
    const viewerAuth = resolveOptionalAuth(req);
    const commentsVisible = canViewCommentsForInstitution(viewerAuth, institution.id);

    const resolved = await resolveInstitutionStrategy(query, institution.id, requestedStrategySlug);
    const strategy = resolved.strategy || null;
    const strategies = Array.isArray(resolved.strategies) ? resolved.strategies : [];
    if (requestedStrategySlug && !strategy) return res.status(404).json({ error: 'strategy not found' });

    const cycle = await getCurrentCycle(query, institution.id, {
      strategyId: strategy?.id || null,
      allowInstitutionFallback: !strategy?.id
    });
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });

    const guidelines = await query(
      `select id, title, description, status, relation_type, parent_guideline_id, line_side, created_at
       from strategy_guidelines
       where cycle_id = $1 and status in ('active', 'disabled')
       order by created_at asc`,
      [cycle.id]
    );

    const votes = await query(
      `select g.id as guideline_id,
              coalesce(sum(v.score), 0)::int as total_score,
              count(distinct v.voter_id)::int as voter_count
       from strategy_guidelines g
       left join strategy_votes v on v.guideline_id = g.id
       where g.cycle_id = $1 and g.status in ('active', 'disabled')
       group by g.id`,
      [cycle.id]
    );

    const comments = commentsVisible
      ? await query(
        `select c.id,
                c.guideline_id,
                c.body,
                c.created_at,
                u.display_name as author_display_name,
                u.email as author_email
         from strategy_comments c
         join strategy_guidelines g on g.id = c.guideline_id
         left join platform_users u on u.id = c.author_id
         where g.cycle_id = $1 and c.status = 'visible'
         order by c.created_at asc`,
        [cycle.id]
      )
      : { rows: [] };

    const voteByGuideline = Object.fromEntries(
      votes.rows.map((row) => [row.guideline_id, { totalScore: row.total_score, voterCount: row.voter_count }])
    );
    const commentsByGuideline = comments.rows.reduce((acc, row) => {
      if (!acc[row.guideline_id]) acc[row.guideline_id] = [];
      acc[row.guideline_id].push({
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        authorName: row.author_display_name || null,
        authorEmail: row.author_email || null
      });
      return acc;
    }, {});
    const strategyLinksByGuideline = await loadGuidelineStrategyLinksByGuidelineIds(
      guidelines.rows.map((row) => row.id)
    );

    const activeGuidelines = guidelines.rows.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      status: g.status,
      relationType: g.relation_type || 'orphan',
      parentGuidelineId: g.parent_guideline_id || null,
      lineSide: normalizeLineSide(g.line_side) || 'auto',
      totalScore: voteByGuideline[g.id]?.totalScore || 0,
      voterCount: voteByGuideline[g.id]?.voterCount || 0,
      strategyLinks: strategyLinksByGuideline[g.id] || [],
      strategyLinkCount: (strategyLinksByGuideline[g.id] || []).length,
      comments: commentsByGuideline[g.id] || [],
      createdAt: g.created_at
    }));
    const pendingGuidelines = await loadPendingGuidelinesForCycle(cycle.id, commentsVisible);
    const mergedGuidelines = [...activeGuidelines, ...pendingGuidelines]
      .sort((left, right) => new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime());

    res.json({
      institution,
      strategy: normalizeStrategyOutput(strategy),
      strategies: strategies.map((item) => normalizeStrategyOutput(item)),
      cycle: normalizeCycleOutput(cycle),
      commentsVisible,
      guidelines: mergedGuidelines
    });
  });

  app.get('/api/v1/public/institutions/:slug/cycles/current/initiatives', publicReadGuard, async (req, res) => {
    const requestedStrategySlug = String(req.query?.strategy || '').trim().toLowerCase();
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });
    const viewerAuth = resolveOptionalAuth(req);
    const commentsVisible = canViewCommentsForInstitution(viewerAuth, institution.id);

    const resolved = await resolveInstitutionStrategy(query, institution.id, requestedStrategySlug);
    const strategy = resolved.strategy || null;
    const strategies = Array.isArray(resolved.strategies) ? resolved.strategies : [];
    if (requestedStrategySlug && !strategy) return res.status(404).json({ error: 'strategy not found' });

    const cycle = await getCurrentCycle(query, institution.id, {
      strategyId: strategy?.id || null,
      allowInstitutionFallback: !strategy?.id
    });
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });

    const initiativesRes = await query(
      `select id, title, description, status, line_side, map_x, map_y, created_at
       from strategy_initiatives
       where cycle_id = $1 and status in ('active', 'disabled')
       order by created_at asc`,
      [cycle.id]
    );

    const linksRes = await query(
      `select ig.initiative_id, ig.guideline_id, g.title as guideline_title
       from strategy_initiative_guidelines ig
       join strategy_guidelines g on g.id = ig.guideline_id
       join strategy_initiatives i on i.id = ig.initiative_id
       where i.cycle_id = $1
       order by g.created_at asc`,
      [cycle.id]
    );

    const votesRes = await query(
      `select i.id as initiative_id,
              coalesce(sum(v.score), 0)::int as total_score,
              count(distinct v.voter_id)::int as voter_count
       from strategy_initiatives i
       left join strategy_initiative_votes v on v.initiative_id = i.id
       where i.cycle_id = $1 and i.status in ('active', 'disabled')
       group by i.id`,
      [cycle.id]
    );

    const commentsRes = commentsVisible
      ? await query(
        `select c.id,
                c.initiative_id,
                c.body,
                c.created_at,
                u.display_name as author_display_name,
                u.email as author_email
         from strategy_initiative_comments c
         join strategy_initiatives i on i.id = c.initiative_id
         left join platform_users u on u.id = c.author_id
         where i.cycle_id = $1 and c.status = 'visible'
         order by c.created_at asc`,
        [cycle.id]
      )
      : { rows: [] };

    const linksByInitiative = {};
    linksRes.rows.forEach((row) => {
      if (!linksByInitiative[row.initiative_id]) linksByInitiative[row.initiative_id] = [];
      linksByInitiative[row.initiative_id].push({
        guidelineId: row.guideline_id,
        guidelineTitle: row.guideline_title
      });
    });

    const voteByInitiative = Object.fromEntries(
      votesRes.rows.map((row) => [row.initiative_id, { totalScore: row.total_score, voterCount: row.voter_count }])
    );

    const commentsByInitiative = commentsRes.rows.reduce((acc, row) => {
      if (!acc[row.initiative_id]) acc[row.initiative_id] = [];
      acc[row.initiative_id].push({
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        authorName: row.author_display_name || null,
        authorEmail: row.author_email || null
      });
      return acc;
    }, {});

    const activeInitiatives = initiativesRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      lineSide: normalizeLineSide(row.line_side) || 'auto',
      mapX: Number.isFinite(Number(row.map_x)) ? Number(row.map_x) : null,
      mapY: Number.isFinite(Number(row.map_y)) ? Number(row.map_y) : null,
      guidelineLinks: linksByInitiative[row.id] || [],
      guidelineIds: (linksByInitiative[row.id] || []).map((item) => item.guidelineId),
      totalScore: voteByInitiative[row.id]?.totalScore || 0,
      voterCount: voteByInitiative[row.id]?.voterCount || 0,
      comments: commentsByInitiative[row.id] || [],
      createdAt: row.created_at
    }));
    const pendingInitiatives = await loadPendingInitiativesForCycle(cycle.id, commentsVisible);
    const mergedInitiatives = [...activeInitiatives, ...pendingInitiatives]
      .sort((left, right) => new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime());

    res.json({
      institution,
      strategy: normalizeStrategyOutput(strategy),
      strategies: strategies.map((item) => normalizeStrategyOutput(item)),
      cycle: normalizeCycleOutput(cycle),
      commentsVisible,
      initiatives: mergedInitiatives
    });
  });
}

module.exports = { registerPublicRoutes };

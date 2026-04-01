const {
  analyzeStrategyPage,
  getClarityGremlinConfig,
  searchStrategicLinks
} = require('./services/clarityGremlinService');
const {
  normalizeAiProvider,
  isProviderCompatibleModel,
  resolveInstitutionAiSettings,
  resolveInstitutionModelOverride
} = require('./services/aiProviderService');

function registerClarityGremlinRoutes({
  app,
  query,
  uuid,
  requireAuth,
  verifyCycleAccess,
  memberWriteRateLimit
}) {
  const pendingJobs = new Map();
  const requestGuard = typeof memberWriteRateLimit === 'function'
    ? memberWriteRateLimit
    : (_req, _res, next) => next();

  const baseLimitPerStrategy = Math.max(1, Number(process.env.CLARITY_GREMLIN_LIMIT_PER_STRATEGY || 10));
  const strategicLinkBaseLimitPerStrategy = Math.max(1, Number(process.env.CLARITY_GREMLIN_STRATEGIC_LINK_LIMIT_PER_STRATEGY || 3));
  const staleJobWindowMs = Math.max(10 * 60 * 1000, Number(process.env.CLARITY_GREMLIN_JOB_STALE_MS || 30 * 60 * 1000));
  const interruptedJobError = 'Analysis run was interrupted. Please run it again.';

  function prunePendingJobs() {
    const cutoff = Date.now() - 15 * 60 * 1000;
    pendingJobs.forEach((job, jobId) => {
      const updatedAt = Date.parse(job?.updatedAt || job?.createdAt || 0);
      if (Number.isFinite(updatedAt) && updatedAt < cutoff) {
        pendingJobs.delete(jobId);
      }
    });
  }

  function setPendingJob(jobId, patch) {
    prunePendingJobs();
    const current = pendingJobs.get(jobId) || {};
    pendingJobs.set(jobId, {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    });
  }

  function mapErrorStatus(error) {
    const message = String(error?.message || '').trim();
    if (!message) return 500;
    if (message === 'cycleId required' || message === 'view required') return 400;
    if (message === 'cycle not found' || message === 'strategy not found') return 404;
    if (message === 'clarity gremlin unsupported view') return 400;
    if (message === 'ai api key not configured') return 503;
    if (message.startsWith('ai provider error:')) return 502;
    if (message === 'ai request timed out') return 504;
    return 500;
  }

  function deriveEntityKind(view) {
    const normalizedView = String(view || '').trim().toLowerCase();
    if (normalizedView === 'guideline-detail') return 'guideline';
    if (normalizedView === 'initiative-detail') return 'initiative';
    return null;
  }

  async function loadStrategyUsage(strategyId) {
    const strategyRes = await query(
      `select s.id,
              s.title,
              coalesce(s.clarity_gremlin_calls_used, 0)::int as clarity_gremlin_calls_used,
              coalesce(i.clarity_gremlin_extra_scans, 0)::int as clarity_gremlin_extra_scans
       from institution_strategies s
       join institutions i on i.id = s.institution_id
       where s.id = $1
       limit 1`,
      [strategyId]
    );
    const strategy = strategyRes.rows[0] || null;
    const used = Number(strategy?.clarity_gremlin_calls_used || 0);
    const extra = Math.max(0, Number(strategy?.clarity_gremlin_extra_scans || 0));
    const limit = baseLimitPerStrategy + extra;
    return {
      used,
      limit,
      baseLimit: baseLimitPerStrategy,
      extraAllocated: extra,
      remaining: Math.max(0, limit - used),
      strategyId,
      strategyTitle: strategy?.title || null
    };
  }

  async function loadStrategicLinkUsage(strategyId) {
    const strategyRes = await query(
      `select s.id,
              s.title,
              coalesce(s.clarity_gremlin_strategic_link_calls_used, 0)::int as clarity_gremlin_strategic_link_calls_used,
              coalesce(i.clarity_gremlin_strategic_link_extra_scans, 0)::int as clarity_gremlin_strategic_link_extra_scans
       from institution_strategies s
       join institutions i on i.id = s.institution_id
       where s.id = $1
       limit 1`,
      [strategyId]
    );
    const strategy = strategyRes.rows[0] || null;
    const used = Number(strategy?.clarity_gremlin_strategic_link_calls_used || 0);
    const extra = Math.max(0, Number(strategy?.clarity_gremlin_strategic_link_extra_scans || 0));
    const limit = strategicLinkBaseLimitPerStrategy + extra;
    return {
      used,
      limit,
      baseLimit: strategicLinkBaseLimitPerStrategy,
      extraAllocated: extra,
      remaining: Math.max(0, limit - used),
      strategyId,
      strategyTitle: strategy?.title || null
    };
  }

  async function loadStrategicLinkUsageSafely(strategyId, fallbackUsage = null) {
    try {
      return await loadStrategicLinkUsage(strategyId);
    } catch {
      return fallbackUsage;
    }
  }

  function shapeStrategicLinkSuggestionRows(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const sameInstitution = [];
    const otherInstitutions = [];
    for (const row of list) {
      const item = {
        sourceGuidelineId: row.source_guideline_id,
        sourceGuidelineTitle: row.source_guideline_title || '',
        targetGuidelineId: row.target_guideline_id,
        targetGuidelineTitle: row.target_guideline_title || '',
        targetInstitutionId: row.target_institution_id || null,
        targetInstitutionName: row.target_institution_name || '',
        targetInstitutionSlug: row.target_institution_slug || '',
        targetStrategyId: row.target_strategy_id || null,
        targetStrategyTitle: row.target_strategy_title || '',
        targetStrategySlug: row.target_strategy_slug || '',
        targetCycleId: row.target_cycle_id || null,
        rationale: row.rationale || '',
        confidence: row.confidence || 'medium',
        canCreate: row.group_key === 'sameInstitution',
        status: row.status || 'suggested'
      };
      if (row.group_key === 'sameInstitution') sameInstitution.push(item);
      else otherInstitutions.push(item);
    }
    return { sameInstitution, otherInstitutions };
  }

  async function loadStrategicLinkSearchState(strategyId) {
    const searchRes = await query(
      `select strategy_id,
              response_language,
              model,
              last_scanned_at
       from clarity_gremlin_strategic_link_searches
       where strategy_id = $1
       limit 1`,
      [strategyId]
    );
    const search = searchRes.rows[0] || null;
    const suggestionsRes = await query(
      `select s.group_key,
              s.status,
              s.source_guideline_id,
              sg.title as source_guideline_title,
              s.target_guideline_id,
              tg.title as target_guideline_title,
              s.target_institution_id,
              coalesce(ti.name, '') as target_institution_name,
              coalesce(ti.slug, '') as target_institution_slug,
              s.target_strategy_id,
              coalesce(ts.title, '') as target_strategy_title,
              coalesce(ts.slug, '') as target_strategy_slug,
              s.target_cycle_id,
              coalesce(s.rationale, '') as rationale,
              coalesce(s.confidence, 'medium') as confidence
       from clarity_gremlin_strategic_link_suggestions s
       join strategy_guidelines sg on sg.id = s.source_guideline_id
       join strategy_guidelines tg on tg.id = s.target_guideline_id
       left join institutions ti on ti.id = s.target_institution_id
       left join institution_strategies ts on ts.id = s.target_strategy_id
       where s.strategy_id = $1
         and s.status = 'suggested'
       order by case when coalesce(s.confidence, 'medium') = 'high' then 0 when coalesce(s.confidence, 'medium') = 'medium' then 1 else 2 end,
                s.updated_at desc`,
      [strategyId]
    );
    return {
      responseLanguage: search?.response_language || null,
      model: search?.model || null,
      lastScannedAt: search?.last_scanned_at || null,
      ...shapeStrategicLinkSuggestionRows(suggestionsRes.rows)
    };
  }

  async function persistStrategicLinkSearchRun({
    strategyId,
    institutionId,
    cycleId,
    actorId,
    responseLanguage,
    model
  }) {
    await query(
      `insert into clarity_gremlin_strategic_link_searches (
         strategy_id,
         institution_id,
         cycle_id,
         response_language,
         model,
         last_scanned_at,
         last_scanned_by,
         created_at,
         updated_at
       )
       values ($1, $2, $3, $4, $5, now(), $6, now(), now())
       on conflict (strategy_id) do update
       set institution_id = excluded.institution_id,
           cycle_id = excluded.cycle_id,
           response_language = excluded.response_language,
           model = excluded.model,
           last_scanned_at = now(),
           last_scanned_by = excluded.last_scanned_by,
           updated_at = now()`,
      [strategyId, institutionId, cycleId, responseLanguage, model || null, actorId || null]
    );
  }

  async function persistStrategicLinkSuggestions({
    strategyId,
    institutionId,
    cycleId,
    suggestions,
    uuid
  }) {
    const items = Array.isArray(suggestions) ? suggestions : [];
    for (const item of items) {
      const sourceGuidelineId = String(item?.sourceGuidelineId || '').trim();
      const targetGuidelineId = String(item?.targetGuidelineId || '').trim();
      if (!sourceGuidelineId || !targetGuidelineId) continue;
      const targetInstitutionId = String(item?.targetInstitutionId || '').trim() || null;
      const targetStrategyId = String(item?.targetStrategyId || '').trim() || null;
      const targetCycleId = String(item?.targetCycleId || '').trim() || null;
      const groupKey = String(item?.canCreate ? 'sameInstitution' : 'otherInstitutions');
      const rationale = String(item?.rationale || '').trim();
      const confidence = String(item?.confidence || 'medium').trim().toLowerCase() || 'medium';
      const metaJson = JSON.stringify({
        sourceGuidelineTitle: item?.sourceGuidelineTitle || '',
        targetGuidelineTitle: item?.targetGuidelineTitle || '',
        targetInstitutionName: item?.targetInstitutionName || '',
        targetInstitutionSlug: item?.targetInstitutionSlug || '',
        targetStrategyTitle: item?.targetStrategyTitle || '',
        targetStrategySlug: item?.targetStrategySlug || ''
      });
      await query(
        `insert into clarity_gremlin_strategic_link_suggestions (
           id,
           strategy_id,
           institution_id,
           cycle_id,
           source_guideline_id,
           target_guideline_id,
           target_institution_id,
           target_strategy_id,
           target_cycle_id,
           group_key,
           status,
           rationale,
           confidence,
           meta_json,
           last_suggested_at,
           created_at,
           updated_at
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'suggested', $11, $12, $13::jsonb, now(), now(), now())
         on conflict (strategy_id, source_guideline_id, target_guideline_id) do update
         set institution_id = excluded.institution_id,
             cycle_id = excluded.cycle_id,
             target_institution_id = excluded.target_institution_id,
             target_strategy_id = excluded.target_strategy_id,
             target_cycle_id = excluded.target_cycle_id,
             group_key = excluded.group_key,
             rationale = excluded.rationale,
             confidence = excluded.confidence,
             meta_json = excluded.meta_json,
             last_suggested_at = now(),
             updated_at = now()`,
        [
          typeof uuid === 'function' ? uuid() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          strategyId,
          institutionId,
          cycleId,
          sourceGuidelineId,
          targetGuidelineId,
          targetInstitutionId,
          targetStrategyId,
          targetCycleId,
          groupKey,
          rationale,
          confidence,
          metaJson
        ]
      );
    }
  }

  async function updateStrategicLinkSuggestionStatus({
    strategyId,
    sourceGuidelineId,
    targetGuidelineId,
    status,
    actorId,
    acceptedLinkId = null
  }) {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (!['dismissed', 'accepted'].includes(normalizedStatus)) {
      throw new Error('invalid strategic link suggestion status');
    }
    const sql = normalizedStatus === 'accepted'
      ? `update clarity_gremlin_strategic_link_suggestions
         set status = 'accepted',
             accepted_at = now(),
             accepted_by = $4,
             accepted_link_id = $5,
             updated_at = now()
         where strategy_id = $1
           and source_guideline_id = $2
           and target_guideline_id = $3
         returning id`
      : `update clarity_gremlin_strategic_link_suggestions
         set status = 'dismissed',
             dismissed_at = now(),
             dismissed_by = $4,
             updated_at = now()
         where strategy_id = $1
           and source_guideline_id = $2
           and target_guideline_id = $3
         returning id`;
    const params = normalizedStatus === 'accepted'
      ? [strategyId, sourceGuidelineId, targetGuidelineId, actorId || null, acceptedLinkId || null]
      : [strategyId, sourceGuidelineId, targetGuidelineId, actorId || null];
    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  async function loadStrategyUsageSafely(strategyId, fallbackUsage = null) {
    try {
      return await loadStrategyUsage(strategyId);
    } catch {
      return fallbackUsage;
    }
  }

  async function listRecentAnalyses(strategyId) {
    const historyRes = await query(
      `select a.id,
              a.view,
              a.entity_kind,
              a.entity_id,
              a.page_label,
              a.context_label,
              a.locale,
              a.provider,
              a.model,
              a.analysis_json,
              a.created_at,
              u.display_name as created_by_name
       from clarity_gremlin_analyses a
       left join platform_users u on u.id = a.created_by
       where a.strategy_id = $1
         and coalesce(a.status, 'completed') = 'completed'
       order by a.created_at desc
       limit 24`,
      [strategyId]
    );
    return historyRes.rows.map((row) => ({
      id: row.id,
      view: row.view,
      entityKind: row.entity_kind || null,
      entityId: row.entity_id || null,
      pageLabel: row.page_label || '',
      contextLabel: row.context_label || row.page_label || '',
      locale: row.locale || 'lt',
      provider: row.provider || null,
      model: row.model || null,
      createdAt: row.created_at,
      createdByName: row.created_by_name || null,
      analysis: row.analysis_json && typeof row.analysis_json === 'object'
        ? row.analysis_json
        : {}
    }));
  }

  async function failStalePersistedJobs({
    cycleId = null,
    jobId = null,
    institutionId = null,
    strategyId = null
  } = {}) {
    const cutoffIso = new Date(Date.now() - staleJobWindowMs).toISOString();
    const candidatesRes = await query(
      `select id, strategy_id
       from clarity_gremlin_analyses
       where ($1::uuid is null or cycle_id = $1)
         and ($2::uuid is null or id = $2)
         and ($3::uuid is null or institution_id = $3)
         and ($4::uuid is null or strategy_id = $4)
         and coalesce(status, 'completed') = 'running'
         and coalesce(started_at, created_at) <= $5::timestamptz`,
      [cycleId || null, jobId || null, institutionId || null, strategyId || null, cutoffIso]
    );

    for (const row of candidatesRes.rows) {
      const failedRes = await query(
        `update clarity_gremlin_analyses
         set status = 'failed',
             error_message = $2,
             failed_at = now()
         where id = $1
           and coalesce(status, 'completed') = 'running'
         returning strategy_id`,
        [row.id, interruptedJobError]
      );
      if (!failedRes.rowCount) continue;
      pendingJobs.delete(row.id);
      await query(
        `update institution_strategies
         set clarity_gremlin_calls_used = greatest(coalesce(clarity_gremlin_calls_used, 0) - 1, 0)
         where id = $1`,
        [failedRes.rows[0].strategy_id]
      ).catch(() => {});
    }
  }

  async function loadPersistedJob(jobId, cycleId, institutionId) {
    const jobRes = await query(
      `select id,
              institution_id,
              strategy_id,
              cycle_id,
              view,
              entity_kind,
              entity_id,
              page_label,
              context_label,
              locale,
              provider,
              model,
              analysis_json,
              error_message,
              coalesce(status, 'completed') as status
       from clarity_gremlin_analyses
       where id = $1
         and cycle_id = $2
         and institution_id = $3
       limit 1`,
      [jobId, cycleId, institutionId]
    );
    return jobRes.rows[0] || null;
  }

  async function markDraftImplemented({
    cycleId,
    analysisId,
    draftIndex,
    institutionId,
    actorId,
    entityKind,
    entityId,
    entityTitle,
    deleted = false
  }) {
    const analysisRes = await query(
      `select id, institution_id, cycle_id, analysis_json
       from clarity_gremlin_analyses
       where id = $1
         and cycle_id = $2
       limit 1`,
      [analysisId, cycleId]
    );
    const row = analysisRes.rows[0] || null;
    if (!row) {
      const error = new Error('analysis not found');
      error.status = 404;
      throw error;
    }
    if (String(row.institution_id || '').trim() !== String(institutionId || '').trim()) {
      const error = new Error('cross-institution forbidden');
      error.status = 403;
      throw error;
    }
    const analysis = row.analysis_json && typeof row.analysis_json === 'object'
      ? row.analysis_json
      : {};
    const drafts = Array.isArray(analysis.proposalDrafts) ? [...analysis.proposalDrafts] : [];
    const index = Number.isInteger(Number(draftIndex)) ? Number(draftIndex) : -1;
    if (index < 0 || index >= drafts.length) {
      const error = new Error('draft not found');
      error.status = 404;
      throw error;
    }
    const draft = drafts[index] && typeof drafts[index] === 'object' ? { ...drafts[index] } : {};
    draft.implemented = {
      entityKind: String(entityKind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline',
      entityId: String(entityId || '').trim(),
      entityTitle: String(entityTitle || draft.title || '').trim() || null,
      deleted: deleted === true,
      appliedAt: new Date().toISOString(),
      appliedBy: String(actorId || '').trim() || null
    };
    drafts[index] = draft;
    analysis.proposalDrafts = drafts;
    await query(
      `update clarity_gremlin_analyses
       set analysis_json = $2::jsonb
       where id = $1`,
      [analysisId, JSON.stringify(analysis)]
    );
    return {
      ok: true,
      analysisId,
      draftIndex: index,
      draft
    };
  }

  app.get('/api/v1/cycles/:cycleId/clarity-gremlin', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const { cycle } = cycleAccess;
    const strategyId = String(cycle?.strategy_id || '').trim();
    if (!strategyId) {
      return res.status(409).json({ error: 'strategy not found' });
    }

    await failStalePersistedJobs({
      cycleId,
      institutionId: req.auth.institutionId,
      strategyId
    });

    const usage = await loadStrategyUsage(strategyId);
    const history = await listRecentAnalyses(strategyId);
    res.json({
      ok: true,
      usage,
      history
    });
  });

  app.get('/api/v1/cycles/:cycleId/clarity-gremlin/strategic-links', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const { cycle } = cycleAccess;
    const strategyId = String(cycle?.strategy_id || '').trim();
    if (!strategyId) {
      return res.status(409).json({ error: 'strategy not found' });
    }

    const [usage, searchState] = await Promise.all([
      loadStrategicLinkUsage(strategyId),
      loadStrategicLinkSearchState(strategyId)
    ]);
    res.json({
      ok: true,
      usage,
      responseLanguage: searchState.responseLanguage || null,
      model: searchState.model || null,
      lastScannedAt: searchState.lastScannedAt || null,
      sameInstitution: searchState.sameInstitution,
      otherInstitutions: searchState.otherInstitutions
    });
  });

  app.post('/api/v1/cycles/:cycleId/clarity-gremlin/strategic-links', requireAuth, requestGuard, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const locale = String(req.body?.locale || 'lt').trim().toLowerCase() === 'en' ? 'en' : 'lt';
    const requestedProviderBody = String(req.body?.provider || '').trim();
    const requestedModel = String(req.body?.model || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const { cycle } = cycleAccess;
    const strategyId = String(cycle?.strategy_id || '').trim();
    if (!strategyId) {
      return res.status(409).json({ error: 'strategy not found' });
    }

    const aiSettings = await resolveInstitutionAiSettings(query, req.auth.institutionId);
    const requestedProvider = requestedProviderBody
      ? normalizeAiProvider(requestedProviderBody)
      : requestedModel
        ? (/mistral/i.test(requestedModel) ? 'mistral' : 'openai')
        : aiSettings.provider;
    if (requestedModel && !isProviderCompatibleModel(requestedProvider, requestedModel)) {
      return res.status(400).json({ error: 'invalid model for provider' });
    }

    const usageReservation = await query(
      `update institution_strategies s
       set clarity_gremlin_strategic_link_calls_used = coalesce(s.clarity_gremlin_strategic_link_calls_used, 0) + 1
       from institutions i
       where s.id = $1
         and i.id = s.institution_id
         and coalesce(s.clarity_gremlin_strategic_link_calls_used, 0) < ($2 + coalesce(i.clarity_gremlin_strategic_link_extra_scans, 0))
       returning s.id,
                 s.title,
                 coalesce(s.clarity_gremlin_strategic_link_calls_used, 0)::int as clarity_gremlin_strategic_link_calls_used,
                 coalesce(i.clarity_gremlin_strategic_link_extra_scans, 0)::int as clarity_gremlin_strategic_link_extra_scans`,
      [strategyId, strategicLinkBaseLimitPerStrategy]
    );

    if (!usageReservation.rowCount) {
      return res.status(429).json({
        error: 'strategic link gremlin limit reached',
        usage: await loadStrategicLinkUsage(strategyId)
      });
    }

    const reserved = usageReservation.rows[0];
    const used = Number(reserved?.clarity_gremlin_strategic_link_calls_used || 0);
    const extra = Math.max(0, Number(reserved?.clarity_gremlin_strategic_link_extra_scans || 0));
    const limit = strategicLinkBaseLimitPerStrategy + extra;
    const usage = {
      used,
      limit,
      baseLimit: strategicLinkBaseLimitPerStrategy,
      extraAllocated: extra,
      remaining: Math.max(0, limit - used),
      strategyId,
      strategyTitle: reserved?.title || null
    };

    try {
      const provider = requestedProvider;
      const aiConfig = getClarityGremlinConfig({
        provider,
        modelOverride: requestedModel || resolveInstitutionModelOverride(aiSettings, provider)
      });
      const result = await searchStrategicLinks({
        query,
        cycleId,
        locale,
        aiConfig
      });
      await persistStrategicLinkSearchRun({
        strategyId,
        institutionId: req.auth.institutionId,
        cycleId,
        actorId: req.auth.sub,
        responseLanguage: result.responseLanguage || locale,
        model: result.model || null
      });
      await persistStrategicLinkSuggestions({
        strategyId,
        institutionId: req.auth.institutionId,
        cycleId,
        suggestions: [
          ...(Array.isArray(result.sameInstitution) ? result.sameInstitution : []),
          ...(Array.isArray(result.otherInstitutions) ? result.otherInstitutions : [])
        ],
        uuid
      });
      const persisted = await loadStrategicLinkSearchState(strategyId);
      return res.json({
        ok: true,
        responseLanguage: persisted.responseLanguage || result.responseLanguage || locale,
        sameInstitution: persisted.sameInstitution,
        otherInstitutions: persisted.otherInstitutions,
        model: persisted.model || result.model || null,
        lastScannedAt: persisted.lastScannedAt || null,
        usage
      });
    } catch (error) {
      await query(
        `update institution_strategies
         set clarity_gremlin_strategic_link_calls_used = greatest(coalesce(clarity_gremlin_strategic_link_calls_used, 0) - 1, 0)
         where id = $1`,
        [strategyId]
      ).catch(() => {});
      return res.status(mapErrorStatus(error)).json({
        error: String(error?.message || 'internal server error'),
        usage: await loadStrategicLinkUsageSafely(strategyId, usage)
      });
    }
  });

  app.post('/api/v1/cycles/:cycleId/clarity-gremlin/strategic-links/dismiss', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    const sourceGuidelineId = String(req.body?.sourceGuidelineId || '').trim();
    const targetGuidelineId = String(req.body?.targetGuidelineId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });
    if (!sourceGuidelineId || !targetGuidelineId) {
      return res.status(400).json({ error: 'sourceGuidelineId and targetGuidelineId required' });
    }

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const strategyId = String(cycleAccess?.cycle?.strategy_id || '').trim();
    if (!strategyId) return res.status(409).json({ error: 'strategy not found' });

    const updated = await updateStrategicLinkSuggestionStatus({
      strategyId,
      sourceGuidelineId,
      targetGuidelineId,
      status: 'dismissed',
      actorId: req.auth.sub
    });
    if (!updated) return res.status(404).json({ error: 'strategic link suggestion not found' });

    const searchState = await loadStrategicLinkSearchState(strategyId);
    res.json({
      ok: true,
      dismissed: true,
      lastScannedAt: searchState.lastScannedAt || null,
      sameInstitution: searchState.sameInstitution,
      otherInstitutions: searchState.otherInstitutions
    });
  });

  app.post('/api/v1/cycles/:cycleId/clarity-gremlin/strategic-links/accepted', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    const sourceGuidelineId = String(req.body?.sourceGuidelineId || '').trim();
    const targetGuidelineId = String(req.body?.targetGuidelineId || '').trim();
    const linkId = String(req.body?.linkId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });
    if (!sourceGuidelineId || !targetGuidelineId) {
      return res.status(400).json({ error: 'sourceGuidelineId and targetGuidelineId required' });
    }

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const strategyId = String(cycleAccess?.cycle?.strategy_id || '').trim();
    if (!strategyId) return res.status(409).json({ error: 'strategy not found' });

    const updated = await updateStrategicLinkSuggestionStatus({
      strategyId,
      sourceGuidelineId,
      targetGuidelineId,
      status: 'accepted',
      actorId: req.auth.sub,
      acceptedLinkId: linkId || null
    });
    if (!updated) return res.status(404).json({ error: 'strategic link suggestion not found' });

    const searchState = await loadStrategicLinkSearchState(strategyId);
    res.json({
      ok: true,
      accepted: true,
      lastScannedAt: searchState.lastScannedAt || null,
      sameInstitution: searchState.sameInstitution,
      otherInstitutions: searchState.otherInstitutions
    });
  });

  app.get('/api/v1/cycles/:cycleId/clarity-gremlin/jobs/:jobId', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const jobId = String(req.params.jobId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });
    if (!jobId) return res.status(400).json({ error: 'jobId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    await failStalePersistedJobs({
      cycleId,
      jobId,
      institutionId: req.auth.institutionId
    });

    prunePendingJobs();
    const job = pendingJobs.get(jobId) || null;
    if (job
      && String(job.cycleId || '').trim() === cycleId
      && String(job.institutionId || '').trim() === String(req.auth.institutionId || '').trim()) {
      if (job.status === 'completed') {
        return res.json({
          ...job.payload,
          ok: true,
          pending: false,
          status: 'completed'
        });
      }
      if (job.status === 'failed') {
        return res.json({
          ok: false,
          pending: false,
          status: 'failed',
          error: String(job.error || 'internal server error'),
          usage: job.usage || null
        });
      }
      return res.json({
        ok: true,
        pending: true,
        status: 'running',
        usage: job.usage || null
      });
    }

    const persistedJob = await loadPersistedJob(jobId, cycleId, req.auth.institutionId);
    if (!persistedJob) {
      return res.status(404).json({ error: 'job not found' });
    }

    const usage = await loadStrategyUsageSafely(persistedJob.strategy_id, null);
    if (persistedJob.status === 'completed') {
      return res.json({
        ok: true,
        pending: false,
        status: 'completed',
        analysis: persistedJob.analysis_json && typeof persistedJob.analysis_json === 'object'
          ? persistedJob.analysis_json
          : {},
        page: {
          view: persistedJob.view,
          entityKind: persistedJob.entity_kind || null,
          entityId: persistedJob.entity_id || null,
          label: persistedJob.page_label || persistedJob.view,
          contextLabel: persistedJob.context_label || persistedJob.page_label || persistedJob.view
        },
        model: persistedJob.model || null,
        historyEntryId: persistedJob.id,
        usage
      });
    }
    if (persistedJob.status === 'failed') {
      return res.json({
        ok: false,
        pending: false,
        status: 'failed',
        error: String(persistedJob.error_message || 'internal server error'),
        usage
      });
    }
    return res.json({
      ok: true,
      pending: true,
      status: 'running',
      usage
    });
  });

  app.post('/api/v1/cycles/:cycleId/clarity-gremlin', requireAuth, requestGuard, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const view = String(req.body?.view || '').trim();
    const entityId = String(req.body?.entityId || '').trim();
    const mode = String(req.body?.mode || '').trim().toLowerCase() === 'entity' ? 'entity' : 'strategy';
    const locale = String(req.body?.locale || 'lt').trim().toLowerCase() === 'en' ? 'en' : 'lt';
    const requestedProviderBody = String(req.body?.provider || '').trim();
    const requestedModel = String(req.body?.model || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });
    if (!view) return res.status(400).json({ error: 'view required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const { cycle } = cycleAccess;
    const strategyId = String(cycle?.strategy_id || '').trim();
    if (!strategyId) {
      return res.status(409).json({ error: 'strategy not found' });
    }

    const aiSettings = await resolveInstitutionAiSettings(query, req.auth.institutionId);
    const requestedProvider = requestedProviderBody
      ? normalizeAiProvider(requestedProviderBody)
      : requestedModel
        ? (/mistral/i.test(requestedModel) ? 'mistral' : 'openai')
        : aiSettings.provider;
    if (requestedModel && !isProviderCompatibleModel(requestedProvider, requestedModel)) {
      return res.status(400).json({ error: 'invalid model for provider' });
    }

    await failStalePersistedJobs({
      cycleId,
      institutionId: req.auth.institutionId,
      strategyId
    });

    const usageReservation = await query(
      `update institution_strategies s
       set clarity_gremlin_calls_used = coalesce(s.clarity_gremlin_calls_used, 0) + 1
       from institutions i
       where s.id = $1
         and i.id = s.institution_id
         and coalesce(s.clarity_gremlin_calls_used, 0) < ($2 + coalesce(i.clarity_gremlin_extra_scans, 0))
       returning s.id,
                 s.title,
                 coalesce(s.clarity_gremlin_calls_used, 0)::int as clarity_gremlin_calls_used,
                 coalesce(i.clarity_gremlin_extra_scans, 0)::int as clarity_gremlin_extra_scans`,
      [strategyId, baseLimitPerStrategy]
    );

    if (!usageReservation.rowCount) {
      return res.status(429).json({
        error: 'clarity gremlin limit reached',
        usage: await loadStrategyUsage(strategyId)
      });
    }

    const reserved = usageReservation.rows[0];
    const used = Number(reserved?.clarity_gremlin_calls_used || 0);
    const extra = Math.max(0, Number(reserved?.clarity_gremlin_extra_scans || 0));
    const limit = baseLimitPerStrategy + extra;
    const usage = {
      used,
      limit,
      baseLimit: baseLimitPerStrategy,
      extraAllocated: extra,
      remaining: Math.max(0, limit - used),
      strategyId,
      strategyTitle: reserved?.title || null
    };
    const jobId = typeof uuid === 'function'
      ? uuid()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const requestedEntityKind = deriveEntityKind(view);

    try {
      await query(
        `insert into clarity_gremlin_analyses (
           id,
           institution_id,
           strategy_id,
           cycle_id,
           view,
           entity_kind,
           entity_id,
           page_label,
           context_label,
           locale,
           analysis_json,
           created_by,
           status,
           started_at
         ) values (
           $1, $2, $3, $4, $5, $6, $7::uuid, $8, $9, $10, '{}'::jsonb, $11, 'running', now()
         )`,
        [
          jobId,
          req.auth.institutionId,
          strategyId,
          cycleId,
          view,
          requestedEntityKind,
          entityId || null,
          view,
          view,
          locale,
          req.auth.sub
        ]
      );
    } catch (error) {
      try {
        await query(
          `update institution_strategies
           set clarity_gremlin_calls_used = greatest(coalesce(clarity_gremlin_calls_used, 0) - 1, 0)
           where id = $1`,
          [strategyId]
        );
      } catch {
        // Preserve the original insert failure.
      }
      return res.status(mapErrorStatus(error)).json({
        error: String(error?.message || 'internal server error'),
        usage: await loadStrategyUsageSafely(strategyId, usage)
      });
    }

    setPendingJob(jobId, {
      status: 'running',
      institutionId: req.auth.institutionId,
      cycleId,
      strategyId,
      createdAt: new Date().toISOString(),
      usage
    });

    Promise.resolve().then(async () => {
      try {
        const provider = requestedProvider;
        const aiConfig = getClarityGremlinConfig({
          provider,
          modelOverride: requestedModel || resolveInstitutionModelOverride(aiSettings, provider)
        });
        const result = await analyzeStrategyPage({
          query,
          cycleId,
          view,
          entityId,
          locale,
          aiConfig,
          mode
        });

        await query(
          `update clarity_gremlin_analyses
           set view = $2,
               entity_kind = $3,
               entity_id = $4::uuid,
               page_label = $5,
               context_label = $6,
               locale = $7,
               provider = $8,
               model = $9,
               analysis_json = $10::jsonb,
               status = 'completed',
               error_message = null,
               completed_at = now()
           where id = $1`,
          [
            jobId,
            result.page?.view || view,
            result.page?.entityKind || null,
            result.page?.entityId || null,
            result.page?.label || result.analysis?.pageLabel || result.page?.view || view,
            result.page?.contextLabel || result.page?.label || result.page?.view || view,
            locale,
            aiConfig.provider || provider,
            result.model || null,
            JSON.stringify(result.analysis || {})
          ]
        );

        setPendingJob(jobId, {
          status: 'completed',
          payload: {
            analysis: result.analysis,
            page: result.page,
            model: result.model,
            historyEntryId: jobId,
            usage
          }
        });
      } catch (error) {
        try {
          await query(
            `update institution_strategies
             set clarity_gremlin_calls_used = greatest(coalesce(clarity_gremlin_calls_used, 0) - 1, 0)
             where id = $1`,
            [strategyId]
          );
        } catch {
          // Keep the job terminal even if the usage rollback cannot be written.
        }
        await query(
          `update clarity_gremlin_analyses
           set status = 'failed',
               error_message = $2,
               failed_at = now()
           where id = $1`,
          [jobId, String(error?.message || 'internal server error')]
        ).catch(() => {});
        setPendingJob(jobId, {
          status: 'failed',
          error: String(error?.message || 'internal server error'),
          statusCode: mapErrorStatus(error),
          usage: await loadStrategyUsageSafely(strategyId, usage)
        });
      }
    });

    return res.json({
      ok: true,
      pending: true,
      jobId,
      usage
    });
  });

  app.post('/api/v1/cycles/:cycleId/clarity-gremlin/:analysisId/drafts/:draftIndex/implemented', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const analysisId = String(req.params.analysisId || '').trim();
    const draftIndex = Number(req.params.draftIndex);
    const entityKind = String(req.body?.entityKind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
    const entityId = String(req.body?.entityId || '').trim();
    const entityTitle = String(req.body?.entityTitle || '').trim();
    const deleted = req.body?.deleted === true;
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });
    if (!analysisId) return res.status(400).json({ error: 'analysisId required' });
    if (!Number.isInteger(draftIndex) || draftIndex < 0) return res.status(400).json({ error: 'invalid draft index' });
    if (!entityId) return res.status(400).json({ error: 'entityId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    try {
      const result = await markDraftImplemented({
        cycleId,
        analysisId,
        draftIndex,
        institutionId: req.auth.institutionId,
        actorId: req.auth.sub,
        entityKind,
        entityId,
        entityTitle,
        deleted
      });
      res.json(result);
    } catch (error) {
      const status = Number(error?.status || 0);
      if (status >= 400 && status < 500) {
        return res.status(status).json({ error: String(error?.message || 'draft update failed') });
      }
      return res.status(500).json({ error: String(error?.message || 'draft update failed') });
    }
  });
}

module.exports = { registerClarityGremlinRoutes };

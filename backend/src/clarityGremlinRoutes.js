const {
  analyzeStrategyPage,
  getClarityGremlinConfig
} = require('./services/clarityGremlinService');
const {
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
  const requestGuard = typeof memberWriteRateLimit === 'function'
    ? memberWriteRateLimit
    : (_req, _res, next) => next();

  const baseLimitPerStrategy = Math.max(1, Number(process.env.CLARITY_GREMLIN_LIMIT_PER_STRATEGY || 10));

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

  async function markDraftImplemented({
    cycleId,
    analysisId,
    draftIndex,
    institutionId,
    actorId,
    entityKind,
    entityId,
    entityTitle
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

    const usage = await loadStrategyUsage(strategyId);
    const history = await listRecentAnalyses(strategyId);
    res.json({
      ok: true,
      usage,
      history
    });
  });

  app.post('/api/v1/cycles/:cycleId/clarity-gremlin', requireAuth, requestGuard, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const view = String(req.body?.view || '').trim();
    const entityId = String(req.body?.entityId || '').trim();
    const locale = String(req.body?.locale || 'lt').trim().toLowerCase() === 'en' ? 'en' : 'lt';
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });
    if (!view) return res.status(400).json({ error: 'view required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const { cycle } = cycleAccess;
    const strategyId = String(cycle?.strategy_id || '').trim();
    if (!strategyId) {
      return res.status(409).json({ error: 'strategy not found' });
    }

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
    try {
      const aiSettings = await resolveInstitutionAiSettings(query, req.auth.institutionId);
      const provider = aiSettings.provider;
      const aiConfig = getClarityGremlinConfig({
        provider,
        modelOverride: resolveInstitutionModelOverride(aiSettings, provider)
      });
      const result = await analyzeStrategyPage({
        query,
        cycleId,
        view,
        entityId,
        locale,
        aiConfig
      });

      const analysisRecordId = typeof uuid === 'function' ? uuid() : null;
      if (analysisRecordId) {
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
             provider,
             model,
             analysis_json,
             created_by
           ) values (
             $1, $2, $3, $4, $5, $6, $7::uuid, $8, $9, $10, $11, $12, $13::jsonb, $14
           )`,
          [
            analysisRecordId,
            req.auth.institutionId,
            strategyId,
            cycleId,
            result.page?.view || view,
            result.page?.entityKind || null,
            result.page?.entityId || null,
            result.page?.label || result.analysis?.pageLabel || result.page?.view || view,
            result.page?.contextLabel || result.page?.label || result.page?.view || view,
            locale,
            aiConfig.provider || provider,
            result.model || null,
            JSON.stringify(result.analysis || {}),
            req.auth.sub
          ]
        );
      }

      const used = Number(reserved?.clarity_gremlin_calls_used || 0);
      const extra = Math.max(0, Number(reserved?.clarity_gremlin_extra_scans || 0));
      const limit = baseLimitPerStrategy + extra;
      return res.json({
        ok: true,
        analysis: result.analysis,
        page: result.page,
        model: result.model,
        historyEntryId: analysisRecordId,
        usage: {
          used,
          limit,
          baseLimit: baseLimitPerStrategy,
          extraAllocated: extra,
          remaining: Math.max(0, limit - used),
          strategyId,
          strategyTitle: reserved?.title || null
        }
      });
    } catch (error) {
      await query(
        `update institution_strategies
         set clarity_gremlin_calls_used = greatest(coalesce(clarity_gremlin_calls_used, 0) - 1, 0)
         where id = $1`,
        [strategyId]
      );
      return res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });

  app.post('/api/v1/cycles/:cycleId/clarity-gremlin/:analysisId/drafts/:draftIndex/implemented', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    const analysisId = String(req.params.analysisId || '').trim();
    const draftIndex = Number(req.params.draftIndex);
    const entityKind = String(req.body?.entityKind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
    const entityId = String(req.body?.entityId || '').trim();
    const entityTitle = String(req.body?.entityTitle || '').trim();
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
        entityTitle
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

const {
  analyzeStrategyPage,
  getClarityGremlinConfig
} = require('./services/clarityGremlinService');

function registerClarityGremlinRoutes({
  app,
  query,
  requireAuth,
  verifyCycleAccess,
  memberWriteRateLimit
}) {
  const requestGuard = typeof memberWriteRateLimit === 'function'
    ? memberWriteRateLimit
    : (_req, _res, next) => next();

  const limitPerStrategy = Math.max(1, Number(process.env.CLARITY_GREMLIN_LIMIT_PER_STRATEGY || 10));
  const aiConfig = getClarityGremlinConfig();

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
      `update institution_strategies
       set clarity_gremlin_calls_used = clarity_gremlin_calls_used + 1
       where id = $1
         and coalesce(clarity_gremlin_calls_used, 0) < $2
       returning id,
                 title,
                 coalesce(clarity_gremlin_calls_used, 0)::int as clarity_gremlin_calls_used`,
      [strategyId, limitPerStrategy]
    );

    if (!usageReservation.rowCount) {
      const strategyRes = await query(
        `select id,
                title,
                coalesce(clarity_gremlin_calls_used, 0)::int as clarity_gremlin_calls_used
         from institution_strategies
         where id = $1
         limit 1`,
        [strategyId]
      );
      const strategy = strategyRes.rows[0] || null;
      return res.status(429).json({
        error: 'clarity gremlin limit reached',
        usage: {
          used: Number(strategy?.clarity_gremlin_calls_used || limitPerStrategy),
          limit: limitPerStrategy,
          remaining: 0,
          strategyId
        }
      });
    }

    const reserved = usageReservation.rows[0];
    try {
      const result = await analyzeStrategyPage({
        query,
        cycleId,
        view,
        entityId,
        locale,
        aiConfig
      });

      const used = Number(reserved?.clarity_gremlin_calls_used || 0);
      return res.json({
        ok: true,
        analysis: result.analysis,
        page: result.page,
        model: result.model,
        usage: {
          used,
          limit: limitPerStrategy,
          remaining: Math.max(0, limitPerStrategy - used),
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
      throw error;
    }
  });
}

module.exports = { registerClarityGremlinRoutes };

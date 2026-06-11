function createInstitutionCycleService({ query }) {
  async function getInstitutionBySlug(slug) {
    const res = await query(
      'select id, name, slug, country_code, website_url, status from institutions where slug = $1',
      [slug]
    );
    return res.rows[0] || null;
  }

  async function getInstitutionStrategies(institutionId) {
    const res = await query(
      `select id, institution_id, title, slug, description, status, is_default, created_at
       from institution_strategies
       where institution_id = $1 and status = 'active'
       order by is_default desc, created_at asc`,
      [institutionId]
    );
    return res.rows;
  }

  function pickStrategy(strategies, strategySlug) {
    const list = Array.isArray(strategies) ? strategies : [];
    if (!list.length) return null;

    const requestedSlug = String(strategySlug || '').trim().toLowerCase();
    if (requestedSlug) {
      const requested = list.find((item) => String(item.slug || '').trim().toLowerCase() === requestedSlug);
      if (requested) return requested;
      return null;
    }

    return list.find((item) => item.is_default) || list[0] || null;
  }

  async function resolveInstitutionStrategy(institutionId, strategySlug) {
    const strategies = await getInstitutionStrategies(institutionId);
    const strategy = pickStrategy(strategies, strategySlug);
    return {
      strategy,
      strategies
    };
  }

  async function getCurrentCycle(institutionId, options = {}) {
    const strategyId = String(options?.strategyId || '').trim() || null;
    const allowInstitutionFallback = options?.allowInstitutionFallback !== false;
    if (strategyId) {
      const resByStrategy = await query(
        `select id, institution_id, strategy_id, title, state, voting_enabled, results_published, starts_at, ends_at, finalized_at, mission_text, vision_text, map_x, map_y, created_at
         from strategy_cycles
         where institution_id = $1 and strategy_id = $2 and state in ('open', 'closed')
         order by created_at desc
         limit 1`,
        [institutionId, strategyId]
      );
      if (resByStrategy.rows[0]) return resByStrategy.rows[0];
      if (!allowInstitutionFallback) return null;
    }

    const resFallback = await query(
      `select id, institution_id, strategy_id, title, state, voting_enabled, results_published, starts_at, ends_at, finalized_at, mission_text, vision_text, map_x, map_y, created_at
       from strategy_cycles
       where institution_id = $1 and state in ('open', 'closed')
       order by created_at desc
       limit 1`,
      [institutionId]
    );
    return resFallback.rows[0] || null;
  }

  return {
    getInstitutionBySlug,
    getInstitutionStrategies,
    resolveInstitutionStrategy,
    getCurrentCycle
  };
}

module.exports = { createInstitutionCycleService };

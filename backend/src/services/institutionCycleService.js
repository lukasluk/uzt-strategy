function createInstitutionCycleService({ query }) {
  async function getInstitutionBySlug(slug) {
    const res = await query(
      'select id, name, slug, status from institutions where slug = $1',
      [slug]
    );
    return res.rows[0] || null;
  }

  async function getCurrentCycle(institutionId) {
    const res = await query(
      `select id, institution_id, title, state, results_published, starts_at, ends_at, finalized_at, mission_text, vision_text, created_at
       from strategy_cycles
       where institution_id = $1 and state in ('open', 'closed')
       order by created_at desc
       limit 1`,
      [institutionId]
    );
    return res.rows[0] || null;
  }

  return {
    getInstitutionBySlug,
    getCurrentCycle
  };
}

module.exports = { createInstitutionCycleService };

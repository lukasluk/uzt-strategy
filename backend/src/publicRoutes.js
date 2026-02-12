const { loadContentSettings } = require('./contentSettings');

function registerPublicRoutes({
  app,
  query,
  publicReadRateLimit,
  trafficMonitor,
  getInstitutionBySlug,
  getCurrentCycle,
  normalizeLineSide
}) {
  const publicReadGuard = typeof publicReadRateLimit === 'function'
    ? publicReadRateLimit
    : (_req, _res, next) => next();

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true, version: 'v1' });
  });

  app.get('/api/v1/public/institutions', publicReadGuard, async (_req, res) => {
    const institutions = await query(
      'select id, name, slug, status, created_at from institutions where status = $1 order by name asc',
      ['active']
    );
    res.json({ institutions: institutions.rows });
  });

  app.get('/api/v1/public/content-settings', publicReadGuard, async (_req, res) => {
    const contentSettings = await loadContentSettings(query);
    res.json({ contentSettings });
  });

  app.get('/api/v1/public/strategy-map', publicReadGuard, async (req, res) => {
    const requestedInstitutionSlug = String(req.query?.institution || '').trim().toLowerCase();
    const source = String(req.query?.source || '').trim().toLowerCase();
    const hasRequestedInstitutionSlug = Boolean(requestedInstitutionSlug && /^[a-z0-9-]+$/.test(requestedInstitutionSlug));

    if (source === 'embed' && hasRequestedInstitutionSlug && trafficMonitor) {
      trafficMonitor.trackEmbedView({ institutionSlug: requestedInstitutionSlug });
    }

    const institutionsRes = hasRequestedInstitutionSlug
      ? await query(
        `select id, name, slug, status, created_at
         from institutions
         where status = 'active' and slug = $1
         order by name asc`,
        [requestedInstitutionSlug]
      )
      : await query(
        `select id, name, slug, status, created_at
         from institutions
         where status = 'active'
         order by name asc`
      );
    const institutions = institutionsRes.rows;
    if (!institutions.length) return res.json({ institutions: [] });

    const institutionIds = institutions.map((row) => row.id);
    const cyclesRes = await query(
      `select distinct on (institution_id)
          id, institution_id, title, state, finalized_at, mission_text, vision_text, created_at, map_x, map_y
       from strategy_cycles
       where institution_id = any($1::uuid[])
       order by institution_id, created_at desc`,
      [institutionIds]
    );
    const cyclesByInstitution = Object.fromEntries(cyclesRes.rows.map((row) => [row.institution_id, row]));
    const cycleIds = cyclesRes.rows.map((row) => row.id);

    const guidelinesByCycle = {};
    const guidelineLookupByCycle = {};
    const voteByGuideline = {};
    const commentsByGuideline = {};
    const initiativesByCycle = {};
    const initiativeLinksByInitiative = {};
    const voteByInitiative = {};
    const commentsByInitiative = {};
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

      const commentsRes = await query(
        `select c.id,
                c.guideline_id,
                c.body,
                c.created_at
         from strategy_comments c
         join strategy_guidelines g on g.id = c.guideline_id
         where g.cycle_id = any($1::uuid[])
           and c.status = 'visible'
         order by c.created_at asc`,
        [cycleIds]
      );
      commentsRes.rows.forEach((row) => {
        if (!commentsByGuideline[row.guideline_id]) commentsByGuideline[row.guideline_id] = [];
        commentsByGuideline[row.guideline_id].push({
          id: row.id,
          body: row.body,
          createdAt: row.created_at
        });
      });

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

      const initiativeCommentsRes = await query(
        `select c.id,
                c.initiative_id,
                c.body,
                c.created_at
         from strategy_initiative_comments c
         join strategy_initiatives i on i.id = c.initiative_id
         where i.cycle_id = any($1::uuid[])
           and c.status = 'visible'
         order by c.created_at asc`,
        [cycleIds]
      );
      initiativeCommentsRes.rows.forEach((row) => {
        if (!commentsByInitiative[row.initiative_id]) commentsByInitiative[row.initiative_id] = [];
        commentsByInitiative[row.initiative_id].push({
          id: row.id,
          body: row.body,
          createdAt: row.created_at
        });
      });

      guidelinesRes.rows.forEach((row) => {
        if (!guidelinesByCycle[row.cycle_id]) guidelinesByCycle[row.cycle_id] = [];
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
          commentCount: (commentsByGuideline[row.id] || []).length,
          comments: commentsByGuideline[row.id] || [],
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
          commentCount: (commentsByInitiative[row.id] || []).length,
          comments: commentsByInitiative[row.id] || [],
          createdAt: row.created_at
        });
      });
    }

    res.json({
      institutions: institutions.map((institution) => {
        const cycle = cyclesByInstitution[institution.id] || null;
        return {
          id: institution.id,
          name: institution.name,
          slug: institution.slug,
          status: institution.status,
          createdAt: institution.created_at,
          cycle: cycle
            ? {
                id: cycle.id,
                title: cycle.title,
                state: cycle.state,
                finalizedAt: cycle.finalized_at,
                missionText: cycle.mission_text || null,
                visionText: cycle.vision_text || null,
                createdAt: cycle.created_at,
                mapX: Number.isFinite(Number(cycle.map_x)) ? Number(cycle.map_x) : null,
                mapY: Number.isFinite(Number(cycle.map_y)) ? Number(cycle.map_y) : null
              }
            : null,
          guidelines: cycle ? (guidelinesByCycle[cycle.id] || []) : [],
          initiatives: cycle ? (initiativesByCycle[cycle.id] || []) : []
        };
      })
    });
  });

  app.get('/api/v1/public/institutions/:slug/cycles/current/summary', publicReadGuard, async (req, res) => {
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const cycle = await getCurrentCycle(query, institution.id);
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });

    const stats = await query(
      `select
         (select count(*) from strategy_guidelines g where g.cycle_id = $1 and g.status in ('active', 'disabled')) as guidelines_count,
         (select count(*) from strategy_initiatives i where i.cycle_id = $1 and i.status in ('active', 'disabled')) as initiatives_count,
         (select count(*) from strategy_comments c join strategy_guidelines g on g.id = c.guideline_id where g.cycle_id = $1 and c.status = 'visible') as comments_count,
         (select count(*) from strategy_initiative_comments c join strategy_initiatives i on i.id = c.initiative_id where i.cycle_id = $1 and c.status = 'visible') as initiative_comments_count,
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

    res.json({
      institution,
      cycle,
      summary: stats.rows[0]
    });
  });

  app.get('/api/v1/public/institutions/:slug/cycles/current/guidelines', publicReadGuard, async (req, res) => {
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const cycle = await getCurrentCycle(query, institution.id);
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

    const comments = await query(
      `select c.id, c.guideline_id, c.body, c.created_at
       from strategy_comments c
       join strategy_guidelines g on g.id = c.guideline_id
       where g.cycle_id = $1 and c.status = 'visible'
       order by c.created_at asc`,
      [cycle.id]
    );

    const voteByGuideline = Object.fromEntries(
      votes.rows.map((row) => [row.guideline_id, { totalScore: row.total_score, voterCount: row.voter_count }])
    );
    const commentsByGuideline = comments.rows.reduce((acc, row) => {
      if (!acc[row.guideline_id]) acc[row.guideline_id] = [];
      acc[row.guideline_id].push({
        id: row.id,
        body: row.body,
        createdAt: row.created_at
      });
      return acc;
    }, {});

    res.json({
      institution,
      cycle,
      guidelines: guidelines.rows.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        status: g.status,
        relationType: g.relation_type || 'orphan',
        parentGuidelineId: g.parent_guideline_id || null,
        lineSide: normalizeLineSide(g.line_side) || 'auto',
        totalScore: voteByGuideline[g.id]?.totalScore || 0,
        voterCount: voteByGuideline[g.id]?.voterCount || 0,
        comments: commentsByGuideline[g.id] || []
      }))
    });
  });

  app.get('/api/v1/public/institutions/:slug/cycles/current/initiatives', publicReadGuard, async (req, res) => {
    const institution = await getInstitutionBySlug(query, req.params.slug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const cycle = await getCurrentCycle(query, institution.id);
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

    const commentsRes = await query(
      `select c.id, c.initiative_id, c.body, c.created_at
       from strategy_initiative_comments c
       join strategy_initiatives i on i.id = c.initiative_id
       where i.cycle_id = $1 and c.status = 'visible'
       order by c.created_at asc`,
      [cycle.id]
    );

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
        createdAt: row.created_at
      });
      return acc;
    }, {});

    res.json({
      institution,
      cycle,
      initiatives: initiativesRes.rows.map((row) => ({
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
        comments: commentsByInitiative[row.id] || []
      }))
    });
  });
}

module.exports = { registerPublicRoutes };

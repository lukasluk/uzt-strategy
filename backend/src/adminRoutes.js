function registerAdminRoutes({
  app,
  query,
  broadcast,
  uuid,
  crypto,
  hashPassword,
  normalizeEmail,
  sha256,
  inviteTtlHours,
  requireAuth,
  isCycleWritable,
  normalizeLineSide,
  loadGuidelineContext,
  loadCommentContext,
  loadInitiativeContext,
  loadInitiativeCommentContext,
  validateGuidelineRelationship,
  validateInitiativeGuidelineAssignments
}) {
  app.post('/api/v1/admin/invites', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const email = normalizeEmail(req.body?.email);
    const role = String(req.body?.role || 'member').trim();
    if (!email) return res.status(400).json({ error: 'email required' });
    if (role !== 'member') return res.status(400).json({ error: 'institution admin can invite only members in v1' });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    await query(
      `insert into institution_invites (id, institution_id, email, role, token_hash, expires_at, created_by)
       values ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval, $7)`,
      [
        uuid(),
        req.auth.institutionId,
        email,
        role,
        sha256(inviteToken),
        String(inviteTtlHours),
        req.auth.sub
      ]
    );
    res.status(201).json({ inviteToken, email, role });
  });


  app.put('/api/v1/admin/cycles/:cycleId/state', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    const state = String(req.body?.state || '').trim();
    if (!['open', 'closed'].includes(state)) {
      return res.status(400).json({ error: 'invalid state' });
    }

    const cycleRes = await query(
      'select id, institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    const cycle = cycleRes.rows[0];
    if (!cycle) return res.status(404).json({ error: 'cycle not found' });
    if (cycle.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await query(
      `update strategy_cycles
       set state = $1,
           finalized_at = case when $1 = 'closed' then now() else null end
       where id = $2`,
      [state, cycleId]
    );

    broadcast({ type: 'v1.cycle.state', institutionId: req.auth.institutionId, cycleId, state });
    res.json({ ok: true, state });
  });


  app.put('/api/v1/admin/cycles/:cycleId/settings', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const body = req.body || {};
    const missionProvided = Object.prototype.hasOwnProperty.call(body, 'missionText');
    const visionProvided = Object.prototype.hasOwnProperty.call(body, 'visionText');
    if (!missionProvided && !visionProvided) {
      return res.status(400).json({ error: 'missionText or visionText required' });
    }

    const missionText = missionProvided ? (String(body.missionText || '').trim() || null) : null;
    const visionText = visionProvided ? (String(body.visionText || '').trim() || null) : null;

    const cycleRes = await query('select institution_id from strategy_cycles where id = $1', [cycleId]);
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const updated = await query(
      `update strategy_cycles
       set mission_text = case when $1::boolean then $2 else mission_text end,
           vision_text = case when $3::boolean then $4 else vision_text end
       where id = $5
       returning mission_text, vision_text`,
      [missionProvided, missionText, visionProvided, visionText, cycleId]
    );

    broadcast({
      type: 'v1.cycle.settings',
      institutionId: req.auth.institutionId,
      cycleId
    });

    res.json({
      ok: true,
      missionText: updated.rows[0]?.mission_text || null,
      visionText: updated.rows[0]?.vision_text || null
    });
  });


  app.post('/api/v1/admin/cycles/:cycleId/results', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    const published = Boolean(req.body?.published);

    const cycleRes = await query('select institution_id from strategy_cycles where id = $1', [cycleId]);
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    await query(
      'update strategy_cycles set results_published = $1 where id = $2',
      [published, cycleId]
    );
    broadcast({ type: 'v1.cycle.results', institutionId: req.auth.institutionId, cycleId, published });
    res.json({ ok: true, published });
  });


  app.get('/api/v1/admin/cycles/:cycleId/participants', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();

    const cycleRes = await query(
      'select institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const participants = await query(
      `select u.id, u.email, u.display_name,
              coalesce(votes.total_score, 0)::int as total_score,
              case when coalesce(votes.vote_count, 0) > 0 then true else false end as has_voted
       from institution_memberships m
       join platform_users u on u.id = m.user_id
       left join (
         select voter_id, sum(score)::int as total_score, count(*)::int as vote_count
         from (
           select v.voter_id, v.score
           from strategy_votes v
           join strategy_guidelines g on g.id = v.guideline_id
           where g.cycle_id = $1
           union all
           select v.voter_id, v.score
           from strategy_initiative_votes v
           join strategy_initiatives i on i.id = v.initiative_id
           where i.cycle_id = $1
         ) as all_votes
         group by voter_id
       ) votes on votes.voter_id = u.id
       where m.institution_id = $2 and m.status = 'active'
       group by u.id, u.email, u.display_name, votes.total_score, votes.vote_count
       order by u.display_name asc`,
      [cycleId, req.auth.institutionId]
    );

    res.json({ participants: participants.rows });
  });


  app.put('/api/v1/admin/users/:userId/password', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const userId = String(req.params.userId || '').trim();
    const password = String(req.body?.password || '');
    if (!userId || password.length < 8) {
      return res.status(400).json({ error: 'userId and password(min 8) required' });
    }

    const membershipRes = await query(
      `select id
       from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [req.auth.institutionId, userId]
    );
    if (membershipRes.rowCount === 0) return res.status(404).json({ error: 'membership not found' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    await query(
      `update platform_users
       set password_salt = $1,
           password_hash = $2
       where id = $3`,
      [salt, hash, userId]
    );

    res.json({ ok: true });
  });


  app.delete('/api/v1/admin/users/:userId', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const userId = String(req.params.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (userId === req.auth.sub) return res.status(400).json({ error: 'cannot delete self' });

    const membershipRes = await query(
      `select id
       from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [req.auth.institutionId, userId]
    );
    if (membershipRes.rowCount === 0) return res.status(404).json({ error: 'membership not found' });

    await query(
      `delete from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [req.auth.institutionId, userId]
    );

    const leftRes = await query(
      `select count(*)::int as membership_count
       from institution_memberships
       where user_id = $1`,
      [userId]
    );
    const membershipsLeft = Number(leftRes.rows[0]?.membership_count || 0);
    let userDeleted = false;
    if (membershipsLeft === 0) {
      await query('delete from platform_users where id = $1', [userId]);
      userDeleted = true;
    }

    res.json({ ok: true, userDeleted, membershipsLeft });
  });


  app.get('/api/v1/admin/cycles/:cycleId/guidelines', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleRes = await query(
      'select institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const guidelinesRes = await query(
      `select g.id, g.title, g.description, g.status, g.relation_type, g.parent_guideline_id, g.line_side, g.created_at,
              coalesce(v.total_score, 0)::int as total_score,
              coalesce(v.voter_count, 0)::int as voter_count
       from strategy_guidelines g
       left join (
         select guideline_id,
                coalesce(sum(score), 0)::int as total_score,
                count(distinct voter_id)::int as voter_count
         from strategy_votes
         group by guideline_id
       ) v on v.guideline_id = g.id
       where g.cycle_id = $1
       order by g.created_at asc`,
      [cycleId]
    );

    const guidelineIds = guidelinesRes.rows.map((row) => row.id);
    const commentsByGuideline = {};
    if (guidelineIds.length) {
      const commentsRes = await query(
        `select c.id,
                c.guideline_id,
                c.body,
                c.status,
                c.created_at,
                u.display_name as author_display_name,
                u.email as author_email
         from strategy_comments c
         left join platform_users u on u.id = c.author_id
         where c.guideline_id = any($1::uuid[])
         order by c.created_at desc`,
        [guidelineIds]
      );
      commentsRes.rows.forEach((row) => {
        if (!commentsByGuideline[row.guideline_id]) commentsByGuideline[row.guideline_id] = [];
        commentsByGuideline[row.guideline_id].push({
          id: row.id,
          body: row.body,
          status: row.status || 'visible',
          authorName: row.author_display_name || row.author_email || 'NeÅ¾inomas autorius',
          authorEmail: row.author_email || null,
          createdAt: row.created_at
        });
      });
    }

    res.json({
      guidelines: guidelinesRes.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        relationType: row.relation_type || 'orphan',
        parentGuidelineId: row.parent_guideline_id || null,
        lineSide: normalizeLineSide(row.line_side) || 'auto',
        createdAt: row.created_at,
        totalScore: row.total_score,
        voterCount: row.voter_count,
        commentCount: (commentsByGuideline[row.id] || []).length,
        comments: commentsByGuideline[row.id] || []
      }))
    });
  });


  app.get('/api/v1/admin/cycles/:cycleId/initiatives', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleRes = await query(
      'select institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const guidelinesRes = await query(
      `select id, title, status
       from strategy_guidelines
       where cycle_id = $1
       order by created_at asc`,
      [cycleId]
    );

    const initiativesRes = await query(
      `select i.id, i.title, i.description, i.status, i.line_side, i.map_x, i.map_y, i.created_at,
              coalesce(v.total_score, 0)::int as total_score,
              coalesce(v.voter_count, 0)::int as voter_count
       from strategy_initiatives i
       left join (
         select initiative_id,
                coalesce(sum(score), 0)::int as total_score,
                count(distinct voter_id)::int as voter_count
         from strategy_initiative_votes
         group by initiative_id
       ) v on v.initiative_id = i.id
       where i.cycle_id = $1
       order by i.created_at asc`,
      [cycleId]
    );

    const initiativeIds = initiativesRes.rows.map((row) => row.id);
    const linksByInitiative = {};
    const commentsByInitiative = {};

    if (initiativeIds.length) {
      const linksRes = await query(
        `select ig.initiative_id, ig.guideline_id, g.title as guideline_title
         from strategy_initiative_guidelines ig
         join strategy_guidelines g on g.id = ig.guideline_id
         where ig.initiative_id = any($1::uuid[])
         order by g.created_at asc`,
        [initiativeIds]
      );
      linksRes.rows.forEach((row) => {
        if (!linksByInitiative[row.initiative_id]) linksByInitiative[row.initiative_id] = [];
        linksByInitiative[row.initiative_id].push({
          guidelineId: row.guideline_id,
          guidelineTitle: row.guideline_title
        });
      });

      const commentsRes = await query(
        `select c.id,
                c.initiative_id,
                c.body,
                c.status,
                c.created_at,
                u.display_name as author_display_name,
                u.email as author_email
         from strategy_initiative_comments c
         left join platform_users u on u.id = c.author_id
         where c.initiative_id = any($1::uuid[])
         order by c.created_at desc`,
        [initiativeIds]
      );
      commentsRes.rows.forEach((row) => {
        if (!commentsByInitiative[row.initiative_id]) commentsByInitiative[row.initiative_id] = [];
        commentsByInitiative[row.initiative_id].push({
          id: row.id,
          body: row.body,
          status: row.status || 'visible',
          authorName: row.author_display_name || row.author_email || 'NeÅ¾inomas autorius',
          authorEmail: row.author_email || null,
          createdAt: row.created_at
        });
      });
    }

    res.json({
      guidelines: guidelinesRes.rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status
      })),
      initiatives: initiativesRes.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        lineSide: normalizeLineSide(row.line_side) || 'auto',
        mapX: Number.isFinite(Number(row.map_x)) ? Number(row.map_x) : null,
        mapY: Number.isFinite(Number(row.map_y)) ? Number(row.map_y) : null,
        createdAt: row.created_at,
        totalScore: row.total_score,
        voterCount: row.voter_count,
        guidelineLinks: linksByInitiative[row.id] || [],
        guidelineIds: (linksByInitiative[row.id] || []).map((item) => item.guidelineId),
        commentCount: (commentsByInitiative[row.id] || []).length,
        comments: commentsByInitiative[row.id] || []
      }))
    });
  });


  app.put('/api/v1/admin/comments/:commentId/status', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const commentId = String(req.params.commentId || '').trim();
    const status = String(req.body?.status || '').trim().toLowerCase();
    if (!commentId) return res.status(400).json({ error: 'commentId required' });
    if (!['visible', 'hidden'].includes(status)) return res.status(400).json({ error: 'invalid status' });

    const context = await loadCommentContext(commentId);
    if (!context) return res.status(404).json({ error: 'comment not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await query(
      `update strategy_comments
       set status = $1
       where id = $2`,
      [status, commentId]
    );

    broadcast({
      type: 'v1.comment.status.updated',
      institutionId: req.auth.institutionId,
      guidelineId: context.guideline_id,
      commentId,
      status
    });
    res.json({ ok: true, commentId, status });
  });


  app.put('/api/v1/admin/initiative-comments/:commentId/status', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const commentId = String(req.params.commentId || '').trim();
    const status = String(req.body?.status || '').trim().toLowerCase();
    if (!commentId) return res.status(400).json({ error: 'commentId required' });
    if (!['visible', 'hidden'].includes(status)) return res.status(400).json({ error: 'invalid status' });

    const context = await loadInitiativeCommentContext(commentId);
    if (!context) return res.status(404).json({ error: 'comment not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await query(
      `update strategy_initiative_comments
       set status = $1
       where id = $2`,
      [status, commentId]
    );

    broadcast({
      type: 'v1.initiative.comment.status.updated',
      institutionId: req.auth.institutionId,
      initiativeId: context.initiative_id,
      commentId,
      status
    });
    res.json({ ok: true, commentId, status });
  });


  app.put('/api/v1/admin/cycles/:cycleId/map-layout', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleRes = await query(
      'select id, institution_id from strategy_cycles where id = $1',
      [cycleId]
    );
    if (cycleRes.rowCount === 0) return res.status(404).json({ error: 'cycle not found' });
    if (cycleRes.rows[0].institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }

    const parseCoord = (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      return Math.round(parsed);
    };

    const institutionPosition = req.body?.institutionPosition || null;
    const rawGuidelinePositions = Array.isArray(req.body?.guidelinePositions) ? req.body.guidelinePositions : [];
    const rawInitiativePositions = Array.isArray(req.body?.initiativePositions) ? req.body.initiativePositions : [];
    const guidelinePositions = rawGuidelinePositions
      .map((item) => ({
        guidelineId: String(item?.guidelineId || '').trim(),
        x: parseCoord(item?.x),
        y: parseCoord(item?.y)
      }))
      .filter((item) => item.guidelineId && item.x !== null && item.y !== null);
    const initiativePositions = rawInitiativePositions
      .map((item) => ({
        initiativeId: String(item?.initiativeId || '').trim(),
        x: parseCoord(item?.x),
        y: parseCoord(item?.y)
      }))
      .filter((item) => item.initiativeId && item.x !== null && item.y !== null);

    const hasInstitutionPosition =
      institutionPosition &&
      parseCoord(institutionPosition.x) !== null &&
      parseCoord(institutionPosition.y) !== null;
    if (!hasInstitutionPosition && guidelinePositions.length === 0 && initiativePositions.length === 0) {
      return res.status(400).json({ error: 'layout payload required' });
    }

    if (hasInstitutionPosition) {
      await query(
        `update strategy_cycles
         set map_x = $1, map_y = $2
         where id = $3`,
        [parseCoord(institutionPosition.x), parseCoord(institutionPosition.y), cycleId]
      );
    }

    if (guidelinePositions.length > 0) {
      const guidelineIds = [...new Set(guidelinePositions.map((item) => item.guidelineId))];
      const validRes = await query(
        `select id
         from strategy_guidelines
         where cycle_id = $1 and id = any($2::uuid[])`,
        [cycleId, guidelineIds]
      );
      const validIds = new Set(validRes.rows.map((row) => row.id));
      const invalid = guidelineIds.find((id) => !validIds.has(id));
      if (invalid) return res.status(400).json({ error: 'guideline not in cycle' });

      for (const item of guidelinePositions) {
        await query(
          `update strategy_guidelines
           set map_x = $1, map_y = $2
           where id = $3 and cycle_id = $4`,
          [item.x, item.y, item.guidelineId, cycleId]
        );
      }
    }

    if (initiativePositions.length > 0) {
      const initiativeIds = [...new Set(initiativePositions.map((item) => item.initiativeId))];
      const validRes = await query(
        `select id
         from strategy_initiatives
         where cycle_id = $1 and id = any($2::uuid[])`,
        [cycleId, initiativeIds]
      );
      const validIds = new Set(validRes.rows.map((row) => row.id));
      const invalid = initiativeIds.find((id) => !validIds.has(id));
      if (invalid) return res.status(400).json({ error: 'initiative not in cycle' });

      for (const item of initiativePositions) {
        await query(
          `update strategy_initiatives
           set map_x = $1, map_y = $2
           where id = $3 and cycle_id = $4`,
          [item.x, item.y, item.initiativeId, cycleId]
        );
      }
    }

    broadcast({ type: 'v1.map.layout.updated', institutionId: req.auth.institutionId, cycleId });
    res.json({
      ok: true,
      updatedInstitution: Boolean(hasInstitutionPosition),
      updatedGuidelines: guidelinePositions.length,
      updatedInitiatives: initiativePositions.length
    });
  });


  app.put('/api/v1/admin/guidelines/:guidelineId', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const guidelineId = String(req.params.guidelineId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const status = String(req.body?.status || 'active').trim();
    const relationType = String(req.body?.relationType || 'orphan').trim().toLowerCase();
    const lineSide = normalizeLineSide(req.body?.lineSide);
    const parentGuidelineIdRaw = req.body?.parentGuidelineId;
    if (!guidelineId || !title) return res.status(400).json({ error: 'guidelineId and title required' });
    if (!['active', 'disabled', 'merged', 'hidden'].includes(status)) return res.status(400).json({ error: 'invalid status' });
    if (!lineSide) return res.status(400).json({ error: 'invalid line side' });

    const context = await loadGuidelineContext(guidelineId);
    if (!context) return res.status(404).json({ error: 'guideline not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    let parentGuidelineId = null;
    try {
      parentGuidelineId = await validateGuidelineRelationship({
        guidelineId,
        cycleId: context.cycle_id,
        relationType,
        parentGuidelineId: parentGuidelineIdRaw
      });
    } catch (error) {
      return res.status(400).json({ error: String(error?.message || 'invalid relation') });
    }

    if (relationType !== 'parent') {
      const childrenRes = await query(
        `select id from strategy_guidelines
         where parent_guideline_id = $1 and id <> $1
         limit 1`,
        [guidelineId]
      );
      if (childrenRes.rowCount > 0) {
        return res.status(400).json({ error: 'cannot demote parent with children' });
      }
    }

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

    broadcast({ type: 'v1.guideline.updated', institutionId: req.auth.institutionId, guidelineId });
    res.json({ ok: true });
  });


  app.put('/api/v1/admin/initiatives/:initiativeId', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const initiativeId = String(req.params.initiativeId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const status = String(req.body?.status || 'active').trim();
    const lineSide = normalizeLineSide(req.body?.lineSide);
    const guidelineIdsRaw = req.body?.guidelineIds;
    if (!initiativeId || !title) return res.status(400).json({ error: 'initiativeId and title required' });
    if (!['active', 'disabled', 'merged', 'hidden'].includes(status)) return res.status(400).json({ error: 'invalid status' });
    if (!lineSide) return res.status(400).json({ error: 'invalid line side' });

    const context = await loadInitiativeContext(initiativeId);
    if (!context) return res.status(404).json({ error: 'initiative not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    let guidelineIds = [];
    try {
      guidelineIds = await validateInitiativeGuidelineAssignments({
        cycleId: context.cycle_id,
        guidelineIds: guidelineIdsRaw
      });
    } catch (error) {
      return res.status(400).json({ error: String(error?.message || 'invalid guideline assignment') });
    }

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

    await query('delete from strategy_initiative_guidelines where initiative_id = $1', [initiativeId]);
    for (const guidelineId of guidelineIds) {
      await query(
        `insert into strategy_initiative_guidelines (id, initiative_id, guideline_id)
         values ($1, $2, $3)`,
        [uuid(), initiativeId, guidelineId]
      );
    }

    broadcast({ type: 'v1.initiative.updated', institutionId: req.auth.institutionId, initiativeId });
    res.json({ ok: true });
  });


  app.delete('/api/v1/admin/initiatives/:initiativeId', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const initiativeId = String(req.params.initiativeId || '').trim();
    if (!initiativeId) return res.status(400).json({ error: 'initiativeId required' });

    const context = await loadInitiativeContext(initiativeId);
    if (!context) return res.status(404).json({ error: 'initiative not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await query(
      `delete from strategy_initiatives
       where id = $1 and cycle_id = $2`,
      [initiativeId, context.cycle_id]
    );

    broadcast({ type: 'v1.initiative.deleted', institutionId: req.auth.institutionId, initiativeId });
    res.json({ ok: true, initiativeId });
  });


  app.delete('/api/v1/admin/guidelines/:guidelineId', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const guidelineId = String(req.params.guidelineId || '').trim();
    if (!guidelineId) return res.status(400).json({ error: 'guidelineId required' });

    const context = await loadGuidelineContext(guidelineId);
    if (!context) return res.status(404).json({ error: 'guideline not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await query(
      `update strategy_guidelines
       set relation_type = 'orphan',
           parent_guideline_id = null,
           updated_at = now()
       where parent_guideline_id = $1`,
      [guidelineId]
    );

    await query(
      `delete from strategy_guidelines
       where id = $1 and cycle_id = $2`,
      [guidelineId, context.cycle_id]
    );

    broadcast({ type: 'v1.guideline.deleted', institutionId: req.auth.institutionId, guidelineId });
    res.json({ ok: true, guidelineId });
  });

}

module.exports = { registerAdminRoutes };


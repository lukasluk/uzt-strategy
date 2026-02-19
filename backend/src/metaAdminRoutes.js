const crypto = require('crypto');
const {
  createAuthToken,
  createRateLimiter,
  getCookie,
  normalizeEmail,
  readAuthToken,
  resolveClientIp,
  sha256,
  shouldUseSecureCookie,
  slugify,
  timingSafeEqual,
  verifyMetaAdminPassword
} = require('./security');
const { logAuditEvent } = require('./audit');
const {
  loadContentSettings,
  normalizeContentSettingsPatch,
  updateContentSettings
} = require('./contentSettings');
const {
  createPasswordResetToken,
  ensurePasswordResetTable
} = require('./passwordResetService');

function registerMetaAdminRoutes({
  app,
  query,
  uuid,
  authSecret,
  inviteTtlHours,
  authWindowMs,
  trafficMonitor,
  rateLimitConfig
}) {
  const SUPERADMIN_CODE = process.env.SUPERADMIN_CODE || 'change-me';

  const META_ADMIN_PASSWORD_HASH = String(process.env.META_ADMIN_PASSWORD_HASH || '').trim();
  const META_ADMIN_PASSWORD = String(process.env.META_ADMIN_PASSWORD || '').trim();
  const ALLOW_LEGACY_META_ADMIN_PASSWORD = String(process.env.ALLOW_LEGACY_META_ADMIN_PASSWORD || '1') === '1';

  const META_ADMIN_SESSION_SECRET = process.env.META_ADMIN_SESSION_SECRET || authSecret;
  const META_ADMIN_SESSION_COOKIE = process.env.META_ADMIN_SESSION_COOKIE || 'uzt_meta_admin_session';
  const META_ADMIN_SESSION_TTL_HOURS = Number(process.env.META_ADMIN_SESSION_TTL_HOURS || 2);
  const META_ADMIN_AUTH_MAX_ATTEMPTS = Number(process.env.META_ADMIN_AUTH_RATE_LIMIT_MAX || 8);

  const ENABLE_LEGACY_SUPERADMIN = String(process.env.ENABLE_LEGACY_SUPERADMIN || '0') === '1';
  const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60);
  const PASSWORD_RESET_BASE_URL = String(process.env.PASSWORD_RESET_BASE_URL || '').trim();
  const INVITE_BASE_URL = String(process.env.INVITE_BASE_URL || PASSWORD_RESET_BASE_URL || '').trim();

  const metaAdminAuthConfigured = Boolean(META_ADMIN_PASSWORD_HASH)
    || (ALLOW_LEGACY_META_ADMIN_PASSWORD && Boolean(META_ADMIN_PASSWORD));

  if (!META_ADMIN_PASSWORD_HASH && ALLOW_LEGACY_META_ADMIN_PASSWORD && META_ADMIN_PASSWORD) {
    console.warn('[security] META_ADMIN_PASSWORD_HASH is not set; using legacy plaintext meta-admin password flow.');
  }
  if (!metaAdminAuthConfigured) {
    console.error('[security] Meta-admin auth is not configured. Set META_ADMIN_PASSWORD_HASH or enable ALLOW_LEGACY_META_ADMIN_PASSWORD with META_ADMIN_PASSWORD.');
  }

  const metaAdminAuthRateLimit = createRateLimiter({
    windowMs: authWindowMs,
    max: META_ADMIN_AUTH_MAX_ATTEMPTS,
    keyPrefix: 'meta-admin-auth',
    keyFn: (req) => resolveClientIp(req),
    onBlocked: ({ req, retryAfter }) => {
      if (!trafficMonitor) return;
      trafficMonitor.trackRateLimitBlocked({
        limiter: 'meta-admin-auth',
        ip: resolveClientIp(req),
        path: req.path || req.originalUrl || '',
        retryAfterSeconds: retryAfter
      });
    }
  });

  function decodePasswordCandidate(value) {
    const candidate = String(value || '').trim();
    if (!candidate) return '';
    try {
      return decodeURIComponent(candidate);
    } catch {
      return candidate;
    }
  }

  function setMetaAdminCookie(req, res, token) {
    const maxAgeMs = Math.max(5 * 60 * 1000, META_ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000);
    res.cookie(META_ADMIN_SESSION_COOKIE, token, {
      maxAge: maxAgeMs,
      httpOnly: true,
      sameSite: 'strict',
      secure: shouldUseSecureCookie(req),
      path: '/api/v1/meta-admin'
    });
  }

  function clearMetaAdminCookie(req, res) {
    res.clearCookie(META_ADMIN_SESSION_COOKIE, {
      httpOnly: true,
      sameSite: 'strict',
      secure: shouldUseSecureCookie(req),
      path: '/api/v1/meta-admin'
    });
  }

  function requireMetaAdminSession(req, res, next) {
    const token = getCookie(req, META_ADMIN_SESSION_COOKIE);
    const payload = readAuthToken(token, META_ADMIN_SESSION_SECRET);
    if (!payload || payload.scope !== 'meta_admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    req.metaAdmin = payload;
    return next();
  }

  function requireSuperAdmin(req, res, next) {
    const code = String(req.headers['x-superadmin-code'] || '').trim();
    if (!code || !timingSafeEqual(code, SUPERADMIN_CODE)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    return next();
  }

  function metaAuditPayload(req, extra = {}) {
    return {
      actorScope: 'meta_admin',
      ip: resolveClientIp(req),
      userAgent: String(req.headers['user-agent'] || ''),
      ...extra
    };
  }

  function buildPasswordResetUrl(req, token) {
    const safeToken = encodeURIComponent(String(token || '').trim());
    const base = resolveAbsoluteBase(req, PASSWORD_RESET_BASE_URL);
    return `${base}/reset-password.html?token=${safeToken}`;
  }

  function resolveAbsoluteBase(req, configuredBase) {
    if (configuredBase) return configuredBase.replace(/\/+$/, '');
    return `${String(req.protocol || 'https')}://${String(req.get('host') || '').trim()}`;
  }

  function buildInviteAcceptUrl(req, token) {
    const safeToken = encodeURIComponent(String(token || '').trim());
    const base = resolveAbsoluteBase(req, INVITE_BASE_URL);
    return `${base}/accept-invite.html?token=${safeToken}`;
  }

  async function createInstitutionWithDefaultCycle(name, slug) {
    const institutionId = uuid();
    const strategyId = uuid();
    const cycleId = uuid();

    await query(
      `insert into institutions (id, name, slug, status)
       values ($1, $2, $3, 'active')`,
      [institutionId, name, slug]
    );

    await query(
      `insert into institution_strategies (id, institution_id, title, slug, status, is_default)
       values ($1, $2, $3, $4, 'active', true)`,
      [strategyId, institutionId, 'Skaitmenizacijos strategija', 'default']
    );

    await query(
      `insert into strategy_cycles (id, institution_id, strategy_id, title, state, results_published, starts_at)
       values ($1, $2, $3, $4, 'open', false, now())`,
      [cycleId, institutionId, strategyId, `${name} strategijos ciklas`]
    );

    return { institutionId, strategyId, cycleId, slug };
  }

  async function createInviteForInstitution(req, institutionId, email, role) {
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(inviteToken);
    const inviteId = uuid();

    await query(
      `insert into institution_invites (id, institution_id, email, role, token_hash, expires_at)
       values ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval)`,
      [inviteId, institutionId, email, role, tokenHash, String(inviteTtlHours)]
    );

    const inviteUrl = buildInviteAcceptUrl(req, inviteToken);
    const expiresAt = new Date(Date.now() + inviteTtlHours * 60 * 60 * 1000).toISOString();
    return { inviteId, inviteToken, inviteUrl, expiresAt, email, role };
  }

  async function loadParentGuidelineCatalog() {
    const result = await query(
      `select g.id,
              g.title as guideline_title,
              g.status as guideline_status,
              c.id as cycle_id,
              c.title as cycle_title,
              c.state as cycle_state,
              i.id as institution_id,
              i.name as institution_name,
              i.slug as institution_slug,
              s.id as strategy_id,
              s.title as strategy_title,
              s.slug as strategy_slug
       from strategy_guidelines g
       join strategy_cycles c on c.id = g.cycle_id
       join institutions i on i.id = c.institution_id
       left join institution_strategies s on s.id = c.strategy_id
       where g.relation_type = 'parent'
         and g.status in ('active', 'disabled', 'merged')
       order by i.name asc, s.title asc, g.created_at asc`
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.guideline_title,
      status: row.guideline_status,
      cycleId: row.cycle_id,
      cycleTitle: row.cycle_title,
      cycleState: row.cycle_state,
      institutionId: row.institution_id,
      institutionName: row.institution_name,
      institutionSlug: row.institution_slug,
      strategyId: row.strategy_id,
      strategyTitle: row.strategy_title || 'default',
      strategySlug: row.strategy_slug || 'default'
    }));
  }

  async function loadGuidelineLinksOverview() {
    const result = await query(
      `select l.id,
              l.created_at,
              sg.id as source_guideline_id,
              sg.title as source_guideline_title,
              sc.id as source_cycle_id,
              sc.title as source_cycle_title,
              si.id as source_institution_id,
              si.name as source_institution_name,
              si.slug as source_institution_slug,
              ss.id as source_strategy_id,
              ss.title as source_strategy_title,
              ss.slug as source_strategy_slug,
              tg.id as target_guideline_id,
              tg.title as target_guideline_title,
              tc.id as target_cycle_id,
              tc.title as target_cycle_title,
              ti.id as target_institution_id,
              ti.name as target_institution_name,
              ti.slug as target_institution_slug,
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
       order by l.created_at desc`
    );
    return result.rows.map((row) => {
      const isCrossInstitution = row.source_institution_id !== row.target_institution_id;
      const isCrossStrategy = row.source_strategy_id !== row.target_strategy_id;
      return {
        id: row.id,
        createdAt: row.created_at,
        isCrossInstitution,
        isCrossStrategy,
        source: {
          guidelineId: row.source_guideline_id,
          guidelineTitle: row.source_guideline_title,
          cycleId: row.source_cycle_id,
          cycleTitle: row.source_cycle_title,
          institutionId: row.source_institution_id,
          institutionName: row.source_institution_name,
          institutionSlug: row.source_institution_slug,
          strategyId: row.source_strategy_id,
          strategyTitle: row.source_strategy_title || 'default',
          strategySlug: row.source_strategy_slug || 'default'
        },
        target: {
          guidelineId: row.target_guideline_id,
          guidelineTitle: row.target_guideline_title,
          cycleId: row.target_cycle_id,
          cycleTitle: row.target_cycle_title,
          institutionId: row.target_institution_id,
          institutionName: row.target_institution_name,
          institutionSlug: row.target_institution_slug,
          strategyId: row.target_strategy_id,
          strategyTitle: row.target_strategy_title || 'default',
          strategySlug: row.target_strategy_slug || 'default'
        }
      };
    });
  }

  app.post('/api/v1/meta-admin/auth', metaAdminAuthRateLimit, async (req, res) => {
    if (!metaAdminAuthConfigured) {
      return res.status(503).json({ error: 'meta admin auth not configured' });
    }

    const password = decodePasswordCandidate(req.body?.password);
    const hashValid = META_ADMIN_PASSWORD_HASH
      ? verifyMetaAdminPassword(password, META_ADMIN_PASSWORD_HASH)
      : false;
    const legacyValid = !META_ADMIN_PASSWORD_HASH
      && ALLOW_LEGACY_META_ADMIN_PASSWORD
      && META_ADMIN_PASSWORD
      && timingSafeEqual(password, META_ADMIN_PASSWORD);

    const authenticated = Boolean(hashValid || legacyValid);

    if (!authenticated) {
      await logAuditEvent({
        query,
        uuid,
        action: 'meta_admin.auth.failed',
        entityType: 'meta_admin_session',
        payload: metaAuditPayload(req)
      });
      return res.status(403).json({ error: 'forbidden' });
    }

    const payload = {
      scope: 'meta_admin',
      authMode: hashValid ? 'hash' : 'legacy',
      exp: Date.now() + Math.max(5 * 60 * 1000, META_ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000)
    };
    const token = createAuthToken(payload, META_ADMIN_SESSION_SECRET);
    setMetaAdminCookie(req, res, token);

    await logAuditEvent({
      query,
      uuid,
      action: 'meta_admin.auth.succeeded',
      entityType: 'meta_admin_session',
      payload: metaAuditPayload(req, { authMode: payload.authMode })
    });

    return res.json({ ok: true });
  });

  app.post('/api/v1/meta-admin/logout', async (req, res) => {
    clearMetaAdminCookie(req, res);

    await logAuditEvent({
      query,
      uuid,
      action: 'meta_admin.logout',
      entityType: 'meta_admin_session',
      payload: metaAuditPayload(req)
    });

    res.json({ ok: true });
  });

  app.get('/api/v1/meta-admin/overview', requireMetaAdminSession, async (_req, res) => {
    const institutionsRes = await query(
      'select id, name, slug, status, created_at from institutions order by created_at desc'
    );
    const strategiesRes = await query(
      `select id, institution_id, title, slug, status, is_default, created_at
       from institution_strategies
       order by created_at desc`
    );
    const usersRes = await query(
      'select id, email, display_name, status, created_at from platform_users order by created_at desc'
    );
    const membershipsRes = await query(
      `select m.id, m.user_id, m.institution_id, m.role, m.status, m.created_at,
              i.name as institution_name, i.slug as institution_slug
       from institution_memberships m
       join institutions i on i.id = m.institution_id
       order by m.created_at desc`
    );
    const invitesRes = await query(
      `select inv.id, inv.institution_id, inv.email, inv.role, inv.expires_at, inv.used_at, inv.revoked_at, inv.created_at,
              i.name as institution_name, i.slug as institution_slug
       from institution_invites inv
       join institutions i on i.id = inv.institution_id
       order by inv.created_at desc
       limit 300`
    );
    const accessRequestsRes = await query(
      `select ar.id,
              ar.request_code,
              ar.institution_id,
              coalesce(i.name, ar.institution_name) as institution_name,
              coalesce(i.slug, '') as institution_slug,
              ar.full_name,
              ar.work_email,
              ar.phone,
              ar.notes,
              ar.status,
              ar.reviewed_at,
              ar.reviewed_by_scope,
              ar.reviewed_by_id,
              ar.created_at
       from access_requests ar
       left join institutions i on i.id = ar.institution_id
       order by ar.created_at desc
       limit 500`
    );

    const membershipsByUser = membershipsRes.rows.reduce((acc, row) => {
      if (!acc[row.user_id]) acc[row.user_id] = [];
      acc[row.user_id].push({
        id: row.id,
        institutionId: row.institution_id,
        institutionName: row.institution_name,
        institutionSlug: row.institution_slug,
        role: row.role,
        status: row.status,
        createdAt: row.created_at
      });
      return acc;
    }, {});

    const pendingInvites = invitesRes.rows
      .filter((row) => !row.used_at && !row.revoked_at && new Date(row.expires_at).getTime() > Date.now())
      .map((row) => ({
        id: row.id,
        institutionId: row.institution_id,
        institutionName: row.institution_name,
        institutionSlug: row.institution_slug,
        email: row.email,
        role: row.role,
        expiresAt: row.expires_at,
        createdAt: row.created_at
      }));
    const strategiesByInstitution = strategiesRes.rows.reduce((acc, row) => {
      if (!acc[row.institution_id]) acc[row.institution_id] = [];
      acc[row.institution_id].push({
        id: row.id,
        institutionId: row.institution_id,
        title: row.title,
        slug: row.slug,
        status: row.status,
        isDefault: Boolean(row.is_default),
        createdAt: row.created_at
      });
      return acc;
    }, {});

    const monitoringSnapshot = trafficMonitor
      ? trafficMonitor.getSnapshot()
      : {
          startedAt: null,
          requestTotal: 0,
          requestsByCategory: [],
          requestsByStatusBucket: [],
          topPaths: [],
          rateLimit: { blockedTotal: 0, byLimiter: [], recent: [] },
          embedViews: { totalViews: 0, institutions: [] }
        };
    const embedViewBySlug = new Map(
      (monitoringSnapshot.embedViews?.institutions || []).map((item) => [item.institutionSlug, item])
    );
    const embedViewsByInstitution = institutionsRes.rows
      .map((institution) => {
        const stats = embedViewBySlug.get(institution.slug);
        return {
          institutionId: institution.id,
          institutionName: institution.name,
          institutionSlug: institution.slug,
          views: Number(stats?.views || 0),
          lastViewedAt: stats?.lastViewedAt || null
        };
      })
      .sort((left, right) => right.views - left.views);
    const [contentSettings, parentGuidelines, guidelineLinks] = await Promise.all([
      loadContentSettings(query),
      loadParentGuidelineCatalog(),
      loadGuidelineLinksOverview()
    ]);

    res.json({
      institutions: institutionsRes.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        createdAt: row.created_at,
        strategies: strategiesByInstitution[row.id] || []
      })),
      users: usersRes.rows.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        status: row.status,
        createdAt: row.created_at,
        memberships: membershipsByUser[row.id] || []
      })),
      pendingInvites,
      accessRequests: accessRequestsRes.rows.map((row) => ({
        id: row.id,
        requestCode: row.request_code,
        institutionId: row.institution_id,
        institutionName: row.institution_name,
        institutionSlug: row.institution_slug || '',
        fullName: row.full_name,
        workEmail: row.work_email,
        phone: row.phone,
        notes: row.notes || '',
        status: row.status,
        reviewedAt: row.reviewed_at,
        reviewedByScope: row.reviewed_by_scope,
        reviewedById: row.reviewed_by_id,
        createdAt: row.created_at
      })),
      guidelineLinks: {
        parentGuidelines,
        links: guidelineLinks
      },
      contentSettings,
      monitoring: {
        ...monitoringSnapshot,
        rateLimitConfig: rateLimitConfig || null,
        embedViewsByInstitution
      }
    });
  });

  app.put('/api/v1/meta-admin/content-settings', requireMetaAdminSession, async (req, res) => {
    const patch = normalizeContentSettingsPatch(req.body || {});
    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'at least one content setting field required' });
    }

    const contentSettings = await updateContentSettings(query, patch);

    await logAuditEvent({
      query,
      uuid,
      action: 'meta_admin.content_settings.updated',
      entityType: 'platform_settings',
      payload: metaAuditPayload(req, { fields: Object.keys(patch) })
    });

    res.json({ ok: true, contentSettings });
  });

  app.post('/api/v1/meta-admin/guideline-links', requireMetaAdminSession, async (req, res) => {
    const sourceGuidelineIdRaw = String(req.body?.sourceGuidelineId || '').trim();
    const targetGuidelineIdRaw = String(req.body?.targetGuidelineId || '').trim();
    if (!sourceGuidelineIdRaw || !targetGuidelineIdRaw) {
      return res.status(400).json({ error: 'sourceGuidelineId and targetGuidelineId required' });
    }
    if (sourceGuidelineIdRaw === targetGuidelineIdRaw) {
      return res.status(400).json({ error: 'source and target must differ' });
    }

    const guidelineContextRes = await query(
      `select g.id,
              g.title,
              g.relation_type,
              c.id as cycle_id,
              c.institution_id,
              c.strategy_id
       from strategy_guidelines g
       join strategy_cycles c on c.id = g.cycle_id
       where g.id = any($1::uuid[])`,
      [[sourceGuidelineIdRaw, targetGuidelineIdRaw]]
    );
    if (guidelineContextRes.rowCount !== 2) {
      return res.status(404).json({ error: 'guideline not found' });
    }

    const byId = Object.fromEntries(guidelineContextRes.rows.map((row) => [row.id, row]));
    const source = byId[sourceGuidelineIdRaw];
    const target = byId[targetGuidelineIdRaw];
    if (!source || !target) return res.status(404).json({ error: 'guideline not found' });
    if (source.relation_type !== 'parent' || target.relation_type !== 'parent') {
      return res.status(400).json({ error: 'parent guideline required' });
    }

    const [firstId, secondId] = sourceGuidelineIdRaw < targetGuidelineIdRaw
      ? [sourceGuidelineIdRaw, targetGuidelineIdRaw]
      : [targetGuidelineIdRaw, sourceGuidelineIdRaw];

    const linkId = uuid();
    const insertRes = await query(
      `insert into strategy_guideline_links (id, source_guideline_id, target_guideline_id, created_by)
       values ($1, $2, $3, null)
       on conflict (source_guideline_id, target_guideline_id) do nothing
       returning id, created_at`,
      [linkId, firstId, secondId]
    );

    const existingRes = insertRes.rowCount
      ? insertRes
      : await query(
        `select id, created_at
         from strategy_guideline_links
         where source_guideline_id = $1 and target_guideline_id = $2
         limit 1`,
        [firstId, secondId]
      );
    const saved = existingRes.rows[0];
    if (!saved) return res.status(500).json({ error: 'failed to create guideline link' });

    await logAuditEvent({
      query,
      uuid,
      institutionId: source.institution_id,
      action: 'meta_admin.guideline_link.upserted',
      entityType: 'strategy_guideline_link',
      entityId: saved.id,
      payload: metaAuditPayload(req, {
        sourceGuidelineId: firstId,
        targetGuidelineId: secondId,
        sourceInstitutionId: source.institution_id,
        targetInstitutionId: target.institution_id
      })
    });

    res.status(insertRes.rowCount ? 201 : 200).json({
      ok: true,
      existedBefore: insertRes.rowCount === 0,
      linkId: saved.id,
      createdAt: saved.created_at
    });
  });

  app.delete('/api/v1/meta-admin/guideline-links/:linkId', requireMetaAdminSession, async (req, res) => {
    const linkId = String(req.params.linkId || '').trim();
    if (!linkId) return res.status(400).json({ error: 'linkId required' });

    const deletedRes = await query(
      `delete from strategy_guideline_links
       where id = $1
       returning id`,
      [linkId]
    );
    if (!deletedRes.rowCount) return res.status(404).json({ error: 'guideline link not found' });

    await logAuditEvent({
      query,
      uuid,
      action: 'meta_admin.guideline_link.deleted',
      entityType: 'strategy_guideline_link',
      entityId: linkId,
      payload: metaAuditPayload(req, { linkId })
    });

    res.json({ ok: true, linkId });
  });

  app.post('/api/v1/meta-admin/institutions', requireMetaAdminSession, async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const slugInput = String(req.body?.slug || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });

    const slug = slugify(slugInput || name);
    if (!slug) return res.status(400).json({ error: 'invalid slug' });

    const existing = await query('select id from institutions where slug = $1', [slug]);
    if (existing.rowCount > 0) return res.status(409).json({ error: 'slug already exists' });

    const created = await createInstitutionWithDefaultCycle(name, slug);

    await logAuditEvent({
      query,
      uuid,
      institutionId: created.institutionId,
      action: 'meta_admin.institution.created',
      entityType: 'institution',
      entityId: created.institutionId,
      payload: metaAuditPayload(req, { slug })
    });

    res.status(201).json(created);
  });

  app.post('/api/v1/meta-admin/institutions/:institutionId/invites', requireMetaAdminSession, async (req, res) => {
    const institutionId = String(req.params.institutionId || '').trim();
    const email = normalizeEmail(req.body?.email);
    const role = String(req.body?.role || 'member').trim();
    if (!institutionId || !email) return res.status(400).json({ error: 'institutionId and email required' });
    if (!['institution_admin', 'member'].includes(role)) return res.status(400).json({ error: 'invalid role' });

    const exists = await query('select id from institutions where id = $1', [institutionId]);
    if (exists.rowCount === 0) return res.status(404).json({ error: 'institution not found' });

    const invite = await createInviteForInstitution(req, institutionId, email, role);

    await logAuditEvent({
      query,
      uuid,
      institutionId,
      action: 'meta_admin.invite.created',
      entityType: 'institution_invite',
      entityId: invite.inviteId,
      payload: metaAuditPayload(req, { email, role })
    });

    res.status(201).json(invite);
  });

  app.put('/api/v1/meta-admin/institutions/:institutionId', requireMetaAdminSession, async (req, res) => {
    const institutionId = String(req.params.institutionId || '').trim();
    const name = String(req.body?.name || '').trim();
    if (!institutionId || !name) {
      return res.status(400).json({ error: 'institutionId and name required' });
    }

    const result = await query(
      `update institutions
       set name = $1
       where id = $2`,
      [name, institutionId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'institution not found' });

    await logAuditEvent({
      query,
      uuid,
      institutionId,
      action: 'meta_admin.institution.updated',
      entityType: 'institution',
      entityId: institutionId,
      payload: metaAuditPayload(req, { name })
    });

    res.json({ ok: true, institutionId, name });
  });

  app.put('/api/v1/meta-admin/strategies/:strategyId', requireMetaAdminSession, async (req, res) => {
    const strategyId = String(req.params.strategyId || '').trim();
    const title = String(req.body?.title || '').trim();
    if (!strategyId || !title) {
      return res.status(400).json({ error: 'strategyId and title required' });
    }

    const result = await query(
      `update institution_strategies
       set title = $1
       where id = $2
       returning id, institution_id, title, slug, status, is_default, created_at`,
      [title, strategyId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'strategy not found' });
    const updated = result.rows[0];

    await logAuditEvent({
      query,
      uuid,
      institutionId: updated.institution_id,
      action: 'meta_admin.strategy.updated',
      entityType: 'institution_strategy',
      entityId: strategyId,
      payload: metaAuditPayload(req, { title })
    });

    res.json({
      ok: true,
      strategy: {
        id: updated.id,
        institutionId: updated.institution_id,
        title: updated.title,
        slug: updated.slug,
        status: updated.status,
        isDefault: Boolean(updated.is_default),
        createdAt: updated.created_at
      }
    });
  });

  app.put('/api/v1/meta-admin/access-requests/:requestId/status', requireMetaAdminSession, async (req, res) => {
    const requestId = String(req.params.requestId || '').trim();
    const status = String(req.body?.status || '').trim();
    if (!requestId || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'requestId and valid status required' });
    }

    const result = await query(
      `update access_requests
       set status = $1,
           reviewed_at = case when $1 = 'pending' then null else now() end,
           reviewed_by_scope = case when $1 = 'pending' then null else 'meta_admin' end,
           reviewed_by_id = case when $1 = 'pending' then null else $2 end
       where id = $3
       returning id, institution_id, request_code, status, reviewed_at, reviewed_by_scope, reviewed_by_id, created_at`,
      [status, req.metaAdmin?.scope || 'meta_admin', requestId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'access request not found' });
    const updated = result.rows[0];

    await logAuditEvent({
      query,
      uuid,
      institutionId: updated.institution_id || null,
      action: 'meta_admin.access_request.status_updated',
      entityType: 'access_request',
      entityId: updated.id,
      payload: metaAuditPayload(req, {
        requestCode: updated.request_code,
        status: updated.status
      })
    });

    res.json({
      ok: true,
      accessRequest: {
        id: updated.id,
        requestCode: updated.request_code,
        status: updated.status,
        reviewedAt: updated.reviewed_at,
        reviewedByScope: updated.reviewed_by_scope,
        reviewedById: updated.reviewed_by_id,
        createdAt: updated.created_at
      }
    });
  });

  app.put('/api/v1/meta-admin/users/:userId/status', requireMetaAdminSession, async (req, res) => {
    const userId = String(req.params.userId || '').trim();
    const status = String(req.body?.status || '').trim();
    if (!userId || !['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'userId and valid status required' });
    }

    const result = await query(
      'update platform_users set status = $1 where id = $2',
      [status, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'user not found' });

    await logAuditEvent({
      query,
      uuid,
      action: 'meta_admin.user.status_updated',
      entityType: 'platform_user',
      entityId: userId,
      payload: metaAuditPayload(req, { status })
    });

    res.json({ ok: true, status });
  });

  app.post('/api/v1/meta-admin/users/:userId/memberships', requireMetaAdminSession, async (req, res) => {
    const userId = String(req.params.userId || '').trim();
    const institutionId = String(req.body?.institutionId || '').trim();
    const role = String(req.body?.role || '').trim();
    if (!userId || !institutionId || !['institution_admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'userId, institutionId and role required' });
    }

    const userRes = await query(
      'select id, status from platform_users where id = $1',
      [userId]
    );
    if (!userRes.rowCount) return res.status(404).json({ error: 'user not found' });
    if (String(userRes.rows[0].status || '').trim() === 'archived') {
      return res.status(409).json({ error: 'user archived' });
    }

    const institutionRes = await query(
      'select id from institutions where id = $1',
      [institutionId]
    );
    if (!institutionRes.rowCount) return res.status(404).json({ error: 'institution not found' });

    const existsRes = await query(
      `select id
       from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [institutionId, userId]
    );
    const existedBefore = existsRes.rowCount > 0;

    const membershipRes = await query(
      `insert into institution_memberships (id, institution_id, user_id, role, status)
       values ($1, $2, $3, $4, 'active')
       on conflict (institution_id, user_id)
       do update set role = excluded.role, status = 'active'
       returning id, institution_id, user_id, role, status, created_at`,
      [uuid(), institutionId, userId, role]
    );

    const membership = membershipRes.rows[0];

    await logAuditEvent({
      query,
      uuid,
      institutionId,
      action: 'meta_admin.membership.upserted',
      entityType: 'institution_membership',
      entityId: membership?.id || null,
      payload: metaAuditPayload(req, {
        userId,
        institutionId,
        role,
        existedBefore
      })
    });

    res.status(existedBefore ? 200 : 201).json({
      ok: true,
      existedBefore,
      membership: {
        id: membership.id,
        institutionId: membership.institution_id,
        userId: membership.user_id,
        role: membership.role,
        status: membership.status,
        createdAt: membership.created_at
      }
    });
  });

  app.post('/api/v1/meta-admin/users/:userId/archive', requireMetaAdminSession, async (req, res) => {
    const userId = String(req.params.userId || '').trim();
    const action = String(req.body?.action || 'keep').trim();
    if (!userId || !['keep', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'userId and valid archive action required' });
    }

    const userRes = await query(
      'select id, email, display_name, status from platform_users where id = $1',
      [userId]
    );
    if (!userRes.rowCount) return res.status(404).json({ error: 'user not found' });

    const deleted = {
      guidelines: 0,
      initiatives: 0,
      guidelineComments: 0,
      initiativeComments: 0,
      guidelineVotes: 0,
      initiativeVotes: 0
    };

    if (action === 'delete') {
      const guidelineCommentsRes = await query(
        'delete from strategy_comments where author_id = $1',
        [userId]
      );
      deleted.guidelineComments = Number(guidelineCommentsRes.rowCount || 0);

      const initiativeCommentsRes = await query(
        'delete from strategy_initiative_comments where author_id = $1',
        [userId]
      );
      deleted.initiativeComments = Number(initiativeCommentsRes.rowCount || 0);

      const guidelineVotesRes = await query(
        'delete from strategy_votes where voter_id = $1',
        [userId]
      );
      deleted.guidelineVotes = Number(guidelineVotesRes.rowCount || 0);

      const initiativeVotesRes = await query(
        'delete from strategy_initiative_votes where voter_id = $1',
        [userId]
      );
      deleted.initiativeVotes = Number(initiativeVotesRes.rowCount || 0);

      const initiativesRes = await query(
        'delete from strategy_initiatives where created_by = $1',
        [userId]
      );
      deleted.initiatives = Number(initiativesRes.rowCount || 0);

      const guidelinesRes = await query(
        'delete from strategy_guidelines where created_by = $1',
        [userId]
      );
      deleted.guidelines = Number(guidelinesRes.rowCount || 0);

      await query(
        `update strategy_guidelines
         set relation_type = 'orphan',
             updated_at = now()
         where relation_type = 'child'
           and parent_guideline_id is null`
      );
    }

    const membershipsRes = await query(
      `update institution_memberships
       set status = 'blocked'
       where user_id = $1
         and status <> 'blocked'`,
      [userId]
    );

    await query(
      `update platform_users
       set status = 'archived'
       where id = $1`,
      [userId]
    );

    await logAuditEvent({
      query,
      uuid,
      action: 'meta_admin.user.archived',
      entityType: 'platform_user',
      entityId: userId,
      payload: metaAuditPayload(req, {
        archiveAction: action,
        membershipsBlocked: Number(membershipsRes.rowCount || 0),
        deleted
      })
    });

    res.json({
      ok: true,
      user: {
        id: userRes.rows[0].id,
        email: userRes.rows[0].email,
        displayName: userRes.rows[0].display_name,
        previousStatus: userRes.rows[0].status,
        status: 'archived'
      },
      action,
      membershipsBlocked: Number(membershipsRes.rowCount || 0),
      deleted
    });
  });

  app.post('/api/v1/meta-admin/users/:userId/password-reset-link', requireMetaAdminSession, async (req, res) => {
    const userId = String(req.params.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const userRes = await query(
      'select id, email, display_name, status from platform_users where id = $1',
      [userId]
    );
    if (!userRes.rowCount) return res.status(404).json({ error: 'user not found' });

    await ensurePasswordResetTable(query);
    const reset = await createPasswordResetToken({
      query,
      uuid,
      userId,
      ttlMinutes: PASSWORD_RESET_TTL_MINUTES,
      createdByScope: 'meta_admin',
      createdById: req.metaAdmin?.scope || 'meta_admin'
    });
    const resetUrl = buildPasswordResetUrl(req, reset.token);

    await logAuditEvent({
      query,
      uuid,
      action: 'meta_admin.user.password_reset_link_created',
      entityType: 'platform_user',
      entityId: userId,
      payload: metaAuditPayload(req, {
        resetTokenId: reset.tokenId,
        expiresAt: reset.expiresAt
      })
    });

    res.status(201).json({
      ok: true,
      user: {
        id: userRes.rows[0].id,
        email: userRes.rows[0].email,
        displayName: userRes.rows[0].display_name,
        status: userRes.rows[0].status
      },
      resetUrl,
      expiresAt: reset.expiresAt
    });
  });

  app.put('/api/v1/meta-admin/memberships/:membershipId/status', requireMetaAdminSession, async (req, res) => {
    const membershipId = String(req.params.membershipId || '').trim();
    const status = String(req.body?.status || '').trim();
    if (!membershipId || !['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'membershipId and valid status required' });
    }

    const membershipResult = await query(
      'update institution_memberships set status = $1 where id = $2 returning institution_id',
      [status, membershipId]
    );
    if (membershipResult.rowCount === 0) return res.status(404).json({ error: 'membership not found' });

    await logAuditEvent({
      query,
      uuid,
      institutionId: membershipResult.rows[0].institution_id,
      action: 'meta_admin.membership.status_updated',
      entityType: 'institution_membership',
      entityId: membershipId,
      payload: metaAuditPayload(req, { status })
    });

    res.json({ ok: true, status });
  });

  if (ENABLE_LEGACY_SUPERADMIN) {
    app.post('/api/v1/superadmin/institutions', requireSuperAdmin, async (req, res) => {
      const name = String(req.body?.name || '').trim();
      const slugInput = String(req.body?.slug || '').trim();
      if (!name) return res.status(400).json({ error: 'name required' });

      const slug = slugify(slugInput || name);
      if (!slug) return res.status(400).json({ error: 'invalid slug' });

      const existing = await query('select id from institutions where slug = $1', [slug]);
      if (existing.rowCount > 0) return res.status(409).json({ error: 'slug already exists' });

      const created = await createInstitutionWithDefaultCycle(name, slug);

      await logAuditEvent({
        query,
        uuid,
        institutionId: created.institutionId,
        action: 'legacy_superadmin.institution.created',
        entityType: 'institution',
        entityId: created.institutionId,
        payload: {
          actorScope: 'legacy_superadmin_header',
          slug,
          ip: resolveClientIp(req),
          userAgent: String(req.headers['user-agent'] || '')
        }
      });

      res.status(201).json(created);
    });

    app.post('/api/v1/superadmin/institutions/:institutionId/invites', requireSuperAdmin, async (req, res) => {
      const institutionId = String(req.params.institutionId || '').trim();
      const email = normalizeEmail(req.body?.email);
      const role = String(req.body?.role || 'institution_admin').trim();
      if (!institutionId || !email) return res.status(400).json({ error: 'institutionId and email required' });
      if (!['institution_admin', 'member'].includes(role)) return res.status(400).json({ error: 'invalid role' });

      const exists = await query('select id from institutions where id = $1', [institutionId]);
      if (exists.rowCount === 0) return res.status(404).json({ error: 'institution not found' });

      const invite = await createInviteForInstitution(req, institutionId, email, role);

      await logAuditEvent({
        query,
        uuid,
        institutionId,
        action: 'legacy_superadmin.invite.created',
        entityType: 'institution_invite',
        entityId: invite.inviteId,
        payload: {
          actorScope: 'legacy_superadmin_header',
          email,
          role,
          ip: resolveClientIp(req),
          userAgent: String(req.headers['user-agent'] || '')
        }
      });

      res.status(201).json(invite);
    });
  }
}

module.exports = { registerMetaAdminRoutes };

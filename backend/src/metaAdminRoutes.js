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
    const base = PASSWORD_RESET_BASE_URL
      ? PASSWORD_RESET_BASE_URL.replace(/\/+$/, '')
      : `${String(req.protocol || 'https')}://${String(req.get('host') || '').trim()}`;
    return `${base}/reset-password.html?token=${safeToken}`;
  }

  async function createInstitutionWithDefaultCycle(name, slug) {
    const institutionId = uuid();
    const cycleId = uuid();

    await query(
      `insert into institutions (id, name, slug, status)
       values ($1, $2, $3, 'active')`,
      [institutionId, name, slug]
    );

    await query(
      `insert into strategy_cycles (id, institution_id, title, state, results_published, starts_at)
       values ($1, $2, $3, 'open', false, now())`,
      [cycleId, institutionId, `${name} strategijos ciklas`]
    );

    return { institutionId, cycleId, slug };
  }

  async function createInviteForInstitution(institutionId, email, role) {
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(inviteToken);
    const inviteId = uuid();

    await query(
      `insert into institution_invites (id, institution_id, email, role, token_hash, expires_at)
       values ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval)`,
      [inviteId, institutionId, email, role, tokenHash, String(inviteTtlHours)]
    );

    return { inviteId, inviteToken, email, role };
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
    const contentSettings = await loadContentSettings(query);

    res.json({
      institutions: institutionsRes.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        createdAt: row.created_at
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
      return res.status(400).json({ error: 'guideIntroText or aboutText required' });
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

    const invite = await createInviteForInstitution(institutionId, email, role);

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

      const invite = await createInviteForInstitution(institutionId, email, role);

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

const crypto = require('crypto');
const multer = require('multer');
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
const { pool } = require('./db');
const {
  extractPdfTexts,
  getAiStrategyConfig,
  generateStrategyFromAi
} = require('./aiStrategyService');
const {
  resolveInstitutionAiSettings,
  resolveInstitutionModelOverride
} = require('./services/aiProviderService');
const {
  refreshStrategyCatalogClassifications,
  loadStrategyCatalogClassificationSummary
} = require('./services/strategyCatalogService');

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
  const AI_STRATEGY_TIMEOUT_MS = Math.max(15000, Number(process.env.AI_STRATEGY_TIMEOUT_MS || 120000));
  const AI_STRATEGY_MAX_FILES = Math.min(8, Math.max(1, Number(process.env.AI_STRATEGY_MAX_FILES || 4)));
  const AI_STRATEGY_MAX_FILE_MB = Math.min(20, Math.max(1, Number(process.env.AI_STRATEGY_MAX_FILE_MB || 20)));
  const AI_STRATEGY_MAX_COMBINED_TEXT_CHARS = Math.max(
    30000,
    Number(process.env.AI_STRATEGY_MAX_COMBINED_TEXT_CHARS || 120000)
  );
  const STRATEGY_MAX_PER_INSTITUTION = Math.max(
    1,
    Number(process.env.STRATEGY_MAX_PER_INSTITUTION || 5)
  );
  const META_ADMIN_STRATEGY_CREATE_RATE_LIMIT_WINDOW_MS = Number(
    process.env.META_ADMIN_STRATEGY_CREATE_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000
  );
  const META_ADMIN_STRATEGY_CREATE_RATE_LIMIT_MAX = Number(
    process.env.META_ADMIN_STRATEGY_CREATE_RATE_LIMIT_MAX || 5
  );

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

  async function loadInstitutionAiConfig(institutionId) {
    const settings = await resolveInstitutionAiSettings(query, institutionId);
    return getAiStrategyConfig({
      provider: settings.provider,
      modelOverride: resolveInstitutionModelOverride(settings, settings.provider)
    });
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

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
  }

  const aiStrategyUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      files: AI_STRATEGY_MAX_FILES,
      fileSize: AI_STRATEGY_MAX_FILE_MB * 1024 * 1024
    },
    fileFilter: (_req, file, done) => {
      const name = String(file?.originalname || '').toLowerCase();
      const mime = String(file?.mimetype || '').toLowerCase();
      const isPdf = name.endsWith('.pdf') || mime.includes('pdf');
      if (!isPdf) {
        return done(new Error('only pdf files allowed'));
      }
      return done(null, true);
    }
  });

  const metaAdminStrategyCreateRateLimit = createRateLimiter({
    windowMs: META_ADMIN_STRATEGY_CREATE_RATE_LIMIT_WINDOW_MS,
    max: META_ADMIN_STRATEGY_CREATE_RATE_LIMIT_MAX,
    keyPrefix: 'meta-admin-strategy-create',
    keyFn: (req) => `${resolveClientIp(req)}:${req.metaAdmin?.sub || 'unknown'}`,
    onBlocked: ({ req, retryAfter }) => {
      if (!trafficMonitor) return;
      trafficMonitor.trackRateLimitBlocked({
        limiter: 'meta-admin-strategy-create',
        ip: resolveClientIp(req),
        path: req.path || req.originalUrl || '',
        retryAfterSeconds: retryAfter
      });
    }
  });

  function aiStrategyUploadMiddleware(req, res, next) {
    aiStrategyUpload.array('documents', AI_STRATEGY_MAX_FILES)(req, res, (error) => {
      if (!error) return next();
      if (error?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'pdf file too large' });
      }
      if (error?.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'too many pdf files' });
      }
      return res.status(400).json({ error: error?.message || 'documents upload failed' });
    });
  }

  async function ensureUniqueInstitutionSlug(client, baseSlug) {
    let slug = String(baseSlug || '').trim();
    if (!slug) slug = `institution-${Date.now()}`;
    let attempt = slug;
    let suffix = 2;
    while (true) {
      const exists = await client.query(
        'select id from institutions where slug = $1 limit 1',
        [attempt]
      );
      if (!exists.rowCount) return attempt;
      attempt = `${slug}-${suffix}`;
      suffix += 1;
    }
  }

  async function ensureUniqueStrategySlug(client, institutionId, baseSlug) {
    let slug = String(baseSlug || '').trim();
    if (!slug) slug = `strategy-${Date.now()}`;
    let attempt = slug;
    let suffix = 2;
    while (true) {
      const exists = await client.query(
        `select id
         from institution_strategies
         where institution_id = $1 and slug = $2
         limit 1`,
        [institutionId, attempt]
      );
      if (!exists.rowCount) return attempt;
      attempt = `${slug}-${suffix}`;
      suffix += 1;
    }
  }

  function normalizeLocaleHint(value) {
    return String(value || '').trim().toLowerCase() === 'en' ? 'en' : 'lt';
  }

  function normalizeLayoutLabel(value) {
    return String(value || '').trim().toLowerCase();
  }

  function layoutCollision(occupied, x, y, minDistanceX, minDistanceY) {
    return occupied.some((point) => (
      Math.abs(point.x - x) < minDistanceX && Math.abs(point.y - y) < minDistanceY
    ));
  }

  function reserveLayoutPosition(occupied, desiredX, desiredY, options = {}) {
    const x = Math.round(Number(desiredX) || 0);
    let y = Math.round(Number(desiredY) || 0);
    const minDistanceX = Math.max(60, Number(options.minDistanceX || 180));
    const minDistanceY = Math.max(60, Number(options.minDistanceY || 120));
    const nudgeY = Math.max(24, Number(options.nudgeY || 130));
    const maxAttempts = Math.max(8, Number(options.maxAttempts || 120));

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (!layoutCollision(occupied, x, y, minDistanceX, minDistanceY)) {
        occupied.push({ x, y });
        return { x, y };
      }
      y += nudgeY;
    }

    occupied.push({ x, y });
    return { x, y };
  }

  function buildAiMapLayout({ guidelineRecords, initiativeRecords }) {
    const institutionX = 1520;
    const institutionY = 860;
    const guidelines = Array.isArray(guidelineRecords) ? guidelineRecords : [];
    const initiatives = Array.isArray(initiativeRecords) ? initiativeRecords : [];

    const guidelineById = new Map(guidelines.map((item) => [item.id, item]));
    const childrenByParent = new Map();
    guidelines.forEach((item) => {
      const parentId = String(item.parentGuidelineId || '').trim();
      if (!parentId || !guidelineById.has(parentId) || parentId === item.id) return;
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(item);
    });

    const occupiedGuidelinePoints = [];
    const guidelinePositions = new Map();
    const visited = new Set();

    const countSubtree = (nodeId, chain = new Set()) => {
      if (!nodeId || chain.has(nodeId)) return 1;
      const nextChain = new Set(chain);
      nextChain.add(nodeId);
      const children = childrenByParent.get(nodeId) || [];
      let total = 1;
      children.forEach((child) => {
        total += countSubtree(child.id, nextChain);
      });
      return total;
    };

    const rootCandidates = guidelines.filter((item) => {
      const parentId = String(item.parentGuidelineId || '').trim();
      return !parentId || !guidelineById.has(parentId) || parentId === item.id;
    });

    const rootPriority = (item) => {
      const relation = String(item.relationType || '').trim().toLowerCase();
      if (relation === 'parent') return 0;
      if (relation === 'orphan') return 1;
      return 2;
    };

    const roots = rootCandidates
      .slice()
      .sort((left, right) => {
        const byWeight = countSubtree(right.id) - countSubtree(left.id);
        if (byWeight !== 0) return byWeight;
        const byType = rootPriority(left) - rootPriority(right);
        if (byType !== 0) return byType;
        return String(left.title || '').localeCompare(String(right.title || ''), 'lt');
      });

    const leftRoots = [];
    const rightRoots = [];
    roots.forEach((root, index) => {
      if (index % 2 === 0) leftRoots.push(root);
      else rightRoots.push(root);
    });

    const placeGuidelineTree = (node, side, depth, preferredY) => {
      if (!node || visited.has(node.id)) return;
      visited.add(node.id);

      const direction = side === 'left' ? -1 : 1;
      const baseX = institutionX + (430 * direction) + (depth * 285 * direction);
      const point = reserveLayoutPosition(
        occupiedGuidelinePoints,
        baseX,
        preferredY,
        { minDistanceX: 170, minDistanceY: 126, nudgeY: 136 }
      );

      guidelinePositions.set(node.id, {
        id: node.id,
        x: point.x,
        y: point.y,
        lineSide: 'auto'
      });

      const children = (childrenByParent.get(node.id) || [])
        .slice()
        .sort((left, right) => String(left.title || '').localeCompare(String(right.title || ''), 'lt'));
      if (!children.length) return;

      const childGap = 176;
      const childStartY = point.y - ((children.length - 1) * childGap) / 2;
      children.forEach((child, index) => {
        placeGuidelineTree(child, side, depth + 1, childStartY + index * childGap);
      });
    };

    const placeRootColumn = (columnRoots, side) => {
      if (!columnRoots.length) return;
      const rootGap = 232;
      const startY = institutionY - ((columnRoots.length - 1) * rootGap) / 2;
      columnRoots.forEach((root, index) => {
        placeGuidelineTree(root, side, 0, startY + index * rootGap);
      });
    };

    placeRootColumn(leftRoots, 'left');
    placeRootColumn(rightRoots, 'right');

    let fallbackSide = 'left';
    guidelines.forEach((item) => {
      if (visited.has(item.id)) return;
      placeGuidelineTree(item, fallbackSide, 0, institutionY);
      fallbackSide = fallbackSide === 'left' ? 'right' : 'left';
    });

    const occupiedInitiativePoints = [];
    const initiativePositions = new Map();

    const initiativesByAnchor = new Map();
    initiatives.forEach((initiative) => {
      const guidelineIds = Array.isArray(initiative.guidelineIds) ? initiative.guidelineIds : [];
      const anchorId = guidelineIds.find((guidelineId) => guidelinePositions.has(guidelineId)) || '__none__';
      if (!initiativesByAnchor.has(anchorId)) initiativesByAnchor.set(anchorId, []);
      initiativesByAnchor.get(anchorId).push(initiative);
    });

    Array.from(initiativesByAnchor.entries()).forEach(([anchorId, bucket], groupIndex) => {
      const sortedBucket = bucket
        .slice()
        .sort((left, right) => String(left.title || '').localeCompare(String(right.title || ''), 'lt'));

      let anchorX = institutionX;
      let anchorY = institutionY + 320;
      let side = groupIndex % 2 === 0 ? 'left' : 'right';

      const anchorPosition = guidelinePositions.get(anchorId);
      if (anchorPosition) {
        anchorX = anchorPosition.x;
        anchorY = anchorPosition.y;
        side = anchorPosition.x < institutionX ? 'left' : 'right';
      }

      const direction = side === 'left' ? -1 : 1;
      const baseX = anchorX + (330 * direction);
      const rowGap = 144;
      const startY = anchorY - ((sortedBucket.length - 1) * rowGap) / 2;

      sortedBucket.forEach((initiative, index) => {
        const point = reserveLayoutPosition(
          occupiedInitiativePoints,
          baseX,
          startY + index * rowGap,
          { minDistanceX: 188, minDistanceY: 120, nudgeY: 128 }
        );
        initiativePositions.set(initiative.id, {
          id: initiative.id,
          x: point.x,
          y: point.y,
          lineSide: 'auto'
        });
      });
    });

    return {
      institutionX,
      institutionY,
      guidelines: Array.from(guidelinePositions.values()),
      initiatives: Array.from(initiativePositions.values())
    };
  }

  function mapAiGenerationError(error) {
    const message = String(error?.message || '').trim() || 'internal server error';
    if (
      message === 'pdf parsing failed'
      || message === 'pdf content too large'
      || message === 'only pdf files allowed'
      || message === 'pdf file too large'
      || message === 'too many pdf files'
      || message === 'documents upload failed'
    ) {
      return { status: 400, error: message };
    }
    if (
      message === 'ai response invalid'
      || message === 'ai response language mismatch'
      || message === 'generated guidelines missing'
      || message === 'generated initiatives missing'
    ) {
      return { status: 422, error: message };
    }
    if (message.startsWith('ai provider error:')) {
      return { status: 502, error: message };
    }
    return { status: 500, error: 'internal server error' };
  }

  async function countInstitutionStrategies(dbClient, institutionId) {
    const result = await dbClient.query(
      `select count(*)::int as total
       from institution_strategies
       where institution_id = $1`,
      [institutionId]
    );
    return Number(result.rows?.[0]?.total || 0);
  }

  async function ensureStrategyCapacity(dbClient, institutionId) {
    const total = await countInstitutionStrategies(dbClient, institutionId);
    if (total >= STRATEGY_MAX_PER_INSTITUTION) {
      const error = new Error('strategy limit reached');
      error.code = 'STRATEGY_LIMIT_REACHED';
      throw error;
    }
  }

  function mapGenerationRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      status: String(row.status || '').trim() || 'failed',
      errorMessage: row.error_message || null,
      createdAt: row.created_at || null,
      institution: row.institution_id ? {
        id: row.institution_id,
        name: row.institution_name,
        slug: row.institution_slug
      } : null,
      strategy: row.strategy_id ? {
        id: row.strategy_id,
        title: row.strategy_title,
        slug: row.strategy_slug,
        description: row.strategy_description || null,
        status: row.strategy_status || 'active'
      } : null,
      cycle: row.cycle_id ? {
        id: row.cycle_id,
        title: row.cycle_title,
        state: row.cycle_state
      } : null
    };
  }

  async function loadMetaAdminAiGenerationById(generationId) {
    const result = await query(
      `select g.id,
              g.institution_id,
              g.status,
              g.error_message,
              g.created_at,
              i.name as institution_name,
              i.slug as institution_slug,
              s.id as strategy_id,
              s.title as strategy_title,
              s.slug as strategy_slug,
              s.description as strategy_description,
              s.status as strategy_status,
              c.id as cycle_id,
              c.title as cycle_title,
              c.state as cycle_state
       from strategy_ai_generations g
       left join institutions i on i.id = g.institution_id
       left join institution_strategies s on s.id = g.strategy_id
       left join strategy_cycles c on c.id = g.cycle_id
       where g.id = $1
         and g.requested_by_scope = 'meta_admin'
       limit 1`,
      [generationId]
    );
    return result.rowCount ? mapGenerationRow(result.rows[0]) : null;
  }

  async function runMetaAdminAiGeneration({
    generationId,
    aiConfig,
    institutionIdInput,
    institutionNameInput,
    strategyTitleInput,
    strategySlugInput,
    strategyDescriptionInput,
    cycleTitleInput,
    clarification,
    localeHint,
    files,
    actorId,
    actorAudit
  }) {
    const inputFiles = Array.isArray(files) ? files : [];
    try {
      await query(
        `update strategy_ai_generations
         set status = 'processing',
             error_message = null
         where id = $1`,
        [generationId]
      );

      const docs = await extractPdfTexts(inputFiles, {
        maxCombinedChars: AI_STRATEGY_MAX_COMBINED_TEXT_CHARS
      });

      const generatedResult = await generateStrategyFromAi({
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        baseUrl: aiConfig.baseUrl,
        instruction: clarification,
        docs,
        localeHint,
        timeoutMs: aiConfig.timeoutMs || AI_STRATEGY_TIMEOUT_MS
      });

      const generated = generatedResult.normalized;
      const finalStrategyTitle = strategyTitleInput
        || generated.strategyTitle
        || `AI strategija ${new Date().toISOString().slice(0, 10)}`;
      const finalCycleTitle = cycleTitleInput
        || generated.cycleTitle
        || `${finalStrategyTitle} ciklas`;
      const strategyDescription = strategyDescriptionInput
        || generated.strategyDescription
        || clarification;

      await query(
        `update strategy_ai_generations
         set status = 'applying'
         where id = $1`,
        [generationId]
      );

      const transactionClient = await pool.connect();
      let institutionId = '';
      let institutionName = '';
      let institutionSlug = '';
      let strategyId = '';
      let strategySlug = '';
      let cycleId = '';
      try {
        await transactionClient.query('BEGIN');

        if (institutionIdInput) {
          const existingInstitution = await transactionClient.query(
            `select id, name, slug
             from institutions
             where id = $1
             for update`,
            [institutionIdInput]
          );
          if (!existingInstitution.rowCount) {
            throw new Error('institution not found');
          }
          institutionId = existingInstitution.rows[0].id;
          institutionName = existingInstitution.rows[0].name;
          institutionSlug = existingInstitution.rows[0].slug;
        } else {
          const baseInstitutionSlug = slugify(institutionNameInput);
          if (!baseInstitutionSlug) {
            throw new Error('invalid institution slug');
          }
          institutionId = uuid();
          institutionName = institutionNameInput;
          institutionSlug = await ensureUniqueInstitutionSlug(transactionClient, baseInstitutionSlug);
          await transactionClient.query(
            `insert into institutions (id, name, slug, status)
             values ($1, $2, $3, 'active')`,
            [institutionId, institutionName, institutionSlug]
          );
        }

        await ensureStrategyCapacity(transactionClient, institutionId);

        const baseStrategySlug = slugify(strategySlugInput || finalStrategyTitle);
        if (!baseStrategySlug) {
          throw new Error('invalid strategy slug');
        }

        strategySlug = await ensureUniqueStrategySlug(transactionClient, institutionId, baseStrategySlug);
        const defaultStrategyCheck = await transactionClient.query(
          `select id
           from institution_strategies
           where institution_id = $1 and is_default = true
           limit 1`,
          [institutionId]
        );
        const isDefault = defaultStrategyCheck.rowCount === 0;

        strategyId = uuid();
        await transactionClient.query(
          `insert into institution_strategies (id, institution_id, title, slug, description, status, is_default)
           values ($1, $2, $3, $4, $5, 'active', $6)`,
          [strategyId, institutionId, finalStrategyTitle, strategySlug, strategyDescription || null, isDefault]
        );

        cycleId = uuid();
        await transactionClient.query(
          `insert into strategy_cycles (
             id, institution_id, strategy_id, title, state, results_published, starts_at, mission_text, vision_text
           )
           values ($1, $2, $3, $4, 'open', false, now(), $5, $6)`,
          [cycleId, institutionId, strategyId, finalCycleTitle, generated.missionText || null, generated.visionText || null]
        );

        const guidelineIdByTitle = new Map();
        const guidelineRecords = [];
        const guidelineRecordById = new Map();
        const childGuidelines = [];
        for (const guideline of generated.guidelines) {
          const guidelineId = uuid();
          await transactionClient.query(
            `insert into strategy_guidelines (
               id, cycle_id, title, description, status, line_side, relation_type, parent_guideline_id, created_by
             )
             values ($1, $2, $3, $4, 'active', 'auto', $5, null, null)`,
            [
              guidelineId,
              cycleId,
              guideline.title,
              guideline.description || null,
              guideline.relationType
            ]
          );
          const guidelineTitleKey = normalizeLayoutLabel(guideline.title);
          guidelineIdByTitle.set(guidelineTitleKey, guidelineId);
          const guidelineRecord = {
            id: guidelineId,
            title: guideline.title,
            relationType: guideline.relationType,
            parentTitle: guideline.parentTitle || null,
            parentGuidelineId: null
          };
          guidelineRecords.push(guidelineRecord);
          guidelineRecordById.set(guidelineId, guidelineRecord);
          if (guideline.relationType === 'child' && guideline.parentTitle) {
            childGuidelines.push({
              id: guidelineId,
              parentTitle: guideline.parentTitle
            });
          }
        }

        for (const child of childGuidelines) {
          const parentId = guidelineIdByTitle.get(normalizeLayoutLabel(child.parentTitle));
          if (!parentId || parentId === child.id) {
            await transactionClient.query(
              `update strategy_guidelines
               set relation_type = 'orphan',
                   parent_guideline_id = null,
                   updated_at = now()
               where id = $1`,
              [child.id]
            );
            const childRecord = guidelineRecordById.get(child.id);
            if (childRecord) {
              childRecord.relationType = 'orphan';
              childRecord.parentGuidelineId = null;
            }
            continue;
          }
          await transactionClient.query(
            `update strategy_guidelines
             set parent_guideline_id = $1,
                 updated_at = now()
             where id = $2`,
            [parentId, child.id]
          );
          const childRecord = guidelineRecordById.get(child.id);
          if (childRecord) {
            childRecord.parentGuidelineId = parentId;
          }
        }

        const fallbackGuidelineId = Array.from(guidelineIdByTitle.values())[0];
        const initiativeRecords = [];
        for (const initiative of generated.initiatives) {
          const initiativeId = uuid();
          await transactionClient.query(
            `insert into strategy_initiatives (
               id, cycle_id, title, description, status, line_side, created_by
             )
             values ($1, $2, $3, $4, 'active', 'auto', null)`,
            [initiativeId, cycleId, initiative.title, initiative.description || null]
          );

          const uniqueGuidelineIds = new Set();
          const initiativeGuidelineTitles = Array.isArray(initiative.guidelineTitles)
            ? initiative.guidelineTitles
            : [];
          initiativeGuidelineTitles.forEach((title) => {
            const guidelineId = guidelineIdByTitle.get(normalizeLayoutLabel(title));
            if (guidelineId) uniqueGuidelineIds.add(guidelineId);
          });
          if (!uniqueGuidelineIds.size && fallbackGuidelineId) {
            uniqueGuidelineIds.add(fallbackGuidelineId);
          }
          const linkedGuidelineIds = Array.from(uniqueGuidelineIds);
          initiativeRecords.push({
            id: initiativeId,
            title: initiative.title,
            guidelineIds: linkedGuidelineIds
          });

          for (const guidelineId of linkedGuidelineIds) {
            await transactionClient.query(
              `insert into strategy_initiative_guidelines (id, initiative_id, guideline_id)
               values ($1, $2, $3)`,
              [uuid(), initiativeId, guidelineId]
            );
          }
        }

        const layout = buildAiMapLayout({
          guidelineRecords,
          initiativeRecords
        });

        await transactionClient.query(
          `update strategy_cycles
           set map_x = $1, map_y = $2
           where id = $3`,
          [layout.institutionX, layout.institutionY, cycleId]
        );

        for (const guidelineLayout of layout.guidelines) {
          await transactionClient.query(
            `update strategy_guidelines
             set map_x = $1,
                 map_y = $2,
                 line_side = $3,
                 updated_at = now()
             where id = $4 and cycle_id = $5`,
            [
              guidelineLayout.x,
              guidelineLayout.y,
              guidelineLayout.lineSide,
              guidelineLayout.id,
              cycleId
            ]
          );
        }

        for (const initiativeLayout of layout.initiatives) {
          await transactionClient.query(
            `update strategy_initiatives
             set map_x = $1,
                 map_y = $2,
                 line_side = $3,
                 updated_at = now()
             where id = $4 and cycle_id = $5`,
            [
              initiativeLayout.x,
              initiativeLayout.y,
              initiativeLayout.lineSide,
              initiativeLayout.id,
              cycleId
            ]
          );
        }

        await transactionClient.query('COMMIT');

        await query(
          `update strategy_ai_generations
           set institution_id = $2,
               strategy_id = $3,
               cycle_id = $4,
               source_files_json = $5::jsonb,
               model = $6,
               status = 'completed',
               error_message = null
           where id = $1`,
          [
            generationId,
            institutionId,
            strategyId,
            cycleId,
            JSON.stringify(
              docs.map((doc) => ({
                filename: doc.filename,
                bytes: doc.bytes,
                chars: doc.chars
              }))
            ),
            generatedResult.model || aiConfig.model
          ]
        );
      } catch (error) {
        try {
          await transactionClient.query('ROLLBACK');
        } catch {
          // ignore rollback errors
        }
        throw error;
      } finally {
        transactionClient.release();
      }

      await logAuditEvent({
        query,
        uuid,
        institutionId,
        action: 'meta_admin.strategy.ai_generated',
        entityType: 'institution_strategy',
        entityId: strategyId,
        payload: {
          ...actorAudit,
          strategyId,
          cycleId,
          strategySlug,
          model: generatedResult.model || aiConfig.model
        }
      });
    } catch (error) {
      const mapped = mapAiGenerationError(error);
      await query(
        `update strategy_ai_generations
         set status = 'failed',
             error_message = $2
         where id = $1`,
        [generationId, mapped.error]
      ).catch(() => {});

      if (mapped.error !== 'internal server error') {
        await logAuditEvent({
          query,
          uuid,
          institutionId: institutionIdInput || null,
          action: 'meta_admin.strategy.ai_generation_failed',
          entityType: 'institution_strategy',
          payload: {
            ...actorAudit,
            generationId,
            requestedById: actorId || null,
            error: mapped.error
          }
        }).catch(() => {});
      }
    }
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
      `select id,
              name,
              slug,
              status,
              created_at,
              coalesce(clarity_gremlin_extra_scans, 0)::int as clarity_gremlin_extra_scans,
              ai_provider,
              coalesce(ai_openai_model, '') as ai_openai_model,
              coalesce(ai_mistral_model, '') as ai_mistral_model
       from institutions
       order by created_at desc`
    );
    const strategiesRes = await query(
      `select id,
              institution_id,
              title,
              slug,
              status,
              is_default,
              created_at,
              coalesce(clarity_gremlin_calls_used, 0)::int as clarity_gremlin_calls_used
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
        clarityGremlinCallsUsed: Number(row.clarity_gremlin_calls_used || 0),
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
    const [contentSettings, parentGuidelines, guidelineLinks, strategyClassification] = await Promise.all([
      loadContentSettings(query),
      loadParentGuidelineCatalog(),
      loadGuidelineLinksOverview(),
      loadStrategyCatalogClassificationSummary(query)
    ]);

    res.json({
      institutions: institutionsRes.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        createdAt: row.created_at,
        aiProvider: row.ai_provider || 'openai',
        aiOpenaiModel: String(row.ai_openai_model || '').trim(),
        aiMistralModel: String(row.ai_mistral_model || '').trim(),
        clarityGremlinExtraScans: Number(row.clarity_gremlin_extra_scans || 0),
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
      strategyClassification,
      contentSettings,
      monitoring: {
        ...monitoringSnapshot,
        rateLimitConfig: rateLimitConfig || null,
        embedViewsByInstitution
      }
    });
  });

  app.post('/api/v1/meta-admin/strategies/reclassify', requireMetaAdminSession, async (req, res) => {
    try {
      const force = true;
      const maxStrategies = Math.max(1, Math.min(500, Number(req.body?.maxStrategies || 500)));
      const refreshResult = await refreshStrategyCatalogClassifications({
        query,
        maxStrategies,
        force,
        requireAi: true
      });
      const strategyClassification = await loadStrategyCatalogClassificationSummary(query);

      await logAuditEvent({
        query,
        uuid,
        action: 'meta_admin.strategy_catalog.reclassified',
        entityType: 'strategy_catalog_classification',
        payload: metaAuditPayload(req, {
          maxStrategies,
          force,
          processed: Number(refreshResult?.processed || 0),
          updated: Number(refreshResult?.updated || 0),
          mode: String(refreshResult?.mode || 'unknown')
        })
      });

      res.json({
        ok: true,
        refresh: refreshResult,
        strategyClassification
      });
    } catch (error) {
      const message = String(error?.message || '').trim();
      if (message === 'ai api key not configured') {
        return res.status(503).json({ error: message });
      }
      if (message === 'classification storage not initialized') {
        return res.status(503).json({ error: message });
      }
      if (message.startsWith('strategy catalog ai classification failed:')) {
        return res.status(502).json({ error: message });
      }
      throw error;
    }
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
    const rawExtraScans = req.body?.clarityGremlinExtraScans;
    const aiOpenaiModel = String(req.body?.aiOpenaiModel || '').trim();
    const aiMistralModel = String(req.body?.aiMistralModel || '').trim();
    if (!institutionId || !name) {
      return res.status(400).json({ error: 'institutionId and name required' });
    }
    let clarityGremlinExtraScans = null;
    if (rawExtraScans !== undefined) {
      const parsed = Number(rawExtraScans);
      if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
        return res.status(400).json({ error: 'invalid clarityGremlinExtraScans' });
      }
      clarityGremlinExtraScans = parsed;
    }

    const result = await query(
      `update institutions
       set name = $1,
           clarity_gremlin_extra_scans = coalesce($2::integer, clarity_gremlin_extra_scans),
           ai_openai_model = nullif($3, ''),
           ai_mistral_model = nullif($4, '')
       where id = $5
       returning coalesce(clarity_gremlin_extra_scans, 0)::int as clarity_gremlin_extra_scans,
                 coalesce(ai_openai_model, '') as ai_openai_model,
                 coalesce(ai_mistral_model, '') as ai_mistral_model`,
      [name, clarityGremlinExtraScans, aiOpenaiModel, aiMistralModel, institutionId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'institution not found' });
    const updatedExtraScans = Number(result.rows[0]?.clarity_gremlin_extra_scans || 0);
    const updatedOpenaiModel = String(result.rows[0]?.ai_openai_model || '').trim();
    const updatedMistralModel = String(result.rows[0]?.ai_mistral_model || '').trim();

    await logAuditEvent({
      query,
      uuid,
      institutionId,
      action: 'meta_admin.institution.updated',
      entityType: 'institution',
      entityId: institutionId,
      payload: metaAuditPayload(req, {
        name,
        clarityGremlinExtraScans: updatedExtraScans,
        aiOpenaiModel: updatedOpenaiModel,
        aiMistralModel: updatedMistralModel
      })
    });

    res.json({
      ok: true,
      institutionId,
      name,
      clarityGremlinExtraScans: updatedExtraScans,
      aiOpenaiModel: updatedOpenaiModel,
      aiMistralModel: updatedMistralModel
    });
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

  app.post('/api/v1/meta-admin/strategies/delete-selected', requireMetaAdminSession, async (req, res) => {
    const institutionId = String(req.body?.institutionId || '').trim();
    const strategyIdsRaw = Array.isArray(req.body?.strategyIds) ? req.body.strategyIds : [];
    if (!institutionId || !strategyIdsRaw.length) {
      return res.status(400).json({ error: 'institutionId and strategyIds required' });
    }
    if (!isUuid(institutionId)) {
      return res.status(400).json({ error: 'institutionId and strategyIds required' });
    }

    const strategyIds = Array.from(
      new Set(
        strategyIdsRaw
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      )
    );
    if (!strategyIds.length || strategyIds.some((value) => !isUuid(value))) {
      return res.status(400).json({ error: 'invalid strategyIds' });
    }

    const transactionClient = await pool.connect();
    try {
      await transactionClient.query('BEGIN');

      const institutionRes = await transactionClient.query(
        `select id
         from institutions
         where id = $1
         for update`,
        [institutionId]
      );
      if (!institutionRes.rowCount) {
        await transactionClient.query('ROLLBACK');
        return res.status(404).json({ error: 'institution not found' });
      }

      const strategyRes = await transactionClient.query(
        `select id, title, slug, is_default
         from institution_strategies
         where institution_id = $1 and id = any($2::uuid[])
         for update`,
        [institutionId, strategyIds]
      );
      if (strategyRes.rowCount !== strategyIds.length) {
        await transactionClient.query('ROLLBACK');
        return res.status(404).json({ error: 'strategy not found' });
      }

      const defaultStrategies = strategyRes.rows.filter((row) => Boolean(row.is_default));
      if (defaultStrategies.length) {
        await transactionClient.query('ROLLBACK');
        return res.status(400).json({ error: 'cannot delete default strategy' });
      }

      const deletedCyclesRes = await transactionClient.query(
        `delete from strategy_cycles
         where strategy_id = any($1::uuid[])
         returning id`,
        [strategyIds]
      );

      const deletedStrategiesRes = await transactionClient.query(
        `delete from institution_strategies
         where institution_id = $1
           and id = any($2::uuid[])
           and coalesce(is_default, false) = false
         returning id, title, slug`,
        [institutionId, strategyIds]
      );
      if (deletedStrategiesRes.rowCount !== strategyIds.length) {
        await transactionClient.query('ROLLBACK');
        return res.status(400).json({ error: 'cannot delete default strategy' });
      }

      await transactionClient.query('COMMIT');

      await logAuditEvent({
        query,
        uuid,
        institutionId,
        action: 'meta_admin.strategies.deleted',
        entityType: 'institution_strategy',
        payload: metaAuditPayload(req, {
          strategyIds,
          deletedStrategyCount: deletedStrategiesRes.rowCount,
          deletedCycleCount: deletedCyclesRes.rowCount
        })
      });

      res.json({
        ok: true,
        deleted: {
          strategyCount: Number(deletedStrategiesRes.rowCount || 0),
          cycleCount: Number(deletedCyclesRes.rowCount || 0),
          strategies: deletedStrategiesRes.rows.map((row) => ({
            id: row.id,
            title: row.title,
            slug: row.slug
          }))
        }
      });
    } catch (error) {
      try {
        await transactionClient.query('ROLLBACK');
      } catch {
        // ignore rollback errors
      }
      throw error;
    } finally {
      transactionClient.release();
    }
  });

  app.get('/api/v1/meta-admin/strategies/ai-generations/:generationId', requireMetaAdminSession, async (req, res) => {
    const generationId = String(req.params.generationId || '').trim();
    if (!generationId) {
      return res.status(400).json({ error: 'generationId required' });
    }

    const generation = await loadMetaAdminAiGenerationById(generationId);
    if (!generation) {
      return res.status(404).json({ error: 'generation not found' });
    }

    return res.json({ ok: true, generation });
  });

  app.post(
    '/api/v1/meta-admin/strategies/ai-generate',
    requireMetaAdminSession,
    metaAdminStrategyCreateRateLimit,
    aiStrategyUploadMiddleware,
    async (req, res) => {
      const institutionIdInput = String(req.body?.institutionId || '').trim();
      const institutionNameInput = String(req.body?.institutionName || '').trim();
      const strategyTitleInput = String(req.body?.strategyTitle || '').trim();
      const strategySlugInput = String(req.body?.strategySlug || '').trim();
      const strategyDescriptionInput = String(req.body?.strategyDescription || '').trim();
      const cycleTitleInput = String(req.body?.cycleTitle || '').trim();
      const clarification = String(req.body?.clarification || '').trim();
      const localeHint = normalizeLocaleHint(req.body?.localeHint || 'lt');
      const files = Array.isArray(req.files) ? req.files : [];

      if (!institutionIdInput && !institutionNameInput) {
        return res.status(400).json({ error: 'institutionId or institutionName required' });
      }
      if (!clarification) {
        return res.status(400).json({ error: 'clarification required' });
      }
      if (!files.length) {
        return res.status(400).json({ error: 'at least one pdf file required' });
      }

      if (institutionIdInput) {
        const strategyCountRes = await query(
          `select count(*)::int as total
           from institution_strategies
           where institution_id = $1`,
          [institutionIdInput]
        );
        if (Number(strategyCountRes.rows?.[0]?.total || 0) >= STRATEGY_MAX_PER_INSTITUTION) {
          return res.status(409).json({ error: 'strategy limit reached' });
        }
      }

      const aiConfig = institutionIdInput
        ? await loadInstitutionAiConfig(institutionIdInput)
        : getAiStrategyConfig({ provider: 'openai' });
      if (!aiConfig.apiKey) {
        return res.status(503).json({ error: 'ai api key not configured' });
      }

      const generationId = uuid();
      const startedAt = new Date().toISOString();
      await query(
        `insert into strategy_ai_generations (
           id,
           institution_id,
           requested_by_scope,
           requested_by_id,
           request_note,
           source_files_json,
           model,
           status,
           error_message
         )
         values ($1, $2, 'meta_admin', $3, $4, $5::jsonb, $6, 'pending', null)`,
        [
          generationId,
          institutionIdInput || null,
          req.metaAdmin?.scope || 'meta_admin',
          clarification,
          JSON.stringify(
            files.map((file) => ({
              filename: String(file?.originalname || file?.name || 'document.pdf'),
              bytes: Number(file?.size || 0)
            }))
          ),
          aiConfig.model
        ]
      );

      res.status(202).json({
        ok: true,
        generation: {
          id: generationId,
          status: 'pending',
          createdAt: startedAt
        }
      });

      const actorAudit = metaAuditPayload(req);
      setImmediate(() => {
        runMetaAdminAiGeneration({
          generationId,
          aiConfig,
          institutionIdInput,
          institutionNameInput,
          strategyTitleInput,
          strategySlugInput,
          strategyDescriptionInput,
          cycleTitleInput,
          clarification,
          localeHint,
          files,
          actorId: req.metaAdmin?.scope || 'meta_admin',
          actorAudit
        }).catch(() => {});
      });
    }
  );

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

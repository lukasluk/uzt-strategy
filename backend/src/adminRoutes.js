const multer = require('multer');
const { pool } = require('./db');
const {
  createPasswordResetToken,
  ensurePasswordResetTable
} = require('./passwordResetService');
const {
  extractPdfTexts,
  generateStrategyFromAi
} = require('./aiStrategyService');

function registerAdminRoutes({
  app,
  query,
  broadcast,
  uuid,
  adminWriteRateLimit,
  strategyCreateRateLimit,
  trafficMonitor,
  crypto,
  hashPassword,
  normalizeEmail,
  sha256,
  slugify,
  inviteTtlHours,
  requireAuth,
  verifyCycleAccess,
  normalizeLineSide,
  loadGuidelineContext,
  loadCommentContext,
  loadInitiativeContext,
  loadInitiativeCommentContext,
  validateGuidelineRelationship,
  validateInitiativeGuidelineAssignments,
  createInstitutionInvite,
  setCycleState,
  setCycleSettings,
  setCycleResultsPublished,
  updatePlatformUserPassword,
  deleteInstitutionMembership,
  countUserMemberships,
  deletePlatformUser,
  setGuidelineCommentStatus,
  setInitiativeCommentStatus,
  setCycleMapPosition,
  listExistingGuidelineIds,
  setGuidelineMapPosition,
  listExistingInitiativeIds,
  setInitiativeMapPosition,
  hasGuidelineChildren,
  updateGuidelineRecord,
  updateInitiativeRecord,
  replaceInitiativeGuidelineLinks,
  deleteInitiativeByCycle,
  resetChildrenToOrphan,
  deleteGuidelineByCycle
}) {
  const adminWriteGuard = typeof adminWriteRateLimit === 'function'
    ? adminWriteRateLimit
    : (_req, _res, next) => next();
  const strategyCreateGuard = typeof strategyCreateRateLimit === 'function'
    ? strategyCreateRateLimit
    : (_req, _res, next) => next();
  const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 24 * 60);
  const PASSWORD_RESET_BASE_URL = String(process.env.PASSWORD_RESET_BASE_URL || '').trim();
  const INVITE_BASE_URL = String(process.env.INVITE_BASE_URL || PASSWORD_RESET_BASE_URL || '').trim();
  const AI_STRATEGY_API_KEY = String(
    process.env.AI_STRATEGY_API_KEY
    || process.env.OPENAI_API_KEY
    || ''
  ).trim();
  const AI_STRATEGY_MODEL = String(
    process.env.AI_STRATEGY_MODEL
    || process.env.OPENAI_MODEL
    || 'gpt-5-mini'
  ).trim();
  const AI_STRATEGY_API_BASE_URL = String(
    process.env.AI_STRATEGY_API_BASE_URL
    || process.env.OPENAI_API_BASE_URL
    || 'https://api.openai.com/v1'
  ).trim();
  const AI_STRATEGY_TIMEOUT_MS = Math.max(15000, Number(process.env.AI_STRATEGY_TIMEOUT_MS || 120000));
  const AI_STRATEGY_MAX_FILES = Math.min(8, Math.max(1, Number(process.env.AI_STRATEGY_MAX_FILES || 4)));
  const AI_STRATEGY_MAX_FILE_MB = Math.min(20, Math.max(1, Number(process.env.AI_STRATEGY_MAX_FILE_MB || 8)));
  const AI_STRATEGY_MAX_COMBINED_TEXT_CHARS = Math.max(
    30000,
    Number(process.env.AI_STRATEGY_MAX_COMBINED_TEXT_CHARS || 120000)
  );
  const STRATEGY_MAX_PER_INSTITUTION = Math.max(
    1,
    Number(process.env.STRATEGY_MAX_PER_INSTITUTION || 5)
  );

  function resolveAbsoluteBase(req, configuredBase) {
    if (configuredBase) return configuredBase.replace(/\/+$/, '');
    return `${String(req.protocol || 'https')}://${String(req.get('host') || '').trim()}`;
  }

  function buildPasswordResetUrl(req, token) {
    const base = resolveAbsoluteBase(req, PASSWORD_RESET_BASE_URL);
    return `${base}/reset-password.html?token=${encodeURIComponent(String(token || '').trim())}`;
  }

  function buildInviteAcceptUrl(req, token) {
    const base = resolveAbsoluteBase(req, INVITE_BASE_URL);
    return `${base}/accept-invite.html?token=${encodeURIComponent(String(token || '').trim())}`;
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
        lineSide: side
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
          lineSide: side
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

  async function loadInstitutionParentGuidelineCatalog(institutionId) {
    const result = await query(
      `select g.id,
              g.title as guideline_title,
              g.status as guideline_status,
              c.id as cycle_id,
              c.title as cycle_title,
              c.state as cycle_state,
              s.id as strategy_id,
              s.title as strategy_title,
              s.slug as strategy_slug
       from strategy_guidelines g
       join strategy_cycles c on c.id = g.cycle_id
       left join institution_strategies s on s.id = c.strategy_id
       where c.institution_id = $1
         and g.relation_type = 'parent'
         and g.status in ('active', 'disabled', 'merged')
       order by s.title asc nulls last, g.created_at asc`,
      [institutionId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.guideline_title,
      status: row.guideline_status,
      cycleId: row.cycle_id,
      cycleTitle: row.cycle_title,
      cycleState: row.cycle_state,
      strategyId: row.strategy_id,
      strategyTitle: row.strategy_title || 'default',
      strategySlug: row.strategy_slug || 'default'
    }));
  }

  async function loadInstitutionGuidelineLinksOverview(institutionId) {
    const result = await query(
      `select l.id,
              l.created_at,
              sg.id as source_guideline_id,
              sg.title as source_guideline_title,
              sc.id as source_cycle_id,
              sc.title as source_cycle_title,
              ss.id as source_strategy_id,
              ss.title as source_strategy_title,
              ss.slug as source_strategy_slug,
              tg.id as target_guideline_id,
              tg.title as target_guideline_title,
              tc.id as target_cycle_id,
              tc.title as target_cycle_title,
              ts.id as target_strategy_id,
              ts.title as target_strategy_title,
              ts.slug as target_strategy_slug
       from strategy_guideline_links l
       join strategy_guidelines sg on sg.id = l.source_guideline_id
       join strategy_guidelines tg on tg.id = l.target_guideline_id
       join strategy_cycles sc on sc.id = sg.cycle_id
       join strategy_cycles tc on tc.id = tg.cycle_id
       left join institution_strategies ss on ss.id = sc.strategy_id
       left join institution_strategies ts on ts.id = tc.strategy_id
       where sc.institution_id = $1
         and tc.institution_id = $1
       order by l.created_at desc`,
      [institutionId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      isCrossStrategy: row.source_strategy_id !== row.target_strategy_id,
      source: {
        guidelineId: row.source_guideline_id,
        guidelineTitle: row.source_guideline_title,
        cycleId: row.source_cycle_id,
        cycleTitle: row.source_cycle_title,
        strategyId: row.source_strategy_id,
        strategyTitle: row.source_strategy_title || 'default',
        strategySlug: row.source_strategy_slug || 'default'
      },
      target: {
        guidelineId: row.target_guideline_id,
        guidelineTitle: row.target_guideline_title,
        cycleId: row.target_cycle_id,
        cycleTitle: row.target_cycle_title,
        strategyId: row.target_strategy_id,
        strategyTitle: row.target_strategy_title || 'default',
        strategySlug: row.target_strategy_slug || 'default'
      }
    }));
  }

  app.get('/api/v1/admin/embed-views', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });

    const institutionRes = await query(
      'select id, name, slug from institutions where id = $1',
      [req.auth.institutionId]
    );
    if (institutionRes.rowCount === 0) return res.status(404).json({ error: 'institution not found' });
    const institution = institutionRes.rows[0];
    const institutionEmbedStats = trafficMonitor
      ? trafficMonitor.getEmbedViewsForInstitution(institution.slug)
      : { views: 0, lastViewedAt: null };
    const embedSummary = trafficMonitor
      ? trafficMonitor.getEmbedViewsSummary()
      : { totalViews: 0 };

    res.json({
      institutionId: institution.id,
      institutionName: institution.name,
      institutionSlug: institution.slug,
      viewCount: Number(institutionEmbedStats.views || 0),
      lastViewedAt: institutionEmbedStats.lastViewedAt || null,
      totalEmbedViews: Number(embedSummary.totalViews || 0)
    });
  });

  app.post('/api/v1/admin/invites', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const email = normalizeEmail(req.body?.email);
    const role = String(req.body?.role || 'member').trim();
    if (!email) return res.status(400).json({ error: 'email required' });
    if (role !== 'member') return res.status(400).json({ error: 'institution admin can invite only members in v1' });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    await createInstitutionInvite({
      institutionId: req.auth.institutionId,
      email,
      role,
      tokenHash: sha256(inviteToken),
      inviteTtlHours,
      createdBy: req.auth.sub,
      uuid
    });
    const inviteUrl = buildInviteAcceptUrl(req, inviteToken);
    const expiresAt = new Date(Date.now() + inviteTtlHours * 60 * 60 * 1000).toISOString();
    res.status(201).json({ inviteToken, inviteUrl, expiresAt, email, role });
  });

  app.post('/api/v1/admin/strategies', requireAuth, strategyCreateGuard, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });

    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const requestedSlug = String(req.body?.slug || '').trim();
    if (!title) return res.status(400).json({ error: 'strategy title required' });

    const normalizedSlug = slugify(requestedSlug || title);
    if (!normalizedSlug) return res.status(400).json({ error: 'invalid strategy slug' });

    const strategyId = uuid();
    const cycleId = uuid();
    let isDefault = false;
    const transactionClient = await pool.connect();
    try {
      await transactionClient.query('BEGIN');

      const institutionRes = await transactionClient.query(
        `select id
         from institutions
         where id = $1
         for update`,
        [req.auth.institutionId]
      );
      if (!institutionRes.rowCount) {
        await transactionClient.query('ROLLBACK');
        return res.status(404).json({ error: 'institution not found' });
      }

      await ensureStrategyCapacity(transactionClient, req.auth.institutionId);

      const existing = await transactionClient.query(
        `select id
         from institution_strategies
         where institution_id = $1 and slug = $2`,
        [req.auth.institutionId, normalizedSlug]
      );
      if (existing.rowCount > 0) {
        await transactionClient.query('ROLLBACK');
        return res.status(409).json({ error: 'strategy slug already exists' });
      }

      const defaultCheck = await transactionClient.query(
        `select id
         from institution_strategies
         where institution_id = $1 and is_default = true
         limit 1`,
        [req.auth.institutionId]
      );
      isDefault = defaultCheck.rowCount === 0;

      await transactionClient.query(
        `insert into institution_strategies (id, institution_id, title, slug, description, status, is_default)
         values ($1, $2, $3, $4, $5, 'active', $6)`,
        [
          strategyId,
          req.auth.institutionId,
          title,
          normalizedSlug,
          description || null,
          isDefault
        ]
      );

      await transactionClient.query(
        `insert into strategy_cycles (id, institution_id, strategy_id, title, state, results_published, starts_at)
         values ($1, $2, $3, $4, 'open', false, now())`,
        [
          cycleId,
          req.auth.institutionId,
          strategyId,
          `${title} ciklas`
        ]
      );

      await transactionClient.query('COMMIT');
    } catch (error) {
      try {
        await transactionClient.query('ROLLBACK');
      } catch {
        // ignore rollback errors
      }
      if (error?.message === 'strategy limit reached' || error?.code === 'STRATEGY_LIMIT_REACHED') {
        return res.status(409).json({ error: 'strategy limit reached' });
      }
      throw error;
    } finally {
      transactionClient.release();
    }

    broadcast({
      type: 'v1.strategy.created',
      institutionId: req.auth.institutionId,
      strategyId,
      cycleId
    });

    res.status(201).json({
      strategy: {
        id: strategyId,
        institutionId: req.auth.institutionId,
        title,
        slug: normalizedSlug,
        description: description || null,
        status: 'active',
        isDefault
      },
      cycle: {
        id: cycleId,
        institutionId: req.auth.institutionId,
        strategyId,
        title: `${title} ciklas`,
        state: 'open'
      }
    });
  });

  app.post(
    '/api/v1/admin/strategies/ai-generate',
    requireAuth,
    strategyCreateGuard,
    adminWriteGuard,
    aiStrategyUploadMiddleware,
    async (req, res) => {
      if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
      if (!AI_STRATEGY_API_KEY) {
        return res.status(503).json({ error: 'ai api key not configured' });
      }

      const strategyTitleInput = String(req.body?.strategyTitle || '').trim();
      const strategySlugInput = String(req.body?.strategySlug || '').trim();
      const strategyDescriptionInput = String(req.body?.strategyDescription || '').trim();
      const cycleTitleInput = String(req.body?.cycleTitle || '').trim();
      const clarification = String(req.body?.clarification || '').trim();
      const localeHint = normalizeLocaleHint(req.body?.localeHint || 'lt');
      const files = Array.isArray(req.files) ? req.files : [];

      if (!clarification) {
        return res.status(400).json({ error: 'clarification required' });
      }
      if (!files.length) {
        return res.status(400).json({ error: 'at least one pdf file required' });
      }

      const strategyCountRes = await query(
        `select count(*)::int as total
         from institution_strategies
         where institution_id = $1`,
        [req.auth.institutionId]
      );
      if (Number(strategyCountRes.rows?.[0]?.total || 0) >= STRATEGY_MAX_PER_INSTITUTION) {
        return res.status(409).json({ error: 'strategy limit reached' });
      }

      let docs = [];
      let generatedResult = null;
      try {
        docs = await extractPdfTexts(files, {
          maxCombinedChars: AI_STRATEGY_MAX_COMBINED_TEXT_CHARS
        });

        generatedResult = await generateStrategyFromAi({
          apiKey: AI_STRATEGY_API_KEY,
          model: AI_STRATEGY_MODEL,
          baseUrl: AI_STRATEGY_API_BASE_URL,
          instruction: clarification,
          docs,
          localeHint,
          timeoutMs: AI_STRATEGY_TIMEOUT_MS
        });
      } catch (error) {
        const mapped = mapAiGenerationError(error);
        return res.status(mapped.status).json({ error: mapped.error });
      }

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

      const institutionRes = await query(
        `select id, name, slug
         from institutions
         where id = $1
         limit 1`,
        [req.auth.institutionId]
      );
      if (!institutionRes.rowCount) return res.status(404).json({ error: 'institution not found' });

      const institution = institutionRes.rows[0];
      const transactionClient = await pool.connect();
      let strategyId = '';
      let strategySlug = '';
      let cycleId = '';
      try {
        await transactionClient.query('BEGIN');

        const baseStrategySlug = slugify(strategySlugInput || finalStrategyTitle);
        if (!baseStrategySlug) {
          await transactionClient.query('ROLLBACK');
          return res.status(400).json({ error: 'invalid strategy slug' });
        }

        const institutionLockRes = await transactionClient.query(
          `select id
           from institutions
           where id = $1
           for update`,
          [req.auth.institutionId]
        );
        if (!institutionLockRes.rowCount) {
          await transactionClient.query('ROLLBACK');
          return res.status(404).json({ error: 'institution not found' });
        }

        await ensureStrategyCapacity(transactionClient, req.auth.institutionId);
        strategySlug = await ensureUniqueStrategySlug(transactionClient, req.auth.institutionId, baseStrategySlug);

        const defaultStrategyCheck = await transactionClient.query(
          `select id
           from institution_strategies
           where institution_id = $1 and is_default = true
           limit 1`,
          [req.auth.institutionId]
        );
        const isDefault = defaultStrategyCheck.rowCount === 0;

        strategyId = uuid();
        await transactionClient.query(
          `insert into institution_strategies (id, institution_id, title, slug, description, status, is_default)
           values ($1, $2, $3, $4, $5, 'active', $6)`,
          [strategyId, req.auth.institutionId, finalStrategyTitle, strategySlug, strategyDescription || null, isDefault]
        );

        cycleId = uuid();
        await transactionClient.query(
          `insert into strategy_cycles (
             id, institution_id, strategy_id, title, state, results_published, starts_at, mission_text, vision_text
           )
           values ($1, $2, $3, $4, 'open', false, now(), $5, $6)`,
          [cycleId, req.auth.institutionId, strategyId, finalCycleTitle, generated.missionText || null, generated.visionText || null]
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
            [guidelineId, cycleId, guideline.title, guideline.description || null, guideline.relationType]
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
            childGuidelines.push({ id: guidelineId, parentTitle: guideline.parentTitle });
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
            [guidelineLayout.x, guidelineLayout.y, guidelineLayout.lineSide, guidelineLayout.id, cycleId]
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
            [initiativeLayout.x, initiativeLayout.y, initiativeLayout.lineSide, initiativeLayout.id, cycleId]
          );
        }

        await transactionClient.query(
          `insert into strategy_ai_generations (
             id,
             institution_id,
             strategy_id,
             cycle_id,
             requested_by_scope,
             requested_by_id,
             request_note,
             source_files_json,
             model,
             status
           )
           values ($1, $2, $3, $4, 'institution_admin', $5, $6, $7::jsonb, $8, 'completed')`,
          [
            uuid(),
            req.auth.institutionId,
            strategyId,
            cycleId,
            req.auth.sub,
            clarification,
            JSON.stringify(
              docs.map((doc) => ({
                filename: doc.filename,
                bytes: doc.bytes,
                chars: doc.chars
              }))
            ),
            generatedResult.model || AI_STRATEGY_MODEL
          ]
        );

        await transactionClient.query('COMMIT');
      } catch (error) {
        try {
          await transactionClient.query('ROLLBACK');
        } catch {
          // ignore rollback errors
        }
        if (error?.message === 'strategy limit reached' || error?.code === 'STRATEGY_LIMIT_REACHED') {
          return res.status(409).json({ error: 'strategy limit reached' });
        }
        throw error;
      } finally {
        transactionClient.release();
      }

      broadcast({
        type: 'v1.strategy.created',
        institutionId: req.auth.institutionId,
        strategyId,
        cycleId
      });

      res.status(201).json({
        ok: true,
        institution: {
          id: institution.id,
          name: institution.name,
          slug: institution.slug
        },
        strategy: {
          id: strategyId,
          institutionId: req.auth.institutionId,
          title: finalStrategyTitle,
          slug: strategySlug,
          description: strategyDescription || null,
          status: 'active'
        },
        cycle: {
          id: cycleId,
          institutionId: req.auth.institutionId,
          strategyId,
          title: finalCycleTitle,
          state: 'open'
        },
        summary: {
          guidelines: generated.guidelines.length,
          initiatives: generated.initiatives.length,
          sourceFiles: docs.length
        }
      });
    }
  );


  app.put('/api/v1/admin/cycles/:cycleId/state', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    const state = String(req.body?.state || '').trim();
    if (!['open', 'closed'].includes(state)) {
      return res.status(400).json({ error: 'invalid state' });
    }

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
    const { cycle } = cycleAccess;

    await setCycleState({ cycleId, state });

    broadcast({ type: 'v1.cycle.state', institutionId: req.auth.institutionId, cycleId, state });
    res.json({ ok: true, state });
  });


  app.put('/api/v1/admin/cycles/:cycleId/settings', requireAuth, adminWriteGuard, async (req, res) => {
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

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    const updated = await setCycleSettings({
      cycleId,
      missionProvided,
      missionText,
      visionProvided,
      visionText
    });

    broadcast({
      type: 'v1.cycle.settings',
      institutionId: req.auth.institutionId,
      cycleId
    });

    res.json({
      ok: true,
      missionText: updated?.mission_text || null,
      visionText: updated?.vision_text || null
    });
  });


  app.post('/api/v1/admin/cycles/:cycleId/results', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    const published = Boolean(req.body?.published);

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    await setCycleResultsPublished({ cycleId, published });
    broadcast({ type: 'v1.cycle.results', institutionId: req.auth.institutionId, cycleId, published });
    res.json({ ok: true, published });
  });


  app.get('/api/v1/admin/cycles/:cycleId/participants', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

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

  app.post('/api/v1/admin/users/:userId/password-reset-link', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const userId = String(req.params.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const membershipRes = await query(
      `select u.id, u.email, u.display_name, u.status
       from institution_memberships m
       join platform_users u on u.id = m.user_id
       where m.institution_id = $1 and m.user_id = $2`,
      [req.auth.institutionId, userId]
    );
    if (!membershipRes.rowCount) return res.status(404).json({ error: 'membership not found' });

    const user = membershipRes.rows[0];
    if (String(user.status || '').trim() !== 'active') {
      return res.status(409).json({ error: 'user inactive' });
    }

    await ensurePasswordResetTable(query);
    const reset = await createPasswordResetToken({
      query,
      uuid,
      userId,
      ttlMinutes: PASSWORD_RESET_TTL_MINUTES,
      createdByScope: 'institution_admin',
      createdById: req.auth.sub
    });
    const resetUrl = buildPasswordResetUrl(req, reset.token);

    res.status(201).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        status: user.status
      },
      resetUrl,
      expiresAt: reset.expiresAt
    });
  });


  app.put('/api/v1/admin/users/:userId/password', requireAuth, adminWriteGuard, async (req, res) => {
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
    await updatePlatformUserPassword({ userId, salt, hash });

    res.json({ ok: true });
  });


  app.delete('/api/v1/admin/users/:userId', requireAuth, adminWriteGuard, async (req, res) => {
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

    await deleteInstitutionMembership({ institutionId: req.auth.institutionId, userId });

    const membershipsLeft = await countUserMemberships(userId);
    let userDeleted = false;
    if (membershipsLeft === 0) {
      await deletePlatformUser(userId);
      userDeleted = true;
    }

    res.json({ ok: true, userDeleted, membershipsLeft });
  });


  app.get('/api/v1/admin/cycles/:cycleId/guidelines', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

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
    const votesByGuideline = {};
    const strategyLinksByGuideline = {};
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

      const votesRes = await query(
        `select v.guideline_id,
                v.voter_id,
                v.score,
                v.updated_at,
                u.display_name as voter_display_name,
                u.email as voter_email
         from strategy_votes v
         left join platform_users u on u.id = v.voter_id
         where v.guideline_id = any($1::uuid[])
         order by v.guideline_id asc, v.score desc, v.updated_at desc`,
        [guidelineIds]
      );
      votesRes.rows.forEach((row) => {
        if (!votesByGuideline[row.guideline_id]) votesByGuideline[row.guideline_id] = [];
        votesByGuideline[row.guideline_id].push({
          voterId: row.voter_id,
          voterName: row.voter_display_name || row.voter_email || 'Nežinomas vartotojas',
          voterEmail: row.voter_email || null,
          score: Number(row.score || 0),
          updatedAt: row.updated_at
        });
      });

      const strategyLinksRes = await query(
        `select l.id,
                l.source_guideline_id,
                l.target_guideline_id,
                sg.title as source_guideline_title,
                tg.title as target_guideline_title,
                si.slug as source_institution_slug,
                si.name as source_institution_name,
                ti.slug as target_institution_slug,
                ti.name as target_institution_name,
                ss.slug as source_strategy_slug,
                ss.title as source_strategy_title,
                ts.slug as target_strategy_slug,
                ts.title as target_strategy_title
         from strategy_guideline_links l
         join strategy_guidelines sg on sg.id = l.source_guideline_id
         join strategy_guidelines tg on tg.id = l.target_guideline_id
         join strategy_cycles sc on sc.id = sg.cycle_id
         join strategy_cycles tc on tc.id = tg.cycle_id
         join institutions si on si.id = sc.institution_id
         join institutions ti on ti.id = tc.institution_id
         left join institution_strategies ss on ss.id = sc.strategy_id
         left join institution_strategies ts on ts.id = tc.strategy_id
         where l.source_guideline_id = any($1::uuid[])
            or l.target_guideline_id = any($1::uuid[])
         order by l.created_at desc`,
        [guidelineIds]
      );

      const guidelineIdSet = new Set(guidelineIds);
      strategyLinksRes.rows.forEach((row) => {
        const sourceId = String(row.source_guideline_id || '').trim();
        const targetId = String(row.target_guideline_id || '').trim();
        if (!sourceId || !targetId) return;

        const isCrossInstitution = String(row.source_institution_slug || '').trim()
          !== String(row.target_institution_slug || '').trim();
        const isCrossStrategy = String(row.source_strategy_slug || '').trim()
          !== String(row.target_strategy_slug || '').trim();

        if (guidelineIdSet.has(sourceId)) {
          if (!strategyLinksByGuideline[sourceId]) strategyLinksByGuideline[sourceId] = [];
          strategyLinksByGuideline[sourceId].push({
            id: row.id,
            direction: 'outgoing',
            otherGuidelineId: targetId,
            otherGuidelineTitle: row.target_guideline_title,
            otherInstitutionName: row.target_institution_name,
            otherInstitutionSlug: row.target_institution_slug,
            otherStrategyTitle: row.target_strategy_title || 'default',
            otherStrategySlug: row.target_strategy_slug || 'default',
            isCrossInstitution,
            isCrossStrategy
          });
        }

        if (guidelineIdSet.has(targetId)) {
          if (!strategyLinksByGuideline[targetId]) strategyLinksByGuideline[targetId] = [];
          strategyLinksByGuideline[targetId].push({
            id: row.id,
            direction: 'incoming',
            otherGuidelineId: sourceId,
            otherGuidelineTitle: row.source_guideline_title,
            otherInstitutionName: row.source_institution_name,
            otherInstitutionSlug: row.source_institution_slug,
            otherStrategyTitle: row.source_strategy_title || 'default',
            otherStrategySlug: row.source_strategy_slug || 'default',
            isCrossInstitution,
            isCrossStrategy
          });
        }
      });
    }

    const [parentGuidelines, guidelineLinks] = await Promise.all([
      loadInstitutionParentGuidelineCatalog(req.auth.institutionId),
      loadInstitutionGuidelineLinksOverview(req.auth.institutionId)
    ]);

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
        votes: votesByGuideline[row.id] || [],
        commentCount: (commentsByGuideline[row.id] || []).length,
        comments: commentsByGuideline[row.id] || [],
        strategyLinks: strategyLinksByGuideline[row.id] || [],
        strategyLinkCount: (strategyLinksByGuideline[row.id] || []).length
      })),
      parentGuidelines,
      guidelineLinks
    });
  });

  app.post('/api/v1/admin/guideline-links', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
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
              g.relation_type,
              c.institution_id
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
    if (source.institution_id !== req.auth.institutionId || target.institution_id !== req.auth.institutionId) {
      return res.status(403).json({ error: 'cross-institution forbidden' });
    }
    if (source.relation_type !== 'parent' || target.relation_type !== 'parent') {
      return res.status(400).json({ error: 'parent guideline required' });
    }

    const [firstId, secondId] = sourceGuidelineIdRaw < targetGuidelineIdRaw
      ? [sourceGuidelineIdRaw, targetGuidelineIdRaw]
      : [targetGuidelineIdRaw, sourceGuidelineIdRaw];

    const linkId = uuid();
    const insertRes = await query(
      `insert into strategy_guideline_links (id, source_guideline_id, target_guideline_id, created_by)
       values ($1, $2, $3, $4)
       on conflict (source_guideline_id, target_guideline_id) do nothing
       returning id, created_at`,
      [linkId, firstId, secondId, req.auth.sub]
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

    broadcast({
      type: 'v1.guideline_link.upserted',
      institutionId: req.auth.institutionId,
      linkId: saved.id
    });
    res.status(insertRes.rowCount ? 201 : 200).json({
      ok: true,
      existedBefore: insertRes.rowCount === 0,
      linkId: saved.id,
      createdAt: saved.created_at
    });
  });

  app.delete('/api/v1/admin/guideline-links/:linkId', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const linkId = String(req.params.linkId || '').trim();
    if (!linkId) return res.status(400).json({ error: 'linkId required' });

    const deletedRes = await query(
      `delete from strategy_guideline_links l
       using strategy_guidelines sg,
             strategy_guidelines tg,
             strategy_cycles sc,
             strategy_cycles tc
       where l.id = $1
         and sg.id = l.source_guideline_id
         and tg.id = l.target_guideline_id
         and sc.id = sg.cycle_id
         and tc.id = tg.cycle_id
         and sc.institution_id = $2
         and tc.institution_id = $2
       returning l.id`,
      [linkId, req.auth.institutionId]
    );
    if (!deletedRes.rowCount) return res.status(404).json({ error: 'guideline link not found' });

    broadcast({
      type: 'v1.guideline_link.deleted',
      institutionId: req.auth.institutionId,
      linkId
    });
    res.json({ ok: true, linkId });
  });


  app.get('/api/v1/admin/cycles/:cycleId/initiatives', requireAuth, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

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
    const votesByInitiative = {};

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

      const votesRes = await query(
        `select v.initiative_id,
                v.voter_id,
                v.score,
                v.updated_at,
                u.display_name as voter_display_name,
                u.email as voter_email
         from strategy_initiative_votes v
         left join platform_users u on u.id = v.voter_id
         where v.initiative_id = any($1::uuid[])
         order by v.initiative_id asc, v.score desc, v.updated_at desc`,
        [initiativeIds]
      );
      votesRes.rows.forEach((row) => {
        if (!votesByInitiative[row.initiative_id]) votesByInitiative[row.initiative_id] = [];
        votesByInitiative[row.initiative_id].push({
          voterId: row.voter_id,
          voterName: row.voter_display_name || row.voter_email || 'Nežinomas vartotojas',
          voterEmail: row.voter_email || null,
          score: Number(row.score || 0),
          updatedAt: row.updated_at
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
        votes: votesByInitiative[row.id] || [],
        guidelineLinks: linksByInitiative[row.id] || [],
        guidelineIds: (linksByInitiative[row.id] || []).map((item) => item.guidelineId),
        commentCount: (commentsByInitiative[row.id] || []).length,
        comments: commentsByInitiative[row.id] || []
      }))
    });
  });


  app.put('/api/v1/admin/comments/:commentId/status', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const commentId = String(req.params.commentId || '').trim();
    const status = String(req.body?.status || '').trim().toLowerCase();
    if (!commentId) return res.status(400).json({ error: 'commentId required' });
    if (!['visible', 'hidden'].includes(status)) return res.status(400).json({ error: 'invalid status' });

    const context = await loadCommentContext(commentId);
    if (!context) return res.status(404).json({ error: 'comment not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await setGuidelineCommentStatus({ commentId, status });

    broadcast({
      type: 'v1.comment.status.updated',
      institutionId: req.auth.institutionId,
      guidelineId: context.guideline_id,
      commentId,
      status
    });
    res.json({ ok: true, commentId, status });
  });


  app.put('/api/v1/admin/initiative-comments/:commentId/status', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const commentId = String(req.params.commentId || '').trim();
    const status = String(req.body?.status || '').trim().toLowerCase();
    if (!commentId) return res.status(400).json({ error: 'commentId required' });
    if (!['visible', 'hidden'].includes(status)) return res.status(400).json({ error: 'invalid status' });

    const context = await loadInitiativeCommentContext(commentId);
    if (!context) return res.status(404).json({ error: 'comment not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await setInitiativeCommentStatus({ commentId, status });

    broadcast({
      type: 'v1.initiative.comment.status.updated',
      institutionId: req.auth.institutionId,
      initiativeId: context.initiative_id,
      commentId,
      status
    });
    res.json({ ok: true, commentId, status });
  });


  app.put('/api/v1/admin/cycles/:cycleId/map-layout', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

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
      await setCycleMapPosition({
        cycleId,
        x: parseCoord(institutionPosition.x),
        y: parseCoord(institutionPosition.y)
      });
    }

    if (guidelinePositions.length > 0) {
      const guidelineIds = [...new Set(guidelinePositions.map((item) => item.guidelineId))];
      const validIds = await listExistingGuidelineIds({ cycleId, guidelineIds });
      const invalid = guidelineIds.find((id) => !validIds.has(id));
      if (invalid) return res.status(400).json({ error: 'guideline not in cycle' });

      for (const item of guidelinePositions) {
        await setGuidelineMapPosition({
          cycleId,
          guidelineId: item.guidelineId,
          x: item.x,
          y: item.y
        });
      }
    }

    if (initiativePositions.length > 0) {
      const initiativeIds = [...new Set(initiativePositions.map((item) => item.initiativeId))];
      const validIds = await listExistingInitiativeIds({ cycleId, initiativeIds });
      const invalid = initiativeIds.find((id) => !validIds.has(id));
      if (invalid) return res.status(400).json({ error: 'initiative not in cycle' });

      for (const item of initiativePositions) {
        await setInitiativeMapPosition({
          cycleId,
          initiativeId: item.initiativeId,
          x: item.x,
          y: item.y
        });
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


  app.put('/api/v1/admin/guidelines/:guidelineId', requireAuth, adminWriteGuard, async (req, res) => {
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
      const hasChildren = await hasGuidelineChildren(guidelineId);
      if (hasChildren) {
        return res.status(400).json({ error: 'cannot demote parent with children' });
      }
    }

    await updateGuidelineRecord({
      guidelineId,
      title,
      description,
      status,
      relationType,
      parentGuidelineId,
      lineSide
    });

    broadcast({ type: 'v1.guideline.updated', institutionId: req.auth.institutionId, guidelineId });
    res.json({ ok: true });
  });


  app.put('/api/v1/admin/initiatives/:initiativeId', requireAuth, adminWriteGuard, async (req, res) => {
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

    await updateInitiativeRecord({
      initiativeId,
      title,
      description,
      status,
      lineSide
    });

    await replaceInitiativeGuidelineLinks({
      initiativeId,
      guidelineIds,
      uuid
    });

    broadcast({ type: 'v1.initiative.updated', institutionId: req.auth.institutionId, initiativeId });
    res.json({ ok: true });
  });


  app.delete('/api/v1/admin/initiatives/:initiativeId', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const initiativeId = String(req.params.initiativeId || '').trim();
    if (!initiativeId) return res.status(400).json({ error: 'initiativeId required' });

    const context = await loadInitiativeContext(initiativeId);
    if (!context) return res.status(404).json({ error: 'initiative not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await deleteInitiativeByCycle({ initiativeId, cycleId: context.cycle_id });

    broadcast({ type: 'v1.initiative.deleted', institutionId: req.auth.institutionId, initiativeId });
    res.json({ ok: true, initiativeId });
  });


  app.delete('/api/v1/admin/guidelines/:guidelineId', requireAuth, adminWriteGuard, async (req, res) => {
    if (req.auth.role !== 'institution_admin') return res.status(403).json({ error: 'admin role required' });
    const guidelineId = String(req.params.guidelineId || '').trim();
    if (!guidelineId) return res.status(400).json({ error: 'guidelineId required' });

    const context = await loadGuidelineContext(guidelineId);
    if (!context) return res.status(404).json({ error: 'guideline not found' });
    if (context.institution_id !== req.auth.institutionId) return res.status(403).json({ error: 'cross-institution forbidden' });

    await resetChildrenToOrphan(guidelineId);
    await deleteGuidelineByCycle({ guidelineId, cycleId: context.cycle_id });

    broadcast({ type: 'v1.guideline.deleted', institutionId: req.auth.institutionId, guidelineId });
    res.json({ ok: true, guidelineId });
  });

}

module.exports = { registerAdminRoutes };


const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const Module = require('node:module');

function mockModule(modulePath, exportsValue) {
  const resolved = require.resolve(modulePath);
  const previous = require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportsValue
  };
  return () => {
    if (previous) require.cache[resolved] = previous;
    else delete require.cache[resolved];
  };
}

function mockBareModule(moduleName, exportsValue) {
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === moduleName) return exportsValue;
    return originalLoad.call(this, request, parent, isMain);
  };
  return () => {
    Module._load = originalLoad;
  };
}

function matchPath(pattern, pathname) {
  const patternParts = String(pattern || '').split('/').filter(Boolean);
  const pathParts = String(pathname || '').split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = pathParts[index];
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
      continue;
    }
    if (expected !== actual) return null;
  }
  return params;
}

function createMiniApp() {
  const routes = [];

  function register(method, path, handlers) {
    routes.push({ method, path, handlers });
  }

  return {
    use() {},
    get(path, ...handlers) {
      register('GET', path, handlers);
    },
    post(path, ...handlers) {
      register('POST', path, handlers);
    },
    put(path, ...handlers) {
      register('PUT', path, handlers);
    },
    delete(path, ...handlers) {
      register('DELETE', path, handlers);
    },
    handler(req, res) {
      const url = new URL(req.url, 'http://127.0.0.1');
      const route = routes.find((item) => item.method === req.method && matchPath(item.path, url.pathname));
      if (!route) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'not found' }));
        return;
      }

      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        let body = {};
        const raw = Buffer.concat(chunks).toString('utf8');
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            body = {};
          }
        }
        req.params = matchPath(route.path, url.pathname) || {};
        req.body = body;
        req.query = Object.fromEntries(url.searchParams.entries());

        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (payload) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        let index = 0;
        const next = (error) => {
          if (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(error?.message || error || 'internal server error') }));
            return;
          }
          const handler = route.handlers[index];
          index += 1;
          if (!handler) return;
          try {
            const maybePromise = handler(req, res, next);
            if (maybePromise && typeof maybePromise.then === 'function') maybePromise.catch(next);
          } catch (handlerError) {
            next(handlerError);
          }
        };
        next();
      });
    }
  };
}

async function startServer(app) {
  const server = http.createServer((req, res) => app.handler(req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function buildApp({
  auth = { institutionId: 'inst-1', sub: 'user-1', role: 'institution_admin' },
  createGuideline = async () => 'guideline-1',
  createInitiativeWithGuidelines = async () => 'initiative-1',
  validateGuidelineRelationship = async ({ parentGuidelineId }) => parentGuidelineId || null,
  validateInitiativeGuidelineAssignments = async ({ guidelineIds }) => guidelineIds,
  verifyCycleAccess = async () => ({ ok: true, status: 200, cycle: { strategy_id: 'strategy-1', state: 'open' } })
} = {}) {
  const teardown = [];
  teardown.push(mockBareModule('multer', Object.assign(
    () => ({
      array: () => (_req, _res, next) => next()
    }),
    {
      memoryStorage: () => ({})
    }
  )));
  teardown.push(mockModule('../src/db', {
    pool: {
      connect: async () => ({
        query: async () => ({ rows: [], rowCount: 0 }),
        release() {}
      })
    }
  }));
  teardown.push(mockModule('../src/passwordResetService', {
    createPasswordResetToken: async () => null,
    ensurePasswordResetTable: async () => {}
  }));
  teardown.push(mockModule('../src/aiStrategyService', {
    extractPdfTexts: async () => [],
    getAiStrategyConfig: () => ({ provider: 'openai', model: 'test-model', timeoutMs: 1000 }),
    generateStrategyFromAi: async () => ({
      normalized: {
        strategyTitle: 'Strategy',
        cycleTitle: 'Cycle',
        strategyDescription: '',
        missionText: '',
        visionText: '',
        guidelines: [],
        initiatives: []
      },
      model: 'test-model'
    })
  }));
  teardown.push(mockModule('../src/services/aiProviderService', {
    normalizeAiProvider: () => 'openai',
    resolveInstitutionAiSettings: async () => ({ provider: 'openai' }),
    resolveInstitutionModelOverride: () => ''
  }));

  const modulePath = require.resolve('../src/adminRoutes');
  delete require.cache[modulePath];
  const { registerAdminRoutes } = require('../src/adminRoutes');

  const app = createMiniApp();
  const broadcasts = [];
  registerAdminRoutes({
    app,
    query: async () => ({ rows: [], rowCount: 0 }),
    broadcast: (message) => broadcasts.push(message),
    uuid: () => 'uuid-1',
    adminWriteRateLimit: (_req, _res, next) => next(),
    strategyCreateRateLimit: (_req, _res, next) => next(),
    trafficMonitor: null,
    crypto: require('node:crypto'),
    hashPassword: () => 'hash',
    normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
    sha256: () => 'hash',
    slugify: (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '-'),
    inviteTtlHours: 72,
    requireAuth: (req, _res, next) => {
      req.auth = auth;
      next();
    },
    verifyCycleAccess,
    isCycleWritable: (state) => state === 'open',
    normalizeLineSide: () => 'auto',
    loadGuidelineContext: async () => null,
    loadCommentContext: async () => null,
    loadInitiativeContext: async () => null,
    loadInitiativeCommentContext: async () => null,
    validateGuidelineRelationship,
    validateInitiativeGuidelineAssignments,
    listCyclePendingProposals: async () => [],
    reviewPendingProposal: async () => ({}),
    createInstitutionInvite: async () => ({}),
    setCycleState: async () => {},
    setCycleSettings: async () => {},
    setCycleResultsPublished: async () => {},
    updatePlatformUserPassword: async () => {},
    deleteInstitutionMembership: async () => {},
    countUserMemberships: async () => 0,
    deletePlatformUser: async () => {},
    setGuidelineCommentStatus: async () => {},
    setInitiativeCommentStatus: async () => {},
    setCycleMapPosition: async () => {},
    listExistingGuidelineIds: async () => new Set(),
    setGuidelineMapPosition: async () => {},
    listExistingInitiativeIds: async () => new Set(),
    setInitiativeMapPosition: async () => {},
    hasGuidelineChildren: async () => false,
    updateGuidelineRecord: async () => {},
    updateInitiativeRecord: async () => {},
    createGuideline,
    createInitiativeWithGuidelines,
    replaceInitiativeGuidelineLinks: async () => {},
    deleteInitiativeByCycle: async () => {},
    resetChildrenToOrphan: async () => {},
    deleteGuidelineByCycle: async () => {},
    createGuidelineDeletionHistoryEntry: async () => {}
  });

  return {
    app,
    broadcasts,
    teardown: () => {
      delete require.cache[modulePath];
      teardown.reverse().forEach((restore) => restore());
    }
  };
}

test('POST /api/v1/admin/cycles/:cycleId/initiatives creates an active initiative for admins', async () => {
  const calls = [];
  const fixture = buildApp({
    createInitiativeWithGuidelines: async (payload) => {
      calls.push(payload);
      return 'initiative-123';
    },
    validateInitiativeGuidelineAssignments: async ({ guidelineIds }) => guidelineIds
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/admin/cycles/cycle-1/initiatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Immediate initiative',
        description: 'Create directly from gremlin',
        guidelineIds: ['guideline-1']
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 201);
    assert.equal(payload.initiativeId, 'initiative-123');
    assert.equal(payload.status, 'active');
    assert.equal(calls[0]?.cycleId, 'cycle-1');
    assert.equal(calls[0]?.title, 'Immediate initiative');
    assert.equal(calls[0]?.description, 'Create directly from gremlin');
    assert.deepEqual(calls[0]?.guidelineIds, ['guideline-1']);
    assert.equal(calls[0]?.createdBy, 'user-1');
    assert.equal(typeof calls[0]?.uuid, 'function');
    assert.equal(fixture.broadcasts[0]?.type, 'v1.initiative.created');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/admin/cycles/:cycleId/initiatives rejects non-admin users', async () => {
  const fixture = buildApp({
    auth: { institutionId: 'inst-1', sub: 'user-1', role: 'member' }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/admin/cycles/cycle-1/initiatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Immediate initiative',
        guidelineIds: ['guideline-1']
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 403);
    assert.equal(payload.error, 'admin role required');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/admin/cycles/:cycleId/guidelines creates an active guideline for admins', async () => {
  const createCalls = [];
  const relationCalls = [];
  const fixture = buildApp({
    createGuideline: async (payload) => {
      createCalls.push(payload);
      return 'guideline-123';
    },
    validateGuidelineRelationship: async (payload) => {
      relationCalls.push(payload);
      return payload.parentGuidelineId || null;
    }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/admin/cycles/cycle-1/guidelines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Immediate guideline',
        description: 'Create directly from gremlin',
        relationType: 'child',
        parentGuidelineId: 'guideline-parent-1'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 201);
    assert.equal(payload.guidelineId, 'guideline-123');
    assert.equal(payload.status, 'active');
    assert.deepEqual(relationCalls[0], {
      cycleId: 'cycle-1',
      relationType: 'child',
      parentGuidelineId: 'guideline-parent-1'
    });
    assert.equal(createCalls[0]?.cycleId, 'cycle-1');
    assert.equal(createCalls[0]?.title, 'Immediate guideline');
    assert.equal(createCalls[0]?.description, 'Create directly from gremlin');
    assert.equal(createCalls[0]?.relationType, 'child');
    assert.equal(createCalls[0]?.parentGuidelineId, 'guideline-parent-1');
    assert.equal(createCalls[0]?.lineSide, 'auto');
    assert.equal(createCalls[0]?.createdBy, 'user-1');
    assert.equal(typeof createCalls[0]?.uuid, 'function');
    assert.equal(fixture.broadcasts[0]?.type, 'v1.guideline.created');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/admin/cycles/:cycleId/guidelines rejects non-admin users', async () => {
  const fixture = buildApp({
    auth: { institutionId: 'inst-1', sub: 'user-1', role: 'member' }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/admin/cycles/cycle-1/guidelines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Immediate guideline'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 403);
    assert.equal(payload.error, 'admin role required');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

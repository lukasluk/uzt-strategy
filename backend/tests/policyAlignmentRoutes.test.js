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

  const app = {
    use() {},
    get(path, ...handlers) {
      register('GET', path, handlers);
    },
    post(path, ...handlers) {
      register('POST', path, handlers);
    },
    handler(req, res) {
      const url = new URL(req.url, 'http://127.0.0.1');
      const route = routes.find((item) => item.method === req.method && matchPath(item.path, url.pathname));
      if (!route) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'not found' }));
        return;
      }

      const params = matchPath(route.path, url.pathname) || {};
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
        req.params = params;
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
            if (maybePromise && typeof maybePromise.then === 'function') {
              maybePromise.catch(next);
            }
          } catch (handlerError) {
            next(handlerError);
          }
        };
        next();
      });
    }
  };

  return app;
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

function buildAppWithRouteMocks({
  frameworks = [],
  frameworkDetail = null,
  createdFramework = null,
  analyses = [],
  createdAnalysis = null,
  deleteFramework = async () => true,
  deleteAnalysis = async () => true,
  getAnalysisById = async () => null,
  verifyCycleAccess = async () => ({ ok: true, status: 200, cycle: { strategy_id: 'strategy-1' } }),
  auth = { institutionId: 'inst-1', sub: 'user-1', role: 'institution_admin' }
} = {}) {
  const teardown = [];
  teardown.push(mockModule('../src/db', {
    pool: {
      query: async () => ({ rows: [], rowCount: 0 }),
      connect: async () => ({
        query: async () => ({ rows: [], rowCount: 0 }),
        release() {}
      })
    }
  }));
  teardown.push(mockBareModule('multer', Object.assign(
    () => ({
      array: () => (_req, _res, next) => next()
    }),
    {
      memoryStorage: () => ({})
    }
  )));
  teardown.push(mockModule('../src/security', {
    sha256: () => 'hash'
  }));
  teardown.push(mockModule('../src/aiStrategyService', {
    extractPdfTexts: async () => []
  }));
  teardown.push(mockModule('../src/services/policyAlignmentPipelineService', {
    createPolicyAlignmentPipelineService: () => ({
      buildDocumentChunks: () => [],
      extractRequirementsFromTargetDocuments: async () => ({
        requirements: [{ title: 'Requirement A', description: 'Description A', theme: 'General' }],
        chunks: [],
        model: 'test-model'
      }),
      loadFrameworkRequirements: async () => [],
      buildSourceReferences: async () => ({ refs: [] }),
      compareRequirementsToSource: async () => ({ requirements: [], sourceRefs: [], findings: [], suggestions: [], summary: {}, model: 'test-model' })
    }),
    normalizeLocaleHint: (value) => String(value || 'en').trim().toLowerCase() || 'en'
  }));
  teardown.push(mockModule('../src/services/policyAlignmentService', {
    createPolicyAlignmentService: () => ({
      listAnalysesForCycle: async () => analyses,
      listFrameworksForCycle: async () => frameworks,
      getFrameworkById: async () => frameworkDetail,
      createFramework: async () => createdFramework || frameworkDetail || null,
      createAnalysis: async () => createdAnalysis || null,
      getAnalysisById,
      setAnalysisStatus: async () => {},
      updateAnalysisSummary: async () => {},
      createDocument: async () => null,
      replaceDocumentChunks: async () => [],
      replaceRequirements: async () => [],
      replaceSourceRefs: async () => [],
      replaceFindings: async () => [],
      replaceSuggestions: async () => [],
      deleteAnalysis,
      deleteFramework
    })
  }));

  const routePath = require.resolve('../src/policyAlignmentRoutes');
  delete require.cache[routePath];
  const { registerPolicyAlignmentRoutes } = require('../src/policyAlignmentRoutes');

  const app = createMiniApp();
  registerPolicyAlignmentRoutes({
    app,
    uuid: () => 'uuid-1',
    memberWriteRateLimit: (_req, _res, next) => next(),
    requireAuth: (req, _res, next) => {
      req.auth = auth;
      next();
    },
    verifyCycleAccess,
    loadGuidelineContext: async () => null,
    loadInitiativeContext: async () => null,
    createGuidelineProposal: async () => 'proposal-1',
    createInitiativeProposal: async () => 'proposal-2'
  });

  return {
    app,
    teardown: () => {
      delete require.cache[routePath];
      teardown.reverse().forEach((restore) => restore());
    }
  };
}

test('GET /api/v1/cycles/:cycleId/policy-alignment-frameworks returns framework list', async () => {
  const fixture = buildAppWithRouteMocks({
    frameworks: [{
      id: 'framework-1',
      institutionId: 'inst-1',
      cycleId: 'cycle-1',
      title: 'EU Digital Policy',
      requirementCount: 12,
      documentCount: 1,
      createdAt: '2026-03-06T10:00:00.000Z',
      updatedAt: '2026-03-06T10:00:00.000Z'
    }]
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/policy-alignment-frameworks`);
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.frameworks.length, 1);
    assert.equal(payload.frameworks[0].title, 'EU Digital Policy');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/cycles/:cycleId/policy-alignment-frameworks requires admin role', async () => {
  const fixture = buildAppWithRouteMocks({
    auth: { institutionId: 'inst-1', sub: 'user-1', role: 'member' }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/policy-alignment-frameworks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const payload = await readJson(response);
    assert.equal(response.status, 403);
    assert.equal(payload.error, 'admin role required');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('GET /api/v1/policy-alignment-frameworks/:frameworkId rejects cross-institution access', async () => {
  const fixture = buildAppWithRouteMocks({
    frameworkDetail: {
      id: 'framework-2',
      institutionId: 'other-inst',
      cycleId: 'cycle-1',
      title: 'Restricted Framework',
      documents: [],
      requirements: []
    }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/policy-alignment-frameworks/framework-2`);
    const payload = await readJson(response);
    assert.equal(response.status, 403);
    assert.equal(payload.error, 'analysis access forbidden');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/cycles/:cycleId/policy-alignments validates framework target mode', async () => {
  const fixture = buildAppWithRouteMocks();
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/policy-alignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Framework-based analysis',
        targetMode: 'framework'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 400);
    assert.equal(payload.error, 'analysis target framework required');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/cycles/:cycleId/policy-alignments requires admin role', async () => {
  const fixture = buildAppWithRouteMocks({
    auth: { institutionId: 'inst-1', sub: 'user-1', role: 'member' }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/policy-alignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Framework-based analysis',
        targetMode: 'framework',
        targetFrameworkId: 'framework-1',
        sourceMode: 'mixed'
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

test('POST /api/v1/cycles/:cycleId/policy-alignments creates framework-based analysis', async () => {
  const fixture = buildAppWithRouteMocks({
    createdAnalysis: {
      id: 'analysis-1',
      institutionId: 'inst-1',
      cycleId: 'cycle-1',
      targetFrameworkId: 'framework-1',
      title: 'Framework-based analysis',
      sourceMode: 'mixed',
      targetMode: 'framework',
      status: 'draft'
    }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/policy-alignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Framework-based analysis',
        targetMode: 'framework',
        targetFrameworkId: 'framework-1',
        sourceMode: 'mixed'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 201);
    assert.equal(payload.analysis.targetMode, 'framework');
    assert.equal(payload.analysis.targetFrameworkId, 'framework-1');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/policy-alignments/:analysisId/delete requires admin role', async () => {
  const fixture = buildAppWithRouteMocks({
    auth: { institutionId: 'inst-1', sub: 'user-1', role: 'member' }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/policy-alignments/analysis-1/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const payload = await readJson(response);
    assert.equal(response.status, 403);
    assert.equal(payload.error, 'admin role required');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/policy-alignment-frameworks/:frameworkId/delete requires admin role', async () => {
  const fixture = buildAppWithRouteMocks({
    auth: { institutionId: 'inst-1', sub: 'user-1', role: 'member' }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/policy-alignment-frameworks/framework-1/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const payload = await readJson(response);
    assert.equal(response.status, 403);
    assert.equal(payload.error, 'admin role required');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/policy-alignment-frameworks/:frameworkId/delete removes framework for admin', async () => {
  let deletedId = '';
  const fixture = buildAppWithRouteMocks({
    frameworkDetail: {
      id: 'framework-1',
      institutionId: 'inst-1',
      cycleId: 'cycle-1',
      title: 'Framework',
      documents: [],
      requirements: []
    },
    deleteFramework: async (frameworkId) => {
      deletedId = frameworkId;
      return true;
    }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/policy-alignment-frameworks/framework-1/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.frameworkId, 'framework-1');
    assert.equal(deletedId, 'framework-1');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('POST /api/v1/policy-alignments/:analysisId/delete removes analysis for admin', async () => {
  let deletedId = '';
  const fixture = buildAppWithRouteMocks({
    getAnalysisById: async () => ({
      id: 'analysis-1',
      institutionId: 'inst-1',
      cycleId: 'cycle-1',
      documents: [],
      findings: [],
      suggestions: []
    }),
    deleteAnalysis: async (analysisId) => {
      deletedId = analysisId;
      return true;
    }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/policy-alignments/analysis-1/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.analysisId, 'analysis-1');
    assert.equal(deletedId, 'analysis-1');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

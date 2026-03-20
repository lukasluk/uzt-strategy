const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

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
        req.body = body;
        req.params = matchPath(route.path, url.pathname) || {};
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

function createStore({ usage, jobs } = {}) {
  const usageState = {
    used: Number(usage?.used || 0),
    extra: Math.max(0, Number(usage?.extra || 0)),
    title: String(usage?.title || 'Strategy One')
  };
  const jobsById = new Map();
  for (const job of Array.isArray(jobs) ? jobs : []) {
    jobsById.set(job.id, {
      provider: 'openai',
      model: null,
      analysis_json: {},
      created_at: job.created_at || new Date().toISOString(),
      ...job
    });
  }
  return { usageState, jobsById };
}

function buildFixture({
  analyzeStrategyPage,
  store = createStore(),
  forceUsageRefreshFailure = false,
  limitReached = false
} = {}) {
  const teardown = [];
  const configCalls = [];
  teardown.push(mockModule('../src/services/clarityGremlinService', {
    analyzeStrategyPage: analyzeStrategyPage || (async () => {
      throw new Error('analysis pipeline exploded');
    }),
    getClarityGremlinConfig: (options = {}) => {
      configCalls.push(options);
      return {
        provider: options.provider || 'openai',
        model: options.modelOverride || 'test-model',
        timeoutMs: 1000
      };
    }
  }));
  teardown.push(mockModule('../src/services/aiProviderService', {
    normalizeAiProvider: (value) => String(value || '').trim().toLowerCase() === 'mistral' ? 'mistral' : 'openai',
    isProviderCompatibleModel: (provider, model) => {
      const modelText = String(model || '').trim();
      if (!modelText) return false;
      return String(provider || '').trim().toLowerCase() === 'mistral'
        ? /mistral/i.test(modelText)
        : !/mistral/i.test(modelText);
    },
    resolveInstitutionAiSettings: async () => ({
      provider: 'openai',
      openaiModel: 'test-model',
      mistralModel: 'mistral-small-latest'
    }),
    resolveInstitutionModelOverride: (settings, provider) => (
      String(provider || '').trim().toLowerCase() === 'mistral'
        ? String(settings?.mistralModel || '').trim()
        : String(settings?.openaiModel || '').trim()
    )
  }));

  const modulePath = require.resolve('../src/clarityGremlinRoutes');
  delete require.cache[modulePath];
  const { registerClarityGremlinRoutes } = require('../src/clarityGremlinRoutes');

  const app = createMiniApp();
  const calls = [];
  const query = async (sql, params = []) => {
    const text = String(sql);
    calls.push(text);

    if (/update institution_strategies s/i.test(text)) {
      if (limitReached) return { rows: [], rowCount: 0 };
      store.usageState.used += 1;
      return {
        rows: [{
          id: 'strategy-1',
          title: store.usageState.title,
          clarity_gremlin_calls_used: store.usageState.used,
          clarity_gremlin_extra_scans: store.usageState.extra
        }],
        rowCount: 1
      };
    }

    if (/select s\.id,/i.test(text)) {
      if (forceUsageRefreshFailure) throw new Error('usage refresh failed');
      return {
        rows: [{
          id: 'strategy-1',
          title: store.usageState.title,
          clarity_gremlin_calls_used: store.usageState.used,
          clarity_gremlin_extra_scans: store.usageState.extra
        }],
        rowCount: 1
      };
    }

    if (/insert into clarity_gremlin_analyses/i.test(text)) {
      const [id, institutionId, strategyId, cycleId, view, entityKind, entityId, pageLabel, contextLabel, locale, createdBy] = params;
      const now = new Date().toISOString();
      store.jobsById.set(id, {
        id,
        institution_id: institutionId,
        strategy_id: strategyId,
        cycle_id: cycleId,
        view,
        entity_kind: entityKind,
        entity_id: entityId,
        page_label: pageLabel,
        context_label: contextLabel,
        locale,
        provider: 'openai',
        model: null,
        analysis_json: {},
        created_by: createdBy,
        created_at: now,
        started_at: now,
        completed_at: null,
        failed_at: null,
        error_message: null,
        status: 'running'
      });
      return { rows: [], rowCount: 1 };
    }

    if (/select id, strategy_id\s+from clarity_gremlin_analyses/i.test(text)) {
      const [cycleId, jobId, institutionId, strategyId, cutoffIso] = params;
      const cutoff = Date.parse(String(cutoffIso || ''));
      const rows = [...store.jobsById.values()]
        .filter((job) => {
          const startedAt = Date.parse(String(job.started_at || job.created_at || '')) || 0;
          if (job.status !== 'running') return false;
          if (cycleId && job.cycle_id !== cycleId) return false;
          if (jobId && job.id !== jobId) return false;
          if (institutionId && job.institution_id !== institutionId) return false;
          if (strategyId && job.strategy_id !== strategyId) return false;
          return startedAt <= cutoff;
        })
        .map((job) => ({ id: job.id, strategy_id: job.strategy_id }));
      return { rows, rowCount: rows.length };
    }

    if (/where id = \$1\s+and coalesce\(status, 'completed'\) = 'running'\s+returning strategy_id/i.test(text)) {
      const [id, errorMessage] = params;
      const job = store.jobsById.get(id);
      if (!job || job.status !== 'running') return { rows: [], rowCount: 0 };
      job.status = 'failed';
      job.error_message = errorMessage;
      job.failed_at = new Date().toISOString();
      store.jobsById.set(id, job);
      return { rows: [{ strategy_id: job.strategy_id }], rowCount: 1 };
    }

    if (/set clarity_gremlin_calls_used = greatest/i.test(text)) {
      store.usageState.used = Math.max(0, store.usageState.used - 1);
      return { rows: [], rowCount: 1 };
    }

    if (/select id,\s+institution_id,\s+strategy_id,\s+cycle_id,/i.test(text) && /from clarity_gremlin_analyses/i.test(text)) {
      const [jobId, cycleId, institutionId] = params;
      const job = store.jobsById.get(jobId);
      if (!job) return { rows: [], rowCount: 0 };
      if (job.cycle_id !== cycleId || job.institution_id !== institutionId) return { rows: [], rowCount: 0 };
      return { rows: [job], rowCount: 1 };
    }

    if (/update clarity_gremlin_analyses\s+set view = \$2,/i.test(text)) {
      const [id, view, entityKind, entityId, pageLabel, contextLabel, locale, provider, model, analysisJson] = params;
      const job = store.jobsById.get(id);
      if (!job) return { rows: [], rowCount: 0 };
      job.view = view;
      job.entity_kind = entityKind;
      job.entity_id = entityId;
      job.page_label = pageLabel;
      job.context_label = contextLabel;
      job.locale = locale;
      job.provider = provider;
      job.model = model;
      job.analysis_json = JSON.parse(analysisJson);
      job.status = 'completed';
      job.error_message = null;
      job.completed_at = new Date().toISOString();
      store.jobsById.set(id, job);
      return { rows: [], rowCount: 1 };
    }

    if (/update clarity_gremlin_analyses\s+set status = 'failed',/i.test(text)) {
      const [id, errorMessage] = params;
      const job = store.jobsById.get(id);
      if (!job) return { rows: [], rowCount: 0 };
      job.status = 'failed';
      job.error_message = errorMessage;
      job.failed_at = new Date().toISOString();
      store.jobsById.set(id, job);
      return { rows: [], rowCount: 1 };
    }

    if (/select a\.id,/i.test(text) && /from clarity_gremlin_analyses a/i.test(text)) {
      const [strategyId] = params;
      const rows = [...store.jobsById.values()]
        .filter((job) => job.strategy_id === strategyId && (job.status || 'completed') === 'completed')
        .sort((left, right) => Date.parse(String(right.created_at || '')) - Date.parse(String(left.created_at || '')))
        .slice(0, 24)
        .map((job) => ({
          id: job.id,
          view: job.view,
          entity_kind: job.entity_kind || null,
          entity_id: job.entity_id || null,
          page_label: job.page_label || '',
          context_label: job.context_label || '',
          locale: job.locale || 'lt',
          provider: job.provider || null,
          model: job.model || null,
          analysis_json: job.analysis_json || {},
          created_at: job.created_at,
          created_by_name: null
        }));
      return { rows, rowCount: rows.length };
    }

    if (/select id, institution_id, cycle_id, analysis_json/i.test(text)) {
      const [analysisId, cycleId] = params;
      const job = store.jobsById.get(analysisId);
      if (!job || job.cycle_id !== cycleId) return { rows: [], rowCount: 0 };
      return {
        rows: [{
          id: job.id,
          institution_id: job.institution_id,
          cycle_id: job.cycle_id,
          analysis_json: job.analysis_json || {}
        }],
        rowCount: 1
      };
    }

    if (/update clarity_gremlin_analyses\s+set analysis_json = \$2::jsonb/i.test(text)) {
      const [analysisId, analysisJson] = params;
      const job = store.jobsById.get(analysisId);
      if (!job) return { rows: [], rowCount: 0 };
      job.analysis_json = JSON.parse(analysisJson);
      store.jobsById.set(analysisId, job);
      return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  };

  registerClarityGremlinRoutes({
    app,
    query,
    uuid: () => 'job-1',
    requireAuth: (req, _res, next) => {
      req.auth = {
        institutionId: 'inst-1',
        sub: 'user-1',
        role: 'institution_admin'
      };
      next();
    },
    verifyCycleAccess: async () => ({
      ok: true,
      status: 200,
      cycle: { strategy_id: 'strategy-1' }
    }),
    memberWriteRateLimit: (_req, _res, next) => next()
  });

  return {
    app,
    calls,
    configCalls,
    store,
    teardown: () => {
      delete require.cache[modulePath];
      teardown.reverse().forEach((restore) => restore());
    }
  };
}

test('POST /api/v1/cycles/:cycleId/clarity-gremlin still reports a failed job when quota refresh fails', async () => {
  const fixture = buildFixture({
    forceUsageRefreshFailure: true
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/clarity-gremlin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        view: 'guidelines',
        locale: 'en'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.pending, true);
    assert.equal(payload.jobId, 'job-1');
    assert.equal(payload.usage.used, 1);

    await new Promise((resolve) => setTimeout(resolve, 25));

    const pollResponse = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/clarity-gremlin/jobs/job-1`);
    const pollPayload = await readJson(pollResponse);
    assert.equal(pollResponse.status, 200);
    assert.equal(pollPayload.ok, false);
    assert.equal(pollPayload.status, 'failed');
    assert.equal(pollPayload.error, 'analysis pipeline exploded');
    assert.equal(pollPayload.usage.used, 1);
    assert.ok(fixture.calls.some((sql) => /set clarity_gremlin_calls_used = greatest/i.test(sql)));
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('completed jobs remain pollable after process restart via persisted analysis rows', async () => {
  const store = createStore();
  const fixture = buildFixture({
    store,
    analyzeStrategyPage: async () => ({
      page: {
        view: 'guidelines',
        entityKind: null,
        entityId: null,
        label: 'Guidelines',
        contextLabel: 'Guidelines'
      },
      model: 'test-model',
      analysis: {
        pageLabel: 'Guidelines',
        summary: 'ok'
      }
    })
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/clarity-gremlin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        view: 'guidelines',
        locale: 'en'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.jobId, 'job-1');
    await new Promise((resolve) => setTimeout(resolve, 25));
  } finally {
    await server.close();
    fixture.teardown();
  }

  const restartedFixture = buildFixture({ store });
  const restartedServer = await startServer(restartedFixture.app);
  try {
    const pollResponse = await fetch(`${restartedServer.baseUrl}/api/v1/cycles/cycle-1/clarity-gremlin/jobs/job-1`);
    const pollPayload = await readJson(pollResponse);
    assert.equal(pollResponse.status, 200);
    assert.equal(pollPayload.ok, true);
    assert.equal(pollPayload.pending, false);
    assert.equal(pollPayload.status, 'completed');
    assert.equal(pollPayload.historyEntryId, 'job-1');
    assert.equal(pollPayload.model, 'test-model');
    assert.equal(pollPayload.analysis.summary, 'ok');
  } finally {
    await restartedServer.close();
    restartedFixture.teardown();
  }
});

test('POST /api/v1/cycles/:cycleId/clarity-gremlin uses requested provider and model override', async () => {
  const analyzeCalls = [];
  const fixture = buildFixture({
    analyzeStrategyPage: async (payload) => {
      analyzeCalls.push(payload);
      return {
        page: {
          view: 'guidelines',
          entityKind: null,
          entityId: null,
          label: 'Guidelines',
          contextLabel: 'Guidelines'
        },
        model: payload?.aiConfig?.model || null,
        analysis: {
          pageLabel: 'Guidelines',
          summary: 'ok'
        }
      };
    }
  });
  const server = await startServer(fixture.app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/clarity-gremlin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        view: 'guidelines',
        locale: 'en',
        provider: 'mistral',
        model: 'mistral-medium-latest'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.pending, true);
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.deepEqual(fixture.configCalls[0], {
      provider: 'mistral',
      modelOverride: 'mistral-medium-latest'
    });
    assert.equal(analyzeCalls[0]?.locale, 'en');
    assert.equal(analyzeCalls[0]?.aiConfig?.provider, 'mistral');
    assert.equal(analyzeCalls[0]?.aiConfig?.model, 'mistral-medium-latest');
  } finally {
    await server.close();
    fixture.teardown();
  }
});

test('stale running jobs are failed and release quota before polling', async () => {
  const store = createStore({
    usage: { used: 3 },
    jobs: [{
      id: 'job-1',
      institution_id: 'inst-1',
      strategy_id: 'strategy-1',
      cycle_id: 'cycle-1',
      view: 'guidelines',
      entity_kind: null,
      entity_id: null,
      page_label: 'guidelines',
      context_label: 'guidelines',
      locale: 'lt',
      status: 'running',
      started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }]
  });
  const fixture = buildFixture({ store });
  const server = await startServer(fixture.app);
  try {
    const pollResponse = await fetch(`${server.baseUrl}/api/v1/cycles/cycle-1/clarity-gremlin/jobs/job-1`);
    const pollPayload = await readJson(pollResponse);
    assert.equal(pollResponse.status, 200);
    assert.equal(pollPayload.ok, false);
    assert.equal(pollPayload.status, 'failed');
    assert.equal(pollPayload.error, 'Analysis run was interrupted. Please run it again.');
    assert.equal(pollPayload.usage.used, 2);
    assert.equal(store.usageState.used, 2);
  } finally {
    await server.close();
    fixture.teardown();
  }
});

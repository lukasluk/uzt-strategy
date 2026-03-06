const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

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

function buildFixture({ queryImpl } = {}) {
  const app = createMiniApp();
  const { registerPublicRoutes } = require('../src/publicRoutes');
  registerPublicRoutes({
    app,
    query: queryImpl || (async () => ({ rows: [], rowCount: 0 })),
    publicReadRateLimit: (_req, _res, next) => next(),
    publicWriteRateLimit: (_req, _res, next) => next(),
    trafficMonitor: null,
    normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
    getInstitutionBySlug: async () => null,
    resolveInstitutionStrategy: async () => null,
    getCurrentCycle: async () => null,
    normalizeLineSide: (value) => value,
    authSecret: null,
    loadPublicPendingProposals: async () => [],
    listPublicProposalComments: async () => [],
    resolveProposalAlias: async () => null
  });
  return app;
}

test('POST /api/v1/public/access-requests ignores honeypot submissions without persisting', async () => {
  const calls = [];
  const app = buildFixture({
    queryImpl: async (...args) => {
      calls.push(args);
      return { rows: [], rowCount: 0 };
    }
  });
  const server = await startServer(app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/public/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionName: 'Test Institution',
        fullName: 'Spam Bot',
        workEmail: 'bot@example.com',
        phone: '+37060000000',
        notes: 'hello',
        organizationWebsite: 'https://spam.invalid'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 201);
    assert.equal(payload.ok, true);
    assert.equal(payload.status, 'pending');
    assert.match(String(payload.requestCode || ''), /^REQ-\d{8}-[A-F0-9]{8}$/);
    assert.equal(calls.length, 0);
  } finally {
    await server.close();
  }
});

test('POST /api/v1/public/access-requests persists normal submissions', async () => {
  const calls = [];
  const app = buildFixture({
    queryImpl: async (sql, params) => {
      calls.push({ sql, params });
      return {
        rows: [{
          id: 'request-1',
          request_code: 'REQ-20260307-ABCDEF12',
          status: 'pending',
          created_at: '2026-03-07T10:00:00.000Z'
        }],
        rowCount: 1
      };
    }
  });
  const server = await startServer(app);
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/public/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionName: 'Test Institution',
        fullName: 'Real User',
        workEmail: 'user@example.com',
        phone: '+37060000000',
        notes: 'Need access'
      })
    });
    const payload = await readJson(response);
    assert.equal(response.status, 201);
    assert.equal(payload.requestId, 'request-1');
    assert.equal(payload.requestCode, 'REQ-20260307-ABCDEF12');
    assert.equal(calls.length, 1);
    assert.match(String(calls[0].sql || ''), /insert into access_requests/i);
  } finally {
    await server.close();
  }
});

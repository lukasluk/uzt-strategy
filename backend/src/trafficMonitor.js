const MAX_PATH_BUCKETS = 600;
const MAX_RECENT_RATE_LIMIT_EVENTS = 120;
const MAX_EMBED_INSTITUTIONS = 400;

function normalizePath(pathname) {
  const raw = String(pathname || '').trim();
  if (!raw) return '/';
  return raw
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/[0-9]{3,}(?=\/|$)/g, '/:num');
}

function categorizePath(pathname) {
  const path = normalizePath(pathname);
  if (path.startsWith('/api/v1/public/')) return 'public';
  if (path.startsWith('/api/v1/auth/') || path.startsWith('/api/v1/invites/')) return 'auth';
  if (path.startsWith('/api/v1/meta-admin/')) return 'meta-admin';
  if (path.startsWith('/api/v1/admin/')) return 'admin';
  if (path.startsWith('/api/v1/cycles/') || path.startsWith('/api/v1/guidelines/') || path.startsWith('/api/v1/initiatives/')) {
    return 'member';
  }
  if (path === '/api/v1/health') return 'health';
  return 'other';
}

function statusBucket(statusCode) {
  const code = Number(statusCode || 0);
  if (code >= 500) return '5xx';
  if (code >= 400) return '4xx';
  if (code >= 300) return '3xx';
  if (code >= 200) return '2xx';
  return 'other';
}

function incrementMap(map, key, amount = 1) {
  const current = Number(map.get(key) || 0);
  map.set(key, current + amount);
}

function clampMapSize(map, maxSize) {
  while (map.size > maxSize) {
    const firstKey = map.keys().next().value;
    if (typeof firstKey === 'undefined') break;
    map.delete(firstKey);
  }
}

class TrafficMonitor {
  constructor() {
    this.startedAt = new Date().toISOString();
    this.requestTotal = 0;
    this.requestsByCategory = new Map();
    this.requestsByStatusBucket = new Map();
    this.requestsByPath = new Map();
    this.rateLimitBlockedTotal = 0;
    this.rateLimitBlockedByLimiter = new Map();
    this.recentRateLimitEvents = [];
    this.embedViewTotal = 0;
    this.embedViewsByInstitution = new Map();
  }

  trackRequest({ method, path, statusCode }) {
    this.requestTotal += 1;
    const normalizedPath = normalizePath(path);
    const category = categorizePath(path);
    const status = statusBucket(statusCode);
    const methodKey = String(method || 'GET').trim().toUpperCase();
    const pathKey = `${methodKey} ${normalizedPath}`;
    incrementMap(this.requestsByCategory, category, 1);
    incrementMap(this.requestsByStatusBucket, status, 1);
    incrementMap(this.requestsByPath, pathKey, 1);
    clampMapSize(this.requestsByPath, MAX_PATH_BUCKETS);
  }

  trackRateLimitBlocked({ limiter, ip, path, retryAfterSeconds }) {
    const limiterKey = String(limiter || 'unknown').trim() || 'unknown';
    this.rateLimitBlockedTotal += 1;
    incrementMap(this.rateLimitBlockedByLimiter, limiterKey, 1);

    this.recentRateLimitEvents.unshift({
      at: new Date().toISOString(),
      limiter: limiterKey,
      ip: String(ip || 'unknown'),
      path: normalizePath(path),
      retryAfterSeconds: Number(retryAfterSeconds || 0)
    });
    if (this.recentRateLimitEvents.length > MAX_RECENT_RATE_LIMIT_EVENTS) {
      this.recentRateLimitEvents.length = MAX_RECENT_RATE_LIMIT_EVENTS;
    }
  }

  trackEmbedView({ institutionSlug }) {
    const slug = String(institutionSlug || '').trim().toLowerCase();
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) return;
    this.embedViewTotal += 1;
    const current = this.embedViewsByInstitution.get(slug) || { views: 0, lastViewedAt: null };
    this.embedViewsByInstitution.set(slug, {
      views: Number(current.views || 0) + 1,
      lastViewedAt: new Date().toISOString()
    });
    clampMapSize(this.embedViewsByInstitution, MAX_EMBED_INSTITUTIONS);
  }

  getEmbedViewsForInstitution(slug) {
    const key = String(slug || '').trim().toLowerCase();
    const stats = this.embedViewsByInstitution.get(key);
    if (!stats) return { views: 0, lastViewedAt: null };
    return {
      views: Number(stats.views || 0),
      lastViewedAt: stats.lastViewedAt || null
    };
  }

  getEmbedViewsSummary() {
    return {
      totalViews: this.embedViewTotal,
      institutions: Array.from(this.embedViewsByInstitution.entries())
        .map(([slug, value]) => ({
          institutionSlug: slug,
          views: Number(value.views || 0),
          lastViewedAt: value.lastViewedAt || null
        }))
        .sort((left, right) => right.views - left.views)
    };
  }

  getSnapshot() {
    return {
      startedAt: this.startedAt,
      requestTotal: this.requestTotal,
      requestsByCategory: Array.from(this.requestsByCategory.entries())
        .map(([category, count]) => ({ category, count: Number(count || 0) }))
        .sort((left, right) => right.count - left.count),
      requestsByStatusBucket: Array.from(this.requestsByStatusBucket.entries())
        .map(([status, count]) => ({ status, count: Number(count || 0) }))
        .sort((left, right) => right.count - left.count),
      topPaths: Array.from(this.requestsByPath.entries())
        .map(([path, count]) => ({ path, count: Number(count || 0) }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 20),
      rateLimit: {
        blockedTotal: this.rateLimitBlockedTotal,
        byLimiter: Array.from(this.rateLimitBlockedByLimiter.entries())
          .map(([limiter, count]) => ({ limiter, count: Number(count || 0) }))
          .sort((left, right) => right.count - left.count),
        recent: this.recentRateLimitEvents.slice(0, 20)
      },
      embedViews: this.getEmbedViewsSummary()
    };
  }

  createApiRequestMiddleware() {
    return (req, res, next) => {
      const requestPath = String(req.originalUrl || `${req.baseUrl || ''}${req.path || ''}` || '')
        .split('?')[0];
      const method = req.method || 'GET';
      res.on('finish', () => {
        this.trackRequest({
          method,
          path: requestPath,
          statusCode: res.statusCode
        });
      });
      next();
    };
  }
}

const trafficMonitor = new TrafficMonitor();

module.exports = { trafficMonitor };

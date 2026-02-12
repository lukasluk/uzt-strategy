const crypto = require('crypto');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
}

function createAuthToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function readAuthToken(token, secret) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!timingSafeEqual(expected, sig)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function parseCookies(req) {
  const source = String(req.headers.cookie || '');
  if (!source) return {};
  return source.split(';').reduce((acc, part) => {
    const [rawKey, ...rawValue] = part.split('=');
    const key = String(rawKey || '').trim();
    if (!key) return acc;
    const value = rawValue.join('=').trim();
    try {
      acc[key] = decodeURIComponent(value || '');
    } catch {
      acc[key] = value || '';
    }
    return acc;
  }, {});
}

function getCookie(req, name) {
  const cookies = parseCookies(req);
  return cookies[name] || '';
}

function resolveClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '');
  const firstForwarded = forwarded.split(',').map((item) => item.trim()).find(Boolean);
  return firstForwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function shouldUseSecureCookie(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')
    .map((item) => item.trim())
    .find(Boolean);
  return Boolean(req.secure || forwardedProto === 'https');
}

function createRateLimiter({
  windowMs,
  max,
  keyPrefix = 'rl',
  keyFn = null,
  onBlocked = null
}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const keyValue = keyFn ? keyFn(req) : resolveClientIp(req);
    const key = `${keyPrefix}:${String(keyValue || 'unknown')}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
    } else if (current.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      if (typeof onBlocked === 'function') {
        try {
          onBlocked({
            req,
            key,
            keyPrefix,
            retryAfter,
            max,
            windowMs
          });
        } catch {
          // Swallow monitoring callback errors to keep rate limiter safe.
        }
      }
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'too many requests' });
    } else {
      current.count += 1;
      hits.set(key, current);
    }

    if (hits.size > 2000) {
      for (const [storedKey, entry] of hits.entries()) {
        if (entry.resetAt <= now) hits.delete(storedKey);
      }
    }

    return next();
  };
}

function parseBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim();
}

function hashMetaAdminPassword(password, options = {}) {
  const digest = String(options.digest || 'sha512').trim().toLowerCase() || 'sha512';
  const iterations = Math.max(100000, Number(options.iterations || 210000));
  const saltBytes = Math.max(16, Number(options.saltBytes || 16));
  const salt = crypto.randomBytes(saltBytes).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 64, digest).toString('hex');
  return `pbkdf2$${digest}$${iterations}$${salt}$${hash}`;
}

function verifyMetaAdminPassword(password, passwordHash) {
  const raw = String(passwordHash || '').trim();
  if (!raw) return false;
  const parts = raw.split('$');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false;

  const digest = String(parts[1] || '').trim().toLowerCase();
  const iterations = Number(parts[2]);
  const salt = String(parts[3] || '');
  const expectedHex = String(parts[4] || '').toLowerCase();

  if (!digest || !Number.isFinite(iterations) || iterations < 100000 || !salt || !expectedHex) return false;

  let derivedHex = '';
  try {
    derivedHex = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 64, digest).toString('hex').toLowerCase();
  } catch {
    return false;
  }

  return timingSafeEqual(derivedHex, expectedHex);
}

module.exports = {
  createAuthToken,
  createRateLimiter,
  getCookie,
  hashMetaAdminPassword,
  hashPassword,
  normalizeEmail,
  parseBearer,
  readAuthToken,
  resolveClientIp,
  sha256,
  shouldUseSecureCookie,
  slugify,
  timingSafeEqual,
  verifyMetaAdminPassword
};

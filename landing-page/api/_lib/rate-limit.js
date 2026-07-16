const attempts = new Map();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || 'unknown';
}

function checkRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { windowStart: now, count: 1 });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

function resetRateLimit(req) {
  const ip = getClientIp(req);
  attempts.delete(ip);
}

module.exports = { checkRateLimit, resetRateLimit };

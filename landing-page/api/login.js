const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { checkRateLimit, resetRateLimit } = require('./_lib/rate-limit');

const COOKIE_MAX_AGE = 24 * 60 * 60;

function getSecret() {
  return process.env.JWT_SECRET || '';
}

function getHash() {
  return process.env.ADMIN_PASSWORD_HASH || '';
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const rateCheck = checkRateLimit(req);
  if (!rateCheck.allowed) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Format request tidak valid.' }));
    return;
  }

  const { password } = parsed;
  if (!password) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Password wajib diisi.' }));
    return;
  }

  const hash = getHash();
  if (!hash) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Admin password belum dikonfigurasi.' }));
    return;
  }

  const match = bcrypt.compareSync(password, hash);
  if (!match) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Password salah.' }));
    return;
  }

  resetRateLimit(req);

  const token = jwt.sign(
    { role: 'admin', iat: Math.floor(Date.now() / 1000) },
    getSecret(),
    { expiresIn: COOKIE_MAX_AGE }
  );

  const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.connection.encrypted;
  var cookieOpts = 'HttpOnly; SameSite=Strict; Path=/; Max-Age=' + COOKIE_MAX_AGE;
  if (isSecure) cookieOpts += '; Secure';

  res.setHeader('Set-Cookie', [
    'scholarify_session=' + token + '; ' + cookieOpts,
    'scholarify_logged_in=true; ' + cookieOpts,
  ]);

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true }));
};

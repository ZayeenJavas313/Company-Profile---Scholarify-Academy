const jwt = require('jsonwebtoken');

function getSecret() {
  return process.env.JWT_SECRET || '';
}

function verifySession(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/scholarify_session=([^;]+)/);
  if (!match) {
    return { valid: false, status: 401, error: 'Tidak ada session. Silakan login terlebih dahulu.' };
  }

  const token = match[1];
  try {
    const decoded = jwt.verify(token, getSecret());
    return { valid: true, user: decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, status: 401, error: 'Session sudah kedaluwarsa. Silakan login ulang.' };
    }
    return { valid: false, status: 401, error: 'Session tidak valid.' };
  }
}

function requireAuth(handler) {
  return async (req, res) => {
    const session = verifySession(req);
    if (!session.valid) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = session.status;
      res.end(JSON.stringify({ error: session.error }));
      return;
    }
    req.user = session.user;
    return handler(req, res);
  };
}

module.exports = { verifySession, requireAuth };

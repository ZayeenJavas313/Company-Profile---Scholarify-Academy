const { verifySession } = require('./_lib/verify-session');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const session = verifySession(req);
  if (!session.valid) {
    res.statusCode = session.status;
    res.end(JSON.stringify({ loggedIn: false, error: session.error }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ loggedIn: true }));
};

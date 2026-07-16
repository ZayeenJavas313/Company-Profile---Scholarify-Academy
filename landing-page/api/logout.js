module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  res.setHeader('Set-Cookie', [
    'scholarify_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    'scholarify_logged_in=; Secure; SameSite=Strict; Path=/; Max-Age=0',
  ]);

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true }));
};

const { requireAuth } = require('../_lib/verify-session');
const { sanityMutate } = require('../_lib/sanity');

function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>&"']/g, '').trim();
}

module.exports = requireAuth(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const id = req.query.id || req.url.split('/').pop().split('?')[0];
  if (!id) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'ID tidak ditemukan.' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  if (req.method === 'PATCH') {
    let data;
    try { data = JSON.parse(body); } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Format request tidak valid.' }));
      return;
    }

    const patch = {};
    if (data.nama !== undefined) patch.nama = sanitize(data.nama);
    if (data.asalKampus !== undefined) patch.asalKampus = sanitize(data.asalKampus);
    if (data.isi !== undefined) patch.isi = sanitize(data.isi);
    if (data.rating !== undefined) patch.rating = Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5));
    if (data.foto !== undefined) patch.foto = data.foto ? { _type: 'image', asset: { _ref: data.foto } } : null;

    try {
      const result = await sanityMutate([{ patch: { id, set: patch } }]);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, id: result.results?.[0]?.id }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Gagal update testimoni: ' + err.message }));
    }
  } else if (req.method === 'DELETE') {
    try {
      await sanityMutate([{ delete: { id } }]);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Gagal hapus testimoni: ' + err.message }));
    }
  } else {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

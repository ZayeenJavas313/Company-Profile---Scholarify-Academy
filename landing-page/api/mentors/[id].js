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
    if (data.jabatan !== undefined) patch.jabatan = sanitize(data.jabatan);
    if (data.kampus !== undefined) patch.kampus = sanitize(data.kampus);
    if (data.kategori !== undefined) patch.kategori = sanitize(data.kategori);
    if (data.urutan !== undefined) patch.urutan = parseInt(data.urutan, 10);
    if (data.foto !== undefined) patch.foto = data.foto ? { _type: 'image', asset: { _ref: data.foto } } : null;
    if (data.logoKampus !== undefined) patch.logoKampus = data.logoKampus ? { _type: 'image', asset: { _ref: data.logoKampus } } : null;

    try {
      const result = await sanityMutate([{ patch: { id, set: patch } }]);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, id: result.results?.[0]?.id }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Gagal update mentor: ' + err.message }));
    }
  } else if (req.method === 'DELETE') {
    try {
      await sanityMutate([{ delete: { id } }]);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Gagal hapus mentor: ' + err.message }));
    }
  } else {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

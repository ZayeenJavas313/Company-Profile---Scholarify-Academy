const { requireAuth } = require('../_lib/verify-session');
const { sanityMutate } = require('../_lib/sanity');

function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>&"']/g, '').trim();
}

function textToBlocks(text) {
  if (!text) return undefined;
  var blocks = [];
  var paragraphs = text.split(/\n\s*\n/);
  paragraphs.forEach(function (p) {
    p = p.trim();
    if (!p) return;
    var lines = p.split('\n');
    lines.forEach(function (line) {
      line = line.trim();
      if (!line) return;
      blocks.push({
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: line, marks: [] }],
      });
    });
  });
  return blocks.length ? blocks : undefined;
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
    if (data.judul !== undefined) patch.judul = sanitize(data.judul);
    if (data.ringkasan !== undefined) patch.ringkasan = sanitize(data.ringkasan);
    if (data.tanggal !== undefined) patch.tanggal = sanitize(data.tanggal);
    if (data.urutan !== undefined) patch.urutan = parseInt(data.urutan, 10);
    if (data.gambar !== undefined) patch.gambar = data.gambar ? { _type: 'image', asset: { _ref: data.gambar } } : null;
    if (data.isiLengkap !== undefined) {
      var blocks = textToBlocks(data.isiLengkap);
      if (blocks) patch.isiLengkap = blocks;
    }

    try {
      const result = await sanityMutate([{ patch: { id, set: patch } }]);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, id: result.results?.[0]?.id }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Gagal update berita: ' + err.message }));
    }
  } else if (req.method === 'DELETE') {
    try {
      await sanityMutate([{ delete: { id } }]);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Gagal hapus berita: ' + err.message }));
    }
  } else {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

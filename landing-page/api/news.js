const { requireAuth } = require('./_lib/verify-session');
const { sanityMutate } = require('./_lib/sanity');

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

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let data;
  try { data = JSON.parse(body); } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Format request tidak valid.' }));
    return;
  }

  const judul = sanitize(data.judul);
  const ringkasan = sanitize(data.ringkasan);
  const tanggal = sanitize(data.tanggal) || new Date().toISOString().split('T')[0];
  const urutan = parseInt(data.urutan, 10) || 1;
  const gambar = data.gambar || null;
  const isiLengkap = textToBlocks(data.isiLengkap);

  if (!judul) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Judul berita wajib diisi.' }));
    return;
  }

  try {
    const doc = { _type: 'news', judul, ringkasan, tanggal, urutan };
    if (gambar) doc.gambar = { _type: 'image', asset: { _ref: gambar } };
    if (isiLengkap) doc.isiLengkap = isiLengkap;

    const result = await sanityMutate([{ create: doc }]);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, id: result.results?.[0]?.id }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Gagal menyimpan berita: ' + err.message }));
  }
});

const { requireAuth } = require('./_lib/verify-session');
const { sanityMutate } = require('./_lib/sanity');

function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>&"']/g, '').trim();
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

  const nama = sanitize(data.nama);
  const asalKampus = sanitize(data.asalKampus);
  const isi = sanitize(data.isi);
  const rating = Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5));
  const foto = data.foto || null;

  if (!nama || !isi) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Nama dan isi testimoni wajib diisi.' }));
    return;
  }

  try {
    const doc = { _type: 'testimonial', nama, asalKampus, isi, rating };
    if (foto) doc.foto = { _type: 'image', asset: { _ref: foto } };

    const result = await sanityMutate([{ create: doc }]);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, id: result.results?.[0]?.id }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Gagal menyimpan testimoni: ' + err.message }));
  }
});

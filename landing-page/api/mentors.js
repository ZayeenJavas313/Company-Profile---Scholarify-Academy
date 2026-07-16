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
  const jabatan = sanitize(data.jabatan);
  const kampus = sanitize(data.kampus);
  const kategori = sanitize(data.kategori) || 'tim-mentor';
  const urutan = parseInt(data.urutan, 10) || 1;
  const foto = data.foto || null;
  const logoKampus = data.logoKampus || null;

  if (!nama) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Nama mentor wajib diisi.' }));
    return;
  }

  try {
    const doc = { _type: 'mentor', nama, jabatan, kampus, kategori, urutan };
    if (foto) doc.foto = { _type: 'image', asset: { _ref: foto } };
    if (logoKampus) doc.logoKampus = { _type: 'image', asset: { _ref: logoKampus } };

    const result = await sanityMutate([{ create: doc }]);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, id: result.results?.[0]?.id }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Gagal menyimpan mentor: ' + err.message }));
  }
});

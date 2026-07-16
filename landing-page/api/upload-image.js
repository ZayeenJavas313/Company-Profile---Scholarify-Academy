const { requireAuth } = require('./_lib/verify-session');
const { uploadImage } = require('./_lib/sanity');
const Busboy = require('busboy');

module.exports = requireAuth(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 5 * 1024 * 1024;

  try {
    const result = await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE, files: 1 } });
      let fileBuffer = null;
      let fileMime = null;
      let fileName = null;

      busboy.on('file', (fieldname, file, info) => {
        const { filename, mimeType, encoding } = info;
        if (!allowedTypes.includes(mimeType)) {
          reject(new Error('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.'));
          file.resume();
          return;
        }
        fileMime = mimeType;
        fileName = filename;

        const chunks = [];
        file.on('data', (chunk) => {
          if (Buffer.byteLength(Buffer.concat([...chunks, chunk])) <= MAX_SIZE) {
            chunks.push(chunk);
          } else {
            reject(new Error('Ukuran file maksimal 5MB.'));
            file.resume();
          }
        });
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      busboy.on('finish', async () => {
        if (!fileBuffer) {
          reject(new Error('Tidak ada file yang diupload.'));
          return;
        }
        try {
          const asset = await uploadImage(fileBuffer, fileName, fileMime);
          resolve(asset);
        } catch (err) {
          reject(err);
        }
      });

      busboy.on('error', (err) => {
        reject(new Error(err.message || 'Upload gagal.'));
      });

      req.pipe(busboy);
    });

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      url: result.document?.url,
      ref: result.document?._id,
    }));
  } catch (err) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: err.message }));
  }
});

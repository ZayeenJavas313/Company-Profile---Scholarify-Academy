const SANITY_PROJECT = 'gbwew0c6';
const SANITY_DATASET = 'production';
const API_VERSION = '2024-01-01';

function getToken() {
  return process.env.SANITY_WRITE_TOKEN || '';
}

async function sanityFetch(query) {
  const url = `https://${SANITY_PROJECT}.api.sanity.io/v${API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Sanity query failed: ${res.status}`);
  }
  return res.json();
}

async function sanityMutate(mutations) {
  const url = `https://${SANITY_PROJECT}.api.sanity.io/v${API_VERSION}/data/mutate/${SANITY_DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ mutations }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Sanity mutate failed: ${res.status}`);
  }
  return res.json();
}

async function uploadImage(buffer, filename, mimeType) {
  const url = `https://${SANITY_PROJECT}.api.sanity.io/v${API_VERSION}/assets/images/${SANITY_DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': mimeType || 'image/jpeg',
    },
    body: buffer,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Image upload failed: ${res.status}`);
  }
  return res.json();
}

module.exports = { sanityFetch, sanityMutate, uploadImage };

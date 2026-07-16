const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node generate-hash.js "password_admin"');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password minimal 6 karakter.');
  process.exit(1);
}

const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync(password, salt);

console.log('\n=== SIMPAN HASH INI KE VERCEL ===');
console.log(`ADMIN_PASSWORD_HASH: ${hash}`);
console.log('================================\n');
console.log('Password asli tidak disimpan. Simpan hash di Vercel Environment Variables.\n');

# Scholarify-Website

## Integrasi AOS (Animate On Scroll)

Tambahan singkat untuk mengaktifkan animasi AOS pada frontend:

- `aos` sudah tercantum di `package.json`.
- Komponen inisialisasi dibuat di `app/components/AosInit.tsx` (client component) dan dirender di `app/layout.tsx`.
- CSS AOS diimpor di `app/layout.tsx` dengan `import "aos/dist/aos.css";`.
- Contoh penggunaan: tambahkan atribut `data-aos` pada elemen klien, mis. di `app/components/NavbarClient.tsx` sudah ditambahkan contoh `data-aos="fade-down"`.

Cara test lokal:

1. Install dependency:

```bat
cd "company profile scholarify"
npm install
```

2. Jalankan dev server:

```bat
npm run dev
```

3. Untuk build (Pastikan Node >= 20.9.0):

```bat
set NODE_OPTIONS=--openssl-legacy-provider && npm run build
```
"# frontend-scholarify"  

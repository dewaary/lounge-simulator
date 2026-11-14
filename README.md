# The Lounge · 3D Event Planner (prototype)

Next.js 16 + React Three Fiber + Zustand. Concept by Bellmango.

## Jalankan
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export ke folder out/ (upload ke Hostinger / subdomain)
```

## Struktur
- `lib/data.ts` – SEMUA data venue: ukuran ruangan, jenis event, harga, katalog meja/dekor, theme. Ganti angka dummy di sini.
- `lib/store.ts` – state (zustand), aturan tabrakan, penempatan tamu.
- `lib/pricing.ts` – kalkulasi harga & pesan WhatsApp.
- `components/scene/` – 3D: `Room` (ruangan), `Models` (meja/dekor), `Guests` (tamu), `Scene` (kamera, drag & drop).
- `components/Intro.tsx`, `components/Simulator.tsx` – UI.
- `preview/` – build satu file HTML untuk preview (opsional).

## Catatan prototype
- Ruangan The Lounge masih ukuran perkiraan (16 × 8 m) dan dibuat dengan kode, belum dari foto asli.
- Harga dan nomor WhatsApp masih contoh (lihat `VENUE` di `lib/data.ts`).

## Scroll story (intro)
- Frame video ada di `public/story/f_001…f_326.webp` (3 klip AI digabung, 12 fps, 1152×648) + `K4/K5/K6.webp` (still, diberi efek zoom).
- Timeline & teks per adegan: `components/Story.tsx` (`VIDEO_END`, `STILL_RANGES`, `CAPTIONS`).
- Kalau klip 4 & 5 sudah jadi: gabungkan ke video, ekstrak ulang frame, naikkan `FRAME_COUNT`, lalu `VIDEO_END` jadi ±0.9 dan hapus still yang sudah tergantikan.

# FairWorks

Kerja kelompok yang adil dan terlihat. Anti free-rider: tugas berpoin, kontrak disetujui semua anggota, bukti kerja diverifikasi teman, laporan kontribusi untuk dosen tanpa login.

STACK 2026 Hackathon GDGoC ITB · Case Learning & College Life
Tim: Raken (Backend) · Chello, Iwan, Riski (Frontend)

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS v4
- Supabase (Postgres, Auth magic link, Realtime, Edge Functions)
- Deploy: Vercel

## Dokumen

- `docs/PRD.md` — kebutuhan produk lengkap
- `docs/PLAN.md` — eksekusi per hari sampai 7 Des
- `docs/DESIGN.md` — token, wireframe, aturan visual

## Struktur

```
app/            route & view (Landing, Auth, Dashboard, Room, Laporan)
lib/supabase/   klien Supabase (browser + server)
docs/           PRD, PLAN, DESIGN
docs/library/   galeri komponen + prototipe visual (referensi, bukan kode produksi)
```

## Library Komponen (WAJIB tahu sebelum bikin UI)

- `docs/library/Galeri-Komponen.html` — galeri eksplorasi tim (60+ komponen). **Buka di browser sebagai referensi.** Dari semua itu, hanya **8 komponen** yang dipakai produk — daftarnya di `docs/DESIGN.md` §3. Komponen di luar 8 itu = arsip, dilarang dipakai.
- `docs/library/Ruang-Tim-Fondasi-V2.html` — prototipe visual acuan: token warna, transisi antar view, layout, cara kerja background engine. Buka di browser untuk lihat feel-nya — **jangan di-copy mentah jadi kode produksi**; implement ulang pakai design system di `app/globals.css`.

## Aturan kerja (wajib dibaca anggota tim)

1. 1 PR = 1 tugas kecil. Tidak ada commit langsung ke `main`.
2. Merge hanya dengan OK Raken.
3. Frontend memakai komponen design system (token di `app/globals.css`, 5 warna — tidak ada warna ke-6).
4. Semua keputusan bisnis (mayoritas, lock, ambil alih) di RPC Supabase — frontend tidak memutuskan aturan.
5. Bahasa UI: Indonesia penuh.

## Jalan lokal

```bash
cp .env.local.example .env.local   # lalu isi kredensial Supabase
npm install
npm run dev
```

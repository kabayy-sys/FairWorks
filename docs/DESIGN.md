# FairWorks — Design Specification (v2)

Pendamping PRD v1 + PLAN v1 · STACK 2026 GDGoC ITB
Basis visual: Monokrom Elegan ala Vercel/Linear (Fondasi V2 sebagai referensi feel, LAYOUT SUDAH DIPANGKAS — lihat §5)
Prinsip induk: **Radical Simplicity** — user gak sadar ada komponen; mereka cuma ngerasain kerja kelompok yang adil.
Perubahan v2: tatanan layar dipangkas (maks 2 zona per layar) supaya bentuknya benar-benar effortless, setia ke blueprint.

---

## 1. Design Tokens

### 1.1 Warna — 5 saja, tidak boleh warna ke-6
| Token | Hex | Peran |
|---|---|---|
| `--c0` | `#0B0B0D` | Latar paling gelap, teks di atas terang |
| `--c1` | `#202024` | Border panel, latar input |
| `--c2` | `#45454D` | Border interaktif, segmen "dikerjakan" |
| `--c3` | `#85858D` | Teks sekunder, placeholder, label |
| `--c4` | `#E8E8EC` | Teks utama, aksi solid, garis background |

Status tugas = tekstur, bukan warna baru:
- Selesai = `--c4` penuh · Perlu disetujui = garis putus diagonal `--c3` atas `--c1` · Dikerjakan = `--c2` · Bisa diambil = transparan berdashes.

### 1.2 Tipografi — Geist + Geist Mono, Indonesia penuh
| Gaya | Spec | Pakai di |
|---|---|---|
| Hero | Geist 600, `clamp(42px, 7vw, 92px)`, tracking −0.055em, line-height 0.96 | Landing, judul ruangan `clamp(34px, 5.8vw, 70px)` |
| Angka | 600, tabular-nums, tracking −0.05em | Persen progres (kecil, di strip) — di v2 TIDAK ada lagi angka raksasa |
| Judul panel | 600, 20–22px, tracking −0.03em | Kartu, modal |
| Body | 400, 15px/1.55 | Semua teks isi |
| Sekunder | 400, 13–14px, `--c3` | Deskripsi tugas, meta |
| Label mono | Geist Mono 400, 12px, uppercase, tracking 0.10–0.14em, `--c3` | Eyebrow, kode ruangan, tenggat, chip, baris statistik |

Aturan: satu ukuran huruf untuk satu peran. Gak ada ukuran ad-hoc.

### 1.3 Bentuk & jarak
- Radius: panel 22px · kartu/baris 18px · input 12px · pill/tombol 999px.
- Border: 1px `--c1` (panel statis), 1px `--c2` (interaktif), dashed `--c2` (area kosong/ajakan).
- Panel: latar `color-mix(c0 86%, transparent)` — garis background tembus samar.
- Spacing: kelipatan 4 · padding panel 18–26px · gap daftar 8–10px · kontainer maks 760px untuk Room & Laporan (daftar satu kolom nyaman dibaca), 1160px untuk Landing/Dashboard.

### 1.4 Motion — satu kurva, satu dunia
- Easing tunggal: `cubic-bezier(.22, .8, .2, 1)` untuk SEMUA.
- Durasi: micro 0.1–0.4s · bar terisi 1.6s · keluar view 0.9s (blur 12px + turun 14px + scale 0.985) · masuk view 1.3s rise, stagger 85ms/elemen + delay 140ms · morph background 2.4s · drawer masuk 0.5s.
- Angka bergerak dengan odometer (cubic-out).
- `prefers-reduced-motion`: semua jadi instant/fade 0.3s. Animasi adalah bonus, bukan informasi.

### 1.5 Aturan Tatanan Layar (HARD RULE — inti v2)
1. **Maksimal 2 zona per layar.** Zona = blok informasi yang tampil permanen.
2. **Info pendukung di balik SATU ketukan:** anggota, feed, daftar suara, riwayat. Munculnya sebagai drawer/modal, bukan panel permanen.
3. **Info personal = toast.** "Poin kamu disetujui", "Bima minta revisi" — toast, jangan panel.
4. **Satu kolom untuk kerja.** Daftar tugas & laporan = satu kolom (maks 760px). Grid kartu tidak ada lagi.
5. **Progres = strip tipis**, bukan panggung. Angka cukup 20–28px.
6. Komponen (§3) = infrastruktur internal. Tidak boleh ada komponen yang "mencuri panggung" dari daftar tugas.

## 2. Signature Moment: Background Morph

Line Background Engine — 26 helai garis `--c4`, satu dunia yang melengkung tiap pindah view (morph 2.4s, garis gak pernah silang):

| View | Suasana garis | Feel |
|---|---|---|
| Landing | Mengalir bebas, bergelombang pelan | Hidup, mengundang |
| Auth | Berpusar ke tengah layar | Fokus satu hal |
| Dashboard | Bergelombang menyilang lebar | Banyak ruangan bergerak |
| Room | Mengikis ke samping, tenang | Kertas kerja |
| Laporan | Tenang, nyaris statis | Arsip resmi |

Interaksi: pointer mendekat → garis menghindar radius 20% viewport, kembali pelan. DPR cap 1.5, turun ke 1 kalau frame lambat. Tab tersembunyi = render berhenti.

## 3. Komponen (infrastruktur internal — maks 8 + 1 varian)

Sumber eksplorasi: `docs/library/Galeri-Komponen.html` (buka di browser). Prototipe visual acuan: `docs/library/Ruang-Tim-Fondasi-V2.html` (feel-nya saja — layout mengikuti §5 dokumen ini).

| # | Komponen | Dipakai di | Catatan |
|---|---|---|---|
| 1 | Line Background | Semua view (mood §2) | Signature moment |
| 2 | Kinetic Title | Hero landing, judul ruangan | Kata muncul blur→jelas berurutan |
| 3 | Tabs Pill | Room: `Semua · Bisa diambil` (2 tab saja) | Pill geser 0.6s |
| 4 | Progress Track | Strip progres Room (tinggi 8px), strip mini di kartu ruangan | Segmen tekstur; tanpa legend |
| 5 | Avatar Stack | Drawer anggota, kartu ruangan | Overlap −12px, ketua = ring `--c4` |
| 6 | Modal | Detail tugas (suara, revisi, bukti), konfirmasi ambil alih, kirim kontrak | Rise blur 0.8s, backdrop `c0 84%` |
| 7 | Toast | Umpan balik + info personal | Pill `--c4`, bawah 76px, auto 2.6s |
| 8 | Odometer | Persen di strip progres, statistik satu baris Dashboard | Tabular-nums |
| + | Drawer | Panel Anggota & Aktivitas di Room (varian Panel, geser dari kanan, 0.5s) | Buka 1 ketukan, tutup swipe/Esc |

Semua komponen lain di galeri (glass, beams, meteor, 3D, magnetic, glitch, aurora, dst) = arsip, dilarang dipakai.

## 4. Navigasi & Thumb Bar

- Tidak ada menu/dock. Pindah view lewat alur nyata (tombol masuk, klik baris/kartu).
- **Thumb bar** (`position: fixed bottom`, safe-area-aware): SATU aksi utama kontekstual + satu sekunder opsional.

| Layar | Aksi utama (solid `--c4`) | Sekunder |
|---|---|---|
| Landing | Mulai gratis | Lihat contoh |
| Auth | Kirim tautan masuk | — |
| Dashboard | Buat ruangan | Masuk kode |
| Room | Ambil · Kirim bukti · Setuju (kontekstual) | Anggota (buka drawer) |
| Laporan | tanpa bar (read-only) | — |

Tinggi sentuh ≥ 50px, jarak ≥ 12px.

## 5. Wireframe v2 — hasil pangkas

### 5.1 Landing — 2 blok
```
┌──────────────────────────────────────────┐
│ ● FairWorks             (garis mengalir) │
│                                          │
│ KERJA KELOMPOK YANG ADIL DAN TERLIHAT    │
│ Kerja kelompok yang        ┌───────────┐ │
│ kelihatan progresnya.      │ Riset Pasar│ │
│                            │ 40% ▓▓▓▒░░ │ │
│ Ketua bagi poin. Anggota   │ ▸ ambil…   │ │
│ ambil. Teman setujui.      └───────────┘ │
│                                          │
│         ( Mulai gratis )  ← thumb bar    │
└──────────────────────────────────────────┘
```
Hilang vs V1: 3 panel fitur, closer, fine print. Penjelasan produk = satu kalimat. Detail fitur cukup hidup di Room saat dipakai.

### 5.2 Auth — tetap (sudah benar)
```
┌──────────────────────┐
│   SELAMAT DATANG     │
│   Masuk ke FairWorks │
│  Email               │
│  [ kamu@kampus.id ]  │
│  ( Kirim tautan )    │
│  Cek email kamu,     │
│  tautan masuk sudah  │
│  dikirim.            │
└──────────────────────┘
```
Kartu 440px, garis berpusar di belakang. Nama opsional SETELAH masuk pertama, bisa dilewati.

### 5.3 Dashboard — 2 zona
```
┌──────────────────────────────────────────┐
│ KAMIS, 29 OKT                            │
│ Halo, Ayu.  2 ruangan · 3 tugas · 45 poin│  ← statistik jadi satu baris mono
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Riset Pasar Digital    RPD-4K7       │ │
│ │ 40% ▓▓▓▒░░  5 anggota                │ │
│ ├──────────────────────────────────────┤ │
│ │ Proyek Akhir Basis Data  PBD-9M2     │ │
│ │ 20% ▓░░░░░  4 anggota                │ │
│ ├──────────────────────────────────────┤ │
│ │ + Masuk kode…            (dashed)    │ │
│ └──────────────────────────────────────┘ │
│         ( Buat ruangan )  ← thumb bar    │
└──────────────────────────────────────────┘
```
Hilang vs V1: 3 kartu statistik besar, grid kartu ruangan → daftar baris satu kolom.

### 5.4 Room — jantung produk, 2 zona
```
┌──────────────────────────────────────────┐
│ RPD-4K7 · Ketua               (Anggota ⌄)│  ← 1 ketukan buka drawer
│ Riset Pasar Digital                      │
│ 40% ▓▓▓▓▒▒░░  16/40 poin   ← strip tipis │
│ (Semua · Bisa diambil)      ← 2 tab saja │
│ ──────────────────────────────────────── │
│ ◨ Perlu disetujui                        │
│   Rangkum 10 jurnal · 15p · Bima · 1/2   │
│ ◐ Dikerjakan                             │
│   Kumpulkan 30 responden · 20p · DM ⚠2h  │
│   Olah data spreadsheet · 15p · Esa      │
│ ○ Bisa diambil                           │
│   Desain slide presentasi · 10p          │
│ ✓ Selesai                                │
│   Tulis bab latar belakang · 10p · Ayu   │
│                                          │
│      ( Ambil tugas )   [Anggota]         │
└──────────────────────────────────────────┘
```
Aturan layar:
- Baris = status ikon + judul + poin mono + pemilik + tenggat. Satu ketukan pada baris → modal detail (tombol aksi sesuai peran: Ambil / Kirim bukti / Setuju / Revisi, plus daftar suara & catatan revisi).
- Overdue = badge terang `--c4` teks `--c0`, tulis "lewat 2 hari".
- Kontrak belum lock → baris khusus paling atas: "Kontrak menunggu 2 persetujuan · terkunci otomatis dalam 18 jam".
- Info personal (poin masuk, minta revisi) = toast, bukan panel.
- **Drawer Anggota** (1 ketukan): avatar stack + progres mini per anggota + feed aktivitas. Semua riwayat hidup di sini — bukan di layar utama.

### 5.5 Laporan Publik — ringkas, read-only
```
┌──────────────────────────────────────────┐
│ LAPORAN KONTRIBUSI                       │
│ Riset Pasar Digital · RPD-4K7 · 5 orang  │
│ Kontrak terkunci 30 Okt · selesai 14 Nov │
│                                          │
│ Kontribusi:  Ayu 25% · Bima 30% · Citra  │
│ 20% · Dimas 15% · Esa 10%   ← pie kecil  │
│ ──────────────────────────────────────── │
│ 30 Okt  ● kontrak terkunci               │
│  2 Nov  ● Ayu ambil bab latar belakang   │
│  4 Nov  ● Bima kirim rangkuman jurnal    │
│  5 Nov  ● 3 orang menyetujui             │
│ ──────────────────────────────────────── │
│ ✓ Tulis bab…   10p  Ayu   [Dokumen]      │
│ ✓ Rangkum…     15p  Bima  [GitHub]       │
│ ◨ Desain slide 10p  —     belum ada      │
│  footer: dibuat dengan FairWorks         │
└──────────────────────────────────────────┘
```
Pie kecil di kepala (bukan panel sendiri), timeline + tabel menyatu satu kolom. Nol tombol, nol login.

## 6. State Wajib (semua view)

| State | Tampilan |
|---|---|
| Kosong | Panel dashed + satu kalimat + satu tombol. "Belum ada tugas. Pecah pekerjaan jadi porsi kecil." |
| Memuat | Skeleton baris berkedip pelan (opacity) |
| Gagal | Toast `--c4` teks tegas + tombol coba lagi — tetap monokrom |
| Offline | Bar tipis atas: "Koneksi terputus, perubahan tersimpan lokal" |
| Reduced motion | Fade 0.3s, background statis mood terkini |

## 7. Microcopy — Bahasa Manusia (Indonesia)

| Situasi | Kata-kata |
|---|---|
| Status | Bisa diambil · Dikerjakan · Perlu disetujui · Selesai |
| Tombol ambil | "Ambil tugas ini" |
| Ambil alih | "Ambil alih dari Bima?" + "Tenggat sudah lewat 2 hari." |
| Kirim bukti | "Tempel tautan pekerjaan kamu" |
| Suara masuk | Toast: "Rina menyetujui tugasmu. 10 poin masuk." |
| Revisi | Toast: "Bima minta revisi: 'kurangi jurnal 2020 ke bawah'" |
| Kontrak lock | "Kontrak terkunci. Sekarang semua tahu porsinya masing-masing." |
| Drawer | Judul "Anggota", tab mini "Progres · Aktivitas" |
| Kosong | Satu kalimat + satu tombol. Tanpa ilustrasi lucu-lucuan. |

Larangan: "Oops", "Whoops", "Error 500", istilah teknis di UI, bahasa campur.

## 8. Aksesibilitas

- Kontras: `--c4` di `--c0` ≈ 15:1 (AAA); `--c3` di `--c0` ≈ 6.8:1 (AA) — `--c3` hanya teks sekunder ≥ 13px.
- Fokus keyboard: outline 2px `--c4` offset 3px, radius ikut elemen.
- Ikon aksi punya `aria-label`; daftar tugas = `aria-live=polite`; modal & drawer = `role=dialog` + `Esc` + klik backdrop + swipe tutup.
- Target sentuh ≥ 44×44 (tombol utama ≥ 50 tinggi).
- Tema selalu gelap; `prefers-reduced-motion` mematikan animasi.

## 9. Checklist Serah Terima Chello (Design System v1)

Sebelum T1 ditutup, Chello rilis di repo:
1. `tokens.css` — 5 warna, font, radius, easing, durasi (sudah ada kerangkanya di `app/globals.css`).
2. Komponen: `Btn`, `Panel`, `Track` (tanpa legend), `AvatarStack`, `Modal`, `Toast`, `Odometer`, `TabsPill` (2 tab), `Field`, `Drawer`, baris daftar (`TaskRow`).
3. `BackgroundEngine` terpasang + `setBackgroundState(view)` dari router.
4. Kerangka 5 view + transisi + thumb bar.
5. Halaman Story = contoh semua komponen.

Aturan review: apa pun di luar 8+1 komponen, warna ke-6, atau zona ketiga di satu layar = DITOLAK.

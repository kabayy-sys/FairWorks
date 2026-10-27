# FairWorks — Design Specification

Pendamping PRD v1 + PLAN v1 · STACK 2026 GDGoC ITB
Basis visual: Ruang Tim Fondasi V2 + Galeri Komponen + Blueprint (Monokrom Elegan ala Vercel/Linear)
Prinsip induk: **Radical Simplicity** — user gak sadar ada komponen; mereka cuma ngerasain kerja kelompok yang adil.

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
| Angka besar | 600, tabular-nums, tracking −0.05em | Persentase progres `clamp(56px, 9vw, 104px)`, statistik |
| Judul panel | 600, 20–22px, tracking −0.03em | Kartu, modal |
| Body | 400, 15px/1.55 | Semua teks isi |
| Sekunder | 400, 13–14px, `--c3` | Deskripsi tugas, meta |
| Label mono | Geist Mono 400, 12px, uppercase, tracking 0.10–0.14em, `--c3` | Eyebrow, kode ruangan, tenggat, chip |

Aturan: satu ukuran huruf untuk satu peran. Gak ada ukuran ad-hoc.

### 1.3 Bentuk & jarak
- Radius: panel 22px · kartu tugas 18px · input 12px · pill/tombol 999px · segmen 999px.
- Border: 1px `--c1` (panel statis), 1px `--c2` (interaktif), dashed `--c2` (area kosong/ajakan).
- Panel: latar `color-mix(c0 86%, transparent)` — transparan tipis supaya garis background tembus samar.
- Spacing: kelipatan 4 · padding panel 18–26px · gap grid 14px · kontainer maks 1160px, padding sisi `max(16px, safe-area)`.

### 1.4 Motion — satu kurva, satu dunia
- Easing tunggal: `cubic-bezier(.22, .8, .2, 1)` untuk SEMUA.
- Durasi: micro (hover/active scale) 0.1–0.4s · bar terisi 1.6s · keluar view 0.9s (blur 12px + turun 14px + scale 0.985) · masuk view 1.3s rise, stagger 85ms/elemen + delay 140ms · morph background 2.4s.
- Angka bergerak dengan odometer (easing cubic-out).
- `prefers-reduced-motion`: semua jadi instant/fade 0.3s. Animasi adalah bonus, bukan informasi.

## 2. Signature Moment: Background Morph

Line Background Engine — 26 helai garis `--c4`, satu dunia yang melengkung tiap pindah view (morph 2.4s, garis gak pernah silang):

| View | Suasana garis | Feel |
|---|---|---|
| Landing | Mengalir bebas, bergelombang pelan | Hidup, mengundang |
| Auth | Berpusar ke tengah layar (pusaran pelan) | Fokus satu hal |
| Dashboard | Bergelombang menyilang lebar | Banyak ruangan bergerak |
| Room | Mengikis ke samping, merata di tengah | Kertas kerja |
| Laporan | Tenang, nyaris statis | Arsip resmi |

Interaksi: pointer mendekat → garis menghindar radius 20% viewport, kembali pelan. DPR cap 1.5, turun ke 1 kalau frame lambat. Tab tersembunyi = render berhenti.

## 3. Pemetaan Komponen Galeri (maks 8, sisanya mati)

| # | Komponen | Dipakai di | Catatan |
|---|---|---|---|
| 1 | Line Background | Semua view (4 mood) | Signature moment |
| 2 | Kinetic Title | Hero landing, judul ruangan | Kata muncul blur→jelas berurutan |
| 3 | Tabs Pill | Filter papan tugas (Semua/Bisa diambil/Dikerjakan/Disetujui/Selesai) | Pill geser 0.6s |
| 4 | Progress Track + segmen | Progres ruangan (22px), progres anggota (8px) | 4 segmen tekstur |
| 5 | Avatar Stack + Tooltip | Header ruangan, baris anggota | Overlap −12px, ketua = ring `--c4`; tooltip nama+peran |
| 6 | Modal | Konfirmasi ambil alih, kirim kontrak, setuju kontrak, detail vote | Rise blur 0.8s, backdrop `c0 84%` |
| 7 | Toast | Umpan balik semua aksi ("Poin kamu disetujui") | Pill `--c4`, bawah 76px, auto 2.6s |
| 8 | Odometer | Persen progres, statistik dashboard | Tabular-nums |

**Matikan di galeri:** glass, beams, meteor, constellation, 3D, cursor comet, magnetic, glitch, aurora — semuanya. Galeri = gudang eksperimen, produk = 8 komponen ini.

## 4. Navigasi & Thumb Bar

- Dock prototipe Fondasi V2 HILANG di produk. Pindah view lewat alur nyata (tombol masuk, klik kartu).
- **Thumb bar** (mobile & desktop, `position: fixed bottom`, safe-area-aware): SATU aksi utama kontekstual + satu sekunder opsional.

| Layar | Aksi utama (solid `--c4`) | Sekunder |
|---|---|---|
| Landing | Mulai gratis | Lihat contoh ruangan |
| Auth | Kirim tautan masuk | — |
| Dashboard | Buat ruangan | Masuk kode |
| Room (kontekstual per tugas terpilih/prioritas) | Ambil · Kirim bukti · Setuju | Lepas |
| Laporan | (read-only, tanpa bar) | — |

Tinggi sentuh ≥ 50px, jarak ≥ 12px, zona jempol kanan/kiri dua-duanya terjangkau.

## 5. Wireframe per View

### 5.1 Landing
```
┌──────────────────────────────────────────────────────┐
│ ● FairWorks                          (garis mengalir)  │
│                                                      │
│ KERJA KELOMPOK YANG ADIL DAN TERLIHAT   ← eyebrow    │
│ Kerja kelompok yang            ┌──────────────────┐  │
│ kelihatan progresnya.  ←kinetic│ Riset Pasar Digital│ │
│                                │ 40% poin disetujui │ │
│ Ketua membagi tugas berpoin,   │ ▓▓▓▓▒▒░░  (track)  │ │
│ anggota mengambil porsinya,    │ ▸ Tulis bab… 10p   │ │
│ hasil dihitung setelah         │ ▸ Rangkum jurnal…  │ │
│ disetujui teman.               └──────────────────┘  │
│                                                      │
│ [ Tugas berpoin ] [ Porsi bisa diambil ] [ Disetujui │
│   teman ]                      ← 3 panel fitur       │
│                                                      │
│        Semua orang tahu siapa mengerjakan apa.       │
│              ( Mulai gratis )  ← thumb bar            │
└──────────────────────────────────────────────────────┘
```
Hero kiri, preview kanan (mobile: preview turun ke bawah hero, tanpa rotasi 3D).

### 5.2 Auth — satu field, selesai
```
┌──────────────────────┐
│                      │
│   SELAMAT DATANG     │  ← eyebrow
│   Masuk ke FairWorks  │
│                      │
│  Email               │
│  [ kamu@kampus.id ]  │  ← satu-satunya field
│                      │
│  ( Kirim tautan )    │  ← loading spinner → centang
│                      │
│  Cek email kamu,     │  ← state sukses:
│  tautan masuk sudah  │    kartu berganti isi,
│  dikirim. 🤍         │    bukan halaman baru
└──────────────────────┘
```
Kartu 440px, garis berpusar di belakang. Nama opsional ditanya SETELAH masuk pertama (satu field kecil, bisa dilewati).

### 5.3 Dashboard
```
┌──────────────────────────────────────────────────────┐
│ KAMIS, 29 OKT                                        │
│ Halo, Ayu. Ini kerja kelompok kamu.                  │
│ ┌────────┐ ┌────────┐ ┌────────┐                     │
│ │ 2      │ │ 3      │ │ 45     │  ← 3 statistik      │
│ │ ruangan│ │ tugasmu│ │ poinmu │    (odometer)       │
│ └────────┘ └────────┘ └────────┘                     │
│ RUANGAN KAMU                                         │
│ ┌───────────────┐ ┌───────────────┐ ┌ ─ ─ ─ ─ ─ ┐   │
│ │ Riset Pasar   │ │ Proyek Akhir  │ │  Masuk     │   │
│ │ Digital RPD-4K7│ │ Basis Data…  │ │  kode…     │   │
│ │ 40% ▓▓▓▒░░    │ │ 20% ▓░░░░░    │ │ ( dashed ) │   │
│ │ 5 anggota · 3h│ │ 4 anggota · 7h│ └ ─ ─ ─ ─ ─ ┘   │
│ └───────────────┘ └───────────────┘                   │
│            ( Buat ruangan )   ← thumb bar             │
└──────────────────────────────────────────────────────┘
```
Klik kartu = masuk room. Kartu dashed = join kode (modal 1 field).

### 5.4 Room — jantung produk
```
┌──────────────────────────────────────────────────────┐
│ KODE RPD-4K7 · Ketua                        (ⒶⒷⒸⒹⒺ) │
│ Riset Pasar Digital              ← kinetic title     │
│ ┌──────────────────────────────┬───────────────────┐ │
│ │ 40% poin disetujui           │ ANGGOTA           │ │
│ │ ▓▓▓▓▓▒▒░░  16/40 poin        │ Ayu   ▓▓▓ 10      │ │
│ │ ■ disetujui ▨ nunggu ░ buka  │ Bima  ▒▒  5       │ │
│ │                              │ Citra ░░  0       │ │
│ │ (Semua│Buka│Kerja│Setuju│    │ ACTIVITAS         │ │
│ │  Selesai)   ← tabs pill      │ Bima kirim hasil… │ │
│ │ ┌──────────┐ ┌──────────┐   │ Esa setujui…      │ │
│ │ │◨ Rangkum │ │▢ Kumpul  │   │ Esa lepas…        │ │
│ │ │ 10 jurnal│ │ 30 resp. │   │                   │ │
│ │ │ 15p · Bima│ │ 20p · DM │   │                   │ │
│ │ │ 1/2 setuju│ │ ⚠ lewat  │   │                   │ │
│ │ └──────────┘ └──────────┘   │                   │ │
│ └──────────────────────────────┴───────────────────┘ │
│         ( Ambil tugas )        ← thumb bar kontekstual│
└──────────────────────────────────────────────────────┘
```
Aturan layar:
- Kartu tugas = status di kiri atas (ikon satu lingkaran), poin mono, pemilik avatar mini, tenggat. SATU ketukan di kartu = modal aksi (Ambil/Kirim/Setuju sesuai peran).
- Tenggat lewat = badge terang `--c4` teks `--c0`, cuma tulis "lewat 2 hari".
- Kontrak belum lock → banner tipis di atas: "Kontrak menunggu 2 persetujuan · terkunci otomatis dalam 18 jam".
- Modal aksi SELALU satu keputusan: judul + satu kalimat + satu tombol solid (+ input link kalau kirim bukti).

### 5.5 Laporan Publik (dosen, tanpa login)
```
┌──────────────────────────────────────────────────────┐
│ LAPORAN KONTRIBUSI                                   │
│ Riset Pasar Digital · RPD-4K7 · 5 anggota · 40 poin  │
│ Kontrak terkunci 30 Okt · selesai 14 Nov             │
│ ┌──────────────────────┬─────────────────────────────┤
│ │   ◐ KONTRIBUSI       │ LINIMASA                    │
│ │   Ayu    25% ▓       │ 30 Okt ●kontrak terkunci    │
│ │   Bima   30% ▓       │  2 Nov ●Ayu ambil bab…      │
│ │   Citra  20% ▒       │  4 Nov ●Bima kirim jurnal   │
│ │   Dimas  15% ░       │  5 Nov ●3 orang setujui     │
│ │   Esa    10% ░       │  …                          │
│ ├──────────────────────┴─────────────────────────────┤
│ │ TUGAS & BUKTI  (baris: status ▸ judul ▸ poin ▸ chip)│
│ │ ✓ Tulis bab latar belakang   10p  Ayu  [Dokumen]   │
│ │ ✓ Rangkum 10 jurnal          15p  Bima [GitHub]    │
│ │ ◨ Desain slide               10p  —    belum ada   │
│ └─────────────────────────────────────────────────────┘
│ (garis tenang)  footer: dibuat dengan FairWorks       │
└──────────────────────────────────────────────────────┘
```
Pie monokrom (derajat abu `--c4→--c1`), label persen di luar. Chip bukti = ikon jenis + label. Nol tombol aksi, nol login, cukup scroll.

## 6. State Wajib (semua view)

| State | Tampilan |
|---|---|
| Kosong | Panel dashed + satu kalimat + satu tombol. "Belum ada tugas. Pecah pekerjaan jadi porsi kecil." |
| Memuat | Skeleton panel berkedip pelan (opacity, bukan spinner kecuali tombol) |
| Gagal | Toast merah? TIDAK — tetap monokrom: toast `--c4` dengan teks tegas + tombol coba lagi |
| Offline | Bar tipis atas: "Koneksi terputus, perubahan tersimpan lokal" |
| Reduced motion | Semua transisi jadi fade 0.3s, background statis mood terkini |

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
| Kosong | Satu kalimat + satu tombol. Tanpa ilustrasi lucu-lucuan. |

Larangan: "Oops", "Whoops", "Error 500", istilah teknis di UI, bahasa campur.

## 8. Aksesibilitas

- Kontras: `--c4` di `--c0` ≈ 15:1 (AAA); `--c3` di `--c0` ≈ 6.8:1 (AA) — `--c3` hanya untuk teks sekunder ≥ 13px.
- Fokus keyboard: outline 2px `--c4` offset 3px, radius ikut elemen.
- Semua ikon aksi punya `aria-label`; feed = `aria-live=polite`; modal = `role=dialog` + `Esc` + klik backdrop.
- Target sentuh ≥ 44×44 (tombol utama ≥ 50 tinggi).
- `prefers-reduced-motion` dan `prefers-color-scheme` tidak mengubah tema (selalu gelap).

## 9. Checklist Serah Terima Chello (Design System v1)

Sebelum Fase 0 tutup (2 Nov), Chello rilis di repo:
1. `tokens.css` — 5 warna, font, radius, easing, durasi.
2. Komponen: `Btn` (solid/ghost/orbit loading), `Panel`, `Track` (4 segmen), `AvatarStack` + tooltip, `Modal`, `Toast`, `Odometer`, `TabsPill`, `Field` (input/link).
3. `BackgroundEngine` terpasang + `setBackgroundState(view)` dipanggil dari router.
4. Kerangka 5 view + transisi masuk/keluar + thumb bar.
5. Satu halaman contoh (Story statis) memakai semua komponen — jadi referensi Iwan & Riski.

Selebihnya (warna ke-6, animasi liar, komponen galeri di luar 8) = ditolak di review.

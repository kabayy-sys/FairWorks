# FairWorks — Product Requirements Document (PRD)

STACK 2026 Hackathon GDGoC ITB · Kategori: Case Learning & College Life
Tim: Raken (Backend) · Chello, Iwan, Riski (Frontend)
Dokumen v1 — 27 Oktober 2026
Sumber: FairWorks_Blueprint_GDGoC_ITB_Pro.pdf, Ruang Tim Fondasi V2.html, Galeri Komponen

---

## 1. Ringkasan Produk

FairWorks adalah platform web anti free-rider untuk kerja kelompok. Ketua membagi tugas berpoin, kontrak disetujui semua anggota sejak awal, hasil baru dihitung setelah teman satu kelompok menyetujui bukti kerjanya, dan dosen menerima laporan kontribusi lewat satu tautan publik tanpa login.

**Janji produk (satu kalimat):** kerja kelompok yang adil dan terlihat, tanpa gesekan.

## 2. Persona

| Persona | Siapa | Kebutuhan | Frekuensi pakai |
|---|---|---|---|
| Ketua | Pembuat ruangan | Bagi tugas berpoin, pantau progres, kirim laporan ke dosen | Harian |
| Anggota | Mahasiswa tim | Tahu tugasnya, kirim bukti, menilai teman, gak dituduh free-rider | Harian |
| Dosen | Penilai | Lihat kontribusi riil tiap mahasiswa, tanpa bikin akun | Sekali per proyek |

## 3. Prinsip Desain (Effortless Contract)

1. **Aksi inti maksimal 2 ketukan.** Ambil = 1 klik. Kirim bukti = tempel link + 1 klik. Setuju = 1 klik.
2. **Satu layar, satu keputusan.** Setiap layar menjawab satu pertanyaan. Tidak ada form bertele-tele.
3. **Default cerdas, bukan pilihan.** Poin default 10. Kontrak auto-lock setelah 24 jam diam. Link dideteksi otomatis.
4. **Satu halaman.** Lima view, nol pindah aplikasi. Pindah view = suasana background ikut morph (signature moment).
5. **Monokrom, gelap, Geist.** 5 warna saja: `#0B0B0D #202024 #45454D #85858D #E8E8EC`. Komponen dari galeri dibawa maksimal 8 sisanya mati.
6. **Mobile-first, thumb bar.** Aksi utama di bawah layar. Bahasa UI: Indonesia penuh.

## 4. Ruang Lingkup MVP (Semifinal 30 November)

**MASUK:** auth magic link, ruangan + kode join, kontrak tugas berpoin + lock, siklus pengerjaan tugas lengkap (ambil/kirim/setuju/revisi/ambil alih), feed realtime, dossier publik (pie chart + timeline), notifikasi in-app + email.

**DITUNDA:** edit kontrak, ekspor PDF, multi-bahasa, notifikasi WA, tema terang, integrasi LMS.

## 5. Struktur Halaman (5 View, Satu Halaman)

| # | View | Isi | Latar background |
|---|---|---|---|
| 1 | Landing | Hero kinetic + preview progres + 3 fitur | Garis mengalir bebas |
| 2 | Auth | Magic link (email doang) | Garis berpusar ke tengah |
| 3 | Dashboard | Sapaan + 3 statistik + kartu ruangan + join kode | Garis bergelombang |
| 4 | Room | Progres besar + papan tugas + anggota + feed | Garis mengikis ke samping |
| 5 | Laporan publik | Pie kontribusi + timeline + daftar bukti | Garis tenang statis |

Navigasi: dock prototipe DIGANTI bar aksi bawah (thumb bar). Transisi antar view: keluar blur-turun, masuk rise berjenjang (pola Fondasi V2).

## 6. Fitur — Detail Menyeluruh

### F1 — Auth Magic Link
- Satu field: email. Kirim → email berisi tautan masuk → klik → masuk.
- Daftar dan masuk = alur yang sama. Tanpa kata sandi, tanpa nama wajib (nama diisi opsional saat pertama masuk, default dari email).
- Kriteria terima: dari buka situs sampai masuk Dashboard ≤ 30 detik, 2 ketukan + 1 klik email.

### F2 — Ruangan & Anggota
- Buat ruangan: 1 field nama. Pembuat otomatis jadi **ketua**. Kode ruangan otomatis (format `XXX-0X0`, contoh `RPD-4K7`).
- Join: masukkan kode ATAU klik tautan undangan → magic link → langsung dalam.
- Maks anggota: 10. Keluar ruangan: ada, dari menu anggota.
- Kriteria terima: anggota baru masuk < 20 detik tanpa bantuan ketua.

### F3 — Kontrak Tugas Berpoin (Agreement Lock)
- Ketua menulis tugas: judul (wajib), deskripsi (opsional), poin (default 10), tenggat (opsional, default +7 hari).
- Rekap kontrak: total poin, jumlah tugas, daftar anggota. Tombol tunggal: **Kirim kontrak**.
- Anggota menerima email → klik → baca → **Setuju** atau **Minta ubah** (wajib tulis catatan).
- **Lock:** semua setuju → terkunci. Atau diam 24 jam → auto-lock (aturan deadlock dari blueprint jadi default senyap; hak veto ketua hanya sebelum lock).
- Pasca-lock: tambah tugas baru boleh, tapi butuh persetujuan mayoritas anggota (alur vote sama, hanya untuk tugas baru itu). Hapus tugas: hanya sebelum lock, oleh ketua.
- Kriteria terima: kontrak 8 tugas terkunci < 5 menit dari sisi ketua; auto-lock teruji dengan clock tiruan.

### F4 — Siklus Pengerjaan Tugas (INTI PRODUK — paling detail)

#### 4.1 Model status
```
open ──ambil──▶ doing ──kirim bukti──▶ review ──mayoritas setuju──▶ done
  ▲                ▲                      │
  │                └────revisi───────────┘ (1 vote revisi + catatan wajib)
  └──(lepas / diambil alih / overdue)◀───┘
```
Status ditampilkan satu kata manusia: `Bisa diambil · Dikerjakan · Perlu disetujui · Selesai`.

#### 4.2 Ambil tugas (1 ketukan)
- Siapa: anggota mana pun, KECUALI pemegang tugas.
- Kapan: tugas `open` ATAU tugas `doing` yang **overdue** (lewat tenggat) — auto-buka.
- Efek: assignee lama gugur, pengambil baru menjadi assignee, status `doing`, aktivitas tercatat di feed.
- Konfirmasi: modal ringkas (judul + poin + tenggat) hanya untuk kasus ambil alih tugas orang.
- Lepas: assignee boleh **Lepas** (1 klik + konfirmasi) → kembali `open`.

#### 4.3 Kirim bukti (tempel + 1 ketukan)
- Hanya assignee. Field: **tautan bukti (wajib)** + catatan (opsional).
- Deteksi otomatis jenis link dan tampil sebagai chip: `GitHub` `Dokumen Google` `Figma` `Drive` `Lainnya`. Tanpa dropdown.
- Validasi: URL valid, satu tautan utama. Kirim → status `review`, vote round baru dimulai, anggota lain dapat notifikasi.

#### 4.4 Persetujuan teman (1 ketukan per suara)
- Pemilih: **semua anggota kecuali assignee** (ketua ikut memilih). Vote sendiri tidak pernah dihitung.
- Butuh: `mayoritas = floor((n-1)/2) + 1` suara **Setuju** (n = jumlah anggota). Contoh: 5 anggota → 3 suara.
- **Revisi:** 1 suara revisi (dengan catatan wajib) langsung mengembalikan tugas ke `doing`; catatan tampil di kartu; assignee memperbaiki lalu kirim ulang (vote di-reset, round baru).
- Keputusan pertama yang mencapai mayoritas menang; vote bersifat final per putaran.
- Transparansi: semua suara terlihat di detail tugas (siapa setuju, siapa minta revisi + alasannya).

#### 4.5 Tenggat & overdue
- Overdue = `due_date < hari ini` DAN status ≠ `done`. Badge pada kartu.
- Doing overdue → otomatis memenuhi syarat ambil alih (4.2). Tidak ada auto-hukuman lain di MVP.

#### 4.6 Progres
- Progres ruangan = `poin done / total poin kontrak (termasuk tugas tambahan terkunci)`, tampil angka besar + bar 4 segmen (done/review/doing/open).
- Progres anggota = poin done miliknya, bar mini per anggota (pola Fondasi V2).
- Angka bergerak dengan odometer, bar dengan transisi 1,6 detik.

#### 4.7 Feed & realtime
- Feed aktivitas:ambil, kirim, setuju, revisi, ambil alih, kontrak terkunci. Format kalimat manusia: "Bima mengirim hasil Rangkum 10 jurnal".
- Update realtime via Supabase Realtime per ruangan: kartu, bar, feed, suara — tanpa refresh. Wajib untuk demo juri.

#### 4.8 Edge case yang wajib ditangani
- Assignee kirim tautan rusak → bisa kirim ulang selama masih `review` (menimpa bukti lama, vote reset).
- Semua anggota kecuali assignee = 1 orang → butuh 1 suara saja (rumus tetap jalan).
- Anggota keluar tengah jalan → suaranya hangus, mayoritas dihitung ulang dari anggota aktif.
- Tugas tanpa tenggat → tidak pernah overdue.
- Nol tugas sebelum lock → tombol kirim kontrak mati dengan penjelasan.
- Koneksi putus saat kirim → optimistic UI + retry; tidak ada data hilang.

Kriteria terima F4: satu siklus penuh (ambil → kirim → 2 setuju → done) selesai oleh 2 orang berbeda dalam < 3 menit, di HP, tanpa penjelasan lisan.

### F5 — Dossier Publik (Wajib Full)
- URL: `/l/{report_token}` — token acak 16 karakter, tidak bisa ditebak. **Tanpa login.** Read-only murni.
- Isi:
  1. Kepala: nama ruangan, kode, anggota, total poin, status kontrak.
  2. **Pie chart kontribusi** per anggota (poin done). Monokrom, label persen.
  3. **Timeline pengerjaan**: per tanggal, siapa ambil/kirim/setuju/revisi apa.
  4. Tabel tugas akhir: judul, poin, status akhir, pemilik, chip tautan bukti (klik → buka bukti asli).
- Data lewat RPC publik `get_report(token)` — anggota non-ruangan dan anon hanya bisa baca via token.
- Kriteria terima: dosen dari nol ke paham kontribusi tiap anggota < 60 detik, di HP.

### F6 — Notifikasi In-App + Email
| Peristiwa | In-app | Email |
|---|---|---|
| Kontrak diajukan | Bell + badge | Ya |
| Ada bukti perlu disetujui | Bell + badge di kartu | Ya |
| Tugas kamu disetujui / direvisi | Bell + toast | Ya |
| Tugas kamu diambil alih | Bell + toast | Ya |
| Kontrak terkunci | Bell | Ya |

Email dari Supabase Auth + Edge Functions, template monokrom satu tombol utama.

## 7. Model Data (Supabase / Postgres)

```
profiles        id, email, nama, created_at
rooms           id, nama, kode (unik), owner_id, report_token (unik),
                locked_at (null = belum lock), contract_deadline, created_at
room_members    room_id, user_id, peran (ketua|anggota), joined_at
tasks           id, room_id, judul, deskripsi, poin, due_date, status
                (open|doing|review|done), assignee_id, submit_link,
                submit_note, submit_at, revision_note, vote_round,
                created_by, created_at
task_votes      id, task_id, voter_id, vote_round, vote (ok|revisi),
                note, created_at
activity_log    id, room_id, actor_id, aksi, task_id, meta jsonb, created_at
notifications   id, user_id, room_id, tipe, payload jsonb, read_at, created_at
```

Aturan RLS: anggota ruangan baca/tulis penuh di ruangannya; tabel `tasks`, `votes`, `activity_log` terekspose realtime ke anggota; laporan publik hanya lewat RPC ber-token.

## 8. Pembagian Tim

### Raken — Backend (penuh)
1. Setup Supabase: schema, indeks, RLS lengkap.
2. Auth magic link + template email.
3. RPC logika bisnis: `submit_contract`, `vote_contract`, `auto_lock`, `take_task`, `submit_proof`, `cast_vote`, `get_report(token)` — mayoritas, reset vote, ambil alih semuanya di sisi DB (frontend tidak boleh memutus aturan).
4. Supabase Realtime channel per ruangan.
5. Edge Function email notifikasi.
6. Seeding data demo 3 ruangan (pola data contoh Fondasi V2).

### Chello — Frontend A (fondasi + laporan)
1. **Design system**: token 5 warna, Geist, komponen dasar (btn, panel, track, avatar, modal, toast, odometer), integrasi Line Background Engine, transisi antar view — dirilis duluan supaya Iwan & Riski tinggal pasang. ← jalur kritis, kerjakan minggu pertama.
2. Landing + Auth (magic link).
3. Dossier publik: pie chart + timeline + tabel bukti.

### Iwan — Frontend B (kontrak + dashboard)
1. Flow kontrak: buat/edit tugas, rekap, kirim kontrak, modal Setuju/Minta ubah, status lock, countdown 24 jam, tambah tugas pasca-lock.
2. Join ruangan via kode/tautan.
3. Dashboard: sapaan, 3 statistik, kartu ruangan, tombol buat/join.
4. Notifikasi in-app: bell + daftar + toast.

### Riski — Frontend C (pengerjaan tugas = inti)
1. Papan tugas room: tabs status dengan pill bergerak, kartu tugas, badge overdue.
2. Ambil tugas + ambil alih + lepas (modal konfirmasi).
3. Kirim bukti: field link + deteksi chip + kirim ulang.
4. UI persetujuan: tombol Setuju/Revisi, daftar suara, catatan revisi.
5. Progres besar + bar anggota + feed realtime (langganan Supabase).
6. Edge case UI: kirim ulang, suara hangus, anggota keluar.

Bobot kasar: Chello = fondasi berat + 2 view ringan; Iwan = 2 area sedang; Riski = satu area terbesar. Merata karena fondasi Chello meringankan dua orang lain; semua tiga jalur bertemu di F4.

### Sinkronisasi
- Kontrak antarmuka: Raken rilis definisi RPC + tipe TypeScript di hari ke-2; frontend kerja pakai mock sampai API hidup.
- Chello rilis design system maksimal hari ke-4.
- Review silang: setiap PR di-review 1 orang frontend lain + Raken.

## 9. Non-Fungsional

- **Performa:** aksi optimis (< 100 ms persepsi), pindah view < 1 detik, Lighthouse mobile ≥ 85.
- **Mobile:** semua aksi inti selesai satu tangan; target sentuh ≥ 44 px; bar aksi di bawah.
- **Aksesibilitas:** fokus terlihat, kontras teks utama memenuhi AA, `prefers-reduced-motion` mematikan animasi (pola Fondasi V2 sudah ada).
- **Keamanan:** RLS ketat, token laporan tak tertebak, semua keputusan bisnis divalidasi di server, tidak ada rahasia di klien.
- **Bahasa UI:** Indonesia penuh, kalimat manusia tanpa jargon.

## 10. Metrik Sukses Demo

1. Siklus anti-free-rider lengkap dalam demo hidup < 5 menit.
2. Semua aksi inti ≤ 2 ketukan (diuji oleh orang di luar tim).
3. Dosen paham laporan < 60 detik tanpa dijelaskan.
4. Realtime terlihat: 2 perangkat, perubahan di satu langsung muncul di lain.
5. Lighthouse mobile ≥ 85; nol error console saat demo.

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Vote revisi tunggal bisa disalahgunakan | Catatan wajib + transparan di feed; kalau jadi masalah saat QA, naikkan jadi 2 suara revisi (satu baris rumus) |
| Magic link masuk folder spam | Uji 3 penyedia email sejak minggu pertama; sediakan tautan undangan ruangan sebagai jalur kedua |
| Realtime gagal di jaringan kampus | Fallback polling 10 detik |
| Demo butuh internet stabil | Data demo lokal + akun cadangan yang sudah masuk |
| Waktu mepet menuju 10 Nov | Fokus MVP; fitur DITUNDA benar-benar tidak disentuh |

## 12. Milestone

| Tanggal | Target |
|---|---|
| 27 Okt – 2 Nov | Repo + schema + auth (Raken); design system + transisi (Chello); mock kontrak & papan (Iwan, Riski) |
| 3 – 9 Nov | Semua fitur inti menyala end-to-end; dossier mulai |
| 10 Nov | Kirim abstrak & proposal |
| 10 – 22 Nov | Realtime + email + dossier selesai; uji nyata 2 kelompok di luar tim |
| 23 – 29 Nov | QA menyeluruh, bugfix, data demo, latihan presentasi |
| 30 Nov | **Semifinal — MVP tayang** |
| 1 – 6 Des | Polish final, deployment produksi |
| 7 Des | **Final — Bandung** |

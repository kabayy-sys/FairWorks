# FairWorks — Execution Plan (Tahapan Task)

Pendamping PRD v1 · STACK 2026 GDGoC ITB
Tim: Raken (Backend) · Chello, Iwan, Riski (Frontend)
Deadline keras (gerbang, bukan penentu urutan): **10 Nov** abstrak · **22 Nov** freeze · **30 Nov** semifinal · **7 Des** final

---

## 1. Prinsip Kerja (ikuti ketat)

1. **1 PR = 1 tugas kecil.** Tidak ada commit langsung ke `main`. Merge hanya dengan OK Raken.
2. **Kerja per tahap.** Tahap berikutnya dibuka begitu keluaran tahap sebelumnya siap — bukan begitu tanggal berganti.
3. **Tahap paralel diperbolehkan** kalau keluaran prasyaratnya sudah ada (lihat peta di bawah).
4. **Frontend kerja pakai mock sampai API hidup.** Gak ada yang nganggur.
5. **Definition of Done per tugas:** jalan di HP + desktop, lolos RLS, nol error console, pakai design system, bukan CSS tempelan.
6. **Sinkron harian async:** tiap sore satu pesan di grup — apa selesai, apa blokir.

## 2. Peta Alur Tahap

```
T0 Fondasi ✅
 └─▶ T1 Kerangka UI (Chello) ──▶ semua UI bisa dibangun
 └─▶ T2 Kontrak Backend (Raken) ──▶ API hidup
        T1 + T2 ──▶ T3 Flow Kontrak (Iwan)  ┐
                    T4 Siklus Tugas (Riski) ├──▶ T6 Nyala E2E ──▶ T7 Uji Nyata ──▶ T8 QA & Demo ──▶ T9 Final
        T1 saja ──▶ T5 Halaman Publik (Chello+Iwan) ┘
```

Paralel wajar: T3 + T4 + T5 berjalan bersamaan setelah T1/T2 cukup matang.

## 3. Daftar Tahap

### T0 — Fondasi ✅ (SELESAI, PR #1 merged)
- [x] Repo Next.js 16 + Tailwind v4 + TypeScript
- [x] Token 5 warna + easing di `app/globals.css`
- [x] Klien Supabase browser + server
- [x] `docs/` PRD + PLAN + DESIGN, README, aturan kerja

### T1 — Kerangka UI (Chello, jalur kritis) ✅ SELESAI (PR #5)
Keluaran: kerangka 5 view jalan + design system v1 rilis di repo.
- [x] Shell 5 view + transisi masuk/keluar + thumb bar *(transisi versi ringan — versi penuh §1.4 masuk tiket T6)*
- [x] Line Background Engine integrasi + 4 mood + `setBackgroundState(view)` *(mood room/laporan masih digabung — tiket T6)*
- [x] Komponen dasar: `Btn`, `Panel`, `Track` (4 segmen), `AvatarStack`+tooltip, `Modal`, `Toast`, `Odometer`, `TabsPill`, `Field` *(Odometer masih statis — tiket T6)*
- [x] Kinetic Title
- [x] Halaman Story statis = contoh pemakaian semua komponen (referensi Iwan & Riski)
- [x] Bonus: keyframes animasi native + override `prefers-reduced-motion` (hasil audit PR #5)

### T2 — Kontrak Backend (Raken) ✅ SELESAI (PR #6)
Keluaran: API hidup + tipe TypeScript — prasyarat T3 & T4 beneran nyambung.
- [x] Schema SQL 7 tabel + indeks + RLS lengkap
- [x] Auth magic link + template email (klien supabase terkonfigurasi)
- [x] Tipe TypeScript + definisi RPC: `submit_contract`, `vote_contract`, `auto_lock`, `take_task`, `submit_proof`, `cast_vote`, `get_report(token)`
- [x] RPC jalan + teruji (mayoritas, reset vote, ambil alih — semua di sisi DB)
- [x] Supabase Realtime channel per ruangan (publikasi supabase_realtime aktif)
- [x] Seeding 3 ruangan demo
- [x] Bonus: helper API siap pakai di `lib/api/fairworks.ts`

### T3 — Flow Kontrak (Iwan) — butuh T1, nyambung saat T2 siap ✅ SELESAI
Keluaran: kontrak bisa dibuat, dikirim, disetujui, terkunci.
- [x] Form buat/edit tugas (judul, deskripsi opsional, poin default 10, tenggat default +7 hari)
- [x] Rekap kontrak + tombol **Kirim kontrak**
- [x] Modal Setuju / Minta ubah (catatan wajib)
- [x] Banner countdown 24 jam + status lock + kontrak terkunci
- [x] Tambah tugas pasca-lock (vote mayoritas untuk tugas baru)
- [x] Join ruangan via kode/tautan

### T4 — Siklus Tugas (Riski) ✅ SELESAI
Keluaran: satu siklus penuh tugas selesai end-to-end.
- [x] Papan tugas: tabs pill, kartu status, badge overdue ("lewat 2 hari")
- [x] Ambil tugas (1 ketukan) + lepas + ambil alih (modal konfirmasi)
- [x] Kirim bukti: field link wajib + chip deteksi otomatis + kirim ulang
- [x] UI persetujuan: Setuju/Revisi, daftar suara transparan, catatan revisi
- [x] Progres besar + bar anggota + feed realtime (langganan Supabase)
- [x] Edge case UI: kirim ulang, suara hangus, anggota keluar, tanpa tenggat

### T5 — Halaman Publik (Chello + Iwan) — butuh T1; dossier nyambung saat ada data done
Keluaran: pintu masuk, masuk, dan laporan dosen jadi.
- [ ] Landing final (hero kinetic + preview + 3 fitur) — Chello
- [ ] Auth final (magic link satu field, state sukses kartu berganti isi) — Chello
- [x] Dashboard final (sapaan, 3 statistik odometer, kartu ruangan, join kode) — Iwan
- [ ] Dossier publik `/l/{token}`: kepala + pie monokrom + timeline + tabel bukti — Chello

### T6 — Nyala End-to-End (semua)
Keluaran: E2E pertama mulus + edge case tertutup.
- [ ] E2E: bikin ruangan → kontrak → ambil → kirim → 2 setuju → done (Rab pertama setelah T4 jadi)
- [ ] Edge case PRD 4.8 satu per satu
- [ ] Audit RLS + hardening RPC (Raken)
- [ ] Notifikasi: in-app bell + toast (Iwan) + email 5 trigger Edge Function (Raken)
- [ ] Fallback polling realtime

### T7 — Uji Nyata
Keluaran: orang luar tim selesai tanpa bantuan.
- [ ] Uji kelompok nyata #1 (5 orang) — catat friction per aksi
- [ ] Perbaikan friction ronde 1
- [ ] Uji kelompok nyata #2 + Lighthouse mobile ≥ 85 + aksi optimis < 100 ms
- [ ] Aksesibilitas + `prefers-reduced-motion` final

### T8 — QA & Demo
Keluaran: produksi hidup, rehearsal mulus.
- [ ] QA silang: tiap orang QA area orang lain, checklist edge case dicentang
- [ ] Mobile pass: aksi inti satu tangan, target sentuh ≥ 44 px
- [ ] Data demo 3 ruangan cerita lengkap + naskah demo 5 menit
- [ ] General rehearsal #1 → bugfix → rehearsal #2
- [ ] Deploy produksi (Vercel) + **freeze kode**

### T9 — Final
Keluaran: siap Bandung.
- [ ] Feedback juri semifinal → backlog polish
- [ ] Polish visual + micro-interaction
- [ ] Deploy final + rehearsal terakhir

## 4. Gerbang Deadline (dicek, bukan penentu urutan)

| Gerbang | Harus sudah lewat |
|---|---|
| 2 Nov | T0–T1 selesai, T2 minimal schema + auth, T3/T4 mock jalan |
| 9 Nov | T6 selesai — E2E mulus, siap draft abstrak |
| **10 Nov** | **Kirim abstrak & proposal** |
| 16 Nov | T7 uji kelompok #1 tuntas |
| 22 Nov | T7 selesai + **feature freeze** |
| 29 Nov | T8 selesai — produksi hidup, rehearsal 2x mulus |
| **30 Nov** | **Semifinal** |
| 6 Des | T9 selesai — berangkat Bandung |
| **7 Des** | **FINAL** |

## 5. Rencana Cadangan

| Gejala | Aksi |
|---|---|
| T1 (DS) molor | UI lanjut style sementara; DS dilepas sebagai skin |
| T2 API molor | Frontend tetap mock; Raken utamakan `submit_contract` + `cast_vote` dulu |
| Realtime goyah | Fallback polling 10 detik wajib terpasang sejak T6 |
| Email masuk spam | In-app cukup untuk demo |
| Dossier molor | Pie + tabel dulu, timeline menyusul |
| Molor apa pun | Potong polish — JANGAN potong E2E inti, dossier, satu rehearsal penuh |

## 6. Metrik Checkpoint

- Setelah T6: siklus penuh 2 orang < 3 menit di HP.
- Setelah T7: 2 kelompok nyata selesai tanpa bantuan; Lighthouse ≥ 85.
- Setelah T8: nol bug kritis, rehearsal 2x mulus, produksi hidup.

# FairWorks — Execution Plan

Pendamping PRD v1 (27 Okt 2026) · STACK 2026 GDGoC ITB
Tim: Raken (Backend) · Chello, Iwan, Riski (Frontend)
Deadline keras: **10 Nov** abstrak/proposal · **30 Nov** semifinal MVP · **7 Des** final Bandung

---

## 1. Prinsip Kerja (ikuti ketat)

1. **1 PR = 1 tugas kecil.** Gak ada PR raksasa. Review dulu, baru merge.
2. **Merge hanya dengan OK Raken.** Semua kerja lewat PR, gak ada commit langsung ke main.
3. **Definition of Done per tugas:** jalan di HP + desktop, lolos RLS (nyoba akses ruangan orang lain = ditolak), nol error console, pakai komponen design system Chello, bukan CSS tempelan.
4. **Sinkron harian async:** tiap sore satu pesan di grup tim — apa selesai, apa blokir. Tanpa rapat panjang.
5. **Frontend kerja pakai mock sampai API hidup.** Gak ada yang nganggur nungguin backend.

## 2. Peta Ketergantungan (siapa ngeblok siapa)

```
Raken: tipe TS + kontrak RPC (hari ke-2) ──▶ Iwan & Riski sambung API asli
Chello: design system (hari ke-4, JALUR KRITIS) ──▶ semua UI final
Riski: board + ambil/kirim ──▶ vote UI ──▶ E2E pertama ──▶ dossier butuh data done
```

Kalau jalur kritis Chello molor: semua lanjut pakai style sementara, DS tinggal dilepas di atasnya.

## 3. Fase 0 — Fondasi (Jumat 27 Okt – Senin 2 Nov)

| Hari | Raken | Chello | Iwan | Riski |
|---|---|---|---|---|
| Jum 27 | Setup repo Next.js+Tailwind+Supabase, env, konvensi branch. Schema SQL + RLS draft | Token 5 warna + font Geist + btn/panel | Shell 5 view + transisi antar view (mock) | Mock data + skeleton papan tugas |
| Sab 28 | **Rilis tipe TS + definisi RPC** (janji hari ke-2). Auth magic link | Komponen dasar: track, avatar, modal, toast, odometer | Form buat/edit tugas (1 field nama + poin default 10) | Kartu tugas + tabs pill |
| Min 29 — *libur ringan, opsional* | | | | |
| Sen 30... |

**Koreksi kalender — mulai dari sini pakai tanggal bener:**

| Tanggal | Raken | Chello | Iwan | Riski |
|---|---|---|---|---|
| Sel 28 | Tipe TS + RPC `submit_contract` | Odometer + line background engine integrasi | Form tugas | Kartu + tabs |
| Rab 29 | RPC `vote_contract` + `auto_lock` | Halaman Landing (hero kinetic) | Rekap + kirim kontrak + modal Setuju/Minta ubah (mock) | Ambil tugas + lepas (mock) |
| Kam 30 | Trigger email dasar | **DS final rilis** → mulai pie chart dossier | Sambung kontrak ke RPC asli | Kirim bukti + chip deteksi link |
| Jum 31 | Realtime channel per ruangan | Timeline dossier | Join ruangan via kode | Board sambung DB asli |
| Sab 1 – Min 2 Nov | Seeding 3 ruangan demo | Landing + Auth final | Dashboard (stats + kartu ruangan) | Feed skeleton + baca activity_log |
| **Sen 2 Nov — Checkpoint Fase 0** | Demo internal: magic link jalan, kontrak terkunci end-to-end, board baca data asli. Raken review semua PR tertunda | | | |

## 4. Fase 1 — Inti Menyala (Selasa 3 – Minggu 9 Nov)

| Tanggal | Fokus |
|---|---|
| Sel 3 | Riski: UI persetujuan (Setuju/Revisi + daftar suara) sambung RPC. Iwan: bell + toast (mock). Chello: tabel bukti dossier |
| Rab 4 | Raken: Edge Function email (5 trigger dari tabel notif PRD). Riski: feed realtime live. Iwan: countdown 24 jam + tugas pasca-lock |
| **Rab 5 — E2E pertama** | Bikin ruangan → kontrak → ambil → kirim → 2 setuju → done. Bug list dibuka |
| Kam 6 | Bugfix E2E. Iwan: dashboard final. Chello: polish transisi + background morph per view |
| Jum 7 | Ambil alih + overdue badge + edge case PRD 4.8 (kirim ulang, suara hangus). Raken: audit RLS + hardening RPC |
| Sab 8 | Dossier publik lengkap: token + halaman `/l/{token}` + RPC `get_report` |
| Min 9 — Checkpoint Fase 1 | Demo penuh: 2 laptop + 1 HP. Draft abstrak & proposal |
| **Sen 10 Nov** | **Kirim abstrak & proposal.** Semua review sebelum submit |

## 5. Fase 2 — Uji Nyata & Perkuat (11 – 22 Nov)

| Tanggal | Fokus |
|---|---|
| Sel–Kam 11–13 | Uji kelompok nyata #1 (5 orang di luar tim main sungguhan). Catat friction per aksi. Uji email ke Gmail/Outlook/Yahoo |
| Jum–Min 14–16 | Perbaikan friction ronde 1. Fallback polling realtime (kalau koneksi kampus jeblok) |
| Sen–Rab 17–19 | Uji kelompok nyata #2. Perf: Lighthouse mobile ≥ 85, aksi optimis < 100 ms |
| Kam–Sab 20–22 | Perbaikan ronde 2. Aksesibilitas + `prefers-reduced-motion`. **22 Nov: feature freeze** — apa pun belum selesai = mati, gak dibawa ke QA |

## 6. Fase 3 — QA & Demo (Minggu 23 – Sabtu 29 Nov)

| Tanggal | Fokus |
|---|---|
| Min–Sen 23–24 | QA silang: tiap orang QA area orang lain. Checklist edge case PRD 4.8 satu per satu, centang manual |
| Sel 25 | Mobile pass: semua aksi inti selesai satu tangan. Target sentuh ≥ 44 px |
| Rab 26 | Data demo: 3 ruangan cerita lengkap (satu hampir selesai biar pie-nya bagus). Naskah demo 5 menit + pembagian peran demo |
| Kam 27 | General rehearsal #1: demo penuh. Semua bug dicatat |
| Jum 28 | Buffer / bugfix |
| Sab 29 | General rehearsal #2. **Deploy produksi (Vercel). Freeze kode** |
| **Min 30 Nov** | **SEMIFINAL — MVP tayang** |

## 7. Fase 4 — Final (1 – 7 Des)

| Tanggal | Fokus |
|---|---|
| Sen–Sel 1–2 | Catat feedback juri semifinal → backlog polish |
| Rab–Kam 3–4 | Polish visual + micro-interaction + fix |
| Jum 5 | Deploy final + rehearsal |
| Sab 6 | Rehearsal terakhir + berangkat Bandung |
| **Min 7 Des** | **FINAL** |

## 8. Rencana Cadangan (kalau ada yang molor)

| Gejala (dicek tanggal) | Aksi |
|---|---|
| DS Chello belum final tgl 30 Okt | UI lanjut style sementara; DS dilepas sebagai skin di atas |
| API Raken belum siap tgl 4 Nov | Frontend tetap mock sampai 6 Nov; Raken utamakan `submit_contract` + `cast_vote` dulu, sisanya menyusul |
| Realtime goyah tgl 19 Nov | Fallback polling 10 detik sudah wajib terpasang sejak Fase 2 |
| Email masuk spam | In-app cukup untuk demo; email diperbaiki pasca-semifinal |
| Dossier timeline molor tgl 20 Nov | Pie + tabel dulu — tapi target tetap full sesuai PRD, ini hanya pagar darurat |
| Molor apa pun menjelang 29 Nov | Potong polish, JANGAN potong: E2E inti, dossier, satu rehearsal penuh |

## 9. Metrik Checkpoint (lolos = lanjut fase)

- **2 Nov:** magic link end-to-end, kontrak terkunci, board baca data asli.
- **9 Nov:** siklus penuh 2 orang < 3 menit di HP.
- **22 Nov:** 2 kelompok nyata selesai tanpa bantuan tim; Lighthouse ≥ 85.
- **29 Nov:** nol bug kritis, rehearsal 2x mulus, produksi hidup.

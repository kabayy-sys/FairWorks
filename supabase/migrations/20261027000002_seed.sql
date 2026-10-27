-- FairWorks Seed Demo Data
-- Matches Ruang Tim Fondasi V2 & PRD Section 6
-- Run this in Supabase SQL editor or seed script

do $$
declare
  v_ayu uuid := '11111111-1111-1111-1111-111111111111';
  v_bima uuid := '22222222-2222-2222-2222-222222222222';
  v_citra uuid := '33333333-3333-3333-3333-333333333333';
  v_dimas uuid := '44444444-4444-4444-4444-444444444444';
  v_esa uuid := '55555555-5555-5555-5555-555555555555';

  v_r1 uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_r2 uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_r3 uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  v_t1 uuid := gen_random_uuid();
  v_t2 uuid := gen_random_uuid();
  v_t3 uuid := gen_random_uuid();
  v_t4 uuid := gen_random_uuid();
  v_t5 uuid := gen_random_uuid();
  v_t6 uuid := gen_random_uuid();
  v_t7 uuid := gen_random_uuid();
  v_t8 uuid := gen_random_uuid();
begin
  -- 1. Mock Profiles
  insert into public.profiles (id, email, nama) values
    (v_ayu, 'ayu@kampus.id', 'Ayu'),
    (v_bima, 'bima@kampus.id', 'Bima'),
    (v_citra, 'citra@kampus.id', 'Citra'),
    (v_dimas, 'dimas@kampus.id', 'Dimas'),
    (v_esa, 'esa@kampus.id', 'Esa')
  on conflict (id) do update set nama = excluded.nama, email = excluded.email;

  -- 2. Room 1: Riset Pasar Digital (RPD-4K7)
  insert into public.rooms (id, nama, kode, owner_id, report_token, locked_at)
  values (v_r1, 'Riset Pasar Digital', 'RPD-4K7', v_ayu, 'demo_rpd_4k7_token', now() - interval '3 days')
  on conflict (id) do nothing;

  -- Members R1
  insert into public.room_members (room_id, user_id, peran, contract_vote, contract_voted_at) values
    (v_r1, v_ayu, 'ketua', 'agree', now() - interval '3 days'),
    (v_r1, v_bima, 'anggota', 'agree', now() - interval '3 days'),
    (v_r1, v_citra, 'anggota', 'agree', now() - interval '3 days'),
    (v_r1, v_dimas, 'anggota', 'agree', now() - interval '3 days'),
    (v_r1, v_esa, 'anggota', 'agree', now() - interval '3 days')
  on conflict (room_id, user_id) do nothing;

  -- Tasks R1
  insert into public.tasks (id, room_id, judul, deskripsi, poin, due_date, status, assignee_id, submit_link, submit_note, submit_at, created_by) values
    (v_t1, v_r1, 'Susun kuesioner survei', 'Maksimal 15 pertanyaan, uji coba ke 3 orang dulu.', 15, now() + interval '2 days', 'doing', v_citra, null, null, null, v_ayu),
    (v_t2, v_r1, 'Kumpulkan 30 responden survei', 'Sebar lewat grup angkatan dan media sosial.', 20, now() - interval '2 days', 'doing', v_dimas, null, null, null, v_ayu),
    (v_t3, v_r1, 'Rangkum 10 jurnal relevan', 'Satu paragraf per jurnal, sertakan sitasi.', 15, now() - interval '1 day', 'review', v_bima, 'https://drive.google.com/drive/folders/sample-jurnal', 'Semua 10 jurnal acuan sudah dirangkum.', now() - interval '1 hour', v_ayu),
    (v_t4, v_r1, 'Desain slide presentasi akhir', '12 slide, pakai template kelompok.', 10, now() + interval '6 days', 'open', null, null, null, null, v_ayu),
    (v_t5, v_r1, 'Tulis bab latar belakang', 'Dua halaman, rujuk hasil rangkuman jurnal.', 10, now() - interval '4 days', 'done', v_ayu, 'https://docs.google.com/document/d/sample-bab1', 'Sudah selesai dan direvisi.', now() - interval '3 days', v_ayu),
    (v_t6, v_r1, 'Olah data di spreadsheet', 'Bersihkan data, hitung rata-rata dan sebaran.', 15, now() + interval '5 days', 'doing', v_esa, null, null, null, v_ayu),
    (v_t7, v_r1, 'Latihan presentasi kelompok', 'Satu kali latihan penuh dengan pewaktu.', 5, now() + interval '9 days', 'open', null, null, null, null, v_ayu),
    (v_t8, v_r1, 'Cari topik dan rumusan masalah', 'Disepakati bersama dosen pembimbing.', 10, now() - interval '8 days', 'done', v_esa, 'https://github.com/sample/repo', 'Topik disetujui dosen.', now() - interval '7 days', v_ayu)
  on conflict (id) do nothing;

  -- Vote for t3 (Rangkum 10 jurnal)
  insert into public.task_votes (task_id, voter_id, vote_round, vote, note)
  values (v_t3, v_esa, 1, 'ok', null)
  on conflict (task_id, voter_id, vote_round) do nothing;

  -- Activity Log R1
  insert into public.activity_log (room_id, actor_id, aksi, task_id, meta, created_at) values
    (v_r1, v_bima, 'kirim_bukti', v_t3, jsonb_build_object('judul', 'Rangkum 10 jurnal relevan', 'link', 'https://drive.google.com/sample'), now() - interval '1 hour'),
    (v_r1, v_esa, 'memberi_suara', v_t3, jsonb_build_object('judul', 'Rangkum 10 jurnal relevan', 'voter_name', 'Esa', 'current_votes', 1, 'needed', 2), now() - interval '40 minutes'),
    (v_r1, v_esa, 'lepas_tugas', v_t4, jsonb_build_object('judul', 'Desain slide presentasi akhir'), now() - interval '1 day'),
    (v_r1, v_ayu, 'tambah_tugas', v_t7, jsonb_build_object('judul', 'Latihan presentasi kelompok'), now() - interval '1 day');

  -- 3. Room 2: Proyek Akhir Basis Data (PBD-9M2)
  insert into public.rooms (id, nama, kode, owner_id, report_token, locked_at)
  values (v_r2, 'Proyek Akhir Basis Data', 'PBD-9M2', v_bima, 'demo_pbd_9m2_token', now() - interval '5 days')
  on conflict (id) do nothing;

  insert into public.room_members (room_id, user_id, peran, contract_vote, contract_voted_at) values
    (v_r2, v_bima, 'ketua', 'agree', now() - interval '5 days'),
    (v_r2, v_ayu, 'anggota', 'agree', now() - interval '5 days'),
    (v_r2, v_dimas, 'anggota', 'agree', now() - interval '5 days'),
    (v_r2, v_citra, 'anggota', 'agree', now() - interval '5 days')
  on conflict (room_id, user_id) do nothing;

  insert into public.tasks (room_id, judul, deskripsi, poin, due_date, status, assignee_id, submit_link, submit_at, created_by) values
    (v_r2, 'Rancang diagram ERD', 'Minimal 8 entitas dan relasinya.', 20, now() - interval '6 days', 'done', v_bima, 'https://figma.com/sample-erd', now() - interval '5 days', v_bima),
    (v_r2, 'Buat skema tabel di server', 'Sertakan kunci dan indeks.', 20, now() + interval '3 days', 'doing', v_ayu, null, null, v_bima),
    (v_r2, 'Tulis 15 kueri laporan', 'Gabungan, agregasi, dan subkueri.', 25, now() + interval '7 days', 'doing', v_dimas, null, null, v_bima),
    (v_r2, 'Uji performa dan indeks', 'Bandingkan waktu sebelum dan sesudah.', 15, now() + interval '10 days', 'open', null, null, null, v_bima),
    (v_r2, 'Tulis laporan akhir', 'Maksimal 20 halaman.', 20, now() + interval '12 days', 'open', null, null, null, v_bima);

  -- 4. Room 3: Panitia Pensi Angkatan (PSN-6H3)
  insert into public.rooms (id, nama, kode, owner_id, report_token, locked_at)
  values (v_r3, 'Panitia Pensi Angkatan', 'PSN-6H3', v_citra, 'demo_psn_6h3_token', now() - interval '4 days')
  on conflict (id) do nothing;

  insert into public.room_members (room_id, user_id, peran, contract_vote, contract_voted_at) values
    (v_r3, v_citra, 'ketua', 'agree', now() - interval '4 days'),
    (v_r3, v_ayu, 'anggota', 'agree', now() - interval '4 days'),
    (v_r3, v_esa, 'anggota', 'agree', now() - interval '4 days')
  on conflict (room_id, user_id) do nothing;

  insert into public.tasks (room_id, judul, deskripsi, poin, due_date, status, assignee_id, submit_link, submit_at, created_by) values
    (v_r3, 'Survei lokasi dan harga sewa', 'Bandingkan tiga opsi gedung.', 10, now() - interval '1 day', 'review', v_ayu, 'https://docs.google.com/document/d/sample-sewa', now() - interval '2 hours', v_citra),
    (v_r3, 'Hubungi pengisi acara', 'Siapkan lima kandidat dan kisaran biaya.', 15, now() + interval '4 days', 'doing', v_esa, null, null, v_citra),
    (v_r3, 'Susun anggaran awal', 'Pemasukan, pengeluaran, dan cadangan.', 15, now() + interval '6 days', 'open', null, null, null, v_citra),
    (v_r3, 'Desain poster dan tiket', 'Dua ukuran: media sosial dan cetak.', 10, now() + interval '9 days', 'open', null, null, null, v_citra);

end $$;

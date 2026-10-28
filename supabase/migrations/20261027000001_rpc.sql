-- FairWorks RPC Functions
-- STACK 2026 Hackathon GDGoC ITB
-- PRD Section 6 (F3, F4, F5) & T2 Execution Plan

-- 1. Helper function: generate random room code (e.g. RPD-4K7)
create or replace function public.gen_room_code()
returns text as $$
declare
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  res text := '';
  i int;
begin
  for i in 1..3 loop
    res := res || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  res := res || '-';
  for i in 1..3 loop
    res := res || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return res;
end;
$$ language plpgsql volatile;

-- 2. create_room
create or replace function public.create_room(p_nama text)
returns jsonb as $$
declare
  v_uid uuid := auth.uid();
  v_room_id uuid;
  v_code text;
  v_retry int := 0;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  if trim(p_nama) = '' then
    raise exception 'Nama ruangan tidak boleh kosong';
  end if;

  -- Generate unique code
  loop
    v_code := public.gen_room_code();
    begin
      insert into public.rooms (nama, kode, owner_id)
      values (trim(p_nama), v_code, v_uid)
      returning id into v_room_id;
      exit;
    exception when unique_violation then
      v_retry := v_retry + 1;
      if v_retry > 10 then
        raise exception 'Gagal membuat kode unik ruangan';
      end if;
    end;
  end loop;

  -- Auto join owner as ketua
  insert into public.room_members (room_id, user_id, peran)
  values (v_room_id, v_uid, 'ketua');

  -- Log activity
  insert into public.activity_log (room_id, actor_id, aksi, meta)
  values (v_room_id, v_uid, 'membuat_ruangan', jsonb_build_object('nama', trim(p_nama), 'kode', v_code));

  return jsonb_build_object('room_id', v_room_id, 'kode', v_code, 'nama', trim(p_nama));
end;
$$ language plpgsql security definer set search_path = public;

-- 3. join_room
create or replace function public.join_room(p_kode text)
returns jsonb as $$
declare
  v_uid uuid := auth.uid();
  v_room record;
  v_member_count int;
  v_user_name text;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_room from public.rooms where upper(kode) = upper(trim(p_kode));
  if not found then
    raise exception 'Kode ruangan tidak ditemukan';
  end if;

  -- Check if already member
  if exists (select 1 from public.room_members where room_id = v_room.id and user_id = v_uid) then
    return jsonb_build_object('room_id', v_room.id, 'nama', v_room.nama, 'already_member', true);
  end if;

  -- Check member limit (10)
  select count(*) into v_member_count from public.room_members where room_id = v_room.id;
  if v_member_count >= 10 then
    raise exception 'Ruangan sudah penuh (maksimal 10 anggota)';
  end if;

  -- Add member
  insert into public.room_members (room_id, user_id, peran)
  values (v_room.id, v_uid, 'anggota');

  select coalesce(nullif(nama, ''), split_part(email, '@', 1)) into v_user_name
  from public.profiles where id = v_uid;

  -- Log activity
  insert into public.activity_log (room_id, actor_id, aksi, meta)
  values (v_room.id, v_uid, 'bergabung', jsonb_build_object('nama', v_user_name));

  return jsonb_build_object('room_id', v_room.id, 'nama', v_room.nama, 'already_member', false);
end;
$$ language plpgsql security definer set search_path = public;

-- 4. submit_contract (PRD F3)
create or replace function public.submit_contract(p_room_id uuid)
returns jsonb as $$
declare
  v_uid uuid := auth.uid();
  v_room record;
  v_task_count int;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if not found then
    raise exception 'Ruangan tidak ditemukan';
  end if;

  if v_room.owner_id != v_uid then
    raise exception 'Hanya ketua yang dapat mengajukan kontrak';
  end if;

  if v_room.locked_at is not null then
    raise exception 'Kontrak sudah terkunci';
  end if;

  select count(*) into v_task_count from public.tasks where room_id = p_room_id;
  if v_task_count = 0 then
    raise exception 'Belum ada tugas. Tambahkan minimal 1 tugas sebelum mengajukan kontrak.';
  end if;

  -- Set 24 hour deadline for auto-lock
  update public.rooms
  set contract_deadline = now() + interval '24 hours'
  where id = p_room_id;

  -- Auto agree for owner
  update public.room_members
  set contract_vote = 'agree',
      contract_voted_at = now()
  where room_id = p_room_id and user_id = v_uid;

  -- Reset vote for other members
  update public.room_members
  set contract_vote = null,
      contract_vote_note = null,
      contract_voted_at = null
  where room_id = p_room_id and user_id != v_uid;

  -- Log activity
  insert into public.activity_log (room_id, actor_id, aksi, meta)
  values (p_room_id, v_uid, 'mengajukan_kontrak', jsonb_build_object('deadline', now() + interval '24 hours'));

  -- Create notifications for members
  insert into public.notifications (user_id, room_id, tipe, payload)
  select user_id, p_room_id, 'kontrak_diajukan', jsonb_build_object('room_nama', v_room.nama)
  from public.room_members
  where room_id = p_room_id and user_id != v_uid;

  return jsonb_build_object('success', true, 'contract_deadline', now() + interval '24 hours');
end;
$$ language plpgsql security definer set search_path = public;

-- 5. vote_contract (PRD F3)
create or replace function public.vote_contract(p_room_id uuid, p_agree boolean, p_note text default null)
returns jsonb as $$
declare
  v_uid uuid := auth.uid();
  v_room record;
  v_total_members int;
  v_agreed_members int;
  v_all_agreed boolean := false;
  v_user_name text;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if not found then
    raise exception 'Ruangan tidak ditemukan';
  end if;

  if not exists (select 1 from public.room_members where room_id = p_room_id and user_id = v_uid) then
    raise exception 'Bukan anggota ruangan';
  end if;

  if v_room.locked_at is not null then
    raise exception 'Kontrak sudah terkunci';
  end if;

  if not p_agree and (p_note is null or trim(p_note) = '') then
    raise exception 'Catatan wajib diisi jika meminta perubahan';
  end if;

  update public.room_members
  set contract_vote = case when p_agree then 'agree' else 'request_changes' end,
      contract_vote_note = case when p_agree then null else trim(p_note) end,
      contract_voted_at = now()
  where room_id = p_room_id and user_id = v_uid;

  select coalesce(nullif(nama, ''), split_part(email, '@', 1)) into v_user_name
  from public.profiles where id = v_uid;

  if p_agree then
    -- Check if all members agreed
    select count(*), count(*) filter (where contract_vote = 'agree')
    into v_total_members, v_agreed_members
    from public.room_members
    where room_id = p_room_id;

    if v_total_members > 0 and v_total_members = v_agreed_members then
      update public.rooms set locked_at = now() where id = p_room_id;
      v_all_agreed := true;

      insert into public.activity_log (room_id, actor_id, aksi, meta)
      values (p_room_id, v_uid, 'kontrak_terkunci', jsonb_build_object('alasan', 'semua_setuju'));

      insert into public.notifications (user_id, room_id, tipe, payload)
      select user_id, p_room_id, 'kontrak_terkunci', jsonb_build_object('room_nama', v_room.nama)
      from public.room_members
      where room_id = p_room_id;
    else
      insert into public.activity_log (room_id, actor_id, aksi, meta)
      values (p_room_id, v_uid, 'menyetujui_kontrak', jsonb_build_object('nama', v_user_name));
    end if;
  else
    insert into public.activity_log (room_id, actor_id, aksi, meta)
    values (p_room_id, v_uid, 'minta_ubah_kontrak', jsonb_build_object('nama', v_user_name, 'catatan', trim(p_note)));
  end if;

  return jsonb_build_object('success', true, 'locked', v_all_agreed);
end;
$$ language plpgsql security definer set search_path = public;

-- 6. auto_lock (PRD F3 24h silent default)
create or replace function public.auto_lock(p_room_id uuid)
returns jsonb as $$
declare
  v_room record;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if not found then
    raise exception 'Ruangan tidak ditemukan';
  end if;

  if v_room.locked_at is not null then
    return jsonb_build_object('locked', true, 'already_locked', true);
  end if;

  if v_room.contract_deadline is not null and v_room.contract_deadline <= now() then
    update public.rooms set locked_at = now() where id = p_room_id;

    insert into public.activity_log (room_id, actor_id, aksi, meta)
    values (p_room_id, null, 'kontrak_terkunci', jsonb_build_object('alasan', 'auto_lock_24h'));

    insert into public.notifications (user_id, room_id, tipe, payload)
    select user_id, p_room_id, 'kontrak_terkunci', jsonb_build_object('room_nama', v_room.nama)
    from public.room_members
    where room_id = p_room_id;

    return jsonb_build_object('locked', true, 'already_locked', false);
  end if;

  return jsonb_build_object('locked', false, 'contract_deadline', v_room.contract_deadline);
end;
$$ language plpgsql security definer set search_path = public;

-- 7. take_task (PRD F4.2: Ambil tugas & ambil alih overdue)
create or replace function public.take_task(p_task_id uuid)
returns jsonb as $$
declare
  v_uid uuid := auth.uid();
  v_task record;
  v_is_overdue boolean := false;
  v_old_assignee uuid;
  v_user_name text;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_task from public.tasks where id = p_task_id;
  if not found then
    raise exception 'Tugas tidak ditemukan';
  end if;

  if not exists (select 1 from public.room_members where room_id = v_task.room_id and user_id = v_uid) then
    raise exception 'Bukan anggota ruangan';
  end if;

  if v_task.assignee_id = v_uid then
    raise exception 'Anda sudah memegang tugas ini';
  end if;

  -- Overdue check for taking over
  if v_task.status = 'doing' and v_task.due_date is not null and v_task.due_date < now() then
    v_is_overdue := true;
  end if;

  if v_task.status != 'open' and not v_is_overdue then
    raise exception 'Tugas tidak dapat diambil saat ini';
  end if;

  v_old_assignee := v_task.assignee_id;

  update public.tasks
  set assignee_id = v_uid,
      status = 'doing',
      revision_note = null
  where id = p_task_id;

  select coalesce(nullif(nama, ''), split_part(email, '@', 1)) into v_user_name
  from public.profiles where id = v_uid;

  if v_is_overdue and v_old_assignee is not null then
    -- Log takeover
    insert into public.activity_log (room_id, actor_id, aksi, task_id, meta)
    values (v_task.room_id, v_uid, 'ambil_alih_tugas', p_task_id, jsonb_build_object(
      'judul', v_task.judul,
      'poin', v_task.poin,
      'old_assignee', v_old_assignee
    ));

    -- Notify old assignee
    insert into public.notifications (user_id, room_id, tipe, payload)
    values (v_old_assignee, v_task.room_id, 'tugas_diambil_alih', jsonb_build_object(
      'judul', v_task.judul,
      'new_assignee_name', v_user_name
    ));
  else
    -- Standard take
    insert into public.activity_log (room_id, actor_id, aksi, task_id, meta)
    values (v_task.room_id, v_uid, 'ambil_tugas', p_task_id, jsonb_build_object(
      'judul', v_task.judul,
      'poin', v_task.poin
    ));
  end if;

  return jsonb_build_object('success', true, 'is_takeover', v_is_overdue);
end;
$$ language plpgsql security definer set search_path = public;

-- 8. submit_proof (PRD F4.3: Kirim bukti kerja)
create or replace function public.submit_proof(p_task_id uuid, p_link text, p_note text default null)
returns jsonb as $$
declare
  v_uid uuid := auth.uid();
  v_task record;
  v_user_name text;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  if trim(p_link) = '' then
    raise exception 'Tautan bukti wajib diisi';
  end if;

  select * into v_task from public.tasks where id = p_task_id;
  if not found then
    raise exception 'Tugas tidak ditemukan';
  end if;

  if v_task.assignee_id != v_uid then
    raise exception 'Hanya pemegang tugas yang dapat mengirim bukti';
  end if;

  if v_task.status not in ('doing', 'review') then
    raise exception 'Tugas tidak dalam status pengerjaan atau tinjauan';
  end if;

  -- Update task, bump vote round (resets votes for new round)
  update public.tasks
  set status = 'review',
      submit_link = trim(p_link),
      submit_note = trim(coalesce(p_note, '')),
      submit_at = now(),
      revision_note = null,
      vote_round = vote_round + 1
  where id = p_task_id;

  select coalesce(nullif(nama, ''), split_part(email, '@', 1)) into v_user_name
  from public.profiles where id = v_uid;

  -- Log activity
  insert into public.activity_log (room_id, actor_id, aksi, task_id, meta)
  values (v_task.room_id, v_uid, 'kirim_bukti', p_task_id, jsonb_build_object(
    'judul', v_task.judul,
    'link', trim(p_link),
    'nama', v_user_name
  ));

  -- Notify other members
  insert into public.notifications (user_id, room_id, tipe, payload)
  select user_id, v_task.room_id, 'perlu_persetujuan', jsonb_build_object(
    'task_id', p_task_id,
    'judul', v_task.judul,
    'sender_name', v_user_name
  )
  from public.room_members
  where room_id = v_task.room_id and user_id != v_uid;

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer set search_path = public;

-- 9. cast_vote (PRD F4.4: Persetujuan teman & revisi)
create or replace function public.cast_vote(p_task_id uuid, p_vote text, p_note text default null)
returns jsonb as $$
declare
  v_uid uuid := auth.uid();
  v_task record;
  v_eligible_members int;
  v_needed int;
  v_ok_votes int;
  v_voter_name text;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  if p_vote not in ('ok', 'revisi') then
    raise exception 'Pilihan vote tidak valid (harus ok atau revisi)';
  end if;

  select * into v_task from public.tasks where id = p_task_id;
  if not found then
    raise exception 'Tugas tidak ditemukan';
  end if;

  if not exists (select 1 from public.room_members where room_id = v_task.room_id and user_id = v_uid) then
    raise exception 'Bukan anggota ruangan';
  end if;

  -- Assignee cannot vote on own task
  if v_task.assignee_id = v_uid then
    raise exception 'Anda tidak dapat menilai pekerjaan Anda sendiri';
  end if;

  if v_task.status != 'review' then
    raise exception 'Tugas tidak sedang menunggu persetujuan';
  end if;

  select coalesce(nullif(nama, ''), split_part(email, '@', 1)) into v_voter_name
  from public.profiles where id = v_uid;

  if p_vote = 'revisi' then
    if p_note is null or trim(p_note) = '' then
      raise exception 'Catatan revisi wajib diisi';
    end if;

    -- 1 vote revisi returns task to doing
    update public.tasks
    set status = 'doing',
        revision_note = trim(p_note)
    where id = p_task_id;

    -- Record vote
    insert into public.task_votes (task_id, voter_id, vote_round, vote, note)
    values (p_task_id, v_uid, v_task.vote_round, 'revisi', trim(p_note))
    on conflict (task_id, voter_id, vote_round) do update
    set vote = 'revisi', note = trim(p_note);

    -- Log activity
    insert into public.activity_log (room_id, actor_id, aksi, task_id, meta)
    values (v_task.room_id, v_uid, 'minta_revisi', p_task_id, jsonb_build_object(
      'judul', v_task.judul,
      'voter_name', v_voter_name,
      'catatan', trim(p_note)
    ));

    -- Notify assignee
    if v_task.assignee_id is not null then
      insert into public.notifications (user_id, room_id, tipe, payload)
      values (v_task.assignee_id, v_task.room_id, 'tugas_revisi', jsonb_build_object(
        'judul', v_task.judul,
        'catatan', trim(p_note),
        'voter_name', v_voter_name
      ));
    end if;

    return jsonb_build_object('success', true, 'status', 'doing', 'verdict', 'revisi');
  end if;

  -- p_vote = 'ok'
  insert into public.task_votes (task_id, voter_id, vote_round, vote, note)
  values (p_task_id, v_uid, v_task.vote_round, 'ok', null)
  on conflict (task_id, voter_id, vote_round) do update
  set vote = 'ok', note = null;

  -- Count eligible voters (members excluding assignee)
  select count(*) into v_eligible_members
  from public.room_members
  where room_id = v_task.room_id and user_id != v_task.assignee_id;

  -- Formula: floor((n-1)/2) + 1
  if v_eligible_members <= 1 then
    v_needed := 1;
  else
    v_needed := floor((v_eligible_members - 1) / 2.0)::int + 1;
  end if;

  -- Count current OK votes in this round
  select count(*) into v_ok_votes
  from public.task_votes
  where task_id = p_task_id and vote_round = v_task.vote_round and vote = 'ok';

  if v_ok_votes >= v_needed then
    -- Mark done
    update public.tasks
    set status = 'done'
    where id = p_task_id;

    -- Log activity
    insert into public.activity_log (room_id, actor_id, aksi, task_id, meta)
    values (v_task.room_id, v_uid, 'tugas_disetujui', p_task_id, jsonb_build_object(
      'judul', v_task.judul,
      'poin', v_task.poin,
      'assignee_id', v_task.assignee_id
    ));

    -- Notify assignee
    if v_task.assignee_id is not null then
      insert into public.notifications (user_id, room_id, tipe, payload)
      values (v_task.assignee_id, v_task.room_id, 'tugas_selesai', jsonb_build_object(
        'judul', v_task.judul,
        'poin', v_task.poin
      ));
    end if;

    return jsonb_build_object('success', true, 'status', 'done', 'ok_votes', v_ok_votes, 'needed', v_needed);
  end if;

  -- Just recorded vote, not yet threshold
  insert into public.activity_log (room_id, actor_id, aksi, task_id, meta)
  values (v_task.room_id, v_uid, 'memberi_suara', p_task_id, jsonb_build_object(
    'judul', v_task.judul,
    'voter_name', v_voter_name,
    'current_votes', v_ok_votes,
    'needed', v_needed
  ));

  return jsonb_build_object('success', true, 'status', 'review', 'ok_votes', v_ok_votes, 'needed', v_needed);
end;
$$ language plpgsql security definer set search_path = public;

-- 10. get_report (PRD F5: Dossier publik untuk dosen, nol login)
create or replace function public.get_report(p_token text)
returns jsonb as $$
declare
  v_room record;
  v_members jsonb;
  v_tasks jsonb;
  v_timeline jsonb;
  v_stats jsonb;
  v_total_points int;
  v_done_points int;
begin
  select * into v_room from public.rooms where report_token = trim(p_token);
  if not found then
    raise exception 'Laporan tidak ditemukan atau tautan tidak valid';
  end if;

  -- Members with done points and percentage
  select jsonb_agg(
    jsonb_build_object(
      'user_id', p.id,
      'nama', coalesce(nullif(p.nama, ''), split_part(p.email, '@', 1)),
      'peran', rm.peran,
      'points_done', coalesce(sum(t.poin) filter (where t.status = 'done'), 0)
    )
  )
  into v_members
  from public.room_members rm
  join public.profiles p on p.id = rm.user_id
  left join public.tasks t on t.room_id = v_room.id and t.assignee_id = p.id
  where rm.room_id = v_room.id
  group by p.id, p.nama, p.email, rm.peran;

  -- Total points
  select
    coalesce(sum(poin), 0),
    coalesce(sum(poin) filter (where status = 'done'), 0)
  into v_total_points, v_done_points
  from public.tasks
  where room_id = v_room.id;

  -- Task list with proof
  select jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'judul', t.judul,
      'deskripsi', t.deskripsi,
      'poin', t.poin,
      'status', t.status,
      'assignee_name', coalesce(p.nama, split_part(p.email, '@', 1)),
      'submit_link', t.submit_link,
      'submit_note', t.submit_note,
      'submit_at', t.submit_at
    ) order by t.created_at asc
  )
  into v_tasks
  from public.tasks t
  left join public.profiles p on p.id = t.assignee_id
  where t.room_id = v_room.id;

  -- Timeline from activity_log
  select jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'aksi', a.aksi,
      'actor_name', coalesce(p.nama, split_part(p.email, '@', 1)),
      'meta', a.meta,
      'created_at', a.created_at
    ) order by a.created_at desc
  )
  into v_timeline
  from public.activity_log a
  left join public.profiles p on p.id = a.actor_id
  where a.room_id = v_room.id;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'nama', v_room.nama,
      'kode', v_room.kode,
      'locked_at', v_room.locked_at,
      'created_at', v_room.created_at,
      'total_points', v_total_points,
      'done_points', v_done_points
    ),
    'members', coalesce(v_members, '[]'::jsonb),
    'tasks', coalesce(v_tasks, '[]'::jsonb),
    'timeline', coalesce(v_timeline, '[]'::jsonb)
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Grant execute on get_report to anon and authenticated
grant execute on function public.get_report(text) to anon, authenticated;

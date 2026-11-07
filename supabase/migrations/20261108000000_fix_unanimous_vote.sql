-- Fix: cast_vote harus unanimous (semua anggota selain assignee harus setuju)
-- Sebelumnya pakai formula mayoritas floor((n-1)/2)+1 yang bikin 1 vote langsung done

create or replace function public.cast_vote(p_task_id uuid, p_vote text, p_note text default null)
returns jsonb as $$
declare
  v_uid uuid;
  v_task record;
  v_voter_name text;
  v_eligible_members int;
  v_ok_votes int;
  v_needed int;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  select t.*, r.id as room_id, r.contract_locked
  into v_task
  from public.tasks t
  join public.rooms r on r.id = t.room_id
  where t.id = p_task_id;

  if not found then
    raise exception 'Tugas tidak ditemukan';
  end if;

  if v_task.status != 'review' then
    raise exception 'Tugas tidak dalam status review';
  end if;

  -- Voter harus anggota ruangan
  if not exists (
    select 1 from public.room_members
    where room_id = v_task.room_id and user_id = v_uid
  ) then
    raise exception 'Kamu bukan anggota ruangan ini';
  end if;

  -- Assignee tidak boleh vote tugasnya sendiri
  if v_task.assignee_id = v_uid then
    raise exception 'Kamu tidak bisa menilai tugasmu sendiri';
  end if;

  select coalesce(nama, email) into v_voter_name
  from public.profiles where id = v_uid;

  if p_vote = 'revisi' then
    -- Revisi: kembalikan ke doing, hapus semua vote ronde ini
    insert into public.task_votes (task_id, voter_id, vote_round, vote, note)
    values (p_task_id, v_uid, v_task.vote_round, 'revisi', p_note)
    on conflict (task_id, voter_id, vote_round) do update
    set vote = 'revisi', note = p_note;

    update public.tasks
    set status = 'doing', vote_round = v_task.vote_round + 1
    where id = p_task_id;

    insert into public.activity_log (room_id, actor_id, aksi, task_id, meta)
    values (v_task.room_id, v_uid, 'meminta_revisi', p_task_id, jsonb_build_object(
      'judul', v_task.judul,
      'voter_name', v_voter_name,
      'note', p_note
    ));

    if v_task.assignee_id is not null then
      insert into public.notifications (user_id, room_id, tipe, payload)
      values (v_task.assignee_id, v_task.room_id, 'tugas_direvisi', jsonb_build_object(
        'judul', v_task.judul,
        'note', p_note
      ));
    end if;

    return jsonb_build_object('success', true, 'status', 'doing');
  end if;

  -- Vote OK
  insert into public.task_votes (task_id, voter_id, vote_round, vote, note)
  values (p_task_id, v_uid, v_task.vote_round, 'ok', null)
  on conflict (task_id, voter_id, vote_round) do update
  set vote = 'ok', note = null;

  -- Eligible voters: semua anggota kecuali assignee
  select count(*) into v_eligible_members
  from public.room_members
  where room_id = v_task.room_id and user_id != v_task.assignee_id;

  -- UNANIMOUS: semua eligible voter harus ok
  v_needed := v_eligible_members;

  -- Count OK votes ronde ini
  select count(*) into v_ok_votes
  from public.task_votes
  where task_id = p_task_id and vote_round = v_task.vote_round and vote = 'ok';

  if v_ok_votes >= v_needed then
    update public.tasks
    set status = 'done'
    where id = p_task_id;

    insert into public.activity_log (room_id, actor_id, aksi, task_id, meta)
    values (v_task.room_id, v_uid, 'tugas_disetujui', p_task_id, jsonb_build_object(
      'judul', v_task.judul,
      'poin', v_task.poin,
      'assignee_id', v_task.assignee_id
    ));

    if v_task.assignee_id is not null then
      insert into public.notifications (user_id, room_id, tipe, payload)
      values (v_task.assignee_id, v_task.room_id, 'tugas_selesai', jsonb_build_object(
        'judul', v_task.judul,
        'poin', v_task.poin
      ));
    end if;

    return jsonb_build_object('success', true, 'status', 'done', 'ok_votes', v_ok_votes, 'needed', v_needed);
  end if;

  -- Vote tercatat, belum semua setuju
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

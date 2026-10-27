-- FairWorks Database Schema
-- STACK 2026 Hackathon GDGoC ITB
-- PRD Section 7 & T2 Execution Plan

-- 1. Profiles table (synced with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nama text not null default '',
  created_at timestamptz not null default now()
);

-- Auto create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nama)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      nama = case when public.profiles.nama = '' then excluded.nama else public.profiles.nama end;
  return new;
end;
$$ language plpgsql security definer search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Rooms table
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kode text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  report_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  locked_at timestamptz default null,
  contract_deadline timestamptz default null,
  created_at timestamptz not null default now()
);

-- 3. Room Members table
create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  peran text not null check (peran in ('ketua', 'anggota')) default 'anggota',
  contract_vote text check (contract_vote in ('agree', 'request_changes')),
  contract_vote_note text,
  contract_voted_at timestamptz,
  joined_at timestamptz not null default now(),
  constraint unique_room_member unique (room_id, user_id)
);

-- 4. Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  judul text not null,
  deskripsi text,
  poin integer not null default 10 check (poin > 0),
  due_date timestamptz,
  status text not null check (status in ('open', 'doing', 'review', 'done')) default 'open',
  assignee_id uuid references public.profiles(id) on delete set null,
  submit_link text,
  submit_note text,
  submit_at timestamptz,
  revision_note text,
  vote_round integer not null default 1,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 5. Task Votes table
create table if not exists public.task_votes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  vote_round integer not null default 1,
  vote text not null check (vote in ('ok', 'revisi')),
  note text,
  created_at timestamptz not null default now(),
  constraint unique_task_voter_round unique (task_id, voter_id, vote_round)
);

-- 6. Activity Log table
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  aksi text not null,
  task_id uuid references public.tasks(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 7. Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  tipe text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz default null,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_rooms_kode on public.rooms(kode);
create index if not exists idx_rooms_report_token on public.rooms(report_token);
create index if not exists idx_room_members_user on public.room_members(user_id);
create index if not exists idx_room_members_room on public.room_members(room_id);
create index if not exists idx_tasks_room on public.tasks(room_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_task_votes_task_round on public.task_votes(task_id, vote_round);
create index if not exists idx_activity_log_room on public.activity_log(room_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read_at) where read_at is null;

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_votes enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;

-- Helper security functions
create or replace function public.is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = p_user_id
  );
$$ language sql stable security definer search_path = public;

create or replace function public.is_room_owner(p_room_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.rooms
    where id = p_room_id and owner_id = p_user_id
  );
$$ language sql stable security definer search_path = public;

-- Profiles policies
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Rooms policies
create policy "Members and owners can view rooms"
  on public.rooms for select
  to authenticated
  using (owner_id = auth.uid() or public.is_room_member(id, auth.uid()));

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update rooms"
  on public.rooms for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Room Members policies
create policy "Members can view room members"
  on public.room_members for select
  to authenticated
  using (public.is_room_member(room_id, auth.uid()));

create policy "Owners can insert room members"
  on public.room_members for insert
  to authenticated
  with check (
    public.is_room_owner(room_id, auth.uid())
    or user_id = auth.uid()
  );

-- Tasks policies
create policy "Members can view tasks"
  on public.tasks for select
  to authenticated
  using (public.is_room_member(room_id, auth.uid()));

create policy "Members can create tasks"
  on public.tasks for insert
  to authenticated
  with check (public.is_room_member(room_id, auth.uid()));

create policy "Members can update tasks"
  on public.tasks for update
  to authenticated
  using (public.is_room_member(room_id, auth.uid()))
  with check (public.is_room_member(room_id, auth.uid()));

-- Task Votes policies
create policy "Members can view votes"
  on public.task_votes for select
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_room_member(t.room_id, auth.uid())
    )
  );

create policy "Members can insert votes"
  on public.task_votes for insert
  to authenticated
  with check (
    voter_id = auth.uid() and
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_room_member(t.room_id, auth.uid())
    )
  );

-- Activity Log policies
create policy "Members can view activity log"
  on public.activity_log for select
  to authenticated
  using (public.is_room_member(room_id, auth.uid()));

create policy "System and members can insert activity log"
  on public.activity_log for insert
  to authenticated
  with check (public.is_room_member(room_id, auth.uid()));

-- Notifications policies
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Enable Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'task_votes') then
    alter publication supabase_realtime add table public.task_votes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'activity_log') then
    alter publication supabase_realtime add table public.activity_log;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'room_members') then
    alter publication supabase_realtime add table public.room_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'rooms') then
    alter publication supabase_realtime add table public.rooms;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Migration: policy hapus ruangan (owner-only)
-- Latar: PR #17 FairWorks menambahkan fitur hapus ruangan di dashboard,
--        tetapi tabel rooms tidak punya policy FOR DELETE, sehingga dengan
--        RLS aktif setiap DELETE selalu ditolak.
-- Perilaku: hanya owner ruangan yang boleh menghapus. Data anak
--        (tasks, room_members, task_votes, activity_log) sudah
--        on delete cascade, jadi ikut terbersihkan otomatis.

create policy "Owners can delete rooms"
  on public.rooms
  for delete
  to authenticated
  using (owner_id = auth.uid());

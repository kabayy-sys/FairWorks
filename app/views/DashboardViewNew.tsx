'use client';

import React from 'react';
import type { DashboardRoomItem } from '../components/DashboardView';

export interface MyTaskRow {
  id: string;
  judul: string;
  status: string;
  poin: number;
  due_date: string | null;
  rooms: { nama: string | null } | null;
}

interface DashboardNewProps {
  userName: string;
  rooms: DashboardRoomItem[];
  myTasks: MyTaskRow[];
  onSelectRoom: (room: DashboardRoomItem) => void;
  onJoin: () => void;
  onCreate: () => void;
  onDeleteRoom?: (roomId: string) => Promise<void>;
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Belum diambil',
  doing: 'Dikerjakan',
  review: 'Menunggu persetujuan',
  done: 'Selesai',
};

// Dashboard (ruang-tim §dashboard): baris ruangan + aside tugas milik sendiri.
export function DashboardViewNew({ userName, rooms, myTasks, onSelectRoom, onJoin, onCreate, onDeleteRoom }: DashboardNewProps) {
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async (roomId: string) => {
    if (!onDeleteRoom) return;
    setDeleting(true);
    try {
      await onDeleteRoom(roomId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fw-stagger mx-auto w-full max-w-[1040px] px-5 pt-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,3.6vw,34px)] font-semibold leading-tight tracking-[-0.025em]">
            Halo, {userName}.
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--c3)]">{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onJoin}
            className="btn cursor-pointer rounded-[10px] border border-[var(--c2)] bg-transparent px-4 py-2 text-[14px] font-medium text-[var(--c4)] transition-colors hover:bg-[var(--c1)]"
          >
            Gabung dengan kode
          </button>
          <button
            onClick={onCreate}
            className="btn solid cursor-pointer rounded-[10px] border border-[var(--c4)] bg-[var(--c4)] px-4 py-2 text-[14px] font-medium text-[var(--c0)] transition-all hover:brightness-110"
          >
            Buat ruangan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Daftar ruangan">
          {rooms.length === 0 ? (
            <div className="grid gap-3 border-t border-[var(--c1)] py-12 text-[var(--c3)]">
              <h3 className="text-[18px] font-semibold text-[var(--c4)]">Belum ada ruangan.</h3>
              <p className="text-sm">Buat ruangan pertama, atau gabung lewat kode dari temanmu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const pct = Math.round(((room.donePoints || 0) / Math.max(1, room.totalPoints || 1)) * 100);
                const isOwner = room.role === 'ketua';
                return (
                  <div
                    key={room.id}
                    className="group relative rounded-[18px] border border-[var(--c1)] bg-[var(--c0)] p-5 transition-all hover:border-[var(--c2)] space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        onClick={() => onSelectRoom(room)}
                        className="min-w-0 flex-1 cursor-pointer text-left transition-colors"
                      >
                        <h3 className="truncate text-[18px] font-semibold text-[var(--c4)] tracking-tight">{room.nama}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[var(--c3)] font-mono">
                          <span className="rounded border border-dashed border-[var(--c2)] px-1.5 py-0.5 text-[11px]">
                            {room.kode}
                          </span>
                          <span>{room.role === 'ketua' ? 'Ketua (Anda)' : 'Anggota'}</span>
                          <span>·</span>
                          <span>{room.membersCount} anggota</span>
                          {room.status === 'locked' && <span className="text-[var(--c4)]">· Kontrak terkunci</span>}
                        </p>
                      </button>

                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(room.id);
                          }}
                          className="cursor-pointer rounded-lg border border-[var(--c1)] bg-[var(--c1)]/60 px-2.5 py-1 text-[11px] font-mono text-[var(--c3)] transition-colors hover:border-[var(--c2)] hover:text-[var(--c4)]"
                          title="Hapus ruangan"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[var(--c1)]">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[var(--c3)]">Progres Selesai</span>
                        <span className="font-semibold text-[var(--c4)] tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--c1)]">
                        <div
                          className="h-full rounded-full bg-[var(--c4)] transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside>
          <div className="flex items-center gap-3 mb-4 p-3.5 rounded-[16px] border border-[var(--c1)] bg-[var(--c0)]">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--c1)] text-sm font-bold text-[var(--c4)] border border-[var(--c2)]">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <b className="block truncate text-[14.5px] font-medium text-[var(--c4)]">{userName}</b>
              <small className="text-[12px] text-[var(--c3)] font-mono">Profil Anggota Aktif</small>
            </div>
          </div>

          <h2 className="mb-3 text-[14px] font-medium text-[var(--c3)]">Tugas Anda</h2>
          {myTasks.length === 0 ? (
            <p className="text-[13.5px] text-[var(--c3)]">Belum ada tugas berjalan. Ambil tugas dari ruangan timmu.</p>
          ) : (
            <div className="space-y-2.5">
              {myTasks.map((t) => (
                <div key={t.id} className="rounded-[14px] border border-[var(--c1)] bg-[var(--c0)] p-4 space-y-2 transition-all hover:border-[var(--c2)]">
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-[14.5px] font-medium text-[var(--c4)] leading-snug">{t.judul}</b>
                    <span className="shrink-0 rounded-full border border-[var(--c2)] px-2 py-0.5 font-mono text-[11px] text-[var(--c3)] tabular-nums">
                      {t.poin}p
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[var(--c3)] font-mono">
                    <span className="truncate">{t.rooms?.nama ?? 'Ruangan'}</span>
                    <span className="rounded bg-[var(--c1)] px-2 py-0.5 text-[var(--c4)]">{STATUS_LABEL[t.status] ?? t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteConfirm(null)}>
          <div
            className="w-full max-w-sm mx-4 rounded-[22px] border border-[var(--c2)] bg-[var(--c0)] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--c4)]">Hapus Ruangan?</h3>
              <p className="text-sm text-[var(--c3)] leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Semua data kontrak dan tugas di ruangan ini akan dihapus.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="cursor-pointer rounded-[10px] border border-[var(--c2)] px-4 py-2 text-xs font-medium text-[var(--c4)] transition-colors hover:bg-[var(--c1)] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="cursor-pointer rounded-[10px] border border-[var(--c4)] bg-[var(--c4)] px-4 py-2 text-xs font-medium text-[var(--c0)] transition-all hover:brightness-110 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Hapus Ruangan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

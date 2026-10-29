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
            <div className="-mx-3 border-b border-[var(--c1)]">
              {rooms.map((room) => {
                const pct = Math.round(((room.donePoints || 0) / Math.max(1, room.totalPoints || 1)) * 100);
                const isOwner = room.role === 'ketua';
                return (
                  <div
                    key={room.id}
                    className="group rrow grid w-full grid-cols-1 items-center gap-3 border-t border-[var(--c1)] px-3 py-[18px] text-left transition-colors hover:bg-[var(--c1)]/45 md:grid-cols-[minmax(0,1fr)_minmax(120px,230px)] md:gap-6"
                  >
                    <button
                      onClick={() => onSelectRoom(room)}
                      className="rrow-btn w-full cursor-pointer text-left transition-colors"
                    >
                      <span className="min-w-0">
                        <b className="block truncate text-[17px] font-medium">{room.nama}</b>
                        <small className="text-[13.5px] text-[var(--c3)]">
                          <span className="mr-2 rounded border border-dashed border-[var(--c2)] px-1.5 py-px font-[family-name:var(--font-geist-mono)] text-[11.5px]">
                            {room.kode}
                          </span>
                          {room.role === 'ketua' ? 'Ketua' : 'Anggota'} · {room.membersCount} anggota
                          {room.status === 'locked' ? ' · kontrak terkunci' : ''}
                        </small>
                      </span>
                      <span className="rprog flex items-center gap-3">
                        <span className="bar h-1 flex-1 overflow-hidden rounded bg-[var(--c1)]">
                          <i
                            className="block h-full rounded bg-[var(--c4)] transition-[width] duration-1000"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <em className="w-[42px] text-right text-[14px] font-medium not-italic tabular-nums">{pct}%</em>
                      </span>
                    </button>
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(room.id);
                        }}
                        className="ml-auto text-xs text-[var(--c3)] hover:text-red-400 transition-colors px-3 py-1 rounded hover:bg-red-950/20 opacity-0 group-hover:opacity-100"
                        title="Hapus ruangan"
                      >
                        🗑 Hapus
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside>
          <h2 className="mb-3 text-[14px] font-medium text-[var(--c3)]">Tugas Anda</h2>
          {myTasks.length === 0 ? (
            <p className="text-[13.5px] text-[var(--c3)]">Belum ada tugas berjalan. Ambil tugas dari ruangan timmu.</p>
          ) : (
            <div className="border-t border-[var(--c1)]">
              {myTasks.map((t) => (
                <div key={t.id} className="block border-b border-[var(--c1)] py-3">
                  <b className="block text-[14.5px] font-medium leading-snug">{t.judul}</b>
                  <small className="text-[13px] text-[var(--c3)]">
                    {t.rooms?.nama ?? 'Ruangan'} · {STATUS_LABEL[t.status] ?? t.status}
                    {t.poin ? ` · ${t.poin}p` : ''}
                    {t.due_date ? ` · tenggat ${new Date(t.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}
                  </small>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--c0)] rounded-[16px] border border-[var(--c2)] p-6 max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--c4)]">Hapus Ruangan?</h3>
            <p className="text-sm text-[var(--c3)]">
              Tindakan ini tidak dapat dibatalkan. Semua data kontrak dan tugas di ruangan ini akan dihapus.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-[10px] bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Menghapus...' : 'Hapus Ruangan'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-[10px] border border-[var(--c2)] bg-transparent text-[var(--c4)] text-sm font-medium hover:bg-[var(--c1)] disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

// RoleCard: kartu pilih peran onboarding, mirip ref HTML Mono
function RoleCard({ onClick, tag, icon, title, desc, steps, btnLabel, btnVariant }: {
  onClick: () => void;
  tag: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  steps: string[];
  btnLabel: string;
  btnVariant: 'solid' | 'orbit';
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [glow, setGlow] = React.useState({ x: '50%', y: '0%', show: false });

  const onMove = (e: React.PointerEvent) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    setGlow({ x: `${e.clientX - r.left}px`, y: `${e.clientY - r.top}px`, show: true });
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={onMove}
      onPointerLeave={() => setGlow(g => ({ ...g, show: false }))}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="relative cursor-pointer rounded-[22px] border border-[var(--c2)] bg-[color-mix(in_srgb,var(--c1)_55%,var(--c0))] p-6 flex flex-col gap-4 transition-colors hover:border-[var(--c3)] select-none"
    >
      {/* Glow overlay */}
      {glow.show && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[22px]"
          style={{ background: `radial-gradient(240px circle at ${glow.x} ${glow.y}, color-mix(in srgb, var(--c4) 12%, transparent), transparent 65%)` }}
        />
      )}

      {/* Top: icon ring + tag */}
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-[var(--c2)] bg-[var(--c0)]">
          {icon}
        </div>
        <span className="font-mono text-[11px] text-[var(--c3)] border border-[var(--c2)] rounded-full px-2.5 py-0.5 whitespace-nowrap">{tag}</span>
      </div>

      {/* Title + desc */}
      <div className="space-y-1.5">
        <h4 className="text-[18px] font-semibold tracking-tight text-[var(--c4)] leading-tight">{title}</h4>
        <p className="text-[13.5px] text-[var(--c3)] leading-relaxed max-w-[38ch]">{desc}</p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        <p className="font-mono text-[10.5px] uppercase tracking-widest text-[var(--c3)]">Alur kamu</p>
        <ol className="space-y-2.5 list-none">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 text-[13px] text-[var(--c3)]">
              <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border border-[var(--c2)] font-mono text-[10px] text-[var(--c3)]">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      {/* Button */}
      <div className="mt-auto pt-1">
        {btnVariant === 'solid' ? (
          <div className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--c4)] text-[13.5px] font-semibold text-[var(--c0)]">
            {btnLabel}
            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </div>
        ) : (
          <div className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--c2)] text-[13.5px] font-medium text-[var(--c4)]">
            {btnLabel}
            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </div>
        )}
      </div>
    </div>
  );
}

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
            <div className="border-t border-[var(--c1)] pt-8 space-y-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--c3)]">FairWorks / mulai</p>
                <h3 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--c4)]">Pilih peranmu untuk mulai.</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <RoleCard
                  onClick={onCreate}
                  tag="buat kode"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[var(--c4)] fill-none stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]" aria-hidden="true">
                      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8z"/><path d="M5 21h14"/>
                    </svg>
                  }
                  title="Saya Ketua Kelompok"
                  desc="Buat ruangan, bagi tugas berpoin, dan pantau kontribusi tiap anggota."
                  steps={['Buat ruangan dan dapat kode unik','Bagikan kode ke anggota kelompok','Buat kontrak dan bagi tugas berpoin','Pantau progres dan setujui hasil kerja']}
                  btnLabel="Buat Ruangan"
                  btnVariant="solid"
                />
                <RoleCard
                  onClick={onJoin}
                  tag="pakai kode"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[var(--c4)] fill-none stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]" aria-hidden="true">
                      <circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>
                      <circle cx="17" cy="9" r="2.4"/><path d="M17 13.5c2.4 0 4 1.7 4 4"/>
                    </svg>
                  }
                  title="Saya Anggota Kelompok"
                  desc="Gabung ruangan dengan kode dari ketua, ambil tugas, dan submit hasil kerjamu."
                  steps={['Minta kode ruangan dari ketua','Gabung dengan kode tersebut','Setujui kontrak kelompok','Ambil dan kerjakan tugasmu']}
                  btnLabel="Gabung dengan Kode"
                  btnVariant="orbit"
                />
              </div>
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

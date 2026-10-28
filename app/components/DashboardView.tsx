'use client';

import React from 'react';
import { Panel, Track, Odometer } from './DesignSystem';

export interface DashboardRoomItem {
  id: string;
  nama: string;
  kode: string;
  role: 'ketua' | 'anggota';
  membersCount: number;
  totalPoints: number;
  donePoints: number;
  reviewPoints?: number;
  doingPoints?: number;
  openPoints?: number;
  status: 'locked' | 'draft' | 'open';
}

interface DashboardViewProps {
  userName: string;
  rooms: DashboardRoomItem[];
  myTaskCount: number;
  myTotalPoints: number;
  onSelectRoom: (room: DashboardRoomItem) => void;
  onOpenJoinModal: () => void;
}

export function DashboardView({
  userName,
  rooms,
  myTaskCount,
  myTotalPoints,
  onSelectRoom,
  onOpenJoinModal,
}: DashboardViewProps) {
  // Tanggal hari ini dalam format Bahasa Indonesia (DESIGN.md v2 §5.3)
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* Zona 1: Sapaan + 3 Statistik Odometer satu baris mono (DESIGN.md v2 §1.5 #5, §5.3) */}
      <div className="space-y-2 border-b border-[var(--c1)] pb-5">
        <span className="eyebrow text-xs uppercase tracking-wider">{todayFormatted}</span>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--c4)]">
            Halo, {userName}.
          </h2>
          {/* 3 Statistik dengan Odometer dinamis */}
          <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-[var(--c3)]">
            <span className="text-[var(--c4)] font-medium">
              <Odometer value={rooms.length} />
            </span>
            <span>ruangan</span>
            <span>·</span>
            <span className="text-[var(--c4)] font-medium">
              <Odometer value={myTaskCount} />
            </span>
            <span>tugas</span>
            <span>·</span>
            <span className="text-[var(--c4)] font-medium">
              <Odometer value={myTotalPoints} />
            </span>
            <span>poin</span>
          </div>
        </div>
      </div>

      {/* Zona 2: Daftar baris ruangan satu kolom (DESIGN.md v2 §5.3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-xs">Ruangan Kamu</span>
        </div>

        {rooms.length === 0 && (
          <div className="p-8 border border-dashed border-[var(--c2)] rounded-[18px] text-center space-y-2 bg-[var(--c0)]/40">
            <p className="text-sm text-[var(--c3)]">Kamu belum bergabung dalam ruangan kerja kelompok.</p>
            <p className="text-xs text-[var(--c3)] font-mono">
              Gunakan tombol <strong>Buat ruangan</strong> di bawah atau masuk dengan kode.
            </p>
          </div>
        )}

        {rooms.map((room) => {
            const sumPoints = room.totalPoints || 1;
            const pctDone = Math.round((room.donePoints / sumPoints) * 100);

            return (
              <Panel
                key={room.id}
                className="group cursor-pointer hover:border-[var(--c4)] active:scale-[0.99] transition-all p-4.5 sm:p-5 space-y-3 bg-[var(--c1)]/50 border border-[var(--c2)]/60 hover:bg-[var(--c1)]/80"
                onClick={() => onSelectRoom(room)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-medium text-[var(--c4)] group-hover:text-white truncate">
                      {room.nama}
                    </h3>
                    <div className="flex items-center gap-2 pt-0.5 text-xs font-mono text-[var(--c3)]">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--c1)] border border-[var(--c2)]/50 text-[11px] text-[var(--c4)]">
                        {room.role === 'ketua' ? 'Ketua' : 'Anggota'}
                      </span>
                      <span>·</span>
                      <span>{room.membersCount} anggota</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[var(--c3)] bg-[var(--c1)] px-2.5 py-1 rounded-full border border-[var(--c2)]/40 flex-shrink-0">
                    {room.kode}
                  </span>
                </div>

                {/* Progress Track strip tipis */}
                <Track
                  done={room.donePoints}
                  review={room.reviewPoints || 0}
                  doing={room.doingPoints || 0}
                  open={room.openPoints || 0}
                />

                <div className="flex justify-between items-center text-xs text-[var(--c3)] font-mono pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <strong className="text-[var(--c4)]">
                      <Odometer value={pctDone} suffix="%" />
                    </strong>
                    <span>selesai</span>
                  </span>
                  <span>
                    {room.donePoints}/{room.totalPoints} poin
                  </span>
                </div>
              </Panel>
            );
          })}

        {/* Baris dashed masuk kode (Sesuai wireframe v2 §5.3) */}
        <div
          onClick={onOpenJoinModal}
          className="p-4 rounded-[18px] border border-dashed border-[var(--c2)] hover:border-[var(--c4)] hover:bg-[var(--c1)]/40 flex items-center justify-between text-xs text-[var(--c3)] cursor-pointer transition-all active:scale-[0.99]"
        >
          <span className="flex items-center gap-2">
            <span className="font-mono text-[var(--c4)]">+</span> Masuk kode ruangan…
          </span>
          <span className="font-mono text-[var(--c4)] px-2.5 py-1 rounded-full bg-[var(--c1)] border border-[var(--c2)]/40 text-[11px]">
            Gabung
          </span>
        </div>
      </div>
    </div>
  );
}

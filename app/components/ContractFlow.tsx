'use client';

import React, { useState, useEffect } from 'react';
import { Btn, Modal, Field } from './DesignSystem';

export interface ContractTaskItem {
  id: string;
  judul: string;
  deskripsi?: string;
  poin: number;
  dueDate?: string; // ISO string or YYYY-MM-DD
  status: 'open' | 'doing' | 'review' | 'done';
  postLockPending?: boolean; // Pasca-lock: butuh vote mayoritas anggota
  postLockVotes?: { voterId: string; agree: boolean }[];
}

export interface ContractMember {
  id: string;
  name: string;
  role: 'ketua' | 'anggota';
  contractVote?: 'agree' | 'request_changes' | null;
  contractVoteNote?: string | null;
}

interface ContractFlowProps {
  roomId?: string;
  roomName: string;
  roomCode: string;
  isOwner: boolean;
  isLocked: boolean;
  lockedAt?: string | null;
  contractDeadline?: string | null; // deadline 24 jam auto-lock
  members: ContractMember[];
  tasks: ContractTaskItem[];
  currentUserId?: string;
  onAddTask?: (task: Omit<ContractTaskItem, 'id' | 'status'>) => Promise<void> | void;
  onEditTask?: (taskId: string, updates: Partial<ContractTaskItem>) => Promise<void> | void;
  onDeleteTask?: (taskId: string) => Promise<void> | void;
  onSubmitContract?: () => Promise<void> | void;
  onVoteContract?: (agree: boolean, note?: string) => Promise<void> | void;
  onVotePostLockTask?: (taskId: string, agree: boolean) => Promise<void> | void;
  onAutoLockTrigger?: () => Promise<void> | void;
  onJoinRoom?: (code: string) => Promise<void> | void;
  onProceedToActiveRoom?: () => void;
}

export function ContractFlow({
  roomName,
  roomCode,
  isOwner,
  isLocked,
  lockedAt,
  contractDeadline,
  members,
  tasks,
  currentUserId = 'me',
  onAddTask,
  onEditTask,
  onDeleteTask,
  onSubmitContract,
  onVoteContract,
  onVotePostLockTask,
  onAutoLockTrigger,
  onProceedToActiveRoom,
}: Omit<ContractFlowProps, 'roomId'>) {
  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ContractTaskItem | null>(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [rekapModalOpen, setRekapModalOpen] = useState(false);
  const [showInkStamp, setShowInkStamp] = useState(false);

  // Form states (Task)
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [formJudul, setFormJudul] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formPoin, setFormPoin] = useState(10);
  const [formDueDate, setFormDueDate] = useState(defaultDueDate());
  const [formError, setFormError] = useState('');

  // Form states (Vote)
  const [voteAgree, setVoteAgree] = useState(true);
  const [voteNote, setVoteNote] = useState('');
  const [voteError, setVoteError] = useState('');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (isLocked || !contractDeadline) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(contractDeadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00 (Waktu habis)');
        if (onAutoLockTrigger) {
          onAutoLockTrigger();
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}j ${minutes.toString().padStart(2, '0')}m ${seconds
          .toString()
          .padStart(2, '0')}d`
      );
    };

    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [contractDeadline, isLocked, onAutoLockTrigger]);

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setFormJudul('');
    setFormDeskripsi('');
    setFormPoin(10);
    setFormDueDate(defaultDueDate());
    setFormError('');
    setTaskModalOpen(true);
  };

  const openEditTaskModal = (task: ContractTaskItem) => {
    setEditingTask(task);
    setFormJudul(task.judul);
    setFormDeskripsi(task.deskripsi || '');
    setFormPoin(task.poin);
    setFormDueDate(task.dueDate || defaultDueDate());
    setFormError('');
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) {
      setFormError('Judul tugas wajib diisi.');
      return;
    }
    if (formPoin <= 0) {
      setFormError('Poin tugas harus lebih dari 0.');
      return;
    }

    if (editingTask) {
      if (onEditTask) {
        await onEditTask(editingTask.id, {
          judul: formJudul,
          deskripsi: formDeskripsi,
          poin: formPoin,
          dueDate: formDueDate,
        });
      }
    } else {
      if (onAddTask) {
        await onAddTask({
          judul: formJudul,
          deskripsi: formDeskripsi,
          poin: formPoin,
          dueDate: formDueDate,
          postLockPending: isLocked, // pasca lock butuh approval
        });
      }
    }

    setTaskModalOpen(false);
  };

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voteAgree && !voteNote.trim()) {
      setVoteError('Catatan wajib diisi saat meminta perubahan.');
      return;
    }

    if (onVoteContract) {
      await onVoteContract(voteAgree, voteAgree ? undefined : voteNote.trim());
    }
    setVoteModalOpen(false);

    // Jika vote setuju dan membuat semua anggota setuju -> pemicu ink stamp
    if (voteAgree) {
      const otherAgreed = members.filter((m) => m.id !== currentUserId && m.contractVote === 'agree').length;
      if (otherAgreed + 1 === members.length) {
        setShowInkStamp(true);
        setTimeout(() => {
          setShowInkStamp(false);
          if (onProceedToActiveRoom) onProceedToActiveRoom();
        }, 2200);
      }
    }
  };

  const totalPoints = tasks.reduce((sum, t) => sum + (t.postLockPending ? 0 : t.poin), 0);
  const myVote = members.find((m) => m.id === currentUserId)?.contractVote;
  const agreeMembers = members.filter((m) => m.contractVote === 'agree');
  const requestChangeMembers = members.filter((m) => m.contractVote === 'request_changes');

  return (
    <div className="space-y-4">
      {/* 1. BANNER STATUS KONTRAK & COUNTDOWN 24 JAM */}
      {showInkStamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--c0)]/80 backdrop-blur-sm pointer-events-none animate-in fade-in duration-300">
          <div className="relative flex flex-col items-center justify-center">
            {/* Ink-Stamp SVG Filter & Seal ring */}
            <svg width="0" height="0" className="absolute">
              <filter id="ink-filter">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
              </filter>
            </svg>
            <div
              style={{ filter: 'url(#ink-filter)' }}
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 sm:border-8 border-double border-[var(--c4)] flex flex-col items-center justify-center text-center text-[var(--c4)] p-4 transform -rotate-12 animate-in zoom-in-150 duration-500 shadow-2xl bg-[var(--c0)]/90"
            >
              <span className="font-mono text-xs tracking-widest uppercase opacity-75">FAIRWORKS</span>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-wider my-1 uppercase">TERKUNCI</span>
              <span className="font-mono text-[10px] tracking-widest uppercase opacity-60">VERIFIED & LOCKED</span>
            </div>
            <p className="mt-4 text-xs font-mono text-[var(--c4)] animate-pulse">Menyiapkan Papan Tugas Aktif…</p>
          </div>
        </div>
      )}

      {isLocked ? (
        <div className="p-3.5 bg-[var(--c1)] border border-[var(--c2)] rounded-[14px] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--c4)]">
            <span className="w-2 h-2 rounded-full bg-[var(--c4)]" />
            <span className="font-semibold uppercase tracking-wider">Kontrak Terkunci</span>
          </div>
          <span className="text-[var(--c3)]">
            {lockedAt ? `Terkunci ${new Date(lockedAt).toLocaleDateString('id-ID')}` : 'Resmi berlaku'}
          </span>
        </div>
      ) : contractDeadline ? (
        <div className="p-3.5 bg-[var(--c1)] border border-[var(--c2)] rounded-[14px] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--c4)]">
            <span className="animate-pulse w-2 h-2 rounded-full bg-[var(--c4)]" />
            <span>
              Menunggu persetujuan ({agreeMembers.length}/{members.length})
            </span>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft && (
              <span className="text-[var(--c3)]">
                Auto-lock: <strong className="text-[var(--c4)]">{timeLeft}</strong>
              </span>
            )}
            <Btn
              variant="outline"
              onClick={() => setVoteModalOpen(true)}
              className="min-h-[32px] px-3.5 py-1 text-xs"
            >
              {myVote ? 'Ubah Suara' : 'Beri Suara'}
            </Btn>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-[var(--c1)]/50 border border-dashed border-[var(--c2)] rounded-[14px] flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--c3)]">
            {isOwner ? 'Kontrak draf · Siap diajukan ke anggota' : 'Menunggu ketua mengajukan kontrak'}
          </span>
          {isOwner && tasks.length > 0 && (
            <Btn
              variant="outline"
              onClick={() => setRekapModalOpen(true)}
              className="min-h-[32px] px-3.5 py-1 text-xs"
            >
              Rekap & Kirim
            </Btn>
          )}
        </div>
      )}

      {/* CATATAN PERMINTAAN PERUBAHAN DARI ANGGOTA */}
      {!isLocked && requestChangeMembers.length > 0 && (
        <div className="space-y-2 p-3.5 bg-[var(--c1)] border border-[var(--c2)] rounded-[14px] text-xs">
          <span className="eyebrow text-[11px] text-[var(--c4)]">Catatan Minta Ubah:</span>
          {requestChangeMembers.map((m) => (
            <div key={m.id} className="text-[var(--c3)] font-mono pl-2 border-l border-[var(--c2)]">
              <strong className="text-[var(--c4)]">{m.name}:</strong> {m.contractVoteNote || '-'}
            </div>
          ))}
        </div>
      )}

      {/* 2. DAFTAR TUGAS KONTRAK */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pt-2">
          <span className="eyebrow text-xs">
            Daftar Tugas ({tasks.filter((t) => !t.postLockPending).length} tugas · {totalPoints} poin)
          </span>

          {/* Tombol Buat Tugas (Sebelum Lock oleh ketua, Pasca-lock oleh siapa saja) */}
          {(!isLocked && isOwner) || isLocked ? (
            <button
              onClick={openCreateTaskModal}
              className="text-xs font-mono text-[var(--c4)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              + {isLocked ? 'Tugas Pasca-Lock' : 'Tambah Tugas'}
            </button>
          ) : null}
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--c2)] rounded-[16px] text-center space-y-2">
            <p className="text-xs text-[var(--c3)]">Belum ada tugas dalam kontrak ini.</p>
            {isOwner && (
              <Btn onClick={openCreateTaskModal} variant="outline" className="min-h-[36px] text-xs px-4">
                Buat Tugas Pertama (Poin 10)
              </Btn>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-[14px] bg-[var(--c1)] border ${
                task.postLockPending ? 'border-dashed border-[var(--c3)]' : 'border-[var(--c2)]/50'
              } flex items-center justify-between gap-3 text-xs`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-[var(--c4)] truncate">{task.judul}</h4>
                  {task.postLockPending && (
                    <span className="px-2 py-0.5 rounded bg-[var(--c2)] text-[var(--c4)] text-[10px] font-mono">
                      Menunggu Vote Mayoritas
                    </span>
                  )}
                </div>
                {task.deskripsi && (
                  <p className="text-[var(--c3)] text-xs line-clamp-1">{task.deskripsi}</p>
                )}
                <div className="flex items-center gap-2 text-[var(--c3)] font-mono text-[11px]">
                  <span className="text-[var(--c4)] font-semibold">{task.poin}p</span>
                  <span>·</span>
                  <span>Tenggat: {task.dueDate || '7 hari'}</span>
                </div>
              </div>

              {/* Aksi Per Tugas */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {task.postLockPending ? (
                  <div className="flex items-center gap-1">
                    <Btn
                      variant="solid"
                      onClick={() => onVotePostLockTask && onVotePostLockTask(task.id, true)}
                      className="min-h-[30px] px-3 py-0.5 text-[11px]"
                    >
                      Setuju
                    </Btn>
                    <Btn
                      variant="outline"
                      onClick={() => onVotePostLockTask && onVotePostLockTask(task.id, false)}
                      className="min-h-[30px] px-3 py-0.5 text-[11px]"
                    >
                      Tolak
                    </Btn>
                  </div>
                ) : !isLocked && isOwner ? (
                  <>
                    <button
                      onClick={() => openEditTaskModal(task)}
                      className="text-[var(--c3)] hover:text-[var(--c4)] p-1.5 cursor-pointer font-mono"
                      title="Edit Tugas"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => onDeleteTask && onDeleteTask(task.id)}
                      className="text-[var(--c3)] hover:text-[var(--c4)] p-1.5 cursor-pointer font-mono"
                      title="Hapus Tugas"
                    >
                      ✕
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. MODAL BUAT / EDIT TUGAS */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={
          editingTask
            ? 'Ubah Tugas'
            : isLocked
            ? 'Tambah Tugas Pasca-Lock'
            : 'Buat Tugas Baru'
        }
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          {isLocked && (
            <p className="text-xs text-[var(--c3)] font-mono pb-1">
              Kontrak sudah terkunci. Tugas baru membutuhkan persetujuan mayoritas anggota sebelum aktif.
            </p>
          )}

          <Field
            label="Judul Tugas (Wajib)"
            placeholder="Contoh: Rangkum 10 jurnal acuan"
            value={formJudul}
            onChange={(e) => setFormJudul(e.target.value)}
            required
          />

          <Field
            label="Deskripsi (Opsional)"
            placeholder="Ringkasan pengerjaan atau format yang diharapkan"
            value={formDeskripsi}
            onChange={(e) => setFormDeskripsi(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Poin (Default 10)"
              type="number"
              min={1}
              value={formPoin}
              onChange={(e) => setFormPoin(Number(e.target.value))}
              required
            />
            <Field
              label="Tenggat (Default +7 Hari)"
              type="date"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
            />
          </div>

          {formError && <p className="text-xs text-[var(--c4)] font-mono">{formError}</p>}

          <Btn type="submit" className="w-full">
            {editingTask ? 'Simpan Perubahan' : isLocked ? 'Ajukan Tugas ke Mayoritas' : 'Tambah Tugas'}
          </Btn>
        </form>
      </Modal>

      {/* 4. MODAL REKAP KONTRAK & KIRIM */}
      <Modal
        isOpen={rekapModalOpen}
        onClose={() => setRekapModalOpen(false)}
        title="Rekap Kontrak Tim"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-3 bg-[var(--c1)] rounded-[12px] space-y-2 border border-[var(--c2)]">
            <div className="flex justify-between text-[var(--c4)]">
              <span>Ruangan:</span>
              <span className="font-semibold">{roomName} ({roomCode})</span>
            </div>
            <div className="flex justify-between text-[var(--c4)]">
              <span>Jumlah Tugas:</span>
              <span>{tasks.length} tugas</span>
            </div>
            <div className="flex justify-between text-[var(--c4)]">
              <span>Total Poin:</span>
              <span className="font-semibold">{totalPoints} poin</span>
            </div>
            <div className="flex justify-between text-[var(--c4)]">
              <span>Jumlah Anggota:</span>
              <span>{members.length} orang</span>
            </div>
          </div>

          <p className="text-[var(--c3)] leading-relaxed text-[11px]">
            Setelah dikirim, seluruh anggota memiliki waktu 24 jam untuk meninjau dan menyetujui. Kontrak akan terkunci otomatis saat semua setuju atau batas 24 jam berakhir.
          </p>

          <Btn
            onClick={async () => {
              if (onSubmitContract) await onSubmitContract();
              setRekapModalOpen(false);
            }}
            className="w-full"
            disabled={tasks.length === 0}
          >
            Kirim Kontrak Sekarang
          </Btn>
        </div>
      </Modal>

      {/* 5. MODAL SETUJU / MINTA UBAH */}
      <Modal
        isOpen={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        title="Persetujuan Kontrak"
      >
        <form onSubmit={handleVoteSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setVoteAgree(true);
                setVoteError('');
              }}
              className={`flex-1 py-3 px-4 rounded-[12px] font-mono text-xs cursor-pointer border transition-all ${
                voteAgree
                  ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold border-[var(--c4)]'
                  : 'bg-[var(--c1)] text-[var(--c3)] border-[var(--c2)]'
              }`}
            >
              ✓ Setuju
            </button>
            <button
              type="button"
              onClick={() => setVoteAgree(false)}
              className={`flex-1 py-3 px-4 rounded-[12px] font-mono text-xs cursor-pointer border transition-all ${
                !voteAgree
                  ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold border-[var(--c4)]'
                  : 'bg-[var(--c1)] text-[var(--c3)] border-[var(--c2)]'
              }`}
            >
              ✕ Minta Ubah
            </button>
          </div>

          {!voteAgree && (
            <Field
              label="Catatan Perubahan (Wajib)"
              placeholder="Jelaskan poin atau tugas apa yang perlu disesuaikan..."
              value={voteNote}
              onChange={(e) => setVoteNote(e.target.value)}
              required
            />
          )}

          {voteError && <p className="text-xs text-[var(--c4)] font-mono">{voteError}</p>}

          <Btn type="submit" className="w-full">
            Kirim Keputusan
          </Btn>
        </form>
      </Modal>
    </div>
  );
}

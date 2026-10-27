'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Btn,
  Panel,
  Track,
  AvatarStack,
  Modal,
  Toast,
  Odometer,
  TabsPill,
  Field,
  Drawer,
  TaskRow,
} from './DesignSystem';
import { ThumbBar } from './ThumbBar';
import {
  takeTask as apiTakeTask,
  submitProof as apiSubmitProof,
  castVote as apiCastVote,
  releaseTask as apiReleaseTask,
  detectLinkType,
  LinkChipType,
} from '@/lib/api/fairworks';

export interface TaskItem {
  id: string;
  judul: string;
  deskripsi?: string;
  poin: number;
  status: 'open' | 'doing' | 'review' | 'done';
  assignee_id?: string | null;
  assignee_name?: string | null;
  due_date?: string | null; // ISO string
  is_overdue?: boolean;
  submit_link?: string | null;
  submit_note?: string | null;
  submit_at?: string | null;
  revision_note?: string | null;
  vote_round?: number;
  votes?: { voter_id: string; voter_name: string; vote: 'ok' | 'revisi'; note?: string }[];
}

export interface MemberItem {
  id: string;
  name: string;
  role: 'Ketua' | 'Anggota';
  points: number;
  isOwner?: boolean;
}

export interface ActivityItem {
  id: string;
  who: string;
  actionText: string; // e.g. "mengirim hasil Rangkum 10 jurnal"
  timeAgo: string;
}

interface RoomTaskLifecycleProps {
  currentUserId?: string;
  currentUserName?: string;
  onNavigateHome?: () => void;
}

export function RoomTaskLifecycle({
  currentUserId = 'user-riski',
  currentUserName = 'Riski',
  onNavigateHome,
}: RoomTaskLifecycleProps) {
  // Demo initial members
  const [members, setMembers] = useState<MemberItem[]>([
    { id: 'user-ayu', name: 'Ayu', role: 'Ketua', points: 10, isOwner: true },
    { id: 'user-bima', name: 'Bima', role: 'Anggota', points: 0 },
    { id: 'user-dimas', name: 'Dimas', role: 'Anggota', points: 0 },
    { id: 'user-esa', name: 'Esa', role: 'Anggota', points: 0 },
    { id: 'user-riski', name: 'Riski', role: 'Anggota', points: 0 },
  ]);

  // Demo initial tasks matching PRD & DESIGN specs
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      judul: 'Tulis bab latar belakang',
      deskripsi: 'Menjelaskan urgensi masalah free-rider di perkuliahan dan metodologi survei.',
      poin: 10,
      status: 'done',
      assignee_id: 'user-ayu',
      assignee_name: 'Ayu',
      due_date: '2026-10-25T23:59:59Z',
      submit_link: 'https://docs.google.com/document/d/1example-latar-belakang',
      submit_note: 'Sudah mencakup 5 rujukan awal.',
      votes: [
        { voter_id: 'user-bima', voter_name: 'Bima', vote: 'ok' },
        { voter_id: 'user-riski', voter_name: 'Riski', vote: 'ok' },
      ],
    },
    {
      id: 'task-2',
      judul: 'Rangkum 10 jurnal relevan',
      deskripsi: 'Cari jurnal terindeks Scopus/Sinta tahun 2021-2026 tentang efektivitas kerja kelompok.',
      poin: 15,
      status: 'review',
      assignee_id: 'user-bima',
      assignee_name: 'Bima',
      due_date: '2026-10-29T23:59:59Z',
      submit_link: 'https://docs.google.com/document/d/1example-rangkuman-jurnal',
      submit_note: 'Telah dirangkum dalam tabel matriks perbandingan.',
      vote_round: 1,
      votes: [{ voter_id: 'user-ayu', voter_name: 'Ayu', vote: 'ok' }],
    },
    {
      id: 'task-3',
      judul: 'Kumpulkan 30 responden survei',
      deskripsi: 'Sebar Google Form ke mahasiswa angkatan 2023-2025 min 30 jawaban terverifikasi.',
      poin: 20,
      status: 'doing',
      assignee_id: 'user-dimas',
      assignee_name: 'Dimas',
      due_date: '2026-10-24T23:59:59Z', // past date -> overdue
      is_overdue: true,
    },
    {
      id: 'task-4',
      judul: 'Olah data di spreadsheet',
      deskripsi: 'Bersihkan data mentah survei, hitung persentase dan buat grafik batang ringkas.',
      poin: 15,
      status: 'doing',
      assignee_id: 'user-esa',
      assignee_name: 'Esa',
      due_date: '2026-11-02T23:59:59Z',
    },
    {
      id: 'task-5',
      judul: 'Desain slide presentasi akhir',
      deskripsi: 'Buat 10-12 slide pitch deck menggunakan format desain monokrom.',
      poin: 10,
      status: 'open',
      assignee_id: null,
      assignee_name: null,
      due_date: '2026-11-05T23:59:59Z',
    },
  ]);

  // Activity Feed
  const [activities, setActivities] = useState<ActivityItem[]>([
    { id: 'act-1', who: 'Bima', actionText: 'mengirim hasil Rangkum 10 jurnal relevan', timeAgo: '1 jam lalu' },
    { id: 'act-2', who: 'Ayu', actionText: 'menyetujui tugas Tulis bab latar belakang (+10 poin)', timeAgo: '3 jam lalu' },
    { id: 'act-3', who: 'Esa', actionText: 'mengambil tugas Olah data di spreadsheet', timeAgo: 'Kemarin' },
    { id: 'act-4', who: 'Dimas', actionText: 'mengambil tugas Kumpulkan 30 responden survei', timeAgo: '2 hari lalu' },
  ]);

  // UI States
  const [activeTab, setActiveTab] = useState<'Semua' | 'Bisa diambil'>('Semua');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'Progres' | 'Aktivitas'>('Progres');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Sub-States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [proofError, setProofError] = useState('');

  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [revisionError, setRevisionError] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState<{
    type: 'release' | 'takeover';
    task: TaskItem;
  } | null>(null);

  // Link Chip Detection
  const linkType: LinkChipType = useMemo(() => {
    return detectLinkType(proofUrl);
  }, [proofUrl]);

  // Calculate Progress Stats
  const stats = useMemo(() => {
    const totalPoints = tasks.reduce((acc, t) => acc + t.poin, 0);
    const donePoints = tasks.filter((t) => t.status === 'done').reduce((acc, t) => acc + t.poin, 0);
    const reviewPoints = tasks.filter((t) => t.status === 'review').reduce((acc, t) => acc + t.poin, 0);
    const doingPoints = tasks.filter((t) => t.status === 'doing').reduce((acc, t) => acc + t.poin, 0);
    const openPoints = tasks.filter((t) => t.status === 'open').reduce((acc, t) => acc + t.poin, 0);

    const pct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

    return {
      totalPoints,
      donePoints,
      reviewPoints,
      doingPoints,
      openPoints,
      pct,
    };
  }, [tasks]);

  // Filter tasks based on Tabs
  const filteredTasks = useMemo(() => {
    if (activeTab === 'Bisa diambil') {
      return tasks.filter((t) => t.status === 'open' || (t.status === 'doing' && t.is_overdue));
    }
    return tasks;
  }, [tasks, activeTab]);

  // Log activity helper
  const addActivity = (who: string, actionText: string) => {
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      who,
      actionText,
      timeAgo: 'baru saja',
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // 1. Take Task (1 tap)
  const handleTakeTask = async (task: TaskItem) => {
    try {
      // Try backend RPC
      await apiTakeTask(task.id).catch(() => null);

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              status: 'doing',
              assignee_id: currentUserId,
              assignee_name: currentUserName,
              is_overdue: false,
              revision_note: null,
            };
          }
          return t;
        })
      );

      addActivity(currentUserName, `mengambil tugas ${task.judul}`);
      setToastMessage('Tugas berhasil diambil. Selamat mengerjakan!');
      setSelectedTask(null);
    } catch {
      setToastMessage('Gagal mengambil tugas. Coba lagi.');
    }
  };

  // 2. Take Over (Overdue Task)
  const handleConfirmTakeover = async () => {
    if (!showConfirmModal || showConfirmModal.type !== 'takeover') return;
    const task = showConfirmModal.task;
    const oldName = task.assignee_name || 'anggota lain';

    try {
      await apiTakeTask(task.id).catch(() => null);

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              status: 'doing',
              assignee_id: currentUserId,
              assignee_name: currentUserName,
              is_overdue: false,
              revision_note: null,
            };
          }
          return t;
        })
      );

      addActivity(currentUserName, `mengambil alih tugas ${task.judul} dari ${oldName}`);
      setToastMessage(`Tugas berhasil diambil alih dari ${oldName}.`);
      setShowConfirmModal(null);
      setSelectedTask(null);
    } catch {
      setToastMessage('Gagal mengambil alih tugas.');
    }
  };

  // 3. Release Task
  const handleConfirmRelease = async () => {
    if (!showConfirmModal || showConfirmModal.type !== 'release') return;
    const task = showConfirmModal.task;

    try {
      await apiReleaseTask(task.id).catch(() => null);

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              status: 'open',
              assignee_id: null,
              assignee_name: null,
              revision_note: null,
            };
          }
          return t;
        })
      );

      addActivity(currentUserName, `melepas tugas ${task.judul} agar bisa diambil`);
      setToastMessage('Tugas dilepas, anggota lain bisa mengambilnya.');
      setShowConfirmModal(null);
      setSelectedTask(null);
    } catch {
      setToastMessage('Gagal melepas tugas.');
    }
  };

  // 4. Submit Proof (Kirim / Kirim Ulang Bukti)
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!proofUrl.trim()) {
      setProofError('Tautan bukti wajib diisi.');
      return;
    }

    try {
      new URL(proofUrl.trim());
    } catch {
      setProofError('Tautan tidak valid. Sertakan http:// atau https://');
      return;
    }

    try {
      await apiSubmitProof(selectedTask.id, proofUrl.trim(), proofNote.trim()).catch(() => null);

      const isResubmit = selectedTask.status === 'review';

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === selectedTask.id) {
            return {
              ...t,
              status: 'review',
              submit_link: proofUrl.trim(),
              submit_note: proofNote.trim() || null,
              submit_at: new Date().toISOString(),
              revision_note: null,
              vote_round: (t.vote_round || 0) + 1,
              votes: [], // reset votes for new round
            };
          }
          return t;
        })
      );

      addActivity(
        currentUserName,
        `${isResubmit ? 'mengirim ulang hasil' : 'mengirim hasil'} ${selectedTask.judul}`
      );
      setToastMessage('Bukti berhasil dikirim. Menunggu persetujuan tim.');
      setShowSubmitModal(false);
      setSelectedTask(null);
      setProofUrl('');
      setProofNote('');
      setProofError('');
    } catch {
      setToastMessage('Gagal mengirim bukti.');
    }
  };

  // 5. Cast Vote: Setuju (OK)
  const handleVoteAgree = async (task: TaskItem) => {
    try {
      await apiCastVote(task.id, 'ok').catch(() => null);

      // Quorum calculation: floor((n - 1) / 2) + 1
      const eligibleCount = members.filter((m) => m.id !== task.assignee_id).length;
      const needed = eligibleCount <= 1 ? 1 : Math.floor((eligibleCount - 1) / 2) + 1;

      const existingVotes = task.votes || [];
      const updatedVotes = [
        ...existingVotes.filter((v) => v.voter_id !== currentUserId),
        { voter_id: currentUserId, voter_name: currentUserName, vote: 'ok' as const },
      ];
      const okCount = updatedVotes.filter((v) => v.vote === 'ok').length;
      const isDone = okCount >= needed;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              status: isDone ? 'done' : 'review',
              votes: updatedVotes,
            };
          }
          return t;
        })
      );

      if (isDone) {
        addActivity(currentUserName, `menyetujui tugas ${task.judul} (+${task.poin} poin selesai)`);
        setToastMessage(`Tugas selesai! +${task.poin} poin masuk ke tim.`);
        // Update member points
        setMembers((prev) =>
          prev.map((m) => (m.id === task.assignee_id ? { ...m, points: m.points + task.poin } : m))
        );
      } else {
        addActivity(currentUserName, `menyetujui tugas ${task.judul}`);
        setToastMessage(`Suara setuju tersimpan (${okCount}/${needed} dibutuhkan).`);
      }

      setSelectedTask(null);
    } catch {
      setToastMessage('Gagal memberi suara.');
    }
  };

  // 6. Cast Vote: Minta Revisi
  const handleVoteRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!revisionText.trim()) {
      setRevisionError('Catatan revisi wajib diisi.');
      return;
    }

    try {
      await apiCastVote(selectedTask.id, 'revisi', revisionText.trim()).catch(() => null);

      const targetAssigneeName = selectedTask.assignee_name || 'Assignee';

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === selectedTask.id) {
            return {
              ...t,
              status: 'doing', // 1 revisi vote returns task to doing
              revision_note: revisionText.trim(),
              votes: [
                ...(t.votes || []).filter((v) => v.voter_id !== currentUserId),
                {
                  voter_id: currentUserId,
                  voter_name: currentUserName,
                  vote: 'revisi' as const,
                  note: revisionText.trim(),
                },
              ],
            };
          }
          return t;
        })
      );

      addActivity(
        currentUserName,
        `meminta revisi untuk ${selectedTask.judul}: "${revisionText.trim()}"`
      );
      setToastMessage(`Permintaan revisi dikirim ke ${targetAssigneeName}.`);
      setShowRevisionInput(false);
      setRevisionText('');
      setRevisionError('');
      setSelectedTask(null);
    } catch {
      setToastMessage('Gagal mengirim revisi.');
    }
  };

  // Format Due Text
  const formatDue = (t: TaskItem) => {
    if (t.status === 'done') return 'Selesai';
    if (t.is_overdue) return undefined;
    if (t.due_date) {
      const d = new Date(t.due_date);
      return `${d.getDate()} Nov`;
    }
    return undefined;
  };

  // Format Review Status Text
  const formatReviewStatus = (t: TaskItem) => {
    if (t.status === 'review') {
      const okVotes = (t.votes || []).filter((v) => v.vote === 'ok').length;
      const eligible = members.filter((m) => m.id !== t.assignee_id).length;
      const needed = eligible <= 1 ? 1 : Math.floor((eligible - 1) / 2) + 1;
      return `${okVotes}/${needed} setuju`;
    }
    return undefined;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notifikasi */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* ==============================================================
          ZONA 1: KEPALA RUANGAN + STRIP PROGRES TIPIS (DESIGN.md v2 §5.4)
         ============================================================== */}
      <section aria-label="Informasi Ruangan" className="space-y-3 border-b border-[var(--c1)] pb-5">
        {/* Baris Meta Atas */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 font-mono text-[var(--c3)]">
            <span className="font-semibold text-[var(--c4)]">RPD-4K7</span>
            <span>·</span>
            <span>5 Anggota</span>
            <span>·</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--c1)] border border-[var(--c2)] text-[var(--c4)]">
              Kontrak Terkunci
            </span>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="font-mono text-xs text-[var(--c3)] hover:text-[var(--c4)] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--c1)] border border-[var(--c2)] transition-colors cursor-pointer"
          >
            <span>Anggota & Tim</span>
            <span className="text-[10px]">⌄</span>
          </button>
        </div>

        {/* Judul Ruangan */}
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--c4)]">
          Riset Pasar Digital
        </h2>

        {/* Strip Progres Tipis: Angka 20-28px + Track 8px (HARD RULE §1.5 #5) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-baseline text-xs font-mono">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[var(--c4)]">
                <Odometer value={`${stats.pct}%`} />
              </span>
              <span className="text-[var(--c3)] text-xs">selesai</span>
            </div>
            <span className="text-[var(--c3)]">
              <strong className="text-[var(--c4)]">{stats.donePoints}</strong>/{stats.totalPoints} poin
            </span>
          </div>

          <Track
            done={stats.donePoints}
            review={stats.reviewPoints}
            doing={stats.doingPoints}
            open={stats.openPoints}
          />
        </div>

        {/* 2 Tab Saja: Semua · Bisa diambil (DESIGN.md v2 §3 #3) */}
        <div className="pt-2">
          <TabsPill
            tabs={['Semua', 'Bisa diambil']}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as 'Semua' | 'Bisa diambil')}
          />
        </div>
      </section>

      {/* ==============================================================
          ZONA 2: DAFTAR TUGAS 1 KOLOM (DESIGN.md v2 §5.4)
         ============================================================== */}
      <section aria-label="Papan Tugas" className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-[18px] border border-dashed border-[var(--c2)] space-y-3">
            <p className="text-sm text-[var(--c3)]">
              {activeTab === 'Bisa diambil'
                ? 'Tidak ada tugas yang bisa diambil saat ini. Semua tugas sedang berjalan.'
                : 'Belum ada tugas di ruangan ini.'}
            </p>
            {activeTab === 'Bisa diambil' && (
              <Btn variant="outline" onClick={() => setActiveTab('Semua')} className="min-h-[40px] text-xs">
                Lihat semua tugas
              </Btn>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              status={task.status}
              title={task.judul}
              points={task.poin}
              assignee={task.assignee_name || undefined}
              dueText={formatDue(task)}
              reviewStatus={formatReviewStatus(task)}
              isOverdue={task.is_overdue}
              onClick={() => {
                setSelectedTask(task);
                setShowRevisionInput(false);
                setRevisionText('');
                setRevisionError('');
                setProofUrl(task.submit_link || '');
                setProofNote(task.submit_note || '');
              }}
            />
          ))
        )}
      </section>

      {/* ==============================================================
          MODAL DETAIL TUGAS & AKSI SIKLUS (T4 CORE INTERACTION)
         ============================================================== */}
      {selectedTask && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedTask(null);
            setShowRevisionInput(false);
          }}
          title={selectedTask.judul}
        >
          <div className="space-y-5">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--c1)] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[var(--c1)] border border-[var(--c2)] text-[var(--c4)] font-semibold">
                  {selectedTask.poin} Poin
                </span>
                <span className="text-[var(--c3)]">
                  {selectedTask.status === 'open' && '○ Bisa diambil'}
                  {selectedTask.status === 'doing' && '◐ Dikerjakan'}
                  {selectedTask.status === 'review' && '◨ Perlu disetujui'}
                  {selectedTask.status === 'done' && '✓ Selesai'}
                </span>
              </div>

              <div className="text-[var(--c3)]">
                {selectedTask.assignee_name ? (
                  <span>
                    Pemegang:{' '}
                    <strong className="text-[var(--c4)]">
                      {selectedTask.assignee_id === currentUserId ? 'Anda' : selectedTask.assignee_name}
                    </strong>
                  </span>
                ) : (
                  <span className="text-[var(--c4)] font-medium">Belum ada pemegang</span>
                )}
              </div>
            </div>

            {/* Deskripsi Tugas */}
            {selectedTask.deskripsi && (
              <p className="text-sm text-[var(--c3)] leading-relaxed">{selectedTask.deskripsi}</p>
            )}

            {/* Peringatan Overdue jika ada */}
            {selectedTask.is_overdue && (
              <div className="p-3 rounded-[12px] bg-[var(--c4)] text-[var(--c0)] text-xs font-medium flex items-center justify-between">
                <span>⚠ Tenggat tugas ini sudah lewat 2 hari.</span>
                {selectedTask.assignee_id !== currentUserId && (
                  <span className="font-mono text-[11px] underline">Dapat diambil alih</span>
                )}
              </div>
            )}

            {/* Catatan Revisi dari putaran sebelumnya */}
            {selectedTask.revision_note && (
              <div className="p-3.5 rounded-[12px] bg-[var(--c1)] border border-[var(--c2)] space-y-1">
                <span className="eyebrow text-[11px] text-[var(--c4)]">Perlu diperbaiki:</span>
                <p className="text-xs text-[var(--c3)] leading-relaxed">
                  &ldquo;{selectedTask.revision_note}&rdquo;
                </p>
              </div>
            )}

            {/* Detail Bukti Kerja jika status review / done */}
            {(selectedTask.status === 'review' || selectedTask.status === 'done') && selectedTask.submit_link && (
              <div className="p-4 rounded-[14px] bg-[var(--c1)] border border-[var(--c2)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-xs">Bukti Pekerjaan</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--c2)] text-[var(--c4)]">
                    {detectLinkType(selectedTask.submit_link)}
                  </span>
                </div>

                <a
                  href={selectedTask.submit_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--c4)] underline break-all hover:opacity-80 block font-mono"
                >
                  {selectedTask.submit_link} ↗
                </a>

                {selectedTask.submit_note && (
                  <p className="text-xs text-[var(--c3)] italic">&ldquo;{selectedTask.submit_note}&rdquo;</p>
                )}
              </div>
            )}

            {/* Daftar Suara Transparan (PRD F4.4) */}
            {selectedTask.status === 'review' && (
              <div className="space-y-2 pt-2 border-t border-[var(--c1)]">
                <div className="flex justify-between items-center text-xs font-mono text-[var(--c3)]">
                  <span className="eyebrow text-[11px]">Daftar Suara Tim</span>
                  <span>{formatReviewStatus(selectedTask)}</span>
                </div>

                <div className="space-y-1.5">
                  {members
                    .filter((m) => m.id !== selectedTask.assignee_id)
                    .map((m) => {
                      const v = (selectedTask.votes || []).find((vote) => vote.voter_id === m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex justify-between items-center text-xs p-2 rounded-[10px] bg-[var(--c1)]/50 border border-[var(--c1)]"
                        >
                          <span className="text-[var(--c4)]">
                            {m.name} {m.id === currentUserId && '(Anda)'}
                          </span>
                          <span className="font-mono text-[11px]">
                            {v ? (
                              v.vote === 'ok' ? (
                                <span className="text-[var(--c4)] font-medium">✓ Setuju</span>
                              ) : (
                                <span className="text-[var(--c3)]">✕ Minta Revisi</span>
                              )
                            ) : (
                              <span className="text-[var(--c3)]/60">Belum memilih</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Input Catatan Revisi jika tombol Minta Revisi ditekan */}
            {showRevisionInput && (
              <form onSubmit={handleVoteRevision} className="space-y-3 pt-2 border-t border-[var(--c1)]">
                <Field
                  label="Catatan revisi (wajib)"
                  placeholder="Contoh: Kurangi jurnal di bawah tahun 2020..."
                  value={revisionText}
                  onChange={(e) => {
                    setRevisionText(e.target.value);
                    setRevisionError('');
                  }}
                  error={revisionError}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Btn type="submit" variant="solid" className="flex-1 min-h-[44px] text-xs">
                    Kirim catatan revisi
                  </Btn>
                  <Btn
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRevisionInput(false)}
                    className="min-h-[44px] text-xs px-4"
                  >
                    Batal
                  </Btn>
                </div>
              </form>
            )}

            {/* Tombol Aksi Kontekstual Berdasarkan Status & Peran */}
            <div className="pt-3 border-t border-[var(--c1)] flex flex-col gap-2">
              {/* KASUS 1: Open Task -> Ambil tugas (1 ketukan) */}
              {selectedTask.status === 'open' && (
                <Btn
                  variant="solid"
                  onClick={() => handleTakeTask(selectedTask)}
                  className="w-full text-sm font-semibold"
                >
                  Ambil tugas ini
                </Btn>
              )}

              {/* KASUS 2: Doing Task & Pemegang adalah Current User */}
              {selectedTask.status === 'doing' && selectedTask.assignee_id === currentUserId && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Btn
                    variant="solid"
                    onClick={() => {
                      setProofUrl(selectedTask.submit_link || '');
                      setProofNote(selectedTask.submit_note || '');
                      setShowSubmitModal(true);
                    }}
                    className="flex-1 text-sm font-semibold"
                  >
                    Kirim bukti pekerjaan
                  </Btn>
                  <Btn
                    variant="outline"
                    onClick={() => setShowConfirmModal({ type: 'release', task: selectedTask })}
                    className="text-xs text-[var(--c3)] hover:text-[var(--c4)]"
                  >
                    Lepas tugas
                  </Btn>
                </div>
              )}

              {/* KASUS 3: Doing Task & Overdue & Pemegang adalah Orang Lain -> Ambil alih */}
              {selectedTask.status === 'doing' &&
                selectedTask.assignee_id !== currentUserId &&
                selectedTask.is_overdue && (
                  <Btn
                    variant="solid"
                    onClick={() => setShowConfirmModal({ type: 'takeover', task: selectedTask })}
                    className="w-full text-sm font-semibold"
                  >
                    Ambil alih tugas ini
                  </Btn>
                )}

              {/* KASUS 4: Review Task & Pemegang adalah Current User -> Kirim ulang */}
              {selectedTask.status === 'review' && selectedTask.assignee_id === currentUserId && (
                <Btn
                  variant="outline"
                  onClick={() => {
                    setProofUrl(selectedTask.submit_link || '');
                    setProofNote(selectedTask.submit_note || '');
                    setShowSubmitModal(true);
                  }}
                  className="w-full text-xs"
                >
                  Kirim ulang bukti (perbarui tautan)
                </Btn>
              )}

              {/* KASUS 5: Review Task & Current User adalah Reviewer (Bukan Assignee) */}
              {selectedTask.status === 'review' &&
                selectedTask.assignee_id !== currentUserId &&
                !showRevisionInput && (
                  <div className="flex gap-2">
                    <Btn
                      variant="solid"
                      onClick={() => handleVoteAgree(selectedTask)}
                      className="flex-1 text-sm font-semibold"
                    >
                      ✓ Setuju
                    </Btn>
                    <Btn
                      variant="outline"
                      onClick={() => setShowRevisionInput(true)}
                      className="flex-1 text-sm"
                    >
                      Minta revisi
                    </Btn>
                  </div>
                )}

              {/* KASUS 6: Done Task */}
              {selectedTask.status === 'done' && (
                <div className="text-center py-2 text-xs font-mono text-[var(--c3)]">
                  ✓ Tugas ini sudah selesai dan dihitung ke progres tim.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ==============================================================
          MODAL KIRIM BUKTI (PRD F4.3: Deteksi Link Otomatis)
         ============================================================== */}
      {showSubmitModal && selectedTask && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowSubmitModal(false);
            setProofError('');
          }}
          title="Kirim Bukti Pekerjaan"
        >
          <form onSubmit={handleSubmitProof} className="space-y-4">
            <p className="text-xs text-[var(--c3)]">
              Tempel tautan hasil pekerjaan untuk tugas:{' '}
              <strong className="text-[var(--c4)]">{selectedTask.judul}</strong>.
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="eyebrow text-xs">Tautan Bukti (Wajib)</label>
                {proofUrl && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--c1)] border border-[var(--c2)] text-[var(--c4)]">
                    Deteksi: {linkType}
                  </span>
                )}
              </div>
              <Field
                placeholder="https://docs.google.com/... atau https://github.com/..."
                value={proofUrl}
                onChange={(e) => {
                  setProofUrl(e.target.value);
                  setProofError('');
                }}
                error={proofError}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="eyebrow text-xs">Catatan Tambahan (Opsional)</label>
              <textarea
                rows={3}
                placeholder="Jelaskan ringkasan bagian mana yang sudah diselesaikan..."
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                className="w-full bg-[var(--c1)] border border-[var(--c2)] rounded-[var(--radius-input)] px-4 py-2.5 text-[var(--c4)] placeholder-[var(--c3)] focus:outline-none focus:border-[var(--c4)] transition-all text-xs resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Btn type="submit" variant="solid" className="flex-1 text-sm font-semibold">
                Kirim untuk ditinjau
              </Btn>
              <Btn
                type="button"
                variant="ghost"
                onClick={() => setShowSubmitModal(false)}
                className="text-xs px-4"
              >
                Batal
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ==============================================================
          MODAL KONFIRMASI: LEPAS & AMBIL ALIH
         ============================================================== */}
      {showConfirmModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowConfirmModal(null)}
          title={showConfirmModal.type === 'release' ? 'Lepas Tugas?' : 'Ambil Alih Tugas?'}
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--c3)] leading-relaxed">
              {showConfirmModal.type === 'release' ? (
                <>
                  Apakah Anda yakin ingin melepas tugas{' '}
                  <strong className="text-[var(--c4)]">{showConfirmModal.task.judul}</strong>? Tugas
                  akan kembali berstatus &ldquo;Bisa diambil&rdquo; oleh anggota lain.
                </>
              ) : (
                <>
                  Tugas <strong className="text-[var(--c4)]">{showConfirmModal.task.judul}</strong>{' '}
                  sudah melewati batas tenggat dari{' '}
                  <strong className="text-[var(--c4)]">
                    {showConfirmModal.task.assignee_name || 'pemegang sebelumnya'}
                  </strong>
                  . Apakah Anda ingin mengambil alih porsi tugas ini?
                </>
              )}
            </p>

            <div className="flex gap-2 pt-2">
              <Btn
                variant="solid"
                onClick={
                  showConfirmModal.type === 'release' ? handleConfirmRelease : handleConfirmTakeover
                }
                className="flex-1 text-xs font-semibold"
              >
                {showConfirmModal.type === 'release' ? 'Ya, lepas tugas' : 'Ya, ambil alih'}
              </Btn>
              <Btn
                variant="ghost"
                onClick={() => setShowConfirmModal(null)}
                className="text-xs px-4"
              >
                Batal
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ==============================================================
          DRAWER ANGGOTA & AKTIVITAS TIM (DESIGN.md v2 §3 & §7)
         ============================================================== */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Anggota & Tim"
      >
        <div className="space-y-6">
          {/* Tab Mini Drawer: Progres · Aktivitas */}
          <div className="flex bg-[var(--c1)] p-1 rounded-full gap-1 border border-[var(--c2)]">
            <button
              onClick={() => setDrawerTab('Progres')}
              className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                drawerTab === 'Progres'
                  ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold'
                  : 'text-[var(--c3)] hover:text-[var(--c4)]'
              }`}
            >
              Progres
            </button>
            <button
              onClick={() => setDrawerTab('Aktivitas')}
              className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                drawerTab === 'Aktivitas'
                  ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold'
                  : 'text-[var(--c3)] hover:text-[var(--c4)]'
              }`}
            >
              Aktivitas
            </button>
          </div>

          {/* TAB 1: PROGRES ANGGOTA */}
          {drawerTab === 'Progres' && (
            <div className="space-y-4">
              <span className="eyebrow text-xs">Poin Kontribusi Selesai</span>
              <div className="space-y-3">
                {members.map((m) => {
                  const memberPct =
                    stats.totalPoints > 0 ? Math.round((m.points / stats.totalPoints) * 100) : 0;
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-[12px] bg-[var(--c1)]/60 border border-[var(--c2)]/40 space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--c2)] text-[var(--c4)] flex items-center justify-center font-bold text-[10px]">
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-[var(--c4)]">
                            {m.name} {m.id === currentUserId && '(Anda)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {m.role === 'Ketua' && (
                            <span className="px-1.5 py-0.5 bg-[var(--c2)] text-[var(--c4)] rounded text-[9px] uppercase">
                              Ketua
                            </span>
                          )}
                          <span className="text-[var(--c3)]">{m.points}p</span>
                        </div>
                      </div>

                      {/* Bar Progres Individu */}
                      <div className="w-full bg-[var(--c0)] h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${memberPct}%` }}
                          className="bg-[var(--c4)] h-full transition-all duration-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FEED AKTIVITAS REALTIME */}
          {drawerTab === 'Aktivitas' && (
            <div className="space-y-4">
              <span className="eyebrow text-xs">Linimasa Aktivitas</span>
              <div className="space-y-2.5">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-[12px] bg-[var(--c1)]/60 border border-[var(--c2)]/40 space-y-1 text-xs"
                  >
                    <p className="text-[var(--c4)] leading-relaxed">
                      <strong className="text-[var(--c4)]">{act.who}</strong> {act.actionText}
                    </p>
                    <span className="text-[10px] font-mono text-[var(--c3)] block">{act.timeAgo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* ==============================================================
          THUMB BAR (DESIGN.md v2 §4: Aksi Utama Kontekstual)
         ============================================================== */}
      <ThumbBar
        view="room"
        onNavigate={() => {}}
        primaryText={
          tasks.some((t) => t.status === 'open')
            ? 'Ambil tugas'
            : tasks.some((t) => t.status === 'review' && t.assignee_id !== currentUserId)
            ? 'Beri suara'
            : 'Lihat tugas'
        }
        onPrimaryClick={() => {
          // Cari tugas open pertama atau review pertama
          const target =
            tasks.find((t) => t.status === 'open') ||
            tasks.find((t) => t.status === 'review' && t.assignee_id !== currentUserId) ||
            tasks[0];
          if (target) {
            setSelectedTask(target);
          }
        }}
        secondaryText="Anggota"
        onSecondaryClick={() => setIsDrawerOpen(true)}
      />
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BackgroundMood, LineBackgroundEngine } from './components/LineBackgroundEngine';
import { KineticTitle } from './components/KineticTitle';
import {
  Btn,
  Panel,
  Track,
  AvatarStack,
  Modal,
  Toast,
  Field,
  Drawer,
} from './components/DesignSystem';
import { ThumbBar } from './components/ThumbBar';
import { RoomTaskLifecycle } from './components/RoomTaskLifecycle';
import { ContractFlow, ContractTaskItem, ContractMember } from './components/ContractFlow';
import { JoinRoomModal } from './components/JoinRoomModal';
import { DashboardView, DashboardRoomItem } from './components/DashboardView';
import { DossierReport } from './components/DossierReport';
import { createClient } from '@/lib/supabase/client';

/* ------------------------------------------------------------------
   Transisi antar view (morph + fade)
   Alur: view lama keluar (fade + blur + naik sedikit) -> konten ditukar
   -> view baru masuk (dari bawah, fade + un-blur). Background engine
   & lebar container langsung morph ke mood baru selama proses ini.
   ------------------------------------------------------------------ */
const EXIT_MS = 220;
const ENTER_MS = 520;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

type TransitionPhase = 'idle' | 'out' | 'in';

function getPhaseStyle(phase: TransitionPhase, reduced: boolean): React.CSSProperties {
  if (reduced) {
    return {
      opacity: phase === 'idle' ? 1 : 0,
      transition: 'opacity 150ms linear',
    };
  }
  switch (phase) {
    case 'out':
      return {
        opacity: 0,
        transform: 'translate3d(0,-8px,0)',
        filter: 'blur(4px)',
        transition: 'opacity 180ms ease-out, transform 180ms ease-out, filter 180ms ease-out',
      };
    case 'in':
      return {
        opacity: 0,
        transform: 'translate3d(0,12px,0)',
        filter: 'blur(4px)',
        transition: 'none',
      };
    default:
      return {
        opacity: 1,
        transform: 'translate3d(0,0,0)',
        filter: 'blur(0px)',
        transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1), transform 400ms cubic-bezier(0.22, 1, 0.36, 1), filter 400ms cubic-bezier(0.22, 1, 0.36, 1)',
      };
  }
}

export default function Home() {
  const [currentView, setCurrentView] = useState<BackgroundMood>('landing');
  // View yang benar-benar sedang dirender (tertinggal dari currentView selama fase keluar)
  const [displayedView, setDisplayedView] = useState<BackgroundMood>('landing');
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [reducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [authSent, setAuthSent] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [roomSubTab, setRoomSubTab] = useState<'papan' | 'kontrak'>('papan');

  const timersRef = useRef<{ swap?: ReturnType<typeof setTimeout>; raf1?: number; raf2?: number }>({});

  // Orkestrasi transisi dengan event handler non-sinkronous (menghindari warning linter setState in effect)
  useEffect(() => {
    if (currentView === displayedView) return;

    const t = timersRef.current;
    if (t.swap) clearTimeout(t.swap);
    if (t.raf1) cancelAnimationFrame(t.raf1);
    if (t.raf2) cancelAnimationFrame(t.raf2);

    const handleTransition = () => {
      setPhase('out');
      t.swap = setTimeout(() => {
        setDisplayedView(currentView);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
        setPhase('in');
        t.raf1 = requestAnimationFrame(() => {
          t.raf2 = requestAnimationFrame(() => setPhase('idle'));
        });
      }, reducedMotion ? 40 : 15);
    };

    handleTransition();

    return () => {
      if (t.swap) clearTimeout(t.swap);
      if (t.raf1) cancelAnimationFrame(t.raf1);
      if (t.raf2) cancelAnimationFrame(t.raf2);
    };
  }, [currentView, displayedView, reducedMotion]);

  // State Dashboard Ruangan
  const [dashboardRooms, setDashboardRooms] = useState<DashboardRoomItem[]>([
    {
      id: 'mock-room-1',
      nama: 'Riset Pasar Digital',
      kode: 'RPD-4K7',
      role: 'ketua',
      membersCount: 5,
      totalPoints: 40,
      donePoints: 16,
      reviewPoints: 12,
      doingPoints: 8,
      openPoints: 4,
      status: 'locked',
    },
    {
      id: 'mock-room-2',
      nama: 'Proyek Akhir Basis Data',
      kode: 'PBD-9M2',
      role: 'anggota',
      membersCount: 4,
      totalPoints: 50,
      donePoints: 10,
      reviewPoints: 0,
      doingPoints: 15,
      openPoints: 25,
      status: 'draft',
    },
  ]);
  const [contractLocked, setContractLocked] = useState(true);
  const [contractDeadline, setContractDeadline] = useState<string | null>(null);
  const [contractMembers, setContractMembers] = useState<ContractMember[]>([
    { id: 'me', name: 'Ayu', role: 'ketua', contractVote: 'agree' },
    { id: 'u2', name: 'Bima', role: 'anggota', contractVote: 'agree' },
    { id: 'u3', name: 'Citra', role: 'anggota', contractVote: 'agree' },
    { id: 'u4', name: 'Dimas', role: 'anggota', contractVote: 'agree' },
    { id: 'u5', name: 'Esa', role: 'anggota', contractVote: 'agree' },
  ]);
  const [contractTasks, setContractTasks] = useState<ContractTaskItem[]>([
    { id: 't1', judul: 'Tulis bab latar belakang', poin: 10, dueDate: '2026-10-25', status: 'done' },
    { id: 't2', judul: 'Rangkum 10 jurnal relevan', poin: 15, dueDate: '2026-10-29', status: 'review' },
    { id: 't3', judul: 'Kumpulkan 30 responden survei', poin: 20, dueDate: '2026-10-24', status: 'doing' },
    { id: 't4', judul: 'Olah data di spreadsheet', poin: 15, dueDate: '2026-11-02', status: 'doing' },
    { id: 't5', judul: 'Desain slide presentasi akhir', poin: 10, dueDate: '2026-11-05', status: 'open' },
  ]);

  // Background & lebar container langsung ikut tujuan (morph berjalan bareng fade konten)
  const activeMood: BackgroundMood = currentView;

  const phaseStyle = getPhaseStyle(phase, reducedMotion);
  const thumbBarVisible = displayedView !== 'laporan' && displayedView !== 'room';

  return (
    <main className="min-h-screen relative overflow-x-hidden pb-28 text-[var(--c4)] bg-[var(--c0)] selection:bg-[var(--c4)] selection:text-[var(--c0)]">
      {/* Keyframes untuk transisi kecil (sub-tab room & kartu) */}
      <style>{`
        @keyframes fw-sub-enter {
          from { opacity: 0; transform: translate3d(0, 10px, 0); filter: blur(4px); }
          to   { opacity: 1; transform: translate3d(0, 0, 0);    filter: blur(0); }
        }
        .fw-sub-enter { animation: fw-sub-enter 380ms ${EASE} both; }
        @media (prefers-reduced-motion: reduce) {
          .fw-sub-enter { animation: none; }
        }
      `}</style>

      {/* Background Engine */}
      <LineBackgroundEngine mood={activeMood} />

      {/* Top Header / View Switcher Bar for Audit & Review */}
      <header className="relative z-30 border-b border-[var(--c1)] bg-[var(--c0)]/80 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="eyebrow text-xs font-bold text-[var(--c4)]">FairWorks</span>
          <span className="text-[var(--c3)] text-[11px] font-mono">v2 (Radical Simplicity)</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {(['landing', 'auth', 'dashboard', 'room', 'laporan'] as const).map((v) => {
            const isActive = currentView === v;
            return (
              <button
                key={v}
                onClick={() => setCurrentView(v)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold' : 'bg-[var(--c1)] text-[var(--c3)] hover:text-[var(--c4)]'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main View Container — lebar ikut morph ke tujuan */}
      <div
        className={`relative z-10 mx-auto px-4 sm:px-6 pt-8 sm:pt-12 transition-[max-width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          currentView === 'room' || currentView === 'laporan' ? 'max-w-[760px]' : 'max-w-5xl'
        }`}
      >
        {/* Wrapper transisi: semua view dirender lewat displayedView */}
        <div style={{ ...phaseStyle, willChange: 'opacity, transform, filter' }}>
          {/* ==============================================================
              VIEW 1: LANDING — 2 Blok (DESIGN.md v2 §5.1)
             ============================================================== */}
          {displayedView === 'landing' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center pt-4">
                <div className="space-y-5">
                  <span className="eyebrow text-xs">Kerja kelompok yang adil dan terlihat</span>
                  <KineticTitle text="Kerja kelompok yang kelihatan progresnya." className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight" />
                  <p className="text-[var(--c3)] text-base max-w-md leading-relaxed">
                    Ketua bagi poin. Anggota ambil. Teman setujui. Dosen terima laporan tanpa login.
                  </p>
                  <div className="pt-2">
                    <Btn onClick={() => setCurrentView('auth')}>Mulai gratis</Btn>
                  </div>
                </div>

                {/* Preview Box Ringkas (1 blok preview di kanan) */}
                <Panel className="space-y-4 border border-[var(--c2)] bg-[var(--c0)]/90 shadow-2xl">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[var(--c4)] font-medium">Riset Pasar Digital</span>
                    <span className="text-[var(--c3)]">40% selesai</span>
                  </div>
                  <Track done={40} review={30} doing={20} open={10} />
                  <div className="space-y-2 pt-2">
                    <div className="p-3 bg-[var(--c1)] rounded-[12px] flex justify-between items-center text-xs border border-[var(--c2)]/40">
                      <span className="text-[var(--c4)] truncate">▸ Tulis bab latar belakang</span>
                      <span className="font-mono text-[var(--c3)]">10p</span>
                    </div>
                    <div className="p-3 bg-[var(--c1)] rounded-[12px] flex justify-between items-center text-xs border border-[var(--c2)]/40">
                      <span className="text-[var(--c4)] truncate">▸ Rangkum 10 jurnal acuan</span>
                      <span className="font-mono text-[var(--c3)]">15p</span>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ==============================================================
              VIEW 2: AUTH — Satu Field (DESIGN.md v2 §5.2)
             ============================================================== */}
          {displayedView === 'auth' && (
            <div className="min-h-[65vh] flex items-center justify-center">
              <Panel className="w-full max-w-sm space-y-5 text-center bg-[var(--c0)]/95 border border-[var(--c2)] shadow-2xl p-7">
                <div className="space-y-1.5 text-left">
                  <span className="eyebrow text-xs">Selamat datang</span>
                  <h2 className="text-2xl font-semibold tracking-tight">Masuk ke FairWorks</h2>
                </div>

                {!authSent ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const email = emailInput.trim();
                      if (!email) return;
                      try {
                        const supabase = createClient();
                        const { error } = await supabase.auth.signInWithOtp({
                          email,
                          options: {
                            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
                          },
                        });
                        if (error) throw error;
                        setAuthSent(true);
                      } catch (err: unknown) {
                        setToastMessage(err instanceof Error ? err.message : 'Gagal mengirim tautan magic link.');
                      }
                    }}
                    className="fw-sub-enter space-y-4 text-left pt-2"
                  >
                    <Field
                      label="Email"
                      type="email"
                      placeholder="kamu@kampus.id"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                    />
                    <Btn type="submit" className="w-full">
                      Kirim tautan masuk
                    </Btn>
                  </form>
                ) : (
                  <div className="fw-sub-enter space-y-3 py-3 bg-[var(--c1)] rounded-[14px] p-5 border border-[var(--c2)] text-left">
                    <p className="text-sm text-[var(--c4)]">
                      Cek email kamu <strong className="text-white">({emailInput})</strong>, tautan masuk sudah dikirim.
                    </p>
                    <Btn variant="outline" onClick={() => setAuthSent(false)} className="w-full text-xs min-h-[36px]">
                      Kirim ulang
                    </Btn>
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* ==============================================================
              VIEW 3: DASHBOARD — 2 Zona: Baris Mono + Daftar Kolom (DESIGN.md v2 §5.3)
             ============================================================== */}
          {displayedView === 'dashboard' && (
            <DashboardView
              userName="Ayu"
              rooms={dashboardRooms}
              myTaskCount={3}
              myTotalPoints={45}
              onSelectRoom={(room) => {
                setCurrentView('room');
                setToastMessage(`Membuka ruangan ${room.nama}`);
              }}
              onCreateRoom={(nama) => {
                const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
                let code = '';
                for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
                code += '-';
                for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];

                const newRoom: DashboardRoomItem = {
                  id: `room-${Date.now()}`,
                  nama,
                  kode: code,
                  role: 'ketua',
                  membersCount: 1,
                  totalPoints: 0,
                  donePoints: 0,
                  reviewPoints: 0,
                  doingPoints: 0,
                  openPoints: 0,
                  status: 'draft',
                };
                setDashboardRooms((prev) => [newRoom, ...prev]);
                setToastMessage(`Ruangan "${nama}" berhasil dibuat dengan kode ${code}!`);
              }}
              onOpenJoinModal={() => setJoinModalOpen(true)}
            />
          )}

          {/* ==============================================================
              VIEW 4: ROOM — Siklus Pengerjaan Tugas T4 (Riski) & Flow Kontrak T3 (Iwan)
             ============================================================== */}
          {displayedView === 'room' && (
            <div className="space-y-5">
              {/* Toggle Sub-View: Papan Tugas vs Alur Kontrak */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex bg-[var(--c1)] p-0.5 rounded-full border border-[var(--c2)] text-xs font-mono">
                  <button
                    onClick={() => setRoomSubTab('papan')}
                    className={`px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                      roomSubTab === 'papan' ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold' : 'text-[var(--c3)] hover:text-[var(--c4)]'
                    }`}
                  >
                    Papan Tugas
                  </button>
                  <button
                    onClick={() => setRoomSubTab('kontrak')}
                    className={`px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                      roomSubTab === 'kontrak' ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold' : 'text-[var(--c3)] hover:text-[var(--c4)]'
                    }`}
                  >
                    Kontrak {contractLocked ? '(Terkunci)' : '(Draf)'}
                  </button>
                </div>
              </div>

              {/* key = paksa remount supaya animasi masuk sub-tab jalan tiap ganti */}
              <div key={roomSubTab} className="fw-sub-enter">
                {roomSubTab === 'papan' ? (
                  <RoomTaskLifecycle
                    currentUserId="user-riski"
                    currentUserName="Riski"
                    onNavigateHome={() => setCurrentView('dashboard')}
                  />
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="border-b border-[var(--c1)] pb-4 space-y-1">
                      <span className="eyebrow text-xs">Agreement Lock</span>
                      <h3 className="text-xl font-semibold">Kesepakatan Porsi Kerja Tim</h3>
                      <p className="text-xs text-[var(--c3)]">
                        Ketua menentukan bobot tugas, seluruh anggota menyepakati di awal sebelum pengerjaan dimulai.
                      </p>
                    </div>
                    <ContractFlow
                      roomName="Riset Pasar Digital"
                      roomCode="RPD-4K7"
                      isOwner={true}
                      isLocked={contractLocked}
                      lockedAt={contractLocked ? '2026-10-24T10:00:00Z' : null}
                      contractDeadline={contractDeadline}
                      members={contractMembers}
                      tasks={contractTasks}
                      currentUserId="me"
                      onAddTask={(newTask) => {
                        const id = `t-${Date.now()}`;
                        setContractTasks((prev) => [
                          ...prev,
                          {
                            ...newTask,
                            id,
                            status: 'open',
                            postLockVotes: newTask.postLockPending ? [] : undefined,
                          },
                        ]);
                        setToastMessage(
                          newTask.postLockPending
                            ? 'Tugas diajukan ke mayoritas anggota!'
                            : 'Tugas berhasil ditambahkan ke draf kontrak'
                        );
                      }}
                      onEditTask={(taskId, updates) => {
                        setContractTasks((prev) =>
                          prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
                        );
                        setToastMessage('Tugas berhasil diubah');
                      }}
                      onDeleteTask={(taskId) => {
                        setContractTasks((prev) => prev.filter((t) => t.id !== taskId));
                        setToastMessage('Tugas dihapus dari kontrak');
                      }}
                      onSubmitContract={() => {
                        const d = new Date();
                        d.setHours(d.getHours() + 24);
                        setContractDeadline(d.toISOString());
                        setToastMessage('Kontrak diajukan! Batas 24 jam dimulai.');
                      }}
                      onVoteContract={(agree, note) => {
                        setContractMembers((prev) =>
                          prev.map((m) =>
                            m.id === 'me'
                              ? { ...m, contractVote: agree ? 'agree' : 'request_changes', contractVoteNote: note || null }
                              : m
                          )
                        );
                        if (agree) {
                          setToastMessage('Persetujuan Anda telah dicatat.');
                        } else {
                          setToastMessage('Catatan revisi kontrak telah dikirim.');
                        }
                      }}
                      onVotePostLockTask={(taskId, agree) => {
                        if (agree) {
                          setContractTasks((prev) =>
                            prev.map((t) => (t.id === taskId ? { ...t, postLockPending: false } : t))
                          );
                          setToastMessage('Tugas pasca-lock disetujui mayoritas & aktif!');
                        } else {
                          setContractTasks((prev) => prev.filter((t) => t.id !== taskId));
                          setToastMessage('Tugas pasca-lock ditolak anggota.');
                        }
                      }}
                      onAutoLockTrigger={() => {
                        setContractLocked(true);
                        setContractDeadline(null);
                        setToastMessage('Waktu 24 jam habis: Kontrak terkunci otomatis!');
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================================
              VIEW 5: DOSSIER PUBLIK FINAL (Chello - PRD §6 F5 / PLAN T5)
              Kepala laporan + Pie chart monokrom + Timeline + Tabel bukti
             ============================================================== */}
          {displayedView === 'laporan' && (
            <div>
              <DossierReport onBack={() => setCurrentView('dashboard')} />
            </div>
          )}
        </div>
      </div>

      {/* Join Room Modal (T3: Join ruangan via kode) */}
      <JoinRoomModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onJoin={async (code) => {
          setToastMessage(`Berhasil bergabung ke ruangan ${code}!`);
          setCurrentView('room');
        }}
      />

      {/* Global Toast */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Global Modal (Join Kode) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Masuk Ruangan">
        <div className="space-y-4">
          <Field label="Kode Ruangan" placeholder="Contoh: RPD-4K7" />
          <Btn onClick={() => { setIsModalOpen(false); setToastMessage('Berhasil masuk ruangan!'); }} className="w-full">
            Gabung
          </Btn>
        </div>
      </Modal>

      {/* Drawer Anggota & Aktivitas (DESIGN.md v2 §1.5 #2 & §5.4) */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Anggota & Aktivitas">
        <div className="space-y-4">
          <span className="eyebrow text-[11px]">Anggota Tim</span>
          <AvatarStack
            members={[
              { name: 'Ayu', isOwner: true },
              { name: 'Bima' },
              { name: 'Citra' },
              { name: 'Dimas' },
              { name: 'Esa' },
            ]}
          />
          <div className="space-y-2 pt-2 text-xs font-mono text-[var(--c3)]">
            <div className="flex justify-between"><span>Ayu (Ketua)</span><span>10p</span></div>
            <div className="flex justify-between"><span>Bima</span><span>15p</span></div>
            <div className="flex justify-between"><span>Citra</span><span>0p</span></div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[var(--c1)]">
          <span className="eyebrow text-[11px]">Aktivitas Terkini</span>
          <div className="space-y-2 text-xs text-[var(--c3)] font-mono">
            <div>Bima kirim bukti jurnal</div>
            <div>Ayu setujui tugas rangkum</div>
            <div>Kontrak terkunci otomatis</div>
          </div>
        </div>
      </Drawer>

      {/* Thumb Bar — Satu Aksi Utama Kontekstual (DESIGN.md v2 §4)
          Wrapper hanya pakai opacity (bukan transform/filter) supaya posisi fixed ThumbBar tidak rusak. */}
      {thumbBarVisible && (
        <div
          style={{
            opacity: phase === 'idle' && currentView === displayedView ? 1 : 0,
            transition: `opacity ${phase === 'out' ? EXIT_MS : ENTER_MS}ms ${phase === 'out' ? 'ease-in' : EASE}`,
            pointerEvents: phase === 'idle' ? 'auto' : 'none',
          }}
        >
          <ThumbBar
            view={displayedView}
            onNavigate={setCurrentView}
            primaryText={
              displayedView === 'landing'
                ? 'Mulai gratis'
                : displayedView === 'auth'
                ? 'Kirim tautan masuk'
                : 'Buat ruangan'
            }
            onPrimaryClick={() => {
              if (displayedView === 'landing') setCurrentView('auth');
              else if (displayedView === 'auth') setAuthSent(true);
              else if (displayedView === 'dashboard') {
                const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
                let code = '';
                for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
                code += '-';
                for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];

                const defaultName = `Ruangan Proyek ${dashboardRooms.length + 1}`;
                const newRoom: DashboardRoomItem = {
                  id: `room-${Date.now()}`,
                  nama: defaultName,
                  kode: code,
                  role: 'ketua',
                  membersCount: 1,
                  totalPoints: 0,
                  donePoints: 0,
                  reviewPoints: 0,
                  doingPoints: 0,
                  openPoints: 0,
                  status: 'draft',
                };
                setDashboardRooms((prev) => [newRoom, ...prev]);
                setToastMessage(`Ruangan baru dibuat (${code})!`);
              }
            }}
            secondaryText={displayedView === 'dashboard' ? 'Masuk kode' : undefined}
            onSecondaryClick={() => {
              if (displayedView === 'dashboard') setJoinModalOpen(true);
            }}
          />
        </div>
      )}
    </main>
  );
}
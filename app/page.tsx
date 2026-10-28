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
import { CreateRoomModal } from './components/CreateRoomModal';
import { DashboardView, DashboardRoomItem } from './components/DashboardView';
import { DossierReport } from './components/DossierReport';
import { createClient } from '@/lib/supabase/client';
import { getUserDashboardData } from '@/lib/api/fairworks';

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
      transition: `opacity ${phase === 'in' ? 0 : 150}ms linear`,
    };
  }
  switch (phase) {
    case 'out':
      return {
        opacity: 0,
        transform: 'translate3d(0,-10px,0) scale(0.985)',
        filter: 'blur(6px)',
        transition: `opacity ${EXIT_MS}ms ease-in, transform ${EXIT_MS}ms ease-in, filter ${EXIT_MS}ms ease-in`,
      };
    case 'in':
      // posisi awal masuk: langsung dipasang tanpa transisi
      return {
        opacity: 0,
        transform: 'translate3d(0,18px,0) scale(0.99)',
        filter: 'blur(6px)',
        transition: 'none',
      };
    default:
      return {
        opacity: 1,
        transform: 'translate3d(0,0,0) scale(1)',
        filter: 'blur(0px)',
        transition: `opacity ${ENTER_MS}ms ${EASE}, transform ${ENTER_MS}ms ${EASE}, filter ${ENTER_MS}ms ${EASE}`,
      };
  }
}

export default function Home() {
  const [currentView, setCurrentView] = useState<BackgroundMood>('landing');
  // View yang benar-benar sedang dirender (tertinggal dari currentView selama fase keluar)
  const [displayedView, setDisplayedView] = useState<BackgroundMood>('landing');
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Auth State & User Session
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Pengguna');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setUserName(session.user.email?.split('@')[0] || 'Pengguna');
        getUserDashboardData().then((res) => {
          if (res && res.rooms) {
            // rooms loaded
          }
        }).catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserName(session.user.email?.split('@')[0] || 'Pengguna');
        setCurrentView('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // State Ruangan Aktif Terpilih
  const [activeRoom, setActiveRoom] = useState<{ id: string; nama: string; kode: string } | null>(null);
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [authSent, setAuthSent] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [roomSubTab, setRoomSubTab] = useState<'papan' | 'kontrak'>('papan');

  const timersRef = useRef<{ swap?: ReturnType<typeof setTimeout>; raf1?: number; raf2?: number }>({});

  // Hormati preferensi "reduce motion"
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Orkestrasi transisi: out -> swap -> in -> idle
  // PENTING: dependency HANYA currentView. displayedView dibaca lewat ref, kalau tidak,
  // setDisplayedView() memicu cleanup yang membatalkan rAF "idle" -> view nyangkut opacity 0.
  const displayedViewRef = useRef<BackgroundMood>('landing');
  useEffect(() => {
    displayedViewRef.current = displayedView;
  }, [displayedView]);

  useEffect(() => {
    const t = timersRef.current;
    const clearAll = () => {
      if (t.swap) clearTimeout(t.swap);
      if (t.raf1) cancelAnimationFrame(t.raf1);
      if (t.raf2) cancelAnimationFrame(t.raf2);
      t.swap = t.raf1 = t.raf2 = undefined;
    };

    clearAll();

    // Balik ke view yang sedang tampil (mis. klik cepat bolak-balik): pastikan terlihat penuh
    if (currentView === displayedViewRef.current) {
      setPhase('idle');
      return clearAll;
    }

    setPhase('out');
    t.swap = setTimeout(() => {
      displayedViewRef.current = currentView;
      setDisplayedView(currentView);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
      setPhase('in');
      // dua frame supaya posisi awal "in" sempat ter-paint sebelum animasi masuk
      t.raf1 = requestAnimationFrame(() => {
        t.raf2 = requestAnimationFrame(() => setPhase('idle'));
      });
    }, reducedMotion ? 120 : EXIT_MS);

    return clearAll;
  }, [currentView, reducedMotion]);

  // State Dashboard Ruangan (kosong bersih dari awal)
  const [dashboardRooms, setDashboardRooms] = useState<DashboardRoomItem[]>([]);
  const [contractLocked, setContractLocked] = useState(false);
  const [contractDeadline, setContractDeadline] = useState<string | null>(null);
  const [contractMembers, setContractMembers] = useState<ContractMember[]>([]);
  const [contractTasks, setContractTasks] = useState<ContractTaskItem[]>([]);

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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {(['landing', 'auth', 'dashboard', 'room', 'laporan'] as const).map((v) => {
              const isActive = currentView === v;
              return (
                <button
                  key={v}
                  onClick={() => {
                    if (v === 'dashboard' && !user) {
                      setCurrentView('auth');
                      setToastMessage('Silakan masuk terlebih dahulu.');
                      return;
                    }
                    setCurrentView(v);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isActive ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold' : 'bg-[var(--c1)] text-[var(--c3)] hover:text-[var(--c4)]'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>

          {user ? (
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                setUser(null);
                setCurrentView('landing');
                setToastMessage('Berhasil keluar.');
              }}
              className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[var(--c1)] text-[var(--c3)] hover:text-red-400 transition-all cursor-pointer border border-[var(--c2)]"
            >
              Keluar ({userName})
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('auth')}
              className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[var(--c4)] text-[var(--c0)] font-semibold transition-all cursor-pointer"
            >
              Masuk
            </button>
          )}
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
              userName={userName}
              rooms={dashboardRooms}
              myTaskCount={3}
              myTotalPoints={45}
              onSelectRoom={(room) => {
                setActiveRoom({ id: room.id, nama: room.nama, kode: room.kode });
                setContractLocked(room.status === 'locked');
                setRoomSubTab(room.status === 'locked' ? 'papan' : 'kontrak');
                setCurrentView('room');
                setToastMessage(`Membuka ruangan ${room.nama}`);
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
                    roomName={activeRoom?.nama || 'Ruangan Tim'}
                    roomCode={activeRoom?.kode || 'RPD-4K7'}
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
                      roomName={activeRoom?.nama || 'Ruangan Tim'}
                      roomCode={activeRoom?.kode || 'RPD-4K7'}
                      isOwner={true}
                      isLocked={contractLocked}
                      lockedAt={contractLocked ? new Date().toISOString() : null}
                      contractDeadline={contractDeadline}
                      members={contractMembers}
                      tasks={contractTasks}
                      currentUserId="me"
                      onProceedToActiveRoom={() => {
                        setContractLocked(true);
                        setRoomSubTab('papan');
                        setToastMessage('Kontrak resmi terkunci! Membuka Papan Tugas Aktif.');
                      }}
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
                  onSubmitContract={async () => {
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

      {/* Create Room Modal (T3/T5: Buat ruangan & langsung redirect ke pre-lock contract) */}
      <CreateRoomModal
        isOpen={createRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        onCreate={(name: string, code?: string) => {
          const finalCode = code || 'RPD-' + Math.floor(100 + Math.random() * 900);
          const newRoom: DashboardRoomItem = {
            id: `room-${Date.now()}`,
            nama: name,
            kode: finalCode,
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
          setActiveRoom({ id: newRoom.id, nama: newRoom.nama, kode: newRoom.kode });
          setContractLocked(false);
          setContractTasks([]);
          setContractMembers([{ id: 'me', name: userName, role: 'ketua', contractVote: 'agree' }]);
          setRoomSubTab('kontrak');
          setCurrentView('room');
          setToastMessage(`Ruangan "${name}" berhasil dibuat! Silakan susun tugas kontrak.`);
        }}
      />

      {/* Global Toast */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Drawer Anggota & Aktivitas (DESIGN.md v2 §1.5 #2 & §5.4) */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Anggota & Aktivitas">
        <div className="space-y-4">
          <span className="eyebrow text-[11px]">Anggota Tim</span>
          <AvatarStack
            members={[
              { name: userName, isOwner: true },
              { name: 'Bima' },
              { name: 'Citra' },
              { name: 'Dimas' },
              { name: 'Esa' },
            ]}
          />
          <div className="space-y-2 pt-2 text-xs font-mono text-[var(--c3)]">
            <div className="flex justify-between"><span>{userName} (Ketua)</span><span>10p</span></div>
            <div className="flex justify-between"><span>Bima</span><span>15p</span></div>
            <div className="flex justify-between"><span>Citra</span><span>0p</span></div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[var(--c1)]">
          <span className="eyebrow text-[11px]">Aktivitas Terkini</span>
          <div className="space-y-2 text-xs text-[var(--c3)] font-mono">
            <div>Bima kirim bukti jurnal</div>
            <div>{userName} setujui tugas rangkum</div>
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
                setCreateRoomModalOpen(true);
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
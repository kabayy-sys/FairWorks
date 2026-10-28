'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { DossierReport, ReportData } from './components/DossierReport';
import { createClient } from '@/lib/supabase/client';
import { getUserDashboardData, createRoom, joinRoom } from '@/lib/api/fairworks';

/* ------------------------------------------------------------------
   Transisi antar view (morph + fade)
   Alur: view lama keluar (fade + blur + naik sedikit) -> konten ditukar
   -> view baru masuk (dari bawah, fade + un-blur). Background engine
   & lebar container langsung morph ke mood baru selama proses ini.
   ------------------------------------------------------------------ */
const EXIT_MS = 220;
const ENTER_MS = 520;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

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
  const [myTaskCount, setMyTaskCount] = useState(0);
  const [myTotalPoints, setMyTotalPoints] = useState(0);

  // Modal nama panggilan (onboarding pertama & rename via header)
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Muat data dashboard asli dari Supabase (profil, ruangan, tugas). Kosong = tampil kosong.
  const loadDashboard = useCallback(async () => {
    try {
      const res = await getUserDashboardData();
      if (!res) return;

      const displayName = res.user.nama || res.user.email?.split('@')[0] || 'Pengguna';
      setUserName(displayName);

      // Nama belum pernah diisi (profil baru / kosong): ajak isi nama panggilan sekali
      if (!res.user.nama) {
        const meta = user?.user_metadata ?? {};
        setNameInput(meta.full_name || meta.name || displayName);
        setNameModalOpen(true);
      }

      const rawRooms = (res.rooms ?? []) as Array<{
        room_id: string;
        peran: string;
        rooms: { id: string; nama: string; kode: string; locked_at: string | null };
      }>;
      const roomIds = rawRooms.map((r) => r.rooms.id);

      const sb = createClient();
      const tasksRes = roomIds.length
        ? await sb.from('tasks').select('room_id, poin, status, assignee_id').in('room_id', roomIds)
        : { data: [] as Array<{ room_id: string; poin: number | null; status: string; assignee_id: string | null }> | null };
      const membersRes = roomIds.length
        ? await sb.from('room_members').select('room_id').in('room_id', roomIds)
        : { data: [] as Array<{ room_id: string }> | null };

      const tasks = tasksRes.data ?? [];
      const stats: Record<string, { total: number; done: number; review: number; doing: number; open: number }> = {};
      let taskCount = 0;
      let totalPoints = 0;
      for (const t of tasks) {
        const poin = t.poin ?? 0;
        const s = (stats[t.room_id] ??= { total: 0, done: 0, review: 0, doing: 0, open: 0 });
        s.total += poin;
        if (t.status === 'done' || t.status === 'review' || t.status === 'doing' || t.status === 'open') {
          s[t.status] += poin;
        }
        if (t.assignee_id === res.user.id) {
          taskCount += 1;
          if (t.status === 'done') totalPoints += poin;
        }
      }

      const memberCounts: Record<string, number> = {};
      for (const m of membersRes.data ?? []) {
        memberCounts[m.room_id] = (memberCounts[m.room_id] ?? 0) + 1;
      }

      setDashboardRooms(
        rawRooms.map((r) => {
          const s = stats[r.rooms.id] ?? { total: 0, done: 0, review: 0, doing: 0, open: 0 };
          return {
            id: r.rooms.id,
            nama: r.rooms.nama,
            kode: r.rooms.kode,
            role: r.peran === 'ketua' ? 'ketua' : 'anggota',
            membersCount: memberCounts[r.rooms.id] ?? 1,
            totalPoints: s.total,
            donePoints: s.done,
            reviewPoints: s.review,
            doingPoints: s.doing,
            openPoints: s.open,
            status: r.rooms.locked_at ? 'locked' : 'draft',
          } as DashboardRoomItem;
        })
      );
      setMyTaskCount(taskCount);
      setMyTotalPoints(totalPoints);
    } catch {
      // Biarkan dashboard tampil kosong kalau data gagal dimuat
    }
  }, [user]);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        if (event === 'SIGNED_IN') setCurrentView('dashboard');
        loadDashboard();
      } else {
        // Sesi habis / belum login: semua state privat dikosongkan & kembali ke landing
        setUserName('Pengguna');
        setDashboardRooms([]);
        setMyTaskCount(0);
        setMyTotalPoints(0);
        setActiveRoom(null);
        setContractLocked(false);
        setContractDeadline(null);
        setContractMembers([]);
        setContractTasks([]);
        setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadDashboard]);

  // Login Google: popup/redirect OAuth, balik ke origin lalu onAuthStateChange yang melanjutkan
  const signInWithGoogle = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : 'Gagal membuka login Google.');
    }
  };

  // Simpan nama panggilan ke profiles (RLS: hanya baris sendiri)
  const handleSaveName = async () => {
    const nama = nameInput.trim();
    if (!nama || !user) return;
    setSavingName(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({ nama }).eq('id', user.id);
      if (error) throw error;
      setUserName(nama);
      setNameModalOpen(false);
      setToastMessage(`Siap, dipanggil ${nama} mulai sekarang.`);
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : 'Gagal menyimpan nama.');
    } finally {
      setSavingName(false);
    }
  };

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

  // Data laporan dibangun dari ruangan aktif yang benar-benar ada. Tanpa ruangan = null (laporan tampil kosong).
  const reportData: ReportData | null = useMemo(() => {
    if (!activeRoom) return null;
    return {
      room: {
        id: activeRoom.id,
        nama: activeRoom.nama,
        kode: activeRoom.kode,
        locked_at: contractLocked ? (contractDeadline ?? new Date().toISOString()) : null,
        created_at: new Date().toISOString(),
        total_points: contractTasks.reduce((s, t) => s + (t.poin ?? 0), 0),
        done_points: contractTasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.poin ?? 0), 0),
      },
      members: contractMembers.map((m) => ({
        user_id: m.id,
        nama: m.name,
        peran: m.role,
        points_done: 0, // Draf kontrak belum ada pengerjaan; poin asli mengalir lewat laporan publik /l/{token}
      })),
      tasks: contractTasks.map((t) => ({
        id: t.id,
        judul: t.judul,
        deskripsi: t.deskripsi ?? null,
        poin: t.poin,
        status: t.status,
        assignee_name: null,
        submit_link: null,
        submit_note: null,
        submit_at: null,
      })),
      timeline: [],
    };
  }, [activeRoom, contractTasks, contractMembers, contractLocked, contractDeadline]);

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

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {(['landing', 'dashboard', 'room', 'laporan'] as const).map((v) => {
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

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setNameInput(userName);
                  setNameModalOpen(true);
                }}
                title="Ubah nama panggilan"
                className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[var(--c1)] text-[var(--c4)] hover:bg-[var(--c2)] transition-all duration-300 cursor-pointer border border-[var(--c2)]"
              >
                {userName}
              </button>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                }}
                className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[var(--c1)] text-[var(--c3)] hover:text-red-400 transition-all cursor-pointer border border-[var(--c2)]"
              >
                Keluar
              </button>
            </div>
          </div>
        )}
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
                  <div className="space-y-4 pt-2">
                    <button
                      onClick={signInWithGoogle}
                      className="fw-sub-enter w-full inline-flex items-center justify-center gap-3 min-h-[48px] px-6 rounded-full bg-white text-[var(--c4)] text-[15px] font-medium border border-[var(--c2)] hover:bg-[var(--c1)] active:scale-[0.98] transition-all duration-200 cursor-pointer select-none"
                      style={{ animationDelay: '60ms' }}
                    >
                      <GoogleIcon />
                      Lanjutkan dengan Google
                    </button>

                    <div className="flex items-center gap-3 fw-sub-enter" style={{ animationDelay: '140ms' }}>
                      <div className="h-px flex-1 bg-[var(--c2)]" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--c3)]">atau</span>
                      <div className="h-px flex-1 bg-[var(--c2)]" />
                    </div>

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
                      className="fw-sub-enter space-y-3 text-left"
                      style={{ animationDelay: '220ms' }}
                    >
                      <Field
                        label="Masuk via tautan email"
                        type="email"
                        placeholder="kamu@kampus.id"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                      />
                      <Btn type="submit" variant="outline" className="w-full text-xs min-h-[40px]">
                        Kirim tautan masuk
                      </Btn>
                    </form>
                  </div>
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
              myTaskCount={myTaskCount}
              myTotalPoints={myTotalPoints}
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
          {displayedView === 'room' && !activeRoom && (
            <Panel className="p-12 text-center space-y-3 border border-dashed border-[var(--c2)]">
              <p className="text-sm text-[var(--c3)]">Belum ada ruangan aktif.</p>
              <p className="text-xs text-[var(--c3)] font-mono">Pilih ruangan dari dashboard terlebih dahulu.</p>
            </Panel>
          )}

          {displayedView === 'room' && activeRoom && (
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
                    currentUserId={user?.id ?? ''}
                    currentUserName={userName}
                    roomName={activeRoom.nama}
                    roomCode={activeRoom.kode}
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
                      roomName={activeRoom.nama}
                      roomCode={activeRoom.kode}
                      isOwner={true}
                      isLocked={contractLocked}
                      lockedAt={contractLocked ? new Date().toISOString() : null}
                      contractDeadline={contractDeadline}
                      members={contractMembers}
                      tasks={contractTasks}
                      currentUserId={user?.id ?? ''}
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
              <DossierReport initialData={reportData} onBack={() => setCurrentView('dashboard')} />
            </div>
          )}
        </div>
      </div>

      {/* Join Room Modal (T3: Join ruangan via kode) */}
      <JoinRoomModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onJoin={async (code) => {
          try {
            const res = (await joinRoom(code)) as { room_id: string; nama: string; already_member: boolean };
            setJoinModalOpen(false);
            setToastMessage(
              res.already_member
                ? `Kamu sudah jadi anggota ruangan "${res.nama}".`
                : `Berhasil bergabung ke ruangan "${res.nama}"!`
            );
            await loadDashboard();
            setCurrentView('dashboard');
          } catch (err: unknown) {
            setToastMessage(err instanceof Error ? err.message : 'Gagal masuk ruangan.');
          }
        }}
      />

      {/* Create Room Modal (T3/T5: Buat ruangan & langsung redirect ke pre-lock contract) */}
      <CreateRoomModal
        isOpen={createRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        onCreate={async (name: string) => {
          try {
            // Kode ruangan digenerate oleh RPC create_room di Supabase
            const created = (await createRoom(name)) as { room_id: string; kode: string; nama: string };
            const newRoom: DashboardRoomItem = {
              id: created.room_id,
              nama: created.nama || name,
              kode: created.kode,
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
            setContractDeadline(null);
            setContractTasks([]);
            setContractMembers([{ id: user?.id ?? '', name: userName, role: 'ketua', contractVote: 'agree' }]);
            setRoomSubTab('kontrak');
            setCurrentView('room');
            setToastMessage(`Ruangan "${newRoom.nama}" berhasil dibuat! Kode: ${newRoom.kode}`);
          } catch (err: unknown) {
            setToastMessage(err instanceof Error ? err.message : 'Gagal membuat ruangan.');
          }
        }}
      />

      {/* Modal Nama Panggilan — onboarding pertama & rename via header */}
      <Modal isOpen={nameModalOpen} onClose={() => setNameModalOpen(false)} title="Nama Panggilan">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveName();
          }}
          className="space-y-4"
        >
          <p className="text-xs text-[var(--c3)] leading-relaxed">
            Nama ini yang tampil di ruangan tim, kontrak, dan laporan yang dibaca dosen.
          </p>
          <Field
            label="Panggil kamu apa?"
            type="text"
            placeholder="Contoh: Raken"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={40}
            required
            autoFocus
          />
          <div className="flex gap-2 justify-end pt-1">
            <Btn
              type="button"
              variant="ghost"
              onClick={() => setNameModalOpen(false)}
              className="min-h-[40px] text-xs px-4"
            >
              Nanti saja
            </Btn>
            <Btn type="submit" loading={savingName} className="min-h-[40px] text-xs px-5">
              Simpan
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Global Toast */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Drawer Anggota & Aktivitas (DESIGN.md v2 §1.5 #2 & §5.4) */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Anggota & Aktivitas">
        <div className="space-y-4">
          <span className="eyebrow text-[11px]">Anggota Tim</span>
          {contractMembers.length === 0 ? (
            <p className="text-xs text-[var(--c3)] font-mono">Belum ada anggota.</p>
          ) : (
            <AvatarStack
              members={contractMembers.map((m) => ({ name: m.name, isOwner: m.role === 'ketua' }))}
            />
          )}
          <div className="space-y-2 pt-2 text-xs font-mono text-[var(--c3)]">
            {contractMembers.map((m) => (
              <div key={m.id} className="flex justify-between">
                <span>{m.name}{m.role === 'ketua' ? ' (Ketua)' : ''}</span>
                <span>0p</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[var(--c1)]">
          <span className="eyebrow text-[11px]">Aktivitas Terkini</span>
          <p className="text-xs text-[var(--c3)] font-mono">Belum ada aktivitas.</p>
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
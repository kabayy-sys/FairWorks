'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LineBackgroundEngine } from './components/LineBackgroundEngine';
import { AppHeader } from './components/AppHeader';
import { AppDock, type DockTarget } from './components/AppDock';
import { Modal, Toast, Field, Btn } from './components/DesignSystem';
import { ContractFlow, ContractTaskItem, ContractMember } from './components/ContractFlow';
import { JoinRoomModal } from './components/JoinRoomModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { DashboardViewNew, type MyTaskRow } from './views/DashboardViewNew';
import type { DashboardRoomItem } from './components/DashboardView';
import { LandingView } from './views/LandingView';
import { AuthView } from './views/AuthView';
import { RoomView } from './views/RoomView';
import { DossierReport, ReportData } from './components/DossierReport';
import { createClient } from '@/lib/supabase/client';
import {
  getUserDashboardData,
  createRoom,
  joinRoom,
  submitContract,
  voteContract,
  autoLock,
  createTask,
  updateTask,
  deleteTask,
} from '@/lib/api/fairworks';

/* ------------------------------------------------------------------
   Shell transisi antar view (ruang-tim): keluar fade-naik, masuk stagger.
   Background engine + lebar container mengikuti mood tujuan.
   ------------------------------------------------------------------ */
const EXIT_MS = 400;

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
        transform: 'translateY(-8px)',
        transition: `opacity ${EXIT_MS}ms var(--ease), transform ${EXIT_MS}ms var(--ease)`,
      };
    case 'in':
      return {
        opacity: 0,
        transition: 'none',
      };
    default:
      return {
        opacity: 1,
        transform: 'translateY(0)',
        transition: 'opacity .7s var(--ease), transform .7s var(--ease)',
      };
  }
}

export default function Home() {
  const [currentView, setCurrentView] = useState<DockTarget>('landing');
  const [displayedView, setDisplayedView] = useState<DockTarget>('landing');
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Sesi & data
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Pengguna');
  const [myTaskCount, setMyTaskCount] = useState(0);
  const [myTotalPoints, setMyTotalPoints] = useState(0);
  const [myTasks, setMyTasks] = useState<MyTaskRow[]>([]);

  // Modal nama panggilan
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Ruangan aktif
  const [activeRoom, setActiveRoom] = useState<{ id: string; nama: string; kode: string; role: 'ketua' | 'anggota' } | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State kontrak (tab Kontrak di dalam ruangan)
  const [contractLocked, setContractLocked] = useState(false);
  const [contractDeadline, setContractDeadline] = useState<string | null>(null);
  const [contractMembers, setContractMembers] = useState<ContractMember[]>([]);
  const [contractTasks, setContractTasks] = useState<ContractTaskItem[]>([]);

  const timersRef = useRef<{ swap?: ReturnType<typeof setTimeout>; raf1?: number; raf2?: number }>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Muat data dashboard asli dari Supabase. Kosong = tampil kosong.
  const loadDashboard = useCallback(async () => {
    try {
      const res = await getUserDashboardData();
      if (!res) return;

      const displayName = res.user.nama || res.user.email?.split('@')[0] || 'Pengguna';
      setUserName(displayName);

      // Nama belum pernah diisi: ajak isi nama panggilan sekali
      if (!res.user.nama) {
        const supabase = createClient();
        const { data: { user: u } } = await supabase.auth.getUser();
        const meta = (u?.user_metadata ?? {}) as Record<string, string>;
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
      setMyTasks((res.myTasks ?? []) as unknown as MyTaskRow[]);
    } catch {
      // Biarkan dashboard tampil kosong kalau data gagal dimuat
    }
  }, []);

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
        setMyTasks([]);
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

  const sendMagic = async (email: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
        },
      });
      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  };

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

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  // Orkestrasi transisi: out -> swap -> in -> idle (view lama benar-benar diganti)
  const displayedViewRef = useRef<DockTarget>('landing');
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

    if (currentView === displayedViewRef.current) {
      setPhase('idle');
      return clearAll;
    }

    setPhase('out');
    t.swap = setTimeout(() => {
      displayedViewRef.current = currentView;
      setDisplayedView(currentView);
      const sc = document.getElementById('fw-scroll');
      if (sc) sc.scrollTo({ top: 0, behavior: 'auto' });
      setPhase('in');
      t.raf1 = requestAnimationFrame(() => {
        t.raf2 = requestAnimationFrame(() => setPhase('idle'));
      });
    }, reducedMotion ? 120 : EXIT_MS);

    return clearAll;
  }, [currentView, reducedMotion]);

  // State Dashboard Ruangan
  const [dashboardRooms, setDashboardRooms] = useState<DashboardRoomItem[]>([]);

  const phaseStyle = getPhaseStyle(phase, reducedMotion);

  // Laporan dibangun dari ruangan aktif; tanpa ruangan = null (tampil kosong)
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
        points_done: 0,
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

  const openRoom = (room: { id: string; nama: string; kode: string; role: 'ketua' | 'anggota'; locked?: boolean }) => {
    setActiveRoom({ id: room.id, nama: room.nama, kode: room.kode, role: room.role });
    setContractLocked(!!room.locked);
    setContractTasks([]);
    setContractMembers(
      room.role === 'ketua'
        ? [{ id: user?.id ?? '', name: userName, role: 'ketua', contractVote: 'agree' }]
        : []
    );
    setContractDeadline(null);
    setCurrentView('room');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--c0)] text-[var(--c4)]">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .fw-stagger > *, .fw-leave { animation: none; }
        }
      `}</style>

      <LineBackgroundEngine mood={displayedView} />

      <AppHeader
        loggedIn={!!user}
        userName={userName}
        onGoLanding={() => setCurrentView('landing')}
        onOpenName={() => {
          setNameInput(userName);
          setNameModalOpen(true);
        }}
        onSignOut={signOut}
      />

      <main
        id="fw-scroll"
        className="fixed inset-0 z-10 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--c2) transparent' }}
      >
        <div className="grid min-h-full pb-28" style={{ paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' }}>
          <div className="min-w-0 [grid-area:1/1]">
            <div style={{ ...phaseStyle, willChange: 'opacity, transform' }}>
              <div className="fw-stagger">
                {displayedView === 'landing' && <LandingView onStart={() => setCurrentView('auth')} />}

                {displayedView === 'auth' && <AuthView onSignInGoogle={signInWithGoogle} onSendMagic={sendMagic} />}

                {displayedView === 'dashboard' && (
                  <DashboardViewNew
                    userName={userName}
                    rooms={dashboardRooms}
                    myTasks={myTasks}
                    onSelectRoom={(room) => openRoom({ ...room, locked: room.status === 'locked' })}
                    onJoin={() => setJoinModalOpen(true)}
                    onCreate={() => setCreateRoomModalOpen(true)}
                  />
                )}

                {displayedView === 'room' &&
                  (activeRoom ? (
                    <RoomView
                      roomId={activeRoom.id}
                      roomName={activeRoom.nama}
                      roomCode={activeRoom.kode}
                      userId={user?.id ?? ''}
                      isOwner={activeRoom.role === 'ketua'}
                      onToast={setToastMessage}
                      onBack={() => setCurrentView('dashboard')}
                      contractLocked={contractLocked}
                      contractSlot={
                        <ContractFlow
                          roomName={activeRoom.nama}
                          roomCode={activeRoom.kode}
                          isOwner={activeRoom.role === 'ketua'}
                          isLocked={contractLocked}
                          lockedAt={contractLocked ? new Date().toISOString() : null}
                          contractDeadline={contractDeadline}
                          members={contractMembers}
                          tasks={contractTasks}
                          currentUserId={user?.id ?? ''}
                          onProceedToActiveRoom={() => {
                            setContractLocked(true);
                            setToastMessage('Kontrak terkunci! Beralih ke papan tugas.');
                          }}
                          onAddTask={async (newTask) => {
                            try {
                              await createTask({
                                roomId: activeRoom.id,
                                judul: newTask.judul,
                                deskripsi: newTask.deskripsi || undefined,
                                poin: newTask.poin,
                                dueDate: newTask.dueDate || undefined,
                              });
                              const item: ContractTaskItem = {
                                ...newTask,
                                id: `db-${Date.now()}`,
                                status: 'open',
                                postLockPending: !!newTask.postLockPending,
                                postLockVotes: newTask.postLockPending ? [] : undefined,
                              };
                              setContractTasks((prev) => [...prev, item]);
                              setToastMessage(
                                newTask.postLockPending ? 'Tugas diajukan ke anggota.' : 'Tugas masuk draf kontrak.'
                              );
                            } catch (err: unknown) {
                              setToastMessage(err instanceof Error ? err.message : 'Gagal menambah tugas.');
                            }
                          }}
                          onEditTask={async (taskId, updates) => {
                            const dbId = taskId.startsWith('db-') ? null : taskId;
                            try {
                              if (dbId) {
                                await updateTask(dbId, {
                                  judul: updates.judul,
                                  deskripsi: updates.deskripsi || undefined,
                                  poin: updates.poin,
                                  dueDate: updates.dueDate || undefined,
                                });
                              }
                              setContractTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
                              setToastMessage('Tugas diperbarui.');
                            } catch (err: unknown) {
                              setToastMessage(err instanceof Error ? err.message : 'Gagal mengubah tugas.');
                            }
                          }}
                          onDeleteTask={async (taskId) => {
                            const dbId = taskId.startsWith('db-') ? null : taskId;
                            try {
                              if (dbId) await deleteTask(dbId);
                              setContractTasks((prev) => prev.filter((t) => t.id !== taskId));
                              setToastMessage('Tugas dihapus dari kontrak.');
                            } catch (err: unknown) {
                              setToastMessage(err instanceof Error ? err.message : 'Gagal menghapus tugas.');
                            }
                          }}
                          onSubmitContract={async () => {
                            try {
                              const res = (await submitContract(activeRoom.id)) as { contract_deadline?: string };
                              const dl = res?.contract_deadline ?? new Date(Date.now() + 24 * 3600 * 1000).toISOString();
                              setContractDeadline(dl);
                              setToastMessage('Kontrak diajukan! Batas 24 jam dimulai.');
                            } catch (err: unknown) {
                              setToastMessage(err instanceof Error ? err.message : 'Gagal mengajukan kontrak.');
                            }
                          }}
                          onVoteContract={async (agree, note) => {
                            try {
                              const res = (await voteContract(activeRoom.id, agree, note || undefined)) as { locked?: boolean };
                              setContractMembers((prev) =>
                                prev.map((m) =>
                                  m.id === user?.id
                                    ? { ...m, contractVote: agree ? 'agree' : 'request_changes', contractVoteNote: note || null }
                                    : m
                                )
                              );
                              if (res?.locked) {
                                setContractLocked(true);
                                setToastMessage('Semua setuju — kontrak resmi terkunci!');
                              } else {
                                setToastMessage(agree ? 'Persetujuan tercatat.' : 'Catatan revisi dikirim.');
                              }
                            } catch (err: unknown) {
                              setToastMessage(err instanceof Error ? err.message : 'Gagal mencatat suara.');
                            }
                          }}
                          onVotePostLockTask={(taskId, agree) => {
                            setContractTasks((prev) =>
                              agree
                                ? prev.map((t) => (t.id === taskId ? { ...t, postLockPending: false } : t))
                                : prev.filter((t) => t.id !== taskId)
                            );
                            setToastMessage(agree ? 'Tugas pasca-lock disetujui.' : 'Tugas pasca-lock ditolak.');
                          }}
                          onAutoLockTrigger={async () => {
                            try {
                              await autoLock(activeRoom.id);
                            } catch {
                              // diam — auto lock hanya upaya terbaik
                            }
                            setContractLocked(true);
                            setContractDeadline(null);
                            setToastMessage('Waktu 24 jam habis: kontrak terkunci otomatis.');
                          }}
                        />
                      }
                    />
                  ) : (
                    <div className="mx-auto w-full max-w-[1040px] px-5 pt-10">
                      <div className="grid gap-3 border border-dashed border-[var(--c2)] rounded-[18px] py-12 text-center">
                        <p className="text-sm text-[var(--c3)]">Belum ada ruangan aktif.</p>
                        <p className="text-xs font-[family-name:var(--font-geist-mono)] text-[var(--c3)]">
                          Pilih ruangan dari dashboard terlebih dahulu.
                        </p>
                      </div>
                    </div>
                  ))}

                {displayedView === 'laporan' && (
                  <div className="mx-auto w-full max-w-[860px] px-5 pt-8">
                    <DossierReport initialData={reportData} onBack={() => setCurrentView('dashboard')} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppDock loggedIn={!!user} current={currentView} onNavigate={setCurrentView} />

      {/* Modal nama panggilan */}
      <Modal isOpen={nameModalOpen} onClose={() => setNameModalOpen(false)} title="Nama Panggilan">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveName();
          }}
          className="grid gap-4"
        >
          <p className="-mt-1 text-[13px] text-[var(--c3)]">
            Nama ini yang tampil di ruangan tim, kontrak, dan laporan.
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
          <div className="flex justify-end gap-2">
            <Btn type="button" variant="ghost" onClick={() => setNameModalOpen(false)} className="min-h-[38px] cursor-pointer px-4 text-xs">
              Nanti saja
            </Btn>
            <Btn type="button" onClick={handleSaveName} loading={savingName} className="min-h-[38px] cursor-pointer px-5 text-xs">
              Simpan
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal gabung ruangan */}
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
            const joined = dashboardRooms.find((r) => r.id === res.room_id);
            openRoom({
              id: res.room_id,
              nama: res.nama,
              kode: code.toUpperCase(),
              role: joined?.role === 'ketua' ? 'ketua' : 'anggota',
            });
          } catch (err: unknown) {
            setToastMessage(err instanceof Error ? err.message : 'Gagal masuk ruangan.');
          }
        }}
      />

      {/* Modal buat ruangan */}
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
            setToastMessage(`Ruangan "${newRoom.nama}" dibuat! Kode: ${newRoom.kode}`);
            openRoom({ id: newRoom.id, nama: newRoom.nama, kode: newRoom.kode, role: 'ketua' });
          } catch (err: unknown) {
            setToastMessage(err instanceof Error ? err.message : 'Gagal membuat ruangan.');
          }
        }}
      />

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
}

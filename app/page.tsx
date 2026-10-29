'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LandingView } from './views/LandingView';
import {
  getUserDashboardData,
  createRoom,
  joinRoom,
  takeTask,
  releaseTask,
  submitProof,
  castVote,
  createTask,
} from '@/lib/api/fairworks';

type ViewMode = 'landing' | 'auth' | 'dashboard' | 'team';

export default function Home() {
  const [view, setView] = useState<ViewMode>('landing');
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Pengguna');

  // Dashboard Data from Supabase
  const [rooms, setRooms] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);
  const [activeRoomData, setActiveRoomData] = useState<any>(null);
  const [selectedMe, setSelectedMe] = useState<string>('');
  const [tab, setTab] = useState<'all' | 'review' | 'doing' | 'open' | 'done'>('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  // UI helpers
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    type: 'createRoom' | 'joinRoom' | 'addTask' | 'submitProof' | 'revise' | null;
    task?: any;
  }>({ type: null });

  // Form states
  const [inputRoomName, setInputRoomName] = useState('');
  const [inputJoinCode, setInputJoinCode] = useState('');
  const [inputTaskTitle, setInputTaskTitle] = useState('');
  const [inputTaskDesc, setInputTaskDesc] = useState('');
  const [inputTaskPoints, setInputTaskPoints] = useState('10');
  const [inputTaskDue, setInputTaskDue] = useState('');
  const [inputTaskAssignee, setInputTaskAssignee] = useState('');
  const [inputProofNote, setInputProofNote] = useState('');
  const [inputProofLink, setInputProofLink] = useState('');
  const [inputReviseNote, setInputReviseNote] = useState('');
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Line background canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Show toast utility
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  /* ------------------------------------------------------------------
     1. BACKGROUND ENGINE (Kurva Bezier 2.4s Lerp Morph Persis ruang-tim.html)
     ------------------------------------------------------------------ */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const ease = (p: number) => p * p * p * (p * (p * 6 - 15) + 10);
    const M = 48;
    let L = 26;
    let W = 0, H = 0, DPR = 1, capDPR = 1.5;
    let F = new Float32Array(0), T = new Float32Array(0), R = new Float32Array(0), D = new Float32Array(0);
    let cur: ViewMode = view;
    let tr = 1, tStart = 0, t0 = 0, raf = 0, last = 0, slow = 0;
    let mx = 0, my = 0, act = 0, want = 0, px = 0, py = 0, tpx = 0, tpy = 0, ex = 0, ey = 0;

    const ev = (n: ViewMode, i: number, j: number, t: number) => {
      const u = j / (M - 1), q = i / (L - 1), m = Math.min(W, H);
      const bx = (u * 1.2 - 0.1) * W;
      const by =
        H * (0.1 + 0.8 * q) +
        Math.sin(u * 5 + t * 0.5 + i * 0.19) * H * 0.05 * (0.6 + 0.4 * Math.sin(i * 0.31 + t * 0.2)) +
        Math.sin(u * 12 - t * 0.35 + i * 0.4) * H * 0.012;

      if (n === 'landing') { ex = bx; ey = by; return; }
      if (n === 'auth') {
        const dx = bx - W / 2, dy = by - H / 2;
        const d = Math.sqrt(dx * dx + dy * dy) / (m * 0.46);
        const th = (3.4 + 0.5 * Math.sin(t * 0.4)) * Math.exp(-d * d);
        const c = Math.cos(th), sn = Math.sin(th);
        ex = W / 2 + dx * c - dy * sn;
        ey = H / 2 + dx * sn + dy * c;
        return;
      }
      if (n === 'dashboard') {
        const d = (u - ((t * 0.09) % 1.5 - 0.25)) / 0.13;
        ex = bx;
        ey =
          H / 2 +
          (q - 0.5) * H * 0.88 * (0.78 * Math.cos(u * 3.8 + t * 0.42) + 0.22 * Math.cos(u * 8 - t * 0.3 + q * 1.5)) +
          Math.sin(u * 2.2 + q * 2.4 + t * 0.3) * H * 0.07 -
          H * 0.24 * Math.exp(-d * d) * Math.sin(q * 3.1416);
        return;
      }
      // team
      const y0 = H / 2 + (by - H / 2) * (0.22 + 0.78 * Math.pow(Math.abs(u - 0.5) * 2, 1.4));
      ex = bx;
      ey = y0 + Math.sin(u * 6.2832 + q * 4 + t * 0.4) * H * 0.03;
    };

    const fill = (A: Float32Array, n: ViewMode, t: number) => {
      for (let i = 0; i < L; i++) {
        for (let j = 0; j < M; j++) {
          ev(n, i, j, t);
          const k = (i * M + j) * 2;
          A[k] = ex;
          A[k + 1] = ey;
        }
      }
    };

    const layout = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      L = window.innerWidth < 640 ? 18 : 26;
      DPR = Math.min(window.devicePixelRatio || 1, capDPR);
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      F = new Float32Array(L * M * 2);
      T = new Float32Array(L * M * 2);
      R = new Float32Array(L * M * 2);
      D = new Float32Array(L * M * 2);
      fill(R, cur, 0);
      tr = 1;
    };

    const draw = (t: number) => {
      const rad = Math.max(120, Math.min(W, H) * 0.2);
      for (let k = 0; k < D.length; k += 2) {
        D[k] = R[k];
        D[k + 1] = R[k + 1];
        if (act > 0.01) {
          const dx = D[k] - mx, dy = D[k + 1] - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < rad && d > 0.1) {
            let pw = 1 - d / rad;
            pw = pw * pw * 46 * act;
            D[k] += (dx / d) * pw;
            D[k + 1] += (dy / d) * pw;
          }
        }
      }

      ctx.setTransform(DPR, 0, 0, DPR, px * DPR, py * DPR);
      ctx.clearRect(-60, -60, W + 120, H + 120);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgb(232,232,236)';

      const AL = [0.1, 0.24, 0.15, 0.3];
      const LW = [0.8, 1.2, 0.9, 1.3];
      for (let gi = 0; gi < 4; gi++) {
        ctx.globalAlpha = AL[gi];
        ctx.lineWidth = LW[gi];
        ctx.beginPath();
        for (let i = gi; i < L; i += 4) {
          const k = i * M * 2;
          ctx.moveTo(D[k], D[k + 1]);
          for (let j = 1; j < M - 1; j++) {
            const a = k + j * 2;
            const b = a + 2;
            ctx.quadraticCurveTo(D[a], D[a + 1], (D[a] + D[b]) / 2, (D[a + 1] + D[b + 1]) / 2);
          }
          ctx.lineTo(D[k + (M - 1) * 2], D[k + (M - 1) * 2 + 1]);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const step = (now: number, t: number) => {
      if (!reduce) {
        act += ((want ? 1 : 0) - act) * 0.06;
        px += (tpx - px) * 0.05;
        py += (tpy - py) * 0.05;
      }
      fill(T, cur, t);
      if (tr < 1) {
        const p = Math.max(0, Math.min(1, (now - tStart) / 2400));
        const e = ease(p);
        for (let k = 0; k < R.length; k++) R[k] = F[k] + (T[k] - F[k]) * e;
        if (p >= 1) tr = 1;
      } else {
        R.set(T);
      }
      draw(t);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!t0) t0 = now;
      if (last) {
        slow = now - last > 38 ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 45 && capDPR > 1) {
          capDPR = 1;
          slow = 0;
          layout();
        }
      }
      last = now;
      step(now, (now - t0) / 1800);
    };

    layout();
    if (reduce) step(0, 2);
    else raf = requestAnimationFrame(frame);

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      want = 1;
      tpx = (e.clientX - W / 2) * 0.03;
      tpy = (e.clientY - H / 2) * 0.03;
    };
    const onLeave = () => { want = 0; tpx = tpy = 0; };
    const onResize = () => { layout(); if (reduce) step(0, 2); };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);

    // Dynamic morphing bridge
    (cv as any)._setMood = (nextView: ViewMode) => {
      if (nextView === cur) return;
      if (!reduce) {
        F.set(R);
        tr = 0;
        tStart = performance.now();
      } else {
        tr = 1;
      }
      cur = nextView;
      if (reduce) step(0, 2);
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Sinkronisasi view ke canvas engine
  useEffect(() => {
    const cv = canvasRef.current;
    if (cv && (cv as any)._setMood) {
      (cv as any)._setMood(view);
    }
  }, [view]);

  /* ------------------------------------------------------------------
     2. SUPABASE AUTH & DATA FETCHING
     ------------------------------------------------------------------ */
  const loadDashboard = useCallback(async () => {
    try {
      const res = await getUserDashboardData();
      if (!res) return;
      const dName = res.user.nama || res.user.email?.split('@')[0] || 'Pengguna';
      setUserName(dName);
      setSelectedMe(res.user.id);

      const rawRooms = (res.rooms ?? []) as any[];
      const rIds = rawRooms.map((r) => r.rooms.id);
      const sb = createClient();

      const [tasksRes, membersRes] = await Promise.all([
        rIds.length ? sb.from('tasks').select('*').in('room_id', rIds) : { data: [] },
        rIds.length ? sb.from('room_members').select('*, profiles(nama, email)').in('room_id', rIds) : { data: [] },
      ]);

      const allTasks = tasksRes.data ?? [];
      const allMembers = membersRes.data ?? [];

      const mapped = rawRooms.map((r, i) => {
        const rTasks = allTasks.filter((t: any) => t.room_id === r.rooms.id);
        const rMems = allMembers.filter((m: any) => m.room_id === r.rooms.id).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.nama || m.profiles?.email?.split('@')[0] || 'Anggota',
          lead: m.peran === 'ketua',
        }));

        const totalPts = rTasks.reduce((s: number, t: any) => s + (t.poin || 0), 0);
        const donePts = rTasks.filter((t: any) => t.status === 'done').reduce((s: number, t: any) => s + (t.poin || 0), 0);
        const reviewPts = rTasks.filter((t: any) => t.status === 'review').reduce((s: number, t: any) => s + (t.poin || 0), 0);
        const doingPts = rTasks.filter((t: any) => t.status === 'doing').reduce((s: number, t: any) => s + (t.poin || 0), 0);
        const openPts = rTasks.filter((t: any) => t.status === 'open').reduce((s: number, t: any) => s + (t.poin || 0), 0);

        return {
          id: r.rooms.id,
          name: r.rooms.nama,
          code: r.rooms.kode,
          role: r.peran,
          members: rMems,
          tasks: rTasks.map((t: any) => ({
            id: t.id,
            title: t.judul,
            desc: t.deskripsi,
            points: t.poin,
            due: t.due_date || new Date().toISOString().slice(0, 10),
            assignee: t.assignee_id,
            status: t.status,
            submit: t.submit_link || t.submit_note ? { link: t.submit_link, note: t.submit_note } : null,
            revNote: t.revision_note,
            votes: {},
          })),
          stats: {
            total: totalPts,
            done: donePts,
            review: reviewPts,
            doing: doingPts,
            open: openPts,
            pct: totalPts ? Math.round((donePts / totalPts) * 100) : 0,
          },
          log: [],
        };
      });

      setRooms(mapped);

      // Filter my tasks
      const mineList = allTasks
        .filter((t: any) => t.assignee_id === res.user.id && (t.status === 'doing' || t.status === 'review'))
        .map((t: any) => {
          const parentRoom = mapped.find((rm: any) => rm.id === t.room_id);
          return {
            t: {
              id: t.id,
              title: t.judul,
              points: t.poin,
              due: t.due_date || new Date().toISOString().slice(0, 10),
              status: t.status,
            },
            r: parentRoom || { name: 'Ruangan' },
            roomIndex: mapped.findIndex((rm: any) => rm.id === t.room_id),
          };
        });
      setMyTasks(mineList);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadDashboard();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        if (event === 'SIGNED_IN') setView('dashboard');
        loadDashboard();
      } else {
        setUserName('Pengguna');
        setRooms([]);
        setMyTasks([]);
        setView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadDashboard]);

  // Active room data lookup
  const currentRoom = useMemo(() => {
    if (!rooms.length || activeRoomIndex < 0 || activeRoomIndex >= rooms.length) return null;
    return rooms[activeRoomIndex];
  }, [rooms, activeRoomIndex]);

  // Auth Google Login
  const handleGoogleLogin = async () => {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
    } catch (err: any) {
      showToast(err.message || 'Gagal login Google');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setView('landing');
    showToast('Telah keluar dari akun');
  };

  // Navigasi go
  const go = (targetView: ViewMode, roomIdx?: number) => {
    if (roomIdx !== undefined) setActiveRoomIndex(roomIdx);
    setView(targetView);
  };

  /* ------------------------------------------------------------------
     3. AKSI ROOM & TASK
     ------------------------------------------------------------------ */
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomName.trim()) {
      setFormErr('Isi nama ruangan dulu.');
      return;
    }
    setBusy(true);
    setFormErr('');
    try {
      const res: any = await createRoom(inputRoomName.trim());
      setModalState({ type: null });
      setInputRoomName('');
      await loadDashboard();
      showToast(`Ruangan dibuat. Kode: ${res?.kode || ''}`);
      setView('dashboard');
    } catch (err: any) {
      setFormErr(err.message || 'Gagal membuat ruangan.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = inputJoinCode.trim().toUpperCase();
    if (!c) {
      setFormErr('Kode tidak boleh kosong.');
      return;
    }
    setBusy(true);
    setFormErr('');
    try {
      await joinRoom(c);
      setModalState({ type: null });
      setInputJoinCode('');
      await loadDashboard();
      showToast('Berhasil bergabung ke ruangan');
      setView('dashboard');
    } catch (err: any) {
      setFormErr(err.message || 'Kode ruangan tidak ditemukan.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;
    if (!inputTaskTitle.trim()) {
      setFormErr('Isi nama tugas dulu.');
      return;
    }
    const pts = parseInt(inputTaskPoints, 10);
    if (!pts || pts < 1) {
      setFormErr('Poin minimal 1.');
      return;
    }
    setBusy(true);
    setFormErr('');
    try {
      await createTask({
        roomId: currentRoom.id,
        judul: inputTaskTitle.trim(),
        deskripsi: inputTaskDesc.trim(),
        poin: pts,
        dueDate: inputTaskDue || undefined,
      });
      setModalState({ type: null });
      setInputTaskTitle('');
      setInputTaskDesc('');
      setInputTaskPoints('10');
      setInputTaskDue('');
      await loadDashboard();
      showToast('Tugas ditambahkan');
    } catch (err: any) {
      setFormErr(err.message || 'Gagal menambahkan tugas.');
    } finally {
      setBusy(false);
    }
  };

  const handleTakeTask = async (taskId: string) => {
    setBusy(true);
    try {
      await takeTask(taskId);
      await loadDashboard();
      showToast('Tugas jadi milik Anda.');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengambil tugas.');
    } finally {
      setBusy(false);
    }
  };

  const handleReleaseTask = async (taskId: string) => {
    setBusy(true);
    try {
      await releaseTask(taskId);
      await loadDashboard();
      showToast('Tugas dilepas.');
    } catch (err: any) {
      showToast(err.message || 'Gagal melepas tugas.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalState.task) return;
    setBusy(true);
    setFormErr('');
    try {
      await submitProof(modalState.task.id, inputProofLink.trim(), inputProofNote.trim());
      setModalState({ type: null });
      setInputProofLink('');
      setInputProofNote('');
      await loadDashboard();
      showToast('Hasil terkirim. Menunggu persetujuan kelompok.');
    } catch (err: any) {
      setFormErr(err.message || 'Gagal mengirim bukti hasil.');
    } finally {
      setBusy(false);
    }
  };

  const handleVote = async (taskId: string, vote: 'ok' | 'revisi', note?: string) => {
    setBusy(true);
    try {
      await castVote(taskId, vote, note);
      await loadDashboard();
      showToast(vote === 'ok' ? 'Disetujui.' : 'Catatan revisi terkirim.');
    } catch (err: any) {
      showToast(err.message || 'Gagal memberikan suara.');
    } finally {
      setBusy(false);
    }
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Kode ruangan ${code} disalin`);
  };

  /* ------------------------------------------------------------------
     4. RENDER ICONS & LABELS
     ------------------------------------------------------------------ */
  const renderIcon = (st: string) => {
    if (st === 'done') {
      return (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" style={{ fill: 'var(--c4)' }} />
          <path d="M8 12.4l2.8 2.8L16.2 9.6" style={{ stroke: 'var(--c0)' }} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (st === 'review') {
      return (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3" />
          <path d="M12 7.5V12l3 2" strokeLinecap="round" />
        </svg>
      );
    }
    if (st === 'doing') {
      return (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" style={{ fill: 'var(--c4)' }} />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" strokeDasharray="1.5 3.5" strokeLinecap="round" />
      </svg>
    );
  };

  const getStatusLabel = (st: string) => {
    switch (st) {
      case 'done': return 'Selesai';
      case 'review': return 'Perlu disetujui';
      case 'doing': return 'Dikerjakan';
      default: return 'Bisa diambil';
    }
  };

  const formatDue = (dateStr: string) => {
    if (!dateStr) return '';
    const diffDays = Math.round((new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5);
    if (diffDays < 0) return `terlambat ${-diffDays} hari`;
    if (diffDays === 0) return 'hari ini';
    if (diffDays === 1) return 'besok';
    return `${diffDays} hari lagi`;
  };

  return (
    <>
      <canvas ref={canvasRef} id="bg-canvas" className="bg-canvas" aria-hidden="true" />

      {/* Top Header */}
      <header className="top on" id="top">
        <div className="wrap bar0">
          <button className="brand" type="button" onClick={() => go(user ? 'dashboard' : 'landing')}>
            <i />
            Ruang Tim
          </button>
          <div className="topr">
            {user ? (
              <>
                <span className="user">
                  <i>{userName.charAt(0).toUpperCase()}</i>
                  {userName}
                </span>
                <button className="btn text" type="button" onClick={handleLogout}>
                  Keluar
                </button>
              </>
            ) : view === 'auth' ? (
              <button className="btn text" type="button" onClick={() => go('landing')}>
                Kembali
              </button>
            ) : (
              <>
                <button className="btn text" type="button" onClick={() => go('auth')}>
                  Masuk
                </button>
                <button className="btn solid sm" type="button" onClick={() => go('auth')}>
                  Mulai
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Scroller Stage */}
      <main className="scroll" id="scroll">
        <div className="stage">
          {/* VIEW: LANDING */}
          {view === 'landing' && (
            <section className="view in" id="v-landing">
              <LandingView onStart={() => go(user ? 'dashboard' : 'auth')} />
            </section>
          )}

          {/* VIEW: AUTH */}
          {view === 'auth' && (
            <section className="view in" id="v-auth">
              <div className="wrap authwrap">
                <div className="authform">
                  <h1 data-s>Masuk ke Ruang Tim</h1>
                  <p className="muted" data-s style={{ marginTop: -8 }}>
                    Lanjutkan ke ruangan kelompok Anda dengan akun Google terverifikasi.
                  </p>
                  <button
                    className="btn solid lg full"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={busy}
                    data-s
                  >
                    <span>Masuk dengan Google</span>
                  </button>
                  <p className="fine" data-s>
                    Otentikasi aman via Google OAuth Supabase. Profil dan ruangan Anda otomatis tersinkronisasi.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* VIEW: DASHBOARD */}
          {view === 'dashboard' && (
            <section className="view in" id="v-dashboard">
              <div className="wrap page">
                <div className="phead" data-s>
                  <div>
                    <h1>Ruangan Anda</h1>
                    <p className="sub">
                      {rooms.length} ruangan aktif {myTasks.length ? `· ${myTasks.length} tugas Anda sedang berjalan` : ''}
                    </p>
                  </div>
                  <div className="pact">
                    <button className="btn" type="button" onClick={() => setModalState({ type: 'joinRoom' })}>
                      Gabung dengan kode
                    </button>
                    <button className="btn solid" type="button" onClick={() => setModalState({ type: 'createRoom' })}>
                      Buat ruangan
                    </button>
                  </div>
                </div>

                <div className="cols">
                  <section data-s>
                    <div className="rlist">
                      {rooms.length > 0 ? (
                        rooms.map((r, i) => (
                          <button
                            key={r.id}
                            className="rrow"
                            type="button"
                            onClick={() => go('team', i)}
                          >
                            <span className="rname">
                              <b>{r.name}</b>
                              <small>
                                {r.members.length} anggota · {r.tasks.filter((t: any) => t.status !== 'done').length} tugas belum selesai · {r.code}
                              </small>
                            </span>
                            <span className="rprog">
                              <span className="bar">
                                <i style={{ width: `${r.stats.pct}%` }} />
                              </span>
                              <em>{r.stats.pct}%</em>
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="empty">
                          <h3>Belum ada ruangan</h3>
                          <p>Buat ruangan baru atau gabung ke ruangan teman dengan kode.</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <aside data-s>
                    <h2>Tugas Anda</h2>
                    <div>
                      {myTasks.length > 0 ? (
                        myTasks.map((x, idx) => (
                          <button
                            key={idx}
                            className="mrow2"
                            type="button"
                            onClick={() => go('team', x.roomIndex)}
                          >
                            <b>{x.t.title}</b>
                            <small className={x.t.status === 'doing' && formatDue(x.t.due).includes('terlambat') ? 'late' : ''}>
                              {x.r.name} · {x.t.status === 'review' ? 'menunggu persetujuan' : formatDue(x.t.due)}
                            </small>
                          </button>
                        ))
                      ) : (
                        <p className="muted">Tidak ada tugas yang sedang berjalan.</p>
                      )}
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          )}

          {/* VIEW: TEAM ROOM */}
          {view === 'team' && currentRoom && (
            <section className="view in" id="v-team">
              <div className="wrap page">
                <nav className="crumb" data-s aria-label="Lokasi">
                  <button className="lnk" type="button" onClick={() => go('dashboard')}>
                    Ruangan
                  </button>
                  <span aria-hidden="true">/</span>
                  <span>{currentRoom.name}</span>
                </nav>

                <div className="phead" data-s>
                  <div>
                    <h1>{currentRoom.name}</h1>
                    <p className="sub">
                      {currentRoom.members.length} anggota ·{' '}
                      {currentRoom.role === 'ketua' ? 'Anda ketua' : 'Anda anggota'} · Kode{' '}
                      <button
                        className="code"
                        type="button"
                        onClick={() => copyRoomCode(currentRoom.code)}
                      >
                        {currentRoom.code}
                      </button>
                    </p>
                  </div>
                  <div className="pact">
                    <button
                      className="btn solid"
                      type="button"
                      onClick={() => setModalState({ type: 'addTask' })}
                    >
                      Tambah tugas
                    </button>
                  </div>
                </div>

                {/* Ringkasan Poin & Progress Bar Multi-Segment */}
                <div className="sum" data-s>
                  <div className="pct">
                    {currentRoom.stats.pct}
                    <small>%</small>
                  </div>
                  <div>
                    <p>
                      <b>{currentRoom.stats.done}</b> dari <b>{currentRoom.stats.total}</b> poin sudah disetujui
                      {currentRoom.stats.review > 0 && ` · ${currentRoom.stats.review} poin menunggu persetujuan`}
                    </p>
                    <div className="track">
                      <i
                        className="seg done"
                        style={{
                          width: `${currentRoom.stats.total ? (currentRoom.stats.done / currentRoom.stats.total) * 100 : 0}%`,
                        }}
                      />
                      <i
                        className="seg review"
                        style={{
                          width: `${currentRoom.stats.total ? (currentRoom.stats.review / currentRoom.stats.total) * 100 : 0}%`,
                        }}
                      />
                      <i
                        className="seg doing"
                        style={{
                          width: `${currentRoom.stats.total ? (currentRoom.stats.doing / currentRoom.stats.total) * 100 : 0}%`,
                        }}
                      />
                      <i
                        className="seg open"
                        style={{
                          width: `${currentRoom.stats.total ? (currentRoom.stats.open / currentRoom.stats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="legend">
                      <span><i className="d" />Disetujui</span>
                      <span><i className="r" />Perlu disetujui</span>
                      <span><i className="g" />Dikerjakan</span>
                      <span><i />Belum diambil</span>
                    </div>
                  </div>
                </div>

                <div className="cols">
                  {/* Kolom Kiri: Tab & List Tugas */}
                  <section data-s aria-label="Daftar tugas">
                    <div className="tabs" role="tablist">
                      {[
                        ['all', 'Semua'],
                        ['review', 'Perlu disetujui'],
                        ['doing', 'Dikerjakan'],
                        ['open', 'Bisa diambil'],
                        ['done', 'Selesai'],
                      ].map(([k, label]) => {
                        const cnt =
                          k === 'all'
                            ? currentRoom.tasks.length
                            : currentRoom.tasks.filter((t: any) => t.status === k).length;
                        return (
                          <button
                            key={k}
                            type="button"
                            role="tab"
                            aria-selected={tab === k}
                            onClick={() => setTab(k as any)}
                          >
                            {label}
                            <em>{cnt}</em>
                          </button>
                        );
                      })}
                    </div>

                    <div className="tlist">
                      {currentRoom.tasks
                        .filter((t: any) => tab === 'all' || t.status === tab)
                        .map((t: any) => {
                          const isOpen = !!openIds[t.id];
                          const isMyTask = t.assignee === user?.id;
                          const assigneeMember = currentRoom.members.find((m: any) => m.id === t.assignee);
                          const who = assigneeMember ? (isMyTask ? `${assigneeMember.name} (Anda)` : assigneeMember.name) : 'Belum ada yang mengambil';

                          return (
                            <article key={t.id} className={`trow ${isOpen ? 'open' : ''}`}>
                              <div className="tmain">
                                <span className={`sti st-${t.status}`}>
                                  {renderIcon(t.status)}
                                </span>
                                <button
                                  className="ttl"
                                  type="button"
                                  onClick={() => setOpenIds((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
                                  aria-expanded={isOpen}
                                >
                                  <h3>{t.title}</h3>
                                  <p className="tmeta">
                                    <span className="stl">{getStatusLabel(t.status)}</span> · {who} · {t.points} poin · {formatDue(t.due)}
                                  </p>
                                </button>
                                <div className="tact">
                                  {t.status === 'doing' && isMyTask && (
                                    <button
                                      className="btn solid sm"
                                      type="button"
                                      onClick={() => setModalState({ type: 'submitProof', task: t })}
                                    >
                                      Kirim hasil
                                    </button>
                                  )}
                                  {(t.status === 'open' || (t.status === 'doing' && !isMyTask && formatDue(t.due).includes('terlambat'))) && (
                                    <button
                                      className="btn solid sm"
                                      type="button"
                                      onClick={() => handleTakeTask(t.id)}
                                    >
                                      {t.status === 'open' ? 'Ambil' : 'Ambil alih'}
                                    </button>
                                  )}
                                  {t.status === 'review' && !isMyTask && (
                                    <>
                                      <button
                                        className="btn solid sm"
                                        type="button"
                                        onClick={() => handleVote(t.id, 'ok')}
                                      >
                                        Setujui
                                      </button>
                                      <button
                                        className="btn sm"
                                        type="button"
                                        onClick={() => setModalState({ type: 'revise', task: t })}
                                      >
                                        Minta revisi
                                      </button>
                                    </>
                                  )}
                                  {t.status === 'review' && isMyTask && (
                                    <span className="done-note">Menunggu persetujuan teman</span>
                                  )}
                                </div>
                              </div>

                              <div className="tmore">
                                <div className="tdet">
                                  {t.desc && <p>{t.desc}</p>}
                                  {t.submit && (
                                    <p className="nt">
                                      <b>Catatan pengirim:</b> {t.submit.note || '-'}{' '}
                                      {t.submit.link && (
                                        <a href={t.submit.link} target="_blank" rel="noreferrer" className="lnk ml-1">
                                          {t.submit.link}
                                        </a>
                                      )}
                                    </p>
                                  )}
                                  {t.revNote && (
                                    <p className="nt">
                                      <b>Perlu revisi:</b> {t.revNote}
                                    </p>
                                  )}
                                  {t.status === 'doing' && isMyTask && (
                                    <p>
                                      <button
                                        className="lnk"
                                        type="button"
                                        onClick={() => handleReleaseTask(t.id)}
                                      >
                                        Lepas tugas ini
                                      </button>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        })}
                    </div>
                  </section>

                  {/* Kolom Kanan: Anggota & Aktivitas */}
                  <aside data-s>
                    <h2>Anggota</h2>
                    <div id="ppl">
                      {currentRoom.members.map((m: any) => {
                        const mine = currentRoom.tasks.filter((t: any) => t.assignee === m.id);
                        const actCount = mine.filter((t: any) => t.status !== 'done').length;
                        const ptsDone = mine
                          .filter((t: any) => t.status === 'done')
                          .reduce((s: number, t: any) => s + t.points, 0);
                        const pctDone = currentRoom.stats.total
                          ? Math.round((ptsDone / currentRoom.stats.total) * 100)
                          : 0;

                        return (
                          <div key={m.id} className="prow">
                            <span className={`av ${m.lead ? 'lead' : ''}`} aria-hidden="true">
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="pn">
                                {m.name} {m.id === user?.id ? '(Anda)' : ''}
                                {m.lead && <span className="role">Ketua</span>}
                              </div>
                              <small>{actCount} tugas aktif</small>
                              <span className="bar">
                                <i style={{ width: `${pctDone}%` }} />
                              </span>
                            </div>
                            <b className="pp">{ptsDone} poin</b>
                          </div>
                        );
                      })}
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* MODAL DIALOGS */}
      {modalState.type && (
        <div className="ov" onClick={(e) => { if (e.target === e.currentTarget) setModalState({ type: null }); }}>
          <div className="modal" role="dialog" aria-modal="true">
            {/* Modal: Buat Ruangan */}
            {modalState.type === 'createRoom' && (
              <form onSubmit={handleCreateRoom} noValidate>
                <h2>Buat ruangan</h2>
                <p className="sub">Anda jadi ketua. Teman bergabung lewat kode.</p>
                <label className="fld">
                  Nama ruangan
                  <input
                    value={inputRoomName}
                    onChange={(e) => setInputRoomName(e.target.value)}
                    maxLength={40}
                    placeholder="Contoh: Tugas Besar Statistika"
                    autoFocus
                  />
                </label>
                {formErr && <div className="err on">{formErr}</div>}
                <div className="mact">
                  <button className="btn text" type="button" onClick={() => setModalState({ type: null })}>
                    Batal
                  </button>
                  <button className="btn solid" type="submit" disabled={busy}>
                    {busy ? 'Menyimpan...' : 'Buat ruangan'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Gabung dengan Kode */}
            {modalState.type === 'joinRoom' && (
              <form onSubmit={handleJoinRoom} noValidate>
                <h2>Gabung dengan kode</h2>
                <p className="sub">Masukkan kode ruangan yang diberikan ketua kelompok.</p>
                <label className="fld">
                  Kode ruangan
                  <input
                    value={inputJoinCode}
                    onChange={(e) => setInputJoinCode(e.target.value)}
                    maxLength={7}
                    placeholder="ABC-123"
                    autoCapitalize="characters"
                    autoFocus
                  />
                </label>
                {formErr && <div className="err on">{formErr}</div>}
                <div className="mact">
                  <button className="btn text" type="button" onClick={() => setModalState({ type: null })}>
                    Batal
                  </button>
                  <button className="btn solid" type="submit" disabled={busy}>
                    {busy ? 'Memeriksa...' : 'Gabung'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Tambah Tugas */}
            {modalState.type === 'addTask' && (
              <form onSubmit={handleAddTask} noValidate>
                <h2>Tambah tugas</h2>
                <p className="sub">Tiap tugas memiliki bobot poin dan tenggat waktu.</p>
                <label className="fld">
                  Nama tugas
                  <input
                    value={inputTaskTitle}
                    onChange={(e) => setInputTaskTitle(e.target.value)}
                    maxLength={60}
                    placeholder="Contoh: Susun tinjauan pustaka"
                    autoFocus
                  />
                </label>
                <label className="fld">
                  Keterangan (boleh dikosongkan)
                  <textarea
                    value={inputTaskDesc}
                    onChange={(e) => setInputTaskDesc(e.target.value)}
                    maxLength={200}
                  />
                </label>
                <div className="two">
                  <label className="fld">
                    Poin
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={inputTaskPoints}
                      onChange={(e) => setInputTaskPoints(e.target.value)}
                    />
                  </label>
                  <label className="fld">
                    Tenggat
                    <input
                      type="date"
                      value={inputTaskDue}
                      onChange={(e) => setInputTaskDue(e.target.value)}
                    />
                  </label>
                </div>
                {formErr && <div className="err on">{formErr}</div>}
                <div className="mact">
                  <button className="btn text" type="button" onClick={() => setModalState({ type: null })}>
                    Batal
                  </button>
                  <button className="btn solid" type="submit" disabled={busy}>
                    {busy ? 'Menyimpan...' : 'Tambah tugas'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Kirim Bukti Pengerjaan */}
            {modalState.type === 'submitProof' && modalState.task && (
              <form onSubmit={handleSubmitProof} noValidate>
                <h2>Kirim hasil</h2>
                <p className="sub">
                  {modalState.task.title}. Teman satu kelompok akan memeriksa sebelum poin dihitung.
                </p>
                <label className="fld">
                  Catatan untuk teman
                  <textarea
                    value={inputProofNote}
                    onChange={(e) => setInputProofNote(e.target.value)}
                    maxLength={240}
                    placeholder="Apa saja yang sudah dikerjakan?"
                    autoFocus
                  />
                </label>
                <label className="fld">
                  Tautan hasil (Google Drive / GitHub / Figma)
                  <input
                    value={inputProofLink}
                    onChange={(e) => setInputProofLink(e.target.value)}
                    maxLength={120}
                    placeholder="https://"
                  />
                </label>
                {formErr && <div className="err on">{formErr}</div>}
                <div className="mact">
                  <button className="btn text" type="button" onClick={() => setModalState({ type: null })}>
                    Batal
                  </button>
                  <button className="btn solid" type="submit" disabled={busy}>
                    {busy ? 'Mengirim...' : 'Kirim hasil'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Minta Revisi */}
            {modalState.type === 'revise' && modalState.task && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inputReviseNote.trim()) {
                    setFormErr('Tulis dulu bagian yang perlu diperbaiki.');
                    return;
                  }
                  handleVote(modalState.task.id, 'revisi', inputReviseNote.trim());
                  setModalState({ type: null });
                  setInputReviseNote('');
                }}
                noValidate
              >
                <h2>Minta revisi</h2>
                <p className="sub">{modalState.task.title}. Tulis bagian yang perlu diperbaiki.</p>
                <label className="fld">
                  Catatan revisi
                  <textarea
                    value={inputReviseNote}
                    onChange={(e) => setInputReviseNote(e.target.value)}
                    autoFocus
                  />
                </label>
                {formErr && <div className="err on">{formErr}</div>}
                <div className="mact">
                  <button className="btn text" type="button" onClick={() => setModalState({ type: null })}>
                    Batal
                  </button>
                  <button className="btn solid" type="submit" disabled={busy}>
                    Kirim catatan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dock Navigasi Cepat (Pratinjau) */}
      <nav className="proto" aria-label="Pratinjau halaman">
        <button
          type="button"
          aria-pressed={view === 'landing'}
          onClick={() => go('landing')}
        >
          Landing
        </button>
        <button
          type="button"
          aria-pressed={view === 'auth'}
          onClick={() => go('auth')}
        >
          Auth
        </button>
        <button
          type="button"
          aria-pressed={view === 'dashboard'}
          onClick={() => go('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          aria-pressed={view === 'team'}
          onClick={() => go('team', activeRoomIndex)}
        >
          Team Room
        </button>
      </nav>

      {/* Toast Notification */}
      <div className={`toast ${!toastMsg ? 'off' : ''}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </>
  );
}

'use client';

import React from 'react';
import { Modal, Field, Btn } from '../components/DesignSystem';
import { getRoomData, type RoomTask, type RoomMember, type RoomActivity } from '@/lib/api/fairworks';
import { ContributionPie } from '../components/Contributionpie';
import { TaskSkyline, type SkylineStatus } from '../components/Taskskyline';

interface RoomViewProps {
  roomId: string;
  roomName: string;
  roomCode: string;
  userId: string;
  isOwner: boolean;
  onToast: (msg: string) => void;
  onBack: () => void;
  /** Slot tab "Kontrak" dirender shell (state kontrak tinggal di page.tsx) */
  contractSlot: React.ReactNode;
  contractLocked: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Belum diambil',
  doing: 'Dikerjakan',
  review: 'Menunggu persetujuan',
  done: 'Disetujui',
};

const AKSI_MAP: Record<string, string> = {
  membuat_ruangan: 'membuat ruangan',
  bergabung: 'bergabung ke ruangan',
  mengajukan_kontrak: 'mengajukan kontrak',
  menyetujui_kontrak: 'menyetujui kontrak',
  minta_ubah_kontrak: 'meminta perubahan kontrak',
  kontrak_terkunci: 'kontrak terkunci',
  ambil_tugas: 'mengambil tugas',
  ambil_alih_tugas: 'mengambil alih tugas',
  kirim_bukti: 'mengirim bukti kerja',
  minta_revisi: 'meminta revisi',
  tugas_disetujui: 'tugas disetujui',
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function RoomView({
  roomId,
  roomName,
  roomCode,
  userId,
  isOwner,
  onToast,
  onBack,
  contractSlot,
  contractLocked,
}: RoomViewProps) {
  const [tasks, setTasks] = React.useState<RoomTask[]>([]);
  const [members, setMembers] = React.useState<RoomMember[]>([]);
  const [activities, setActivities] = React.useState<RoomActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<'semua' | 'open' | 'doing' | 'review' | 'done' | 'kontrak'>('semua');
  const [openRow, setOpenRow] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'daftar' | 'kota'>('daftar');

  // modal aksi
  const [proofTask, setProofTask] = React.useState<RoomTask | null>(null);
  const [proofLink, setProofLink] = React.useState('');
  const [proofNote, setProofNote] = React.useState('');
  const [reviseTask, setReviseTask] = React.useState<RoomTask | null>(null);
  const [reviseNote, setReviseNote] = React.useState('');
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);
  const [ntJudul, setNtJudul] = React.useState('');
  const [ntDesk, setNtDesk] = React.useState('');
  const [ntPoin, setNtPoin] = React.useState('10');
  const [ntDue, setNtDue] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const tabsRef = React.useRef<HTMLDivElement | null>(null);
  const [ink, setInk] = React.useState({ left: 0, width: 0 });

  const load = React.useCallback(async () => {
    try {
      const res = await getRoomData(roomId);
      setTasks(res.tasks);
      setMembers(res.members);
      setActivities(res.activities);
    } catch {
      onToast('Gagal memuat data ruangan.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  React.useEffect(() => {
    setLoading(true);
    setTab('semua');
    setOpenRow(null);
    load();
  }, [roomId, load]);

  // Posisi ink tab
  React.useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${tab}"]`);
    if (el) setInk({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab, loading]);

  const memberName = React.useCallback(
    (id: string | null) => members.find((m) => m.user_id === id)?.profiles?.nama ?? null,
    [members]
  );

  const stats = React.useMemo(() => {
    let total = 0,
      done = 0,
      review = 0,
      doing = 0;
    for (const t of tasks) {
      total += t.poin ?? 0;
      if (t.status === 'done') done += t.poin ?? 0;
      else if (t.status === 'review') review += t.poin ?? 0;
      else if (t.status === 'doing') doing += t.poin ?? 0;
    }
    return { total, done, review, doing, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const filtered = React.useMemo(() => {
    if (tab === 'semua' || tab === 'kontrak') return tasks;
    return tasks.filter((t) => t.status === tab);
  }, [tasks, tab]);

  // Data untuk Skyline: 1 gedung = 1 tugas (mengikuti tab yang sedang dipilih)
  const skylineTasks = React.useMemo(
    () =>
      filtered.map((t) => ({
        id: t.id,
        judul: t.judul,
        poin: t.poin ?? 0,
        status: t.status as SkylineStatus,
        assignee_name: memberName(t.assignee_id),
      })),
    [filtered, memberName]
  );

  // Data untuk donut kontribusi: poin tugas yang sudah disetujui per anggota
  const pieMembers = React.useMemo(() => {
    const pts = new Map<string, number>();
    for (const t of tasks) {
      if (t.status === 'done' && t.assignee_id) pts.set(t.assignee_id, (pts.get(t.assignee_id) ?? 0) + (t.poin ?? 0));
    }
    return members.map((m) => ({
      id: m.user_id,
      name: m.profiles?.nama ?? 'Anggota',
      role: m.peran === 'ketua' ? 'Ketua' : 'Anggota',
      points: pts.get(m.user_id) ?? 0,
      isCurrentUser: m.user_id === userId,
    }));
  }, [tasks, members, userId]);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
      onToast(okMsg);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Aksi gagal, coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      onToast(`Kode ${roomCode} tersalin.`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      onToast('Gagal menyalin kode.');
    }
  };

  const createTask = async () => {
    if (!ntJudul.trim()) return;
    setBusy(true);
    try {
      const { createTask: api } = await import('@/lib/api/fairworks');
      await api({
        roomId,
        judul: ntJudul,
        deskripsi: ntDesk || undefined,
        poin: Number(ntPoin) || 10,
        dueDate: ntDue || undefined,
      });
      setNewTaskOpen(false);
      setNtJudul('');
      setNtDesk('');
      setNtPoin('10');
      setNtDue('');
      await load();
      onToast('Tugas ditambahkan.');
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Gagal menambah tugas.');
    } finally {
      setBusy(false);
    }
  };

  const submitProof = async () => {
    if (!proofTask || !proofLink.trim()) return;
    await run(
      () =>
        import('@/lib/api/fairworks').then((m) =>
          m.submitProof(proofTask.id, proofLink.trim(), proofNote.trim() || undefined)
        ),
      'Bukti dikirim, menunggu persetujuan teman.'
    );
    setProofTask(null);
    setProofLink('');
    setProofNote('');
  };

  const castVote = async (t: RoomTask, vote: 'ok' | 'revisi', note?: string) => {
    await run(
      () => import('@/lib/api/fairworks').then((m) => m.castVote(t.id, vote, note)),
      vote === 'ok' ? 'Persetujuan tercatat.' : 'Revisi dikirim ke pemegang tugas.'
    );
    setReviseTask(null);
    setReviseNote('');
  };

  // Klik gedung di Skyline: balik ke daftar, buka rincian tugasnya, scroll ke sana
  const openFromCity = (id: string) => {
    setViewMode('daftar');
    setOpenRow(id);
    window.setTimeout(() => {
      document.getElementById(`task-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const nowIso = Date.now();

  return (
    <div className="fw-stagger mx-auto w-full max-w-[1040px] px-5 pt-7">
      {/* Crumb */}
      <nav className="mb-3.5 flex items-center gap-2 text-[14px] text-[var(--c3)]" aria-label="Lokasi">
        <button onClick={onBack} className="lnk cursor-pointer bg-none p-0 text-[var(--c3)] underline decoration-[var(--c2)] underline-offset-4 hover:text-[var(--c4)]">
          Ruangan
        </button>
        <span aria-hidden>/</span>
        <span>{roomName}</span>
      </nav>

      {/* Kepala ruangan */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-geist-mono)] text-[12px] uppercase tracking-[0.1em] text-[var(--c3)]">
            <button
              onClick={copyCode}
              className="cursor-pointer rounded-md bg-[var(--c1)] px-2 py-0.5 text-[13px] tracking-[0.06em] text-[var(--c4)] transition-colors hover:bg-[var(--c2)]"
              title="Salin kode"
            >
              {copied ? 'Tersalin!' : roomCode}
            </button>
            <span>{contractLocked ? 'Kontrak terkunci' : 'Draf kontrak'}</span>
          </div>
          <h1 className="mt-3 truncate text-[clamp(26px,3.6vw,34px)] font-semibold tracking-[-0.025em]">{roomName}</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setNewTaskOpen(true)}
            className="btn solid cursor-pointer rounded-[10px] border border-[var(--c4)] bg-[var(--c4)] px-4 py-2 text-[14px] font-medium text-[var(--c0)] transition-all hover:brightness-110"
          >
            Tambah tugas
          </button>
        </div>
      </div>

      {/* Ringkasan progres */}
      <div className="mb-8 grid grid-cols-1 items-center gap-4 border-y border-[var(--c1)] py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-7">
        <div className="min-w-[2.3em] text-[56px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
          {stats.pct}
          <small className="ml-1 text-[22px] tracking-normal text-[var(--c3)]">%</small>
        </div>
        <div>
          <p className="text-[14.5px] text-[var(--c3)]">
            <b className="font-medium text-[var(--c4)] tabular-nums">{stats.done}</b> dari{' '}
            <b className="font-medium text-[var(--c4)] tabular-nums">{stats.total}</b> poin disetujui
          </p>
          <div className="my-3 flex h-2.5 overflow-hidden rounded-[10px] bg-[var(--c1)]">
            <span className="h-full bg-[var(--c4)] transition-[width] duration-1000" style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }} />
            <span className="h-full bg-[var(--c3)] transition-[width] duration-1000" style={{ width: `${stats.total ? (stats.review / stats.total) * 100 : 0}%` }} />
            <span className="h-full bg-[var(--c2)] transition-[width] duration-1000" style={{ width: `${stats.total ? (stats.doing / stats.total) * 100 : 0}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[var(--c3)]">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border border-[var(--c3)] bg-[var(--c4)]" /> Disetujui</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border border-[var(--c3)] bg-[var(--c3)]" /> Menunggu persetujuan</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border border-[var(--c3)] bg-[var(--c2)]" /> Dikerjakan</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border border-[var(--c3)]" /> Belum diambil</span>
          </div>
        </div>
      </div>

      {/* Papan */}
      <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Daftar tugas">
          {tab !== 'kontrak' && (
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[13px] text-[var(--c3)]">
                {viewMode === 'kota' ? 'Satu gedung = satu tugas · klik untuk buka rincian' : ''}
              </span>
              <div
                role="group"
                aria-label="Pilih tampilan tugas"
                className="flex rounded-full border border-[var(--c2)] bg-[var(--c1)] p-0.5 text-[13px]"
              >
                {(['daftar', 'kota'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={`cursor-pointer rounded-full px-3.5 py-1 capitalize transition-all duration-300 ${
                      viewMode === mode ? 'bg-[var(--c4)] font-semibold text-[var(--c0)]' : 'text-[var(--c3)] hover:text-[var(--c4)]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={tabsRef} className="relative -mx-1 flex gap-5 overflow-x-auto border-b border-[var(--c1)]" style={{ scrollbarWidth: 'none' }}>
            {([
              ['semua', 'Semua'],
              ['open', 'Tersedia'],
              ['doing', 'Berjalan'],
              ['review', 'Menunggu'],
              ['done', 'Selesai'],
              ...(contractSlot ? [['kontrak', 'Kontrak']] as const : []),
            ] as const).map(([k, label]) => (
              <button
                key={k}
                data-tab={k}
                onClick={() => setTab(k)}
                aria-selected={tab === k}
                className={`whitespace-nowrap border-0 bg-none px-1 pb-3 pt-1 text-[14px] transition-colors ${
                  tab === k ? 'text-[var(--c4)]' : 'cursor-pointer text-[var(--c3)] hover:text-[var(--c4)]'
                }`}
              >
                {label}
              </button>
            ))}
            <span
              className="absolute bottom-[-1px] h-0.5 bg-[var(--c4)] transition-[left,width] duration-500"
              style={{ left: ink.left, width: ink.width }}
              aria-hidden
            />
          </div>

          {tab === 'kontrak' ? (
            <div className="pt-6">{contractSlot}</div>
          ) : loading ? (
            <p className="py-12 text-center text-sm text-[var(--c3)]">Memuat tugas…</p>
          ) : filtered.length === 0 ? (
            <div className="grid gap-3 py-12 text-[var(--c3)]">
              <h3 className="text-[18px] font-semibold text-[var(--c4)]">Belum ada tugas di sini.</h3>
              <p className="text-sm">
                {tab === 'semua' ? 'Tambahkan tugas pertama dengan tombol "Tambah tugas".' : 'Coba kategori lain.'}
              </p>
            </div>
          ) : viewMode === 'kota' ? (
            <div className="pt-6" style={{ animation: 'fwRise .5s var(--ease) both' }}>
              <TaskSkyline tasks={skylineTasks} pct={stats.pct} onSelectTask={openFromCity} />
            </div>
          ) : (
            <div>
              {filtered.map((t, i) => {
                const mine = t.assignee_id === userId;
                const late = t.due_date && new Date(t.due_date).getTime() < nowIso && t.status !== 'done';
                const open = openRow === t.id;
                return (
                  <div key={t.id} id={`task-${t.id}`} className="border-b border-[var(--c1)]" style={{ animation: `fwRise .5s var(--ease) both`, animationDelay: `${i * 40}ms` }}>
                    <button
                      onClick={() => setOpenRow(open ? null : t.id)}
                      className="grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 rounded-[10px] px-3 py-4 text-left transition-colors hover:bg-[var(--c1)]/35 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                    >
                      <span className="grid h-[22px] w-[22px] place-items-center">
                        {t.status === 'done' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>
                        ) : t.status === 'review' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c3)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" /></svg>
                        ) : t.status === 'doing' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c3)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c3)" strokeWidth="1.8"><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /></svg>
                        )}
                      </span>
                      <span className="min-w-0">
                        <h3 className="truncate text-[16px] font-medium">{t.judul}</h3>
                        <p className="mt-0.5 text-[13.5px] text-[var(--c3)]">
                          <span className={t.status === 'done' ? 'text-[var(--c4)]' : ''}>{STATUS_LABEL[t.status]}</span>
                          {t.assignee_id ? ` · ${memberName(t.assignee_id) ?? 'Anggota'}` : ''}
                          {` · ${t.poin}p`}
                          {t.due_date ? ` · tenggat ${fmtDate(t.due_date)}` : ''}
                        </p>
                      </span>
                      <span className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1 md:justify-end">
                        {late && (
                          <span className="rounded-md bg-[var(--c4)] px-1.5 py-px text-[12px] font-semibold text-[var(--c0)]">Terlambat</span>
                        )}
                        <span className="rounded-full border border-[var(--c2)] px-2.5 py-px font-[family-name:var(--font-geist-mono)] text-[12px] tabular-nums text-[var(--c3)]">
                          {t.poin}p
                        </span>
                      </span>
                    </button>

                    <div className={`fw-reveal ${open ? 'on' : ''}`}>
                      <div>
                        <div className="grid gap-3 pb-4 pl-[34px] pr-2 pt-1 text-[14px] text-[var(--c3)]">
                          {t.deskripsi && <p>{t.deskripsi}</p>}
                          {t.revision_note && (
                            <p className="border-l-2 border-[var(--c2)] pl-2.5">
                              <b className="font-medium text-[var(--c4)]">Revisi:</b> {t.revision_note}
                            </p>
                          )}
                          {t.submit_link && (
                            <p>
                              <b className="font-medium text-[var(--c4)]">Bukti:</b>{' '}
                              <a href={t.submit_link} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-[var(--c4)]">
                                {t.submit_link}
                              </a>
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {!busy && t.status === 'open' && (
                              <Btn
                                variant="outline"
                                className="min-h-[34px] cursor-pointer px-3 text-xs"
                                onClick={() => run(() => import('@/lib/api/fairworks').then((m) => m.takeTask(t.id)), `Tugas "${t.judul}" kamu ambil.`)}
                              >
                                Ambil tugas
                              </Btn>
                            )}
                            {t.status === 'doing' && mine && (
                              <>
                                <Btn variant="solid" className="min-h-[34px] cursor-pointer px-3 text-xs" onClick={() => setProofTask(t)}>
                                  Kirim bukti
                                </Btn>
                                <Btn
                                  variant="outline"
                                  className="min-h-[34px] cursor-pointer px-3 text-xs"
                                  onClick={() => run(() => import('@/lib/api/fairworks').then((m) => m.releaseTask(t.id)), 'Tugas dilepaskan, kembali tersedia.')}
                                >
                                  Lepaskan
                                </Btn>
                              </>
                            )}
                            {t.status === 'review' && !mine && (
                              <>
                                <Btn
                                  variant="solid"
                                  className="min-h-[34px] cursor-pointer px-3 text-xs"
                                  onClick={() => castVote(t, 'ok')}
                                >
                                  Setujui
                                </Btn>
                                <Btn variant="outline" className="min-h-[34px] cursor-pointer px-3 text-xs" onClick={() => setReviseTask(t)}>
                                  Minta revisi
                                </Btn>
                              </>
                            )}
                            {t.status === 'review' && mine && <span className="text-[13px]">Menunggu persetujuan teman…</span>}
                            {t.status === 'done' && <span className="text-[13px]">Disetujui · poin dihitung.</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Aside */}
        <aside>
          <h2 className="mb-3 text-[14px] font-medium text-[var(--c3)]">Anggota</h2>
          <div className="border-t border-[var(--c1)] pt-5">
            <ContributionPie members={pieMembers} centerLabel="poin disetujui" />
          </div>

          <h2 className="mb-3 mt-8 text-[14px] font-medium text-[var(--c3)]">Aktivitas</h2>
          <div className="max-h-[320px] overflow-y-auto border-t border-[var(--c1)]">
            {activities.length === 0 ? (
              <p className="py-4 text-[13.5px] text-[var(--c3)]">Belum ada aktivitas.</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="border-b border-[var(--c1)] py-2.5 text-[14px] last:border-b-0">
                  <time className="block text-[12.5px] text-[var(--c3)]">
                    {new Date(a.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </time>
                  <b className="font-medium">
                    {a.profiles?.nama ?? 'Sistem'} {AKSI_MAP[a.aksi] ?? a.aksi}
                  </b>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Modal: kirim bukti */}
      <Modal isOpen={!!proofTask} onClose={() => setProofTask(null)} title="Kirim Bukti Kerja">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitProof();
          }}
          className="grid gap-4"
        >
          <p className="-mt-1 text-[13px] text-[var(--c3)]">
            Untuk tugas <b className="text-[var(--c4)]">{proofTask?.judul}</b>
          </p>
          <Field label="Tautan bukti" type="url" placeholder="https://github.com/…" value={proofLink} onChange={(e) => setProofLink(e.target.value)} required />
          <Field label="Catatan (opsional)" type="text" placeholder="Ringkasan hasil…" value={proofNote} onChange={(e) => setProofNote(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Btn type="button" variant="ghost" onClick={() => setProofTask(null)} className="min-h-[38px] px-4 text-xs">
              Batal
            </Btn>
            <Btn type="submit" loading={busy} className="min-h-[38px] px-5 text-xs">
              Kirim
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal: minta revisi */}
      <Modal isOpen={!!reviseTask} onClose={() => setReviseTask(null)} title="Minta Revisi">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reviseTask) castVote(reviseTask, 'revisi', reviseNote.trim());
          }}
          className="grid gap-4"
        >
          <p className="-mt-1 text-[13px] text-[var(--c3)]">
            Catatan wajib — jelaskan apa yang perlu diperbaiki dari <b className="text-[var(--c4)]">{reviseTask?.judul}</b>.
          </p>
          <Field label="Catatan revisi" type="text" placeholder="Contoh: tambahkan sumber data…" value={reviseNote} onChange={(e) => setReviseNote(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <Btn type="button" variant="ghost" onClick={() => setReviseTask(null)} className="min-h-[38px] px-4 text-xs">
              Batal
            </Btn>
            <Btn type="submit" loading={busy} className="min-h-[38px] px-5 text-xs">
              Kirim revisi
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal: tambah tugas */}
      <Modal isOpen={newTaskOpen} onClose={() => setNewTaskOpen(false)} title="Tambah Tugas">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTask();
          }}
          className="grid gap-4"
        >
          <Field label="Judul tugas" type="text" placeholder="Contoh: Tulis bab latar belakang" value={ntJudul} onChange={(e) => setNtJudul(e.target.value)} required />
          <Field label="Deskripsi (opsional)" type="text" placeholder="Detail singkat…" value={ntDesk} onChange={(e) => setNtDesk(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Poin" type="number" min={1} max={100} value={ntPoin} onChange={(e) => setNtPoin(e.target.value)} required />
            <Field label="Tenggat (opsional)" type="date" value={ntDue} onChange={(e) => setNtDue(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Btn type="button" variant="ghost" onClick={() => setNewTaskOpen(false)} className="min-h-[38px] px-4 text-xs">
              Batal
            </Btn>
            <Btn type="submit" loading={busy} className="min-h-[38px] px-5 text-xs">
              Tambahkan
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
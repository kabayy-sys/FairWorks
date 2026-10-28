'use client';

import React, { useEffect, useState } from 'react';
import { Panel, Track } from './DesignSystem';
import { getReport, detectLinkType } from '@/lib/api/fairworks';

export interface ReportMember {
  user_id: string;
  nama: string;
  peran: string;
  points_done: number;
}

export interface ReportTask {
  id: string;
  judul: string;
  deskripsi?: string | null;
  poin: number;
  status: 'done' | 'review' | 'doing' | 'open';
  assignee_name?: string | null;
  submit_link?: string | null;
  submit_note?: string | null;
  submit_at?: string | null;
}

export interface ReportTimeline {
  id: string;
  aksi: string;
  actor_name: string;
  meta?: Record<string, unknown> | null;
  created_at: string;
}

export interface ReportRoom {
  id: string;
  nama: string;
  kode: string;
  locked_at?: string | null;
  created_at: string;
  total_points: number;
  done_points: number;
}

export interface ReportData {
  room: ReportRoom;
  members: ReportMember[];
  tasks: ReportTask[];
  timeline: ReportTimeline[];
}

const MONO_PIE_SHADES = [
  '#E8E8EC', // --c4
  '#B8B8C2', // mid light
  '#85858D', // --c3
  '#5C5C66', // mid dark
  '#35353C', // --c1 deep
];

function formatTanggalIndo(isoStr?: string | null): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

export function DossierReport({
  token,
  initialData,
  onBack,
}: {
  token?: string;
  initialData?: ReportData | null;
  onBack?: () => void;
}) {
  const [data, setData] = useState<ReportData | null>(() => {
    if (initialData) return initialData;
    if (!token) {
      // Jika diakses di halaman demo utama (tanpa token URL /l/{token}), pakai demo data agar tidak error
      return {
        room: {
          id: 'demo-room-1',
          nama: 'Riset Pasar Digital',
          kode: 'RPD-4K7',
          locked_at: '2026-10-24T10:00:00Z',
          created_at: '2026-10-23T08:30:00Z',
          total_points: 40,
          done_points: 25,
        },
        members: [
          { user_id: 'm1', nama: 'Ayu Pratiwi', peran: 'ketua', points_done: 10 },
          { user_id: 'm2', nama: 'Bima Sakti', peran: 'anggota', points_done: 10 },
          { user_id: 'm3', nama: 'Citra Kirana', peran: 'anggota', points_done: 5 },
          { user_id: 'm4', nama: 'Dimas Anggara', peran: 'anggota', points_done: 0 },
          { user_id: 'm5', nama: 'Esa Prakasa', peran: 'anggota', points_done: 0 },
        ],
        tasks: [
          {
            id: 'task-1',
            judul: 'Tulis bab latar belakang & rumusan masalah',
            deskripsi: 'Bab 1 lengkap beserta studi literatur pendahuluan',
            poin: 10,
            status: 'done',
            assignee_name: 'Ayu Pratiwi',
            submit_link: 'https://docs.google.com/document/d/1demo-latar-belakang',
            submit_note: 'Dokumen Bab 1 selesai dan telah direvisi sesuai catatan dosen.',
            submit_at: '2026-10-25T14:20:00Z',
          },
          {
            id: 'task-2',
            judul: 'Rangkum 10 jurnal relevan & sitasi IEEE',
            deskripsi: 'Ekstraksi metodologi riset 5 tahun terakhir',
            poin: 10,
            status: 'done',
            assignee_name: 'Bima Sakti',
            submit_link: 'https://github.com/fairworks/riset-pasar-digital',
            submit_note: 'Repositori berisi rangkuman markdown dan berkas bibtex sitasi.',
            submit_at: '2026-10-26T09:15:00Z',
          },
          {
            id: 'task-3',
            judul: 'Susun instrumen kuesioner survei pengguna',
            deskripsi: '15 butir pertanyaan skala Likert 1-5',
            poin: 5,
            status: 'done',
            assignee_name: 'Citra Kirana',
            submit_link: 'https://drive.google.com/drive/folders/1demo-kuesioner',
            submit_note: 'Kuesioner sudah divalidasi oleh 3 responden awal.',
            submit_at: '2026-10-26T16:40:00Z',
          },
          {
            id: 'task-4',
            judul: 'Sebar survei & himpun 50 responden target',
            deskripsi: 'Sebar di komunitas kampus dan sosial media',
            poin: 10,
            status: 'review',
            assignee_name: 'Dimas Anggara',
            submit_link: 'https://docs.google.com/spreadsheets/d/1demo-responden',
            submit_note: 'Sudah terkumpul 52 respons bersih siap olah.',
            submit_at: '2026-10-27T08:00:00Z',
          },
          {
            id: 'task-5',
            judul: 'Desain slide presentasi hasil temuan akhir',
            deskripsi: '12 slide minimalis monokrom format 16:9',
            poin: 5,
            status: 'doing',
            assignee_name: 'Esa Prakasa',
            submit_link: 'https://figma.com/file/demo-slide-presentasi',
            submit_note: null,
            submit_at: null,
          },
        ],
        timeline: [
          {
            id: 'log-1',
            aksi: 'Tugas "Susun instrumen kuesioner" disetujui mayoritas tim (3 suara)',
            actor_name: 'Ayu Pratiwi',
            created_at: '2026-10-26T17:10:00Z',
          },
          {
            id: 'log-2',
            aksi: 'Citra Kirana mengirim bukti pengumpulan instrumen kuesioner',
            actor_name: 'Citra Kirana',
            created_at: '2026-10-26T16:40:00Z',
          },
          {
            id: 'log-3',
            aksi: 'Tugas "Rangkum 10 jurnal relevan" disetujui mayoritas tim (3 suara)',
            actor_name: 'Citra Kirana',
            created_at: '2026-10-26T11:00:00Z',
          },
          {
            id: 'log-4',
            aksi: 'Bima Sakti mengirim repositori bukti pengerjaan rangkuman jurnal',
            actor_name: 'Bima Sakti',
            created_at: '2026-10-26T09:15:00Z',
          },
          {
            id: 'log-5',
            aksi: 'Tugas "Tulis bab latar belakang" disetujui mayoritas tim (4 suara)',
            actor_name: 'Bima Sakti',
            created_at: '2026-10-25T16:30:00Z',
          },
          {
            id: 'log-6',
            aksi: 'Ayu Pratiwi mengirim tautan bukti naskah Bab 1',
            actor_name: 'Ayu Pratiwi',
            created_at: '2026-10-25T14:20:00Z',
          },
          {
            id: 'log-7',
            aksi: 'Kontrak tugas disetujui seluruh anggota dan terkunci resmi',
            actor_name: 'Sistem FairWorks',
            created_at: '2026-10-24T10:00:00Z',
          },
        ],
      };
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!initialData && !!token);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialData || !token) return;

    let isMounted = true;
    async function fetchReport() {
      try {
        const res = await getReport(token as string);
        if (isMounted) {
          if (res) {
            setData(res as unknown as ReportData);
          } else {
            setErrorMessage('Laporan tidak ditemukan atau tautan tidak valid.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat laporan publik.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [token, initialData]);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3 font-mono text-xs text-[var(--c3)] animate-pulse">
        <p>Memuat dossier publik dari server...</p>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="p-12 sm:p-16 text-center space-y-4 max-w-md mx-auto panel border border-[var(--c2)] bg-[var(--c0)]/90">
        <span className="text-2xl">⚠</span>
        <h2 className="text-xl font-semibold text-[var(--c4)]">Laporan Tidak Ditemukan</h2>
        <p className="text-xs text-[var(--c3)] font-mono leading-relaxed">
          {errorMessage || 'Tautan laporan publik tidak valid atau sudah kedaluwarsa.'}
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full text-xs font-mono bg-[var(--c4)] text-[var(--c0)] font-semibold cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        )}
      </div>
    );
  }

  const { room, members, tasks, timeline } = data;

  const memberContributions = members.map((m, idx) => {
    const totalDone = room.done_points || 1;
    const pct = Math.round((m.points_done / totalDone) * 100);
    return {
      ...m,
      pct: isNaN(pct) ? 0 : pct,
      color: MONO_PIE_SHADES[idx % MONO_PIE_SHADES.length],
    };
  });

  const donutSegments = (() => {
    const R = 52;
    const C = 2 * Math.PI * R;
    let acc = 0;
    const segments: Array<
      (typeof memberContributions)[number] & {
        strokeDasharray: string;
        strokeDashoffset: number;
      }
    > = [];

    for (const m of memberContributions) {
      const strokeDasharray = `${(m.pct / 100) * C} ${C}`;
      const strokeDashoffset = -((acc / 100) * C);
      acc += m.pct;
      segments.push({
        ...m,
        strokeDasharray,
        strokeDashoffset,
      });
    }

    return segments;
  })();

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const statusBadge = (st: ReportTask['status']) => {
    switch (st) {
      case 'done':
        return (
          <span className="font-mono text-xs text-[var(--c4)] flex items-center gap-1.5 font-semibold">
            <span>✓</span> Selesai
          </span>
        );
      case 'review':
        return (
          <span className="font-mono text-xs text-[var(--c3)] flex items-center gap-1.5">
            <span>◨</span> Menunggu suara
          </span>
        );
      case 'doing':
        return (
          <span className="font-mono text-xs text-[var(--c2)] flex items-center gap-1.5">
            <span>◐</span> Dikerjakan
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs text-[var(--c3)] flex items-center gap-1.5">
            <span>○</span> Terbuka
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-3xl mx-auto text-[var(--c4)]">
      {onBack && (
        <button
          onClick={onBack}
          className="text-xs font-mono text-[var(--c3)] hover:text-[var(--c4)] flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          ← Kembali ke Beranda
        </button>
      )}

      {/* 1. KEPALA LAPORAN */}
      <Panel className="p-6 sm:p-8 space-y-6 border border-[var(--c2)] bg-[var(--c0)]/90 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--c1)] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-[11px] tracking-wider text-[var(--c4)]">
                Laporan Kontribusi Mahasiswa
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--c1)] text-[var(--c3)] border border-[var(--c2)]/40">
                Resmi · Dosen
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{room.nama}</h1>
            <p className="text-xs font-mono text-[var(--c3)]">
              KODE: <span className="text-[var(--c4)] font-medium">{room.kode}</span> · {members.length} Anggota · Kontrak {room.locked_at ? `Terkunci ${formatTanggalIndo(room.locked_at)}` : 'Draf'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-full text-xs font-mono border border-[var(--c2)] hover:border-[var(--c4)] bg-[var(--c1)] text-[var(--c4)] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{copied ? '✓ Tautan Disalin' : 'Salin Tautan Publik'}</span>
            </button>
            <span className="text-[10px] font-mono text-[var(--c3)]">Tanpa login · Akses langsung</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="space-y-1">
            <span className="eyebrow text-[10px]">Total Poin Tugas</span>
            <p className="text-2xl font-semibold font-mono tracking-tight">{room.total_points}p</p>
          </div>
          <div className="space-y-1">
            <span className="eyebrow text-[10px]">Poin Sah Disetujui</span>
            <p className="text-2xl font-semibold font-mono text-[var(--c4)] tracking-tight">
              {room.done_points}p
            </p>
          </div>
          <div className="space-y-1">
            <span className="eyebrow text-[10px]">Tingkat Penyelesaian</span>
            <p className="text-2xl font-semibold font-mono tracking-tight">
              {room.total_points > 0 ? Math.round((room.done_points / room.total_points) * 100) : 0}%
            </p>
          </div>
          <div className="space-y-1">
            <span className="eyebrow text-[10px]">Tugas Selesai</span>
            <p className="text-2xl font-semibold font-mono tracking-tight">
              {tasks.filter((t) => t.status === 'done').length}/{tasks.length}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Track
            done={room.done_points}
            review={tasks.filter((t) => t.status === 'review').reduce((a, b) => a + b.poin, 0)}
            doing={tasks.filter((t) => t.status === 'doing').reduce((a, b) => a + b.poin, 0)}
            open={tasks.filter((t) => t.status === 'open').reduce((a, b) => a + b.poin, 0)}
          />
        </div>
      </Panel>

      {/* 2. PIE CHART MONOKROM */}
      <Panel className="p-6 sm:p-8 space-y-6 border border-[var(--c2)] bg-[var(--c0)]/90">
        <div className="space-y-1 border-b border-[var(--c1)] pb-4">
          <span className="eyebrow text-[11px]">Distribusi Kontribusi</span>
          <h2 className="text-xl font-semibold tracking-tight">Porsi Kerja Riil Tiap Anggota</h2>
          <p className="text-xs text-[var(--c3)]">
            Dihitung murni dari tugas yang bukti pengerjaannya telah diverifikasi dan disetujui mayoritas rekan tim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
          <div className="flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 140 140" className="w-48 h-48 -rotate-90 transform">
              <circle cx="70" cy="70" r="52" fill="none" stroke="var(--c1)" strokeWidth="14" />
              {donutSegments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="70"
                  cy="70"
                  r="52"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="14"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-1000 ease-[var(--ease)]"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-2xl font-bold font-mono tracking-tight text-[var(--c4)]">
                {room.done_points}p
              </span>
              <span className="text-[11px] font-mono text-[var(--c3)] uppercase tracking-wider">
                Selesai
              </span>
            </div>
          </div>

          <div className="space-y-3.5 divide-y divide-[var(--c1)]">
            {memberContributions.map((m, idx) => (
              <div key={m.user_id} className={`${idx > 0 ? 'pt-3' : ''} flex items-center justify-between text-xs`}>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                  <div>
                    <span className="font-medium text-[var(--c4)]">{m.nama}</span>
                    <span className="text-[var(--c3)] font-mono text-[11px] ml-1.5">
                      ({m.peran === 'ketua' ? 'Ketua' : 'Anggota'})
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="font-semibold text-sm text-[var(--c4)]">{m.pct}%</span>
                  <span className="text-[var(--c3)] text-[11px] ml-1.5">({m.points_done}p)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* 3. TABEL TUGAS & BUKTI AKHIR */}
      <Panel className="p-6 sm:p-8 space-y-6 border border-[var(--c2)] bg-[var(--c0)]/90">
        <div className="space-y-1 border-b border-[var(--c1)] pb-4">
          <span className="eyebrow text-[11px]">Daftar Tugas & Bukti Pekerjaan</span>
          <h2 className="text-xl font-semibold tracking-tight">Artefak Hasil Kerja</h2>
          <p className="text-xs text-[var(--c3)]">
            Setiap poin ditautkan langsung ke bukti riil. Klik chip untuk verifikasi langsung.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {tasks.map((task) => {
            const chipType = task.submit_link ? detectLinkType(task.submit_link) : null;
            return (
              <div key={task.id} className="p-4 rounded-[14px] bg-[var(--c1)]/70 border border-[var(--c2)]/60 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      {statusBadge(task.status)}
                      <span className="text-[var(--c3)]">·</span>
                      <span className="font-mono text-xs font-semibold text-[var(--c4)]">{task.poin} poin</span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--c4)] leading-snug">{task.judul}</h3>
                    {task.deskripsi && <p className="text-xs text-[var(--c3)] leading-relaxed">{task.deskripsi}</p>}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-mono text-[var(--c3)]">
                      Pemegang: <strong className="text-[var(--c4)]">{task.assignee_name || '-'}</strong>
                    </span>
                    {task.submit_link ? (
                      <a
                        href={task.submit_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-[var(--c2)] bg-[var(--c1)] hover:border-[var(--c4)] text-[var(--c4)] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        title={`Buka ${task.submit_link}`}
                      >
                        <span>↗</span>
                        <span>{chipType || 'Lihat Bukti'}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] font-mono text-[var(--c3)] italic">Belum ada bukti</span>
                    )}
                  </div>
                </div>

                {task.submit_note && (
                  <div className="p-2.5 rounded-[10px] bg-[var(--c0)] border border-[var(--c2)]/40 text-xs text-[var(--c3)] font-mono leading-relaxed">
                    <strong className="text-[var(--c4)]">Catatan pengerjaan:</strong> {task.submit_note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 4. LINIMASA PENGERJAAN TIM */}
      <Panel className="p-6 sm:p-8 space-y-6 border border-[var(--c2)] bg-[var(--c0)]/90">
        <div className="space-y-1 border-b border-[var(--c1)] pb-4">
          <span className="eyebrow text-[11px]">Audit Trail & Riwayat</span>
          <h2 className="text-xl font-semibold tracking-tight">Linimasa Transparan</h2>
        </div>

        <div className="space-y-4 pt-1 pl-2 border-l border-[var(--c2)]">
          {timeline.map((item, idx) => (
            <div key={item.id || idx} className="relative pl-6 space-y-1">
              <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[var(--c4)] ring-4 ring-[var(--c0)]" />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[var(--c4)]">{item.aksi}</span>
                <span className="font-mono text-[11px] text-[var(--c3)]">{formatTanggalIndo(item.created_at)}</span>
              </div>
              <p className="text-[11px] font-mono text-[var(--c3)]">
                Oleh: <span className="text-[var(--c4)]">{item.actor_name}</span>
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

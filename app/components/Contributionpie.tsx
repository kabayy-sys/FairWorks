'use client';

import React, { useEffect, useMemo, useState } from 'react';

/* ------------------------------------------------------------------
   ContributionPie
   Donut kontribusi poin selesai tiap anggota (diport dari FairRoom ·
   Laporan Akhir). Hover / fokus pada irisan atau baris legenda saling
   tersinkron, angka tengah ikut berubah, dan irisan "menyapu" masuk saat
   pertama tampil. Warna dibedakan lewat tingkat terang (monokrom).
   ------------------------------------------------------------------ */

export interface PieMember {
  id: string;
  name: string;
  role?: string;
  points: number;
  isCurrentUser?: boolean;
}

export interface ContributionPieProps {
  members: PieMember[];
  /** Teks kecil di bawah angka total (default: "poin selesai") */
  centerLabel?: string;
}

const TAU = Math.PI * 2;

function pt(r: number, a: number): string {
  return `${(r * Math.sin(a)).toFixed(2)},${(-r * Math.cos(a)).toFixed(2)}`;
}

function seg(r0: number, r1: number, a0: number, a1: number): string {
  if (a1 - a0 < 1e-4) return '';
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${pt(r1, a0)}A${r1} ${r1} 0 ${large} 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 ${large} 0 ${pt(r0, a0)}Z`;
}

/** Terang -> gelap, mengikuti palet monokrom laporan (E8E8EC ... 3A3A41) */
function lightnessFor(i: number, n: number): number {
  if (n <= 1) return 92;
  return 92 - (i / (n - 1)) * 62;
}

export function ContributionPie({ members, centerLabel = 'poin selesai' }: ContributionPieProps) {
  // Anggota terbesar paling terang, supaya urutan irisan = urutan legenda
  const sorted = useMemo(
    () => members.map((m, idx) => ({ m, idx })).sort((a, b) => b.m.points - a.m.points || a.idx - b.idx).map((x) => x.m),
    [members]
  );
  const total = useMemo(() => sorted.reduce((acc, m) => acc + Math.max(0, m.points), 0), [sorted]);

  // k = progres animasi sapuan masuk (0 -> 1)
  const [k, setK] = useState(0);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setK(1);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1100);
      setK(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const slices = useMemo(() => {
    let a = 0;
    const nonZero = sorted.filter((m) => m.points > 0).length;
    return sorted.map((m, i) => {
      const frac = total > 0 ? Math.max(0, m.points) / total : 0;
      const a0 = a;
      const a1 = a + TAU * frac * k;
      a = a1;
      // celah antar irisan; tidak dipakai kalau hanya ada satu irisan (cincin penuh)
      const gap = nonZero > 1 && a1 - a0 > 0.07 ? 0.035 : 0;
      const end = frac > 0.9999 ? a1 - 0.0005 : a1 - gap;
      const d = seg(60, 100, a0 + gap, end);
      const mid = (a0 + a1) / 2;
      const L = lightnessFor(i, sorted.length);
      return { m, i, d, mid, frac, color: `hsl(240 4% ${L.toFixed(1)}%)`, ink: L > 50 ? 'var(--c0)' : 'var(--c4)' };
    });
  }, [sorted, total, k]);

  if (sorted.length === 0) {
    return (
      <div className="p-6 text-center rounded-[14px] border border-dashed border-[var(--c2)] text-xs text-[var(--c3)]">
        Belum ada anggota di ruangan ini.
      </div>
    );
  }

  const act = active >= 0 ? slices[active] : null;

  return (
    <div className="space-y-4">
      <div className="relative mx-auto" style={{ width: 'min(240px, 100%)' }}>
        <svg
          viewBox="-110 -110 220 220"
          className="block w-full overflow-visible"
          role="img"
          aria-label="Kontribusi poin selesai tiap anggota"
        >
          {total === 0 && <circle r={80} fill="none" stroke="var(--c1)" strokeWidth={40} />}
          {slices.map((s) => {
            const on = active === s.i;
            const dx = on ? 9 * Math.sin(s.mid) : 0;
            const dy = on ? -9 * Math.cos(s.mid) : 0;
            return (
              <path
                key={s.m.id}
                d={s.d}
                fill={s.color}
                tabIndex={0}
                role="img"
                aria-label={`${s.m.name}: ${s.m.points} poin, ${Math.round(s.frac * 100)}%`}
                style={{
                  cursor: 'pointer',
                  outline: 'none',
                  transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`,
                  opacity: active < 0 || on ? 1 : 0.4,
                  transition: 'transform .28s cubic-bezier(.3,.7,.2,1), opacity .2s',
                  pointerEvents: 'auto',
                }}
                stroke={on ? 'var(--c4)' : 'none'}
                strokeWidth={on ? 1.5 : 0}
                onMouseEnter={() => setActive(s.i)}
                onMouseLeave={() => setActive((cur) => (cur === s.i ? -1 : cur))}
                onFocus={() => setActive(s.i)}
                onBlur={() => setActive((cur) => (cur === s.i ? -1 : cur))}
              />
            );
          })}
        </svg>

        {/* Angka tengah */}
        <div className="absolute inset-0 grid place-content-center text-center pointer-events-none">
          <b className="text-[34px] leading-none font-semibold tracking-[-0.05em] text-[var(--c4)] px-6 truncate max-w-[150px]">
            {act ? act.m.name : total}
          </b>
          <span className="font-mono text-[11px] text-[var(--c3)] mt-1.5">
            {act ? `${act.m.points} poin · ${Math.round(act.frac * 100)}%` : centerLabel}
          </span>
        </div>
      </div>

      {/* Legenda ringkas (tersinkron dengan irisan) */}
      <ul className="grid gap-1 m-0 p-0 list-none">
        {slices.map((s) => {
          const on = active === s.i;
          return (
            <li
              key={s.m.id}
              onPointerEnter={() => setActive(s.i)}
              onPointerLeave={() => setActive(-1)}
              className={`grid grid-cols-[28px_1fr_auto] items-center gap-3 px-2.5 py-2 rounded-[12px] border cursor-pointer transition-all duration-200 ${
                on ? 'bg-[var(--c1)] border-[var(--c2)]' : 'border-transparent'
              }`}
              style={{ opacity: active < 0 || on ? 1 : 0.5 }}
            >
              <span
                className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-semibold"
                style={{ background: s.color, color: s.ink }}
              >
                {s.m.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex items-center gap-2 text-xs text-[var(--c4)]">
                <span className="truncate font-medium">
                  {s.m.name}
                  {s.m.isCurrentUser && ' (Anda)'}
                </span>
                {s.m.role === 'Ketua' && (
                  <span className="px-1.5 py-0.5 bg-[var(--c2)] text-[var(--c4)] rounded text-[9px] uppercase font-mono">
                    Ketua
                  </span>
                )}
              </span>
              <span className="font-mono text-[11px] text-[var(--c3)] text-right tabular-nums">
                {s.m.points}p · <strong className="text-[var(--c4)] font-semibold">{Math.round(s.frac * 100)}%</strong>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
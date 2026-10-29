'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ------------------------------------------------------------------
   TaskSkyline
   Kota isometrik progres tugas (diport dari galeri "Isometric Task
   Skyline"). Bedanya: di sini 1 gedung = 1 tugas nyata.
   - Selesai   : gedung tinggi (di tengah kota, tumbuh duluan)
   - Perlu disetujui / Dikerjakan : gedung menengah / pendek
   - Bisa diambil : lempengan rusak yang miring di tanah
   Tinggi sedikit dipengaruhi poin tugas. Hover = angkat gedung + info,
   klik / Enter = buka detail tugas. Maksimal 25 gedung (grid 5x5).
   ------------------------------------------------------------------ */

export type SkylineStatus = 'open' | 'doing' | 'review' | 'done';

export interface SkylineTask {
  id: string;
  judul: string;
  poin: number;
  status: SkylineStatus;
  assignee_name?: string | null;
}

export interface TaskSkylineProps {
  tasks: SkylineTask[];
  /** Persen poin selesai (0-100), dipakai untuk teks suasana kota */
  pct: number;
  onSelectTask?: (taskId: string) => void;
}

const NS = 'http://www.w3.org/2000/svg';
const S = 30;
const C = Math.sqrt(3) / 2;
const GRID = 5;
const SLOTS = GRID * GRID;

const STATUS_LABEL: Record<SkylineStatus, string> = {
  open: 'Bisa diambil',
  doing: 'Dikerjakan',
  review: 'Perlu disetujui',
  done: 'Selesai',
};
const STATUS_GLYPH: Record<SkylineStatus, string> = { open: '○', doing: '◐', review: '◨', done: '✓' };
const STATUS_ORDER: Record<SkylineStatus, number> = { done: 0, review: 1, doing: 2, open: 3 };
const HEIGHT_FACTOR: Record<SkylineStatus, number> = { done: 1, review: 0.62, doing: 0.34, open: 0 };

function proj(gx: number, gy: number, z: number): string {
  return `${((gx - gy) * C * S).toFixed(1)},${((gx + gy) * 0.5 * S - z).toFixed(1)}`;
}
function rnd(i: number, j: number, k: number): number {
  const s = Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453;
  return s - Math.floor(s);
}
function el<K extends keyof SVGElementTagNameMap>(tag: K, cls: string | null, parent: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag) as SVGElementTagNameMap[K];
  if (cls) e.setAttribute('class', cls);
  parent.appendChild(e);
  return e;
}

interface Slot {
  i: number;
  j: number;
  rank: number; // 0 = paling tengah
  h: number; // tinggi dasar gedung di slot ini
  jz: number[]; // goyangan sudut (lempengan rusak)
  cur: number;
  v: number;
  tgt: number;
  wait: number;
  hv: boolean;
  task?: SkylineTask;
  g: SVGGElement;
  l: SVGPolygonElement;
  r: SVGPolygonElement;
  t: SVGPolygonElement;
  w: SVGPathElement;
}

const CSS = `
.fw-sky-svg{width:min(420px,100%);height:auto;display:block;overflow:visible;margin-inline:auto}
.fw-sky-ground{fill:var(--c1);stroke:var(--c2);stroke-width:1}
.fw-sky-lines{stroke:var(--c2);stroke-width:.5;opacity:.5;fill:none}
.fw-sky-b{outline:none}
.fw-sky-b polygon{stroke:var(--c0);stroke-width:.6;transition:fill .4s}
.fw-sky-b .fw-t{fill:var(--c2)}.fw-sky-b .fw-l,.fw-sky-b .fw-r{fill:var(--c1)}
.fw-sky-b.s-done .fw-t{fill:var(--c4)}.fw-sky-b.s-done .fw-l{fill:var(--c3)}.fw-sky-b.s-done .fw-r{fill:var(--c2)}
.fw-sky-b.s-review .fw-t{fill:var(--c3)}.fw-sky-b.s-review .fw-l{fill:var(--c2)}.fw-sky-b.s-review .fw-r{fill:var(--c1)}
.fw-sky-b.s-doing .fw-t{fill:var(--c2)}.fw-sky-b.s-doing .fw-l,.fw-sky-b.s-doing .fw-r{fill:var(--c1)}
.fw-sky-b.s-open polygon{stroke:var(--c3);stroke-dasharray:3 2}
.fw-sky-b.hv .fw-t,.fw-sky-b:focus-visible .fw-t{fill:#fff}
.fw-sky-b:focus-visible polygon{stroke:var(--c4);stroke-width:1.4}
.fw-sky-b .fw-w{stroke:var(--c0);stroke-width:1.2;opacity:.45;fill:none}
`;

export function TaskSkyline({ tasks, pct, onSelectTask }: TaskSkylineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const slotsRef = useRef<Slot[]>([]);
  const kickRef = useRef<() => void>(() => {});
  const onSelectRef = useRef(onSelectTask);
  const [tip, setTip] = useState('');

  useEffect(() => {
    onSelectRef.current = onSelectTask;
  }, [onSelectTask]);

  // 1) Bangun kota (sekali): tanah, grid, 25 slot gedung, loop animasi pegas
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.replaceChildren();

    const reduce =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ground = el('polygon', 'fw-sky-ground', svg);
    ground.setAttribute('points', [proj(-0.3, -0.3, 0), proj(5.3, -0.3, 0), proj(5.3, 5.3, 0), proj(-0.3, 5.3, 0)].join(' '));
    const gl = el('path', 'fw-sky-lines', svg);
    let gd = '';
    for (let q = 0; q <= GRID; q++) gd += `M${proj(q, 0, 0)}L${proj(q, GRID, 0)}M${proj(0, q, 0)}L${proj(GRID, q, 0)}`;
    gl.setAttribute('d', gd);

    // data slot + peringkat jarak dari pusat
    const meta: { i: number; j: number; d: number; h: number; jz: number[]; rank: number }[] = [];
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const d = Math.hypot(i - 2, j - 2);
        meta.push({
          i,
          j,
          d,
          h: 38 + (1 - d / 2.83) * 110 + rnd(i, j, 1) * 22,
          jz: [1, 2, 3, 4].map((k) => (rnd(i, j, k + 5) - 0.5) * 12),
          rank: 0,
        });
      }
    }
    [...meta].sort((a, b) => a.d - b.d || a.i - b.i).forEach((m, k) => (m.rank = k));
    // urutan gambar: belakang -> depan (painter's algorithm)
    meta.sort((a, b) => a.i + a.j - (b.i + b.j) || a.i - b.i);

    const slots: Slot[] = meta.map((m) => {
      const g = el('g', 'fw-sky-b', svg);
      const l = el('polygon', 'fw-l', g);
      const r = el('polygon', 'fw-r', g);
      const t = el('polygon', 'fw-t', g);
      const w = el('path', 'fw-w', g);
      return { i: m.i, j: m.j, rank: m.rank, h: m.h, jz: m.jz, cur: 0, v: 0, tgt: 0, wait: 0, hv: false, g, l, r, t, w };
    });
    slotsRef.current = slots;

    const draw = (b: Slot) => {
      const x0 = b.i + 0.1, x1 = b.i + 0.9, y0 = b.j + 0.1, y1 = b.j + 0.9;
      const h = Math.max(b.cur, 2);
      const jf = Math.max(0, 1 - b.cur / 18);
      const [a, bb, c, d] = b.jz.map((z) => h + z * jf);
      b.t.setAttribute('points', [proj(x0, y0, a), proj(x1, y0, bb), proj(x1, y1, c), proj(x0, y1, d)].join(' '));
      b.l.setAttribute('points', [proj(x0, y1, 0), proj(x1, y1, 0), proj(x1, y1, c), proj(x0, y1, d)].join(' '));
      b.r.setAttribute('points', [proj(x1, y0, 0), proj(x1, y1, 0), proj(x1, y1, c), proj(x1, y0, bb)].join(' '));
      let s = '';
      for (let z = 14; z < h - 6; z += 13) s += `M${proj(x0, y1, z)}L${proj(x1, y1, z)}M${proj(x1, y0, z)}L${proj(x1, y1, z)}`;
      b.w.setAttribute('d', s);
      // slot tanpa tugas disembunyikan setelah "turun"
      b.g.style.display = !b.task && b.cur < 2.5 ? 'none' : '';
    };

    let raf = 0;
    let running = false;
    const step = (now: number) => {
      let moving = false;
      for (const b of slots) {
        if (now < b.wait) {
          moving = true;
          continue;
        }
        const tg = b.tgt + (b.hv && b.task ? 10 : 0);
        b.v += (tg - b.cur) * 0.09;
        b.v *= 0.78;
        b.cur += b.v;
        if (Math.abs(b.v) > 0.02 || Math.abs(tg - b.cur) > 0.05) moving = true;
        else {
          b.cur = tg;
          b.v = 0;
        }
        draw(b);
      }
      if (moving) raf = requestAnimationFrame(step);
      else running = false;
    };
    const kick = () => {
      if (reduce) {
        slots.forEach((b) => {
          b.cur = b.tgt + (b.hv && b.task ? 10 : 0);
          b.v = 0;
          b.wait = 0;
          draw(b);
        });
        return;
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };
    kickRef.current = kick;

    // interaksi
    slots.forEach((b) => {
      const enter = () => {
        if (!b.task) return;
        b.hv = true;
        b.g.classList.add('hv');
        setTip(
          `${b.task.judul} · ${b.task.poin}p · ${STATUS_LABEL[b.task.status]}` +
            (b.task.assignee_name ? ` · ${b.task.assignee_name}` : '')
        );
        kick();
      };
      const leave = () => {
        b.hv = false;
        b.g.classList.remove('hv');
        setTip('');
        kick();
      };
      b.g.addEventListener('pointerenter', enter);
      b.g.addEventListener('pointerleave', leave);
      b.g.addEventListener('focus', enter);
      b.g.addEventListener('blur', leave);
      b.g.addEventListener('click', () => {
        if (b.task) onSelectRef.current?.(b.task.id);
      });
      b.g.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && b.task) {
          e.preventDefault();
          onSelectRef.current?.(b.task.id);
        }
      });
      draw(b);
    });

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      kickRef.current = () => {};
      slotsRef.current = [];
      svg.replaceChildren();
    };
  }, []);

  // 2) Sinkronkan gedung dengan data tugas (jalan tiap tugas berubah)
  useEffect(() => {
    const slots = slotsRef.current;
    if (!slots.length) return;
    const byRank = [...slots].sort((a, b) => a.rank - b.rank);
    const list = [...tasks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]).slice(0, SLOTS);
    const maxP = Math.max(1, ...list.map((t) => t.poin));
    const now = performance.now();

    byRank.forEach((b, r) => {
      const t = list[r];
      b.task = t;
      let nt = 0;
      if (t) nt = t.status === 'open' ? 5 : Math.max(10, b.h * (0.75 + 0.5 * (t.poin / maxP)) * HEIGHT_FACTOR[t.status]);
      b.g.setAttribute('class', `fw-sky-b${t ? ` s-${t.status}` : ''}${b.hv ? ' hv' : ''}`);
      if (t) {
        b.g.setAttribute('role', 'button');
        b.g.setAttribute('tabindex', '0');
        b.g.setAttribute('aria-label', `${t.judul}, ${t.poin} poin, ${STATUS_LABEL[t.status]}`);
        b.g.style.cursor = 'pointer';
        b.g.style.pointerEvents = 'auto';
      } else {
        b.g.removeAttribute('role');
        b.g.setAttribute('tabindex', '-1');
        b.g.removeAttribute('aria-label');
        b.g.style.cursor = 'default';
        b.g.style.pointerEvents = 'none';
        if (b.hv) b.hv = false;
      }
      if (Math.abs(nt - b.tgt) > 0.01) {
        const up = nt > b.tgt;
        b.tgt = nt;
        b.wait = now + (up ? r * 40 : (SLOTS - 1 - r) * 18);
      }
    });
    kickRef.current();
  }, [tasks]);

  const counts = useMemo(() => {
    const c: Record<SkylineStatus, number> = { done: 0, review: 0, doing: 0, open: 0 };
    tasks.forEach((t) => (c[t.status] += 1));
    return c;
  }, [tasks]);

  const mood =
    tasks.length === 0
      ? 'Belum ada tugas, kota masih kosong'
      : pct < 25
      ? 'Kota sepi: banyak tugas menumpuk'
      : pct < 60
      ? 'Mulai tumbuh'
      : pct < 100
      ? 'Hampir megah'
      : 'Kota megah terbangun!';

  return (
    <div className="rounded-[18px] border border-[var(--c2)] bg-[var(--c0)]/90 p-4 sm:p-6 space-y-3">
      <style>{CSS}</style>

      <svg
        ref={svgRef}
        className="fw-sky-svg"
        viewBox="-150 -200 300 370"
        role="group"
        aria-label="Kota isometrik progres tugas tim, satu gedung mewakili satu tugas"
      />

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-mono text-[var(--c3)]">
        {(['done', 'review', 'doing', 'open'] as SkylineStatus[]).map((s) => (
          <span key={s}>
            {STATUS_GLYPH[s]} {STATUS_LABEL[s]} <strong className="text-[var(--c4)]">{counts[s]}</strong>
          </span>
        ))}
      </div>

      <p className="text-center text-xs font-mono text-[var(--c3)] min-h-[1.25rem]" aria-live="polite">
        {tip || mood}
      </p>
      {tasks.length > SLOTS && (
        <p className="text-center text-[11px] font-mono text-[var(--c3)]/70">
          +{tasks.length - SLOTS} tugas lain tidak tampil di kota (maks. {SLOTS})
        </p>
      )}
    </div>
  );
}
'use client';

/*
 * FairWorks Background Engine — port dari prototipe "ruang-tim".
 * Garis mengalir 4 suasana (landing / auth / dashboard / team), bereaksi ke kursor.
 * Dilengkapi rem otomatis:
 *  - pause saat tab tak terlihat (visibilitychange)
 *  - auto-degrade: frame lambat -> turunkan DPR -> gambar statis
 *  - prefers-reduced-motion -> render statis sekali
 */

import React, { useEffect, useRef } from 'react';

export type BackgroundMood = 'landing' | 'auth' | 'dashboard' | 'room' | 'laporan';

const M = 48; // titik per garis
let BASE_LINES = 26;

export function LineBackgroundEngine({ mood }: { mood: BackgroundMood }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const ease = (p: number) => p * p * p * (p * (p * 6 - 15) + 10);
    const hs = (n: number) => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    type Scene = 'landing' | 'auth' | 'dashboard' | 'team';
    const norm = (m: BackgroundMood): Scene =>
      m === 'auth' ? 'auth' : m === 'dashboard' || m === 'laporan' ? 'dashboard' : m === 'room' ? 'team' : 'landing';

    let W = 0,
      H = 0,
      DPR = 1,
      L = BASE_LINES;
    let F: Float32Array, T: Float32Array, R: Float32Array;
    let cur: Scene = norm(mood);
    let tr = 1,
      tStart = 0,
      raf = 0,
      ready = false,
      last = 0,
      slow = 0,
      capDPR = 1.5,
      rzT: ReturnType<typeof setTimeout> | undefined;
    let mx = 0,
      my = 0,
      act = 0,
      want = 0,
      px = 0,
      py = 0,
      tpx = 0,
      tpy = 0;
    let t0 = 0;
    let dead = false;

    const ev = (n: Scene, i: number, j: number, t: number, out: Float32Array) => {
      const u = j / (M - 1);
      const q = i / (L - 1);
      const m = Math.min(W, H);
      const bx = (u * 1.2 - 0.1) * W;
      const by =
        H * (0.1 + 0.8 * q) +
        Math.sin(u * 5 + t * 0.5 + i * 0.19) * H * 0.05 * (0.6 + 0.4 * Math.sin(i * 0.31 + t * 0.2)) +
        Math.sin(u * 12 - t * 0.35 + i * 0.4) * H * 0.012;
      let ex = bx;
      let ey = by;
      if (n === 'auth') {
        const dx = bx - W / 2;
        const dy = by - H / 2;
        const d = Math.sqrt(dx * dx + dy * dy) / (m * 0.46);
        const th = (3.4 + 0.5 * Math.sin(t * 0.4)) * Math.exp(-d * d);
        const c = Math.cos(th);
        const sn = Math.sin(th);
        ex = W / 2 + dx * c - dy * sn;
        ey = H / 2 + dx * sn + dy * c;
      } else if (n === 'dashboard') {
        const d = (u - ((t * 0.09) % 1.5 - 0.25)) / 0.13;
        ex = bx;
        ey =
          H / 2 +
          (q - 0.5) * H * 0.88 * (0.78 * Math.cos(u * 3.8 + t * 0.42) + 0.22 * Math.cos(u * 8 - t * 0.3 + q * 1.5)) +
          Math.sin(u * 2.2 + q * 2.4 + t * 0.3) * H * 0.07 -
          H * 0.24 * Math.exp(-d * d) * Math.sin(q * 3.1416);
      } else if (n === 'team') {
        const y0 = H / 2 + (by - H / 2) * (0.22 + 0.78 * Math.pow(Math.abs(u - 0.5) * 2, 1.4));
        ex = bx;
        ey = y0 + Math.sin(u * 6.2832 + q * 4 + t * 0.4) * H * 0.03;
      }
      const k = (i * M + j) * 2;
      out[k] = ex;
      out[k + 1] = ey;
    };

    const fill = (A: Float32Array, n: Scene, t: number) => {
      for (let i = 0; i < L; i++) for (let j = 0; j < M; j++) ev(n, i, j, t, A);
    };

    const layout = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      L = BASE_LINES;
      DPR = Math.min(window.devicePixelRatio || 1, capDPR);
      cv!.width = Math.round(W * DPR);
      cv!.height = Math.round(H * DPR);
      F = new Float32Array(L * M * 2);
      T = new Float32Array(L * M * 2);
      R = new Float32Array(L * M * 2);
      fill(R, cur, 0);
      tr = 1;
    };

    const draw = (t: number) => {
      const D = new Float32Array(R.length);
      D.set(R);
      if (act > 0.01) {
        const rad = Math.max(120, Math.min(W, H) * 0.2);
        for (let k = 0; k < D.length; k += 2) {
          const dx = D[k] - mx;
          const dy = D[k + 1] - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < rad && d > 0.1) {
            let pw = 1 - d / rad;
            pw = pw * pw * 46 * act;
            D[k] += (dx / d) * pw;
            D[k + 1] += (dy / d) * pw;
          }
        }
      }
      ctx!.setTransform(DPR, 0, 0, DPR, px * DPR, py * DPR);
      ctx!.clearRect(-60, -60, W + 120, H + 120);
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';
      ctx!.strokeStyle = 'rgb(232,232,236)';
      const AL = [0.1, 0.24, 0.15, 0.3];
      const LW = [0.8, 1.2, 0.9, 1.3];
      for (let gi = 0; gi < 4; gi++) {
        ctx!.globalAlpha = AL[gi];
        ctx!.lineWidth = LW[gi];
        ctx!.beginPath();
        for (let i = gi; i < L; i += 4) {
          const k = i * M * 2;
          ctx!.moveTo(D[k], D[k + 1]);
          for (let j = 1; j < M - 1; j++) {
            const a = k + j * 2;
            const b = a + 2;
            ctx!.quadraticCurveTo(D[a], D[a + 1], (D[a] + D[b]) / 2, (D[a + 1] + D[b + 1]) / 2);
          }
          ctx!.lineTo(D[k + (M - 1) * 2], D[k + (M - 1) * 2 + 1]);
        }
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
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
      } else R.set(T);
      draw(t);
    };

    const frame = (now: number) => {
      raf = window.requestAnimationFrame(frame);
      if (!t0) t0 = now;
      // Auto-degrade: kalau frame terus lambat, turunkan DPR; kalau masih lambat, garis sedikit.
      if (last) {
        slow = now - last > 38 ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 45 && capDPR > 1) {
          capDPR = 1;
          slow = 0;
          layout();
        } else if (slow > 45 && BASE_LINES > 12) {
          BASE_LINES = 12;
          slow = 0;
          layout();
        }
      }
      last = now;
      step(now, (now - t0) / 1800);
    };

    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf && !reduce) {
        last = 0;
        raf = window.requestAnimationFrame(frame);
      }
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      want = 1;
      tpx = (e.clientX - W / 2) * 0.03;
      tpy = (e.clientY - H / 2) * 0.03;
    };
    const onLeave = () => {
      want = 0;
      tpx = 0;
      tpy = 0;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        want = 0;
        tpx = 0;
        tpy = 0;
      }
    };
    const onResize = () => {
      clearTimeout(rzT);
      rzT = setTimeout(() => {
        layout();
        if (reduce) step(0, 2);
      }, 120);
    };
    const onVis = () => {
      if (reduce) return;
      if (document.hidden) stop();
      else start();
    };

    layout();
    ready = true;

    if (window.innerWidth < 640) BASE_LINES = Math.min(BASE_LINES, 18);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);

    if (reduce) step(0, 2);
    else start();

    // Ganti suasana dengan transisi morf
    const applyMood = () => {
      const n = norm(mood);
      if (!ready || n === cur) return;
      if (!reduce) {
        F.set(R);
        tr = 0;
        tStart = performance.now();
      } else tr = 1;
      cur = n;
      if (reduce) step(0, 2);
    };
    applyMood();

    return () => {
      dead = true;
      stop();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      clearTimeout(rzT);
      void hs; void dead;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 block h-full w-full opacity-55" />;
}

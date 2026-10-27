'use client';

import React, { useEffect, useRef } from 'react';

export type BackgroundMood = 'landing' | 'auth' | 'dashboard' | 'room' | 'laporan';

interface LineBackgroundEngineProps {
  mood: BackgroundMood;
}

export function LineBackgroundEngine({ mood }: LineBackgroundEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{
    cur: string;
    setMood: (m: string) => void;
  } | null>(null);

  // Smooth mood morphing when view changes
  useEffect(() => {
    const targetMood = mood === 'room' ? 'team' : mood === 'laporan' ? 'team' : mood;
    if (stateRef.current) {
      stateRef.current.setMood(targetMood);
    }
  }, [mood]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const context = ctx;
    const canvasElement = cv;

    // Persis parameter Galeri-Komponen.html Tambahan 14 (Line Background)
    const L = 30;
    const M = 56;
    const DUR = 2400;
    let W = 0;
    let H = 0;
    let cur = mood === 'room' ? 'team' : mood === 'laporan' ? 'team' : mood;
    let tr = 1;
    let tStart = 0;
    let t0 = 0;
    let vis = true;
    let rzT: any = 0;
    let mx = -999;
    let my = -999;
    let act = 0;
    let want = 0;
    let ex = 0;
    let ey = 0;
    let raf = 0;

    const F = new Float32Array(L * M * 2);
    const T = new Float32Array(L * M * 2);
    const R = new Float32Array(L * M * 2);
    const D = new Float32Array(L * M * 2);

    function hs(n: number) {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    }

    function ease(p: number) {
      return p * p * p * (p * (p * 6 - 15) + 10);
    }

    // Persis fungsi formula ev di Galeri-Komponen.html
    function ev(n: string, i: number, j: number, t: number) {
      const u = j / (M - 1);
      const q = i / (L - 1);
      const m = Math.min(W, H);
      const bx = (u * 1.2 - 0.1) * W;
      const by =
        H * (0.1 + 0.8 * q) +
        Math.sin(u * 5 + t * 0.5 + i * 0.19) * H * 0.05 * (0.6 + 0.4 * Math.sin(i * 0.31 + t * 0.2)) +
        Math.sin(u * 12 - t * 0.35 + i * 0.4) * H * 0.012;

      if (n === 'landing') {
        ex = bx;
        ey = by;
        return;
      }
      if (n === 'auth') {
        // pusaran: garis belakang mengikuti garis depan, makin ke tengah makin melingkar
        const dx = bx - W / 2;
        const dy = by - H / 2;
        const d = Math.sqrt(dx * dx + dy * dy) / (m * 0.46);
        const th = (3.4 + 0.5 * Math.sin(t * 0.4)) * Math.exp(-d * d);
        const c = Math.cos(th);
        const sn = Math.sin(th);
        ex = W / 2 + dx * c - dy * sn;
        ey = H / 2 + dx * sn + dy * c;
        return;
      }
      if (n === 'dashboard') {
        // pita berpilin: lebar pita berputar dan menyempit di simpul
        const d = (u - (((t * 0.09) % 1.5) - 0.25)) / 0.13;
        ex = bx;
        ey =
          H / 2 +
          (q - 0.5) * H * 0.88 * (0.78 * Math.cos(u * 3.8 + t * 0.42) + 0.22 * Math.cos(u * 8 - t * 0.3 + q * 1.5)) +
          Math.sin(u * 2.2 + q * 2.4 + t * 0.3) * H * 0.07 -
          H * 0.24 * Math.exp(-d * d) * Math.sin(q * 3.1416);
        return;
      }
      // team / room / laporan: helai berkumpul di tengah lalu melebar
      const y0 = H / 2 + (by - H / 2) * (0.22 + 0.78 * Math.pow(Math.abs(u - 0.5) * 2, 1.4));
      ex = bx;
      ey = y0 + Math.sin(u * 6.2832 + q * 4 + t * 0.4) * H * 0.03;
    }

    function fill(A: Float32Array, n: string, t: number) {
      let k = 0;
      for (let i = 0; i < L; i++) {
        for (let j = 0; j < M; j++) {
          ev(n, i, j, t);
          k = (i * M + j) * 2;
          A[k] = ex;
          A[k + 1] = ey;
        }
      }
    }

    function draw() {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      for (let k = 0; k < D.length; k += 2) {
        D[k] = R[k];
        D[k + 1] = R[k + 1];
        if (act > 0.01) {
          const dx = D[k] - mx;
          const dy = D[k + 1] - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160 && d > 0.1) {
            let pw = 1 - d / 160;
            pw = pw * pw * 46 * act;
            D[k] += (dx / d) * pw;
            D[k + 1] += (dy / d) * pw;
          }
        }
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, W, H);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = 'rgb(232,232,236)';

      for (let i = 0; i < L; i++) {
        const k = i * M * 2;
        context.globalAlpha = 0.1 + 0.26 * hs(i * 1.7);
        context.lineWidth = 0.8 + 0.5 * hs(i * 3.1);
        context.beginPath();
        context.moveTo(D[k], D[k + 1]);
        for (let j = 1; j < M - 1; j++) {
          const a = k + j * 2;
          const b = a + 2;
          context.quadraticCurveTo(D[a], D[a + 1], (D[a] + D[b]) / 2, (D[a + 1] + D[b + 1]) / 2);
        }
        context.lineTo(D[k + (M - 1) * 2], D[k + (M - 1) * 2 + 1]);
        context.stroke();
      }
      context.globalAlpha = 1;
    }

    function step(now: number, t: number) {
      act += ((want ? 1 : 0) - act) * 0.05;
      fill(T, cur, t);
      if (tr < 1) {
        const p = Math.max(0, Math.min(1, (now - tStart) / DUR));
        const e = ease(p);
        for (let k = 0; k < R.length; k += 2) {
          R[k] = F[k] + (T[k] - F[k]) * e;
          R[k + 1] = F[k + 1] + (T[k + 1] - F[k + 1]) * e;
        }
        if (p >= 1) tr = 1;
      } else {
        R.set(T);
      }
      draw();
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!vis || !W) return;
      if (!t0) t0 = now;
      step(now, (now - t0) / 1800);
    }

    function layout() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      if (!w || !h) return false;
      W = w;
      H = h;
      canvasElement.width = Math.round(w * dpr);
      canvasElement.height = Math.round(h * dpr);
      return true;
    }

    function setMoodState(newMood: string) {
      if (newMood === cur) return;
      if (W) {
        F.set(R);
        tr = 0;
        tStart = performance.now();
      } else {
        tr = 1;
      }
      cur = newMood;
    }

    stateRef.current = {
      cur,
      setMood: setMoodState,
    };

    const handlePointerMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      want = 1;
    };

    const handlePointerLeave = () => {
      want = 0;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);

    const handleResize = () => {
      clearTimeout(rzT);
      rzT = setTimeout(() => {
        layout();
      }, 100);
    };
    window.addEventListener('resize', handleResize);

    const handleVisibility = () => {
      vis = !document.hidden;
      if (vis) {
        t0 = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    layout();
    if (W) {
      fill(R, cur, 0);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
}

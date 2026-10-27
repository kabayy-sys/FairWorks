'use client';

import React, { useEffect, useRef } from 'react';

export type BackgroundMood = 'landing' | 'auth' | 'dashboard' | 'room' | 'laporan';

interface LineBackgroundEngineProps {
  mood: BackgroundMood;
}

export function LineBackgroundEngine({ mood }: LineBackgroundEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 26 lines as specified in DESIGN.md §2
    const numLines = 26;
    const lines: { offset: number; speed: number; amplitude: number }[] = [];
    for (let i = 0; i < numLines; i++) {
      lines.push({
        offset: i * 25,
        speed: 0.0015 + i * 0.0001,
        amplitude: 30 + (i % 5) * 15,
      });
    }

    let time = 0;

    const render = () => {
      // Smooth mouse follow
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      ctx.clearRect(0, 0, width, height);
      time += 0.012;

      // Color --c4 is #e8e8ec, --c1 is #202024
      ctx.strokeStyle = '#e8e8ec';
      ctx.lineWidth = 1;

      const spacing = height / (numLines + 1);

      for (let i = 0; i < numLines; i++) {
        const line = lines[i];
        ctx.beginPath();
        const yBase = spacing * (i + 1);

        for (let x = 0; x <= width; x += 30) {
          let wave = 0;
          const t = time * line.speed * 800 + line.offset;

          if (mood === 'landing') {
            // Free flowing, gentle wave
            wave = Math.sin(x * 0.003 + t) * line.amplitude + Math.cos(x * 0.002 - t) * (line.amplitude * 0.5);
          } else if (mood === 'auth') {
            // Converging to center
            const centerX = width / 2;
            const distFromCenter = Math.abs(x - centerX);
            const factor = Math.max(0, 1 - distFromCenter / (width * 0.6));
            wave = Math.sin(x * 0.005 + t) * (line.amplitude * factor * 1.5) + Math.cos(t * 2) * 15;
          } else if (mood === 'dashboard') {
            // Cross flowing wide waves
            wave = Math.sin(x * 0.004 + t * 1.2) * (line.amplitude * 1.2) + Math.cos(x * 0.001 + t) * 20;
          } else if (mood === 'room') {
            // Side scraping, structured middle
            const distEdges = Math.min(x, width - x);
            const edgeFactor = Math.min(1, distEdges / 200);
            wave = Math.sin(x * 0.002 + t) * (line.amplitude * 0.8) * edgeFactor;
          } else {
            // Laporan: nearly static, calm
            wave = Math.sin(x * 0.001 + t * 0.2) * 10;
          }

          // Mouse repulsion effect (radius 20% viewport)
          const dx = x - mouseRef.current.x;
          const dy = (yBase + wave) - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = width * 0.2;
          let pushY = 0;
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 35;
            pushY = (dy / dist) * force;
          }

          const finalY = yBase + wave + pushY;

          if (x === 0) {
            ctx.moveTo(x, finalY);
          } else {
            ctx.lineTo(x, finalY);
          }
        }

        // Variable opacity per line for depth
        const alpha = 0.08 + (i % 3) * 0.04;
        ctx.strokeStyle = `rgba(232, 232, 236, ${alpha})`;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mood]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}

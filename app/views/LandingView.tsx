'use client';

import React, { useRef, useState } from 'react';

interface LandingViewProps {
  onStart: () => void;
}

export function LandingView({ onStart }: LandingViewProps) {
  const stepsRef = useRef<HTMLDivElement | null>(null);
  const [hlStyle, setHlStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
  }>({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });

  const handlePointerEnter = (e: React.PointerEvent<HTMLLIElement>) => {
    const li = e.currentTarget;
    setHlStyle({
      left: li.offsetLeft,
      top: li.offsetTop,
      width: li.offsetWidth,
      height: li.offsetHeight,
      opacity: 1,
    });
  };

  const handlePointerLeave = () => {
    setHlStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="fw-stagger mx-auto w-full max-w-[1040px] px-[max(20px,env(safe-area-inset-left,0px))]">
      {/* Hero Section */}
      <section className="pt-[clamp(40px,13vh,110px)]">
        <h1 className="max-w-[18ch] text-[clamp(34px,5.6vw,60px)] font-semibold leading-[1.08] tracking-[-0.03em]">
          Bagi tugas kelompok dengan adil, dan lihat progresnya.
        </h1>
        <p className="mt-5 max-w-[46ch] text-[18px] text-[var(--c3)]">
          Buat ruangan, beri poin pada tiap tugas, lalu biarkan teman satu kelompok memeriksa hasilnya. Poin baru
          dihitung setelah disetujui.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onStart}
            className="landing-mb"
          >
            Mulai sekarang
          </button>
          <button
            type="button"
            onClick={() => stepsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="cursor-pointer rounded-full border border-transparent px-[22px] py-[14px] text-[15px] font-normal text-[var(--c3)] transition-colors hover:text-[var(--c4)] focus-visible:outline-2 focus-visible:outline-[var(--c4)] focus-visible:outline-offset-3"
          >
            Lihat cara kerjanya
          </button>
        </div>
      </section>

      {/* Cara kerjanya */}
      <section ref={stepsRef} className="mt-[clamp(56px,12vh,104px)] scroll-mt-20">
        <h2 className="mb-6 text-[clamp(28px,4vw,42px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          Cara kerjanya
        </h2>
        <ol
          onPointerLeave={handlePointerLeave}
          className="relative grid grid-cols-1 gap-1 border-t border-[var(--c1)] pt-7 md:grid-cols-3"
        >
          {/* Highlight pill hover effect */}
          <span
            style={{
              left: `${hlStyle.left}px`,
              top: `${hlStyle.top}px`,
              width: `${hlStyle.width}px`,
              height: `${hlStyle.height}px`,
              opacity: hlStyle.opacity,
            }}
            className="pointer-events-none absolute rounded-[16px] bg-[var(--c1)] transition-[left,top,width,height,opacity] duration-250 ease-[cubic-bezier(0.3,0.7,0.2,1)] motion-reduce:transition-none"
          />

          <li
            onPointerEnter={handlePointerEnter}
            className="relative z-10 rounded-[16px] p-5"
          >
            <b className="mr-2.5 font-[family-name:var(--font-geist-mono)] text-[13px] font-medium align-middle text-[var(--c3)]">
              1
            </b>
            <h3 className="inline text-[18px] font-semibold align-middle">Buat ruangan</h3>
            <p className="mt-2 text-[14.5px] text-[var(--c3)]">
              Anda jadi ketua. Teman bergabung lewat kode enam karakter.
            </p>
          </li>

          <li
            onPointerEnter={handlePointerEnter}
            className="relative z-10 rounded-[16px] p-5"
          >
            <b className="mr-2.5 font-[family-name:var(--font-geist-mono)] text-[13px] font-medium align-middle text-[var(--c3)]">
              2
            </b>
            <h3 className="inline text-[18px] font-semibold align-middle">Bagi tugas dan poin</h3>
            <p className="mt-2 text-[14.5px] text-[var(--c3)]">
              Tiap tugas punya poin dan tenggat. Siapa pun bisa mengambil tugas yang masih terbuka.
            </p>
          </li>

          <li
            onPointerEnter={handlePointerEnter}
            className="relative z-10 rounded-[16px] p-5"
          >
            <b className="mr-2.5 font-[family-name:var(--font-geist-mono)] text-[13px] font-medium align-middle text-[var(--c3)]">
              3
            </b>
            <h3 className="inline text-[18px] font-semibold align-middle">Teman memeriksa</h3>
            <p className="mt-2 text-[14.5px] text-[var(--c3)]">
              Setelah hasil dikirim, mayoritas teman perlu menyetujui sebelum poinnya dihitung.
            </p>
          </li>
        </ol>
      </section>

      {/* Footer */}
      <footer className="py-14 text-[13px] text-[var(--c3)]">
        Kerja kelompok yang adil dan terlihat — gratis untuk kelompok kuliah mana pun.
      </footer>
    </div>
  );
}

'use client';

import React from 'react';

interface LandingViewProps {
  onStart: () => void;
}

// Landing (ruang-tim §landing): hero + 3 langkah + catatan kaki.
export function LandingView({ onStart }: LandingViewProps) {
  const steps = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className="fw-stagger mx-auto w-full max-w-[1040px] px-5">
      <div className="pb-0 pt-[clamp(40px,13vh,110px)]">
        <h1 className="max-w-[18ch] text-[clamp(34px,5.6vw,60px)] font-semibold leading-[1.08] tracking-[-0.03em]">
          Bagi tugas kelompok dengan adil, dan lihat progresnya.
        </h1>
        <p className="mt-5 max-w-[46ch] text-[18px] text-[var(--c3)]">
          Buat ruangan, beri poin pada tiap tugas, lalu biarkan teman satu kelompok memeriksa hasilnya. Poin baru
          dihitung setelah disetujui.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <button
            onClick={onStart}
            className="btn solid lg cursor-pointer rounded-[10px] border border-[var(--c4)] bg-[var(--c4)] px-[22px] py-[13px] text-[15px] font-medium text-[var(--c0)] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Mulai sekarang
          </button>
          <button
            onClick={() => steps.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="cursor-pointer rounded-[10px] border border-transparent px-[22px] py-[13px] text-[15px] text-[var(--c3)] transition-colors hover:text-[var(--c4)]"
          >
            Lihat cara kerjanya
          </button>
        </div>
      </div>

      <div ref={steps} className="mt-[clamp(56px,12vh,104px)] scroll-mt-20">
        <h2 className="mb-3.5 text-[14px] font-medium text-[var(--c3)]">Cara kerjanya</h2>
        <ol className="grid grid-cols-1 gap-6 border-t border-[var(--c1)] pt-7 md:grid-cols-3 md:gap-8">
          <li>
            <b className="font-[family-name:var(--font-geist-mono)] text-[13px] font-medium text-[var(--c3)]">1</b>
            <h3 className="mb-1.5 mt-2 text-[17px] font-semibold">Buat ruangan</h3>
            <p className="text-[14.5px] text-[var(--c3)]">Anda jadi ketua. Teman bergabung lewat kode enam karakter.</p>
          </li>
          <li>
            <b className="font-[family-name:var(--font-geist-mono)] text-[13px] font-medium text-[var(--c3)]">2</b>
            <h3 className="mb-1.5 mt-2 text-[17px] font-semibold">Bagi tugas dan poin</h3>
            <p className="text-[14.5px] text-[var(--c3)]">
              Tiap tugas punya poin dan tenggat. Siapa pun bisa mengambil tugas yang masih terbuka.
            </p>
          </li>
          <li>
            <b className="font-[family-name:var(--font-geist-mono)] text-[13px] font-medium text-[var(--c3)]">3</b>
            <h3 className="mb-1.5 mt-2 text-[17px] font-semibold">Teman memeriksa</h3>
            <p className="text-[14.5px] text-[var(--c3)]">
              Setelah hasil dikirim, mayoritas teman perlu menyetujui sebelum poinnya dihitung.
            </p>
          </li>
        </ol>
      </div>

      <div className="pb-14 pt-14 text-[13px] text-[var(--c3)]">
        Kerja kelompok yang adil dan terlihat — gratis untuk kelompok kuliah mana pun.
      </div>
    </div>
  );
}

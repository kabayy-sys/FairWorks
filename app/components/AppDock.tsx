'use client';

import React from 'react';

export type DockTarget = 'landing' | 'auth' | 'dashboard' | 'room' | 'laporan';

interface AppDockProps {
  loggedIn: boolean;
  current: DockTarget;
  onNavigate: (t: DockTarget) => void;
}

// Dock pill di bawah: navigasi antar halaman.
// Belum login: cuma Landing + Masuk. Sudah login: Dashboard · Ruangan · Laporan.
export function AppDock({ loggedIn, current, onNavigate }: AppDockProps) {
  const items: { key: DockTarget; label: string }[] = loggedIn
    ? [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'room', label: 'Ruangan' },
        { key: 'laporan', label: 'Laporan' },
      ]
    : [
        { key: 'landing', label: 'Landing' },
        { key: 'auth', label: 'Masuk' },
      ];

  return (
    <nav
      aria-label="Navigasi halaman"
      className="fixed bottom-2 left-1/2 z-30 flex max-w-[calc(100%-24px)] -translate-x-1/2 gap-0.5 overflow-x-auto rounded-[10px] border border-[var(--c1)] bg-[var(--c0)]/90 p-0.5 backdrop-blur-sm"
      style={{ bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))', scrollbarWidth: 'none' }}
    >
      {items.map((it) => {
        const on = current === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onNavigate(it.key)}
            aria-pressed={on}
            className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] transition-colors active:scale-[0.97] ${
              on ? 'bg-[var(--c1)] text-[var(--c4)]' : 'text-[var(--c3)] hover:text-[var(--c4)]'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

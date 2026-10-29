'use client';

import React from 'react';

interface AppHeaderProps {
  loggedIn: boolean;
  userName: string;
  onGoLanding: () => void;
  onOpenName: () => void;
  onSignOut: () => void;
}

// Header atas: brand + chip user. Ringan — tanpa backdrop-blur berat (cuma semi transparan saat scroll).
export function AppHeader({ loggedIn, userName, onGoLanding, onOpenName, onSignOut }: AppHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const el = document.getElementById('fw-scroll');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-20 border-b transition-colors duration-300 ${
        scrolled ? 'border-[var(--c1)] bg-[var(--c0)]/85 backdrop-blur-sm' : 'border-transparent'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-5">
        <button onClick={onGoLanding} className="flex cursor-pointer items-center gap-2.5 bg-none p-0 text-[16px] font-semibold tracking-tight">
          <i className="relative block h-5 w-5 rounded-md bg-[var(--c4)]" aria-hidden>
            <span className="absolute inset-1.5 rounded-full bg-[var(--c0)]" />
          </i>
          FairWorks
        </button>

        {loggedIn && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenName}
              title="Ubah nama panggilan"
              className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--c2)] px-2 py-1 text-[13px] text-[var(--c3)] transition-colors hover:text-[var(--c4)]"
            >
              <i className="grid h-6 w-6 place-items-center rounded-full border border-[var(--c2)] bg-[var(--c1)] text-[11px] font-semibold not-italic text-[var(--c4)]">
                {userName.slice(0, 2).toUpperCase()}
              </i>
              {userName}
            </button>
            <button
              onClick={onSignOut}
              className="btn text !border-transparent cursor-pointer !text-[13px] text-[var(--c3)] hover:text-[var(--c4)]"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

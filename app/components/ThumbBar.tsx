'use client';

import React from 'react';
import { BackgroundMood } from './LineBackgroundEngine';
import { Btn } from './DesignSystem';

interface ThumbBarProps {
  view?: BackgroundMood;
  onNavigate?: (view: BackgroundMood) => void;
  primaryText: string;
  onPrimaryClick: () => void;
  secondaryText?: string;
  onSecondaryClick?: () => void;
}

export function ThumbBar({
  primaryText,
  onPrimaryClick,
  secondaryText,
  onSecondaryClick,
}: ThumbBarProps) {
  return (
    <nav
      aria-label="Aksi Utama"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--c0)]/90 backdrop-blur-md border-t border-[var(--c1)] px-4 py-2.5 sm:py-3 transition-all duration-300 shadow-[0_-8px_24px_rgba(0,0,0,0.15)] pointer-events-auto"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="max-w-md w-full mx-auto flex items-center justify-between gap-3">
        {secondaryText ? (
          <button
            type="button"
            onClick={onSecondaryClick}
            className="text-[var(--c3)] hover:text-[var(--c4)] active:scale-95 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg hover:bg-[var(--c1)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>{secondaryText}</span>
          </button>
        ) : (
          <span className="text-xs eyebrow text-[var(--c3)] tracking-wider">FairWorks</span>
        )}

        <Btn
          variant="solid"
          onClick={onPrimaryClick}
          className="min-h-[44px] px-6 sm:px-8 py-2 text-xs sm:text-sm font-medium active:scale-[0.98] transition-transform shadow-md"
        >
          {primaryText}
        </Btn>
      </div>
    </nav>
  );
}

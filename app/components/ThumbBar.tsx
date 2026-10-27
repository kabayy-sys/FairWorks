'use client';

import React from 'react';
import { BackgroundMood } from './LineBackgroundEngine';
import { Btn } from './DesignSystem';

interface ThumbBarProps {
  view: BackgroundMood;
  onNavigate: (view: BackgroundMood) => void;
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
    <nav aria-label="Aksi Utama" className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 sm:pb-6 flex justify-center bg-gradient-to-t from-[var(--c0)] via-[var(--c0)]/80 to-transparent">
      <div className="panel flex items-center gap-3 px-5 py-3 max-w-lg w-full justify-between bg-[var(--c0)]/90 border border-[var(--c2)] shadow-2xl backdrop-blur-xl">
        {secondaryText ? (
          <button
            onClick={onSecondaryClick}
            className="text-[var(--c3)] hover:text-[var(--c4)] text-sm font-medium px-4 py-2 transition-colors cursor-pointer"
          >
            {secondaryText}
          </button>
        ) : (
          <span className="text-xs eyebrow text-[var(--c3)]">FairWorks</span>
        )}

        <Btn variant="solid" onClick={onPrimaryClick} className="min-h-[44px] px-8 py-2.5 text-sm">
          {primaryText}
        </Btn>
      </div>
    </nav>
  );
}

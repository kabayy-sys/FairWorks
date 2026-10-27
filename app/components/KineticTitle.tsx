'use client';

import React, { useEffect, useState } from 'react';

interface KineticTitleProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'div';
}

export function KineticTitle({ text, className = '', tag = 'h1' }: KineticTitleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const words = text.split(' ');

  const Component = tag;

  return (
    <Component className={`flex flex-wrap gap-x-[0.25em] overflow-hidden ${className}`}>
      {words.map((word, wIdx) => (
        <span key={wIdx} className="inline-flex overflow-hidden pb-[0.05em]">
          <span
            className="inline-block transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.2,1)]"
            style={{
              transform: mounted ? 'translateY(0) scale(1)' : 'translateY(110%) scale(0.98)',
              filter: mounted ? 'blur(0px)' : 'blur(8px)',
              transitionDelay: `${wIdx * 65}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </Component>
  );
}

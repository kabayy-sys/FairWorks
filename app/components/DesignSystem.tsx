'use client';

import React, { useEffect } from 'react';

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'ghost' | 'outline';
  loading?: boolean;
}

export function Btn({
  children,
  variant = 'solid',
  loading = false,
  className = '',
  disabled,
  ...props
}: BtnProps) {
  const baseStyle =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[48px] px-6 rounded-full text-[15px]';

  const variants = {
    solid: 'bg-[var(--c4)] text-[var(--c0)] hover:opacity-90 active:scale-[0.98]',
    ghost: 'bg-transparent text-[var(--c4)] hover:bg-[var(--c1)] active:scale-[0.98]',
    outline: 'border border-[var(--c2)] text-[var(--c4)] hover:bg-[var(--c1)] active:scale-[0.98]',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Memproses…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function Panel({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`panel p-6 sm:p-8 backdrop-blur-md ${className}`}>{children}</div>;
}

interface TrackProps {
  done: number; // 0 - 100 percentage or count
  review?: number;
  doing?: number;
  open?: number;
  total?: number;
  size?: 'normal' | 'large';
}

export function Track({ done = 0, review = 0, doing = 0, open = 0, total, size = 'normal' }: TrackProps) {
  const sum = total ? Math.max(1, total) : Math.max(1, done + review + doing + open);
  const pDone = (done / sum) * 100;
  const pReview = (review / sum) * 100;
  const pDoing = (doing / sum) * 100;
  const pOpen = (open / sum) * 100;

  const height = size === 'large' ? 'h-[22px]' : 'h-[8px]';

  return (
    <div className={`w-full bg-[var(--c1)] rounded-full overflow-hidden flex ${height} transition-all duration-1000 ease-[var(--ease)]`}>
      {pDone > 0 && <div style={{ width: `${pDone}%` }} className="bg-[var(--c4)] h-full transition-all duration-1000" title="Selesai" />}
      {pReview > 0 && (
        <div
          style={{
            width: `${pReview}%`,
            backgroundImage: 'repeating-linear-gradient(45deg, var(--c3), var(--c3) 4px, var(--c1) 4px, var(--c1) 8px)',
          }}
          className="h-full transition-all duration-1000"
          title="Perlu disetujui"
        />
      )}
      {pDoing > 0 && <div style={{ width: `${pDoing}%` }} className="bg-[var(--c2)] h-full transition-all duration-1000" title="Dikerjakan" />}
      {pOpen > 0 && <div style={{ width: `${pOpen}%` }} className="bg-transparent border-dashed border-l border-[var(--c2)] h-full transition-all duration-1000" title="Bisa diambil" />}
    </div>
  );
}

interface AvatarItem {
  name: string;
  role?: string;
  isOwner?: boolean;
}

export function AvatarStack({ members }: { members: AvatarItem[] }) {
  return (
    <div className="flex items-center -space-x-3 overflow-hidden py-1">
      {members.map((m, i) => (
        <div
          key={i}
          title={`${m.name} ${m.role ? `(${m.role})` : ''}`}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--c1)] text-[var(--c4)] font-medium text-xs border-2 border-[var(--c0)] relative group cursor-pointer ${
            m.isOwner ? 'ring-2 ring-[var(--c4)]' : ''
          }`}
        >
          {m.name.substring(0, 2).toUpperCase()}
          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[var(--c1)] text-[var(--c4)] text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 border border-[var(--c2)]">
            {m.name} {m.isOwner && '· Ketua'}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--c0)]/84 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative panel w-full max-w-md p-6 bg-[var(--c0)] border border-[var(--c2)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--c4)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--c3)] hover:text-[var(--c4)] text-xl px-2">
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => {
      if (onClose) onClose();
    }, 2600);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 z-50 bg-[var(--c4)] text-[var(--c0)] px-5 py-3 rounded-full font-medium text-sm shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-[var(--c0)]/60 hover:text-[var(--c0)]">
          ✕
        </button>
      )}
    </div>
  );
}

export function Odometer({ value }: { value: number | string }) {
  return <span className="tabular-nums font-semibold tracking-tight">{value}</span>;
}

interface TabsPillProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function TabsPill({ tabs, activeTab, onChange }: TabsPillProps) {
  return (
    <div className="flex bg-[var(--c1)] p-1 rounded-full gap-1 border border-[var(--c2)] overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              isActive ? 'bg-[var(--c4)] text-[var(--c0)] shadow-sm' : 'text-[var(--c3)] hover:text-[var(--c4)]'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Field({ label, error, className = '', ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="eyebrow text-xs">{label}</label>}
      <input
        className={`w-full bg-[var(--c1)] border border-[var(--c2)] rounded-[var(--radius-input)] px-4 py-3 text-[var(--c4)] placeholder-[var(--c3)] focus:outline-none focus:border-[var(--c4)] transition-all text-[15px] ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--c3)]">{error}</span>}
    </div>
  );
}

// 10. Drawer (DESIGN.md v2 §3: varian Panel, geser dari kanan 0.5s)
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[var(--c0)]/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-[var(--c0)] border-l border-[var(--c2)] p-6 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-right duration-500 overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--c1)]">
          <h3 className="text-lg font-semibold text-[var(--c4)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--c3)] hover:text-[var(--c4)] text-lg px-2">
            ✕
          </button>
        </div>
        <div className="flex-1 space-y-6">{children}</div>
      </div>
    </div>
  );
}

// 11. TaskRow (DESIGN.md v2 §1.5 & §5.4: Baris satu kolom)
interface TaskRowProps {
  status: 'done' | 'review' | 'doing' | 'open';
  title: string;
  points: number;
  assignee?: string;
  dueText?: string;
  reviewStatus?: string;
  isOverdue?: boolean;
  onClick?: () => void;
}

export function TaskRow({
  status,
  title,
  points,
  assignee,
  dueText,
  reviewStatus,
  isOverdue,
  onClick,
}: TaskRowProps) {
  const statusIcons = {
    done: '✓',
    review: '◨',
    doing: '◐',
    open: '○',
  };

  const statusColors = {
    done: 'text-[var(--c4)]',
    review: 'text-[var(--c3)]',
    doing: 'text-[var(--c2)]',
    open: 'text-[var(--c3)]',
  };

  return (
    <div
      onClick={onClick}
      className="p-3.5 sm:p-4 rounded-[14px] bg-[var(--c1)] border border-[var(--c2)]/50 hover:border-[var(--c4)] flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`text-base font-bold select-none ${statusColors[status]}`}>{statusIcons[status]}</span>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-[var(--c4)] truncate">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-[var(--c3)] pt-0.5">
            <span className="font-mono text-[var(--c4)]">{points}p</span>
            <span>·</span>
            <span className="truncate">{assignee || 'Bisa diambil'}</span>
            {reviewStatus && (
              <>
                <span>·</span>
                <span className="font-mono">{reviewStatus}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isOverdue && (
          <span className="px-2 py-0.5 bg-[var(--c4)] text-[var(--c0)] font-mono text-[11px] font-semibold rounded">
            lewat 2 hari
          </span>
        )}
        {dueText && !isOverdue && (
          <span className="font-mono text-xs text-[var(--c3)]">{dueText}</span>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Field, Btn } from '../components/DesignSystem';

interface AuthViewProps {
  onSignInGoogle: () => void;
  onSendMagic: (email: string) => Promise<boolean>;
}

// Auth (ruang-tim §masuk): kartu tengah. Google utama, tautan email cadangan.
export function AuthView({ onSignInGoogle, onSendMagic }: AuthViewProps) {
  const [email, setEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    if (!em) return;
    setSending(true);
    setErr(null);
    const ok = await onSendMagic(em);
    setSending(false);
    if (ok) setSent(true);
    else setErr('Gagal mengirim tautan. Periksa email lalu coba lagi.');
  };

  return (
    <div className="grid min-h-[calc(100vh-190px)] place-items-center px-5 py-10">
      <div className="fw-stagger relative z-0 grid w-full max-w-[380px] gap-4">
        {/* lingkar redup di belakang form */}
        <span aria-hidden className="absolute -inset-x-[90px] -inset-y-[70px] -z-10 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--c0)_92%,transparent),transparent)]" />

        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">Masuk ke FairWorks</h1>
        <p className="-mt-2 text-[14px] text-[var(--c3)]">Lanjutkan ke ruangan kelompok Anda.</p>

        <button
          onClick={onSignInGoogle}
          className="mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[10px] border border-[var(--c4)] bg-white py-3 text-[15px] font-medium text-[#0B0B0D] transition-all hover:brightness-95 active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Lanjutkan dengan Google
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--c1)]" />
          <span className="text-[12px] text-[var(--c3)]">atau</span>
          <span className="h-px flex-1 bg-[var(--c1)]" />
        </div>

        {!sent ? (
          <form onSubmit={submit} className="grid gap-4">
            <Field
              label="Masuk via tautan email"
              type="email"
              placeholder="kamu@kampus.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="min-h-[20px] text-[13.5px] text-[var(--c4)]">{err}</div>
            <Btn type="submit" variant="solid" loading={sending} className="w-full">
              Kirim tautan masuk
            </Btn>
          </form>
        ) : (
          <div className="grid gap-3 rounded-[10px] border border-[var(--c2)] bg-[var(--c1)]/60 p-4 text-left">
            <p className="text-sm text-[var(--c4)]">
              Cek email <strong>{email}</strong> — tautan masuk sudah dikirim. Buka dari perangkat yang sama agar sesi
              langsung tersambung.
            </p>
            <Btn variant="outline" onClick={() => setSent(false)} className="min-h-[36px] w-full text-xs">
              Gunakan email lain
            </Btn>
          </div>
        )}

        <p className="text-center text-[13px] text-[var(--c3)]">
          Pertama kali masuk? Nama panggilan ditanyakan setelah ini.
        </p>
      </div>
    </div>
  );
}

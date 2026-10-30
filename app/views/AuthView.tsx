'use client';

import React from 'react';

interface AuthViewProps {
  onSignInGoogle: () => void;
  onBack?: () => void;
  busy?: boolean;
}

export function AuthView({ onSignInGoogle, onBack, busy = false }: AuthViewProps) {
  return (
    <div className="grid min-h-[calc(100vh-var(--hd)-110px)] place-items-center px-5 py-8">
      <div className="auth-view-wrap">
        {onBack && (
          <button className="auth-view-back" type="button" onClick={onBack}>
            ← Kembali
          </button>
        )}

        <section className="auth-view-card">
          <h1>Masuk ke FairWorks</h1>
          <p className="sub">Lanjutkan ke ruangan kelompok Anda.</p>

          <button
            className="auth-view-g"
            id="gb"
            type="button"
            onClick={onSignInGoogle}
            disabled={busy}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span id="gl">{busy ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
          </button>

          <p className="hint">Tautan masuk (magic link) akan dikirim ke email akun Google Anda.</p>
        </section>

        <ul className="auth-view-trust">
          <li>
            <svg viewBox="0 0 24 24">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span>Tanpa kata sandi</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            <span>Poin dihitung setelah teman menyetujui</span>
          </li>
        </ul>

        <p className="auth-view-note">
          Pertama kali masuk? Nama panggilan ditanyakan setelah ini.
          <br />
          Dengan masuk, Anda menyetujui <a href="#syarat">Syarat</a> dan <a href="#privasi">Privasi</a>.
        </p>
      </div>
    </div>
  );
}

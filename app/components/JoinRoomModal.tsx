'use client';

import React, { useState } from 'react';
import { Modal, Field, Btn } from './DesignSystem';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void> | void;
}

export function JoinRoomModal({ isOpen, onClose, onJoin }: JoinRoomModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Kode ruangan wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onJoin(cleanCode);
      setCode('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal bergabung ke ruangan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Masuk Ruangan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-[var(--c3)] font-mono leading-relaxed">
          Masukkan 6-7 digit kode undangan yang diberikan oleh ketua tim (contoh: <span className="text-[var(--c4)]">RPD-4K7</span>).
        </p>

        <Field
          label="Kode Ruangan"
          placeholder="RPD-4K7"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError('');
          }}
          autoFocus
          required
        />

        {error && <p className="text-xs text-[var(--c4)] font-mono">{error}</p>}

        <Btn type="submit" loading={loading} className="w-full">
          Gabung Sekarang
        </Btn>
      </form>
    </Modal>
  );
}

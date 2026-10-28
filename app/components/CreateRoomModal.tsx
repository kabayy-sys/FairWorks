'use client';

import React, { useState } from 'react';
import { Modal, Field, Btn } from './DesignSystem';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (nama: string) => Promise<void> | void;
}

export function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [nama, setNama] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNama = nama.trim();
    if (!cleanNama) {
      setError('Nama ruangan wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onCreate(cleanNama);
      setNama('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat ruangan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Ruangan Baru">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-[var(--c3)] font-mono leading-relaxed">
          Satu nama untuk ruang kerja kelompokmu. Kode unik (seperti <span className="text-[var(--c4)]">RPD-4K7</span>) akan digenerate otomatis.
        </p>

        <Field
          label="Nama Ruangan (Wajib)"
          placeholder="Contoh: Riset Pasar Digital"
          value={nama}
          onChange={(e) => {
            setNama(e.target.value);
            if (error) setError('');
          }}
          autoFocus
          required
        />

        {error && <p className="text-xs text-[var(--c4)] font-mono">{error}</p>}

        <Btn type="submit" loading={loading} className="w-full">
          Buat Ruangan Sekarang
        </Btn>
      </form>
    </Modal>
  );
}

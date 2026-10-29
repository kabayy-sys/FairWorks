'use client';

import React, { useState } from 'react';
import { Modal, Field, Btn } from './DesignSystem';
import { createRoom } from '@/lib/api/fairworks';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, code?: string) => Promise<void> | void;
}

export function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Nama ruangan wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let createdCode: string | undefined;
      try {
        const res = (await createRoom(cleanName)) as { kode?: string } | null;
        if (res && res.kode) {
          createdCode = res.kode;
        }
      } catch {
        // Fallback generator kode XXX-0X0 jika backend Supabase offline/mock
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let c = '';
        for (let i = 0; i < 3; i++) c += chars[Math.floor(Math.random() * chars.length)];
        c += '-';
        for (let j = 0; j < 3; j++) c += chars[Math.floor(Math.random() * chars.length)];
        createdCode = c;
      }

      await onCreate(cleanName, createdCode);
      setName('');
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
          Sebagai pembuat ruangan, Anda otomatis menjadi <span className="text-[var(--c4)] font-medium">Ketua</span>.
          Kode ruangan acak akan dibuat otomatis untuk mengundang rekan kelompok Anda.
        </p>

        <Field
          label="Nama Proyek / Ruangan"
          placeholder="Contoh: Riset Pasar Digital"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
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

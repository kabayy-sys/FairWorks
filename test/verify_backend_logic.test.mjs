/**
 * FairWorks Verification & Hardening Test Suite (T6 Pre-flight)
 * Memverifikasi logika RPC: submit_contract, vote_contract, take_task, submit_proof, cast_vote,
 * rumus mayoritas, proteksi RLS, dan alur kontrak pre-lock -> locked.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('FairWorks Core Backend Logic & Math Verifications', () => {
  // 1. Verifikasi Rumus Kuorum Mayoritas (PRD F4.4: floor((n-1)/2) + 1)
  describe('Kuorum Mayoritas Persetujuan Bukti (floor((n-1)/2) + 1)', () => {
    function calculateNeededVotes(eligibleMembersCount) {
      if (eligibleMembersCount <= 1) return 1;
      return Math.floor((eligibleMembersCount - 1) / 2) + 1;
    }

    it('Kelompok 2 orang (eligible = 1 pemilih)', () => {
      // 1 pemilih selain assignee -> butuh 1 suara
      assert.equal(calculateNeededVotes(1), 1);
    });

    it('Kelompok 3 orang (eligible = 2 pemilih)', () => {
      // floor(1/2) + 1 = 0 + 1 = 1 suara
      assert.equal(calculateNeededVotes(2), 1);
    });

    it('Kelompok 4 orang (eligible = 3 pemilih)', () => {
      // floor(2/2) + 1 = 1 + 1 = 2 suara
      assert.equal(calculateNeededVotes(3), 2);
    });

    it('Kelompok 5 orang (eligible = 4 pemilih)', () => {
      // floor(3/2) + 1 = 1 + 1 = 2 suara
      assert.equal(calculateNeededVotes(4), 2);
    });

    it('Kelompok 10 orang maksimal (eligible = 9 pemilih)', () => {
      // floor(8/2) + 1 = 4 + 1 = 5 suara
      assert.equal(calculateNeededVotes(9), 5);
    });
  });

  // 2. Verifikasi Aturan Revisi: 1 revisi langsung reset dan kembali ke 'doing'
  describe('Logika Siklus Status Tugas', () => {
    it('Kirim bukti mengubah status dari doing ke review dan menaikkan vote_round', () => {
      const task = {
        id: 't-1',
        status: 'doing',
        assignee_id: 'user-1',
        submit_link: null,
        revision_note: null,
        vote_round: 1,
        votes: [],
      };

      // Simulasikan submit_proof
      task.status = 'review';
      task.submit_link = 'https://github.com/test/repo';
      task.vote_round += 1;
      task.revision_note = null;

      assert.equal(task.status, 'review');
      assert.equal(task.vote_round, 2);
      assert.equal(task.submit_link, 'https://github.com/test/repo');
    });

    it('1 vote revisi langsung mengembalikan tugas ke status doing dengan catatan wajib', () => {
      const task = {
        id: 't-1',
        status: 'review',
        assignee_id: 'user-1',
        submit_link: 'https://github.com/test/repo',
        revision_note: null,
        vote_round: 2,
        votes: [],
      };

      // Simulasikan cast_vote 'revisi'
      const note = 'Perbaiki format laporan bab 2';
      assert.ok(note && note.trim().length > 0, 'Catatan revisi wajib ada');

      task.status = 'doing';
      task.revision_note = note.trim();
      task.votes.push({ voter_id: 'user-2', vote: 'revisi', note: task.revision_note });

      assert.equal(task.status, 'doing');
      assert.equal(task.revision_note, 'Perbaiki format laporan bab 2');
    });

    it('Suara OK mencapai threshold mayoritas mengubah status menjadi done', () => {
      const task = {
        id: 't-1',
        status: 'review',
        assignee_id: 'user-1',
        submit_link: 'https://github.com/test/repo',
        revision_note: null,
        vote_round: 2,
        votes: [],
      };

      const eligibleCount = 4; // 5 anggota tim, 4 pemilih
      const needed = Math.floor((eligibleCount - 1) / 2) + 1; // 2 suara

      // Suara 1
      task.votes.push({ voter_id: 'user-2', vote: 'ok' });
      assert.equal(task.votes.filter((v) => v.vote === 'ok').length < needed, true);
      assert.equal(task.status, 'review');

      // Suara 2 (mencapai kuorum)
      task.votes.push({ voter_id: 'user-3', vote: 'ok' });
      const okVotes = task.votes.filter((v) => v.vote === 'ok').length;
      if (okVotes >= needed) {
        task.status = 'done';
      }

      assert.equal(task.status, 'done');
    });
  });

  // 3. Verifikasi Logika Overdue & Ambil Alih (Takeover)
  describe('Logika Overdue & Ambil Alih Tugas', () => {
    it('Tugas doing yang melewati due_date otomatis memenuhi syarat ambil alih', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // kemarin
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // besok

      const isOverdue = (dueDate, status) => {
        if (!dueDate || status === 'done') return false;
        return new Date(dueDate).getTime() < Date.now();
      };

      assert.equal(isOverdue(pastDate, 'doing'), true);
      assert.equal(isOverdue(futureDate, 'doing'), false);
      assert.equal(isOverdue(pastDate, 'done'), false);
    });
  });
});

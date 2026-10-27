'use client';

import React, { useState } from 'react';
import { BackgroundMood, LineBackgroundEngine } from './components/LineBackgroundEngine';
import { KineticTitle } from './components/KineticTitle';
import {
  Btn,
  Panel,
  Track,
  AvatarStack,
  Modal,
  Toast,
  Odometer,
  TabsPill,
  Field,
  Drawer,
  TaskRow,
} from './components/DesignSystem';
import { ThumbBar } from './components/ThumbBar';

export default function Home() {
  const [currentView, setCurrentView] = useState<BackgroundMood | 'story'>('landing');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Semua');
  const [emailInput, setEmailInput] = useState('');
  const [authSent, setAuthSent] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  const activeMood: BackgroundMood = currentView === 'story' ? 'landing' : (currentView as BackgroundMood);

  return (
    <main className="min-h-screen relative overflow-x-hidden pb-28 text-[var(--c4)] bg-[var(--c0)] selection:bg-[var(--c4)] selection:text-[var(--c0)]">
      {/* Background Engine */}
      <LineBackgroundEngine mood={activeMood} />

      {/* Top Header / View Switcher Bar for Audit & Review */}
      <header className="relative z-30 border-b border-[var(--c1)] bg-[var(--c0)]/80 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="eyebrow text-xs font-bold text-[var(--c4)]">FairWorks</span>
          <span className="text-[var(--c3)] text-[11px] font-mono">v2 (Radical Simplicity)</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {(['landing', 'auth', 'dashboard', 'room', 'laporan', 'story'] as const).map((v) => {
            const isActive = currentView === v;
            return (
              <button
                key={v}
                onClick={() => setCurrentView(v)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  isActive ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold' : 'bg-[var(--c1)] text-[var(--c3)] hover:text-[var(--c4)]'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main View Container */}
      <div
        className={`relative z-10 mx-auto px-4 sm:px-6 pt-8 sm:pt-12 transition-all duration-700 ease-[var(--ease)] ${
          currentView === 'room' || currentView === 'laporan' ? 'max-w-[760px]' : 'max-w-5xl'
        }`}
      >
        {/* ==============================================================
            VIEW 1: LANDING — 2 Blok (DESIGN.md v2 §5.1)
           ============================================================== */}
        {currentView === 'landing' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center pt-4">
              <div className="space-y-5">
                <span className="eyebrow text-xs">Kerja kelompok yang adil dan terlihat</span>
                <KineticTitle text="Kerja kelompok yang kelihatan progresnya." className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight" />
                <p className="text-[var(--c3)] text-base max-w-md leading-relaxed">
                  Ketua bagi poin. Anggota ambil. Teman setujui. Dosen terima laporan tanpa login.
                </p>
                <div className="pt-2">
                  <Btn onClick={() => setCurrentView('auth')}>Mulai gratis</Btn>
                </div>
              </div>

              {/* Preview Box Ringkas (1 blok preview di kanan) */}
              <Panel className="space-y-4 border border-[var(--c2)] bg-[var(--c0)]/90 shadow-2xl">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[var(--c4)] font-medium">Riset Pasar Digital</span>
                  <span className="text-[var(--c3)]">40% selesai</span>
                </div>
                <Track done={40} review={30} doing={20} open={10} />
                <div className="space-y-2 pt-2">
                  <div className="p-3 bg-[var(--c1)] rounded-[12px] flex justify-between items-center text-xs border border-[var(--c2)]/40">
                    <span className="text-[var(--c4)] truncate">▸ Tulis bab latar belakang</span>
                    <span className="font-mono text-[var(--c3)]">10p</span>
                  </div>
                  <div className="p-3 bg-[var(--c1)] rounded-[12px] flex justify-between items-center text-xs border border-[var(--c2)]/40">
                    <span className="text-[var(--c4)] truncate">▸ Rangkum 10 jurnal acuan</span>
                    <span className="font-mono text-[var(--c3)]">15p</span>
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* ==============================================================
            VIEW 2: AUTH — Satu Field (DESIGN.md v2 §5.2)
           ============================================================== */}
        {currentView === 'auth' && (
          <div className="min-h-[65vh] flex items-center justify-center animate-in fade-in duration-700">
            <Panel className="w-full max-w-sm space-y-5 text-center bg-[var(--c0)]/95 border border-[var(--c2)] shadow-2xl p-7">
              <div className="space-y-1.5 text-left">
                <span className="eyebrow text-xs">Selamat datang</span>
                <h2 className="text-2xl font-semibold tracking-tight">Masuk ke FairWorks</h2>
              </div>

              {!authSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (emailInput) setAuthSent(true);
                  }}
                  className="space-y-4 text-left pt-2"
                >
                  <Field
                    label="Email"
                    type="email"
                    placeholder="kamu@kampus.id"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                  <Btn type="submit" className="w-full">
                    Kirim tautan masuk
                  </Btn>
                </form>
              ) : (
                <div className="space-y-3 py-3 bg-[var(--c1)] rounded-[14px] p-5 border border-[var(--c2)] text-left">
                  <p className="text-sm text-[var(--c4)]">
                    Cek email kamu <strong className="text-white">({emailInput})</strong>, tautan masuk sudah dikirim.
                  </p>
                  <Btn variant="outline" onClick={() => setAuthSent(false)} className="w-full text-xs min-h-[36px]">
                    Kirim ulang
                  </Btn>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ==============================================================
            VIEW 3: DASHBOARD — 2 Zona: Baris Mono + Daftar Kolom (DESIGN.md v2 §5.3)
           ============================================================== */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-700 max-w-2xl mx-auto">
            {/* Zona 1: Sapaan + Statistik satu baris mono */}
            <div className="space-y-1.5 border-b border-[var(--c1)] pb-5">
              <span className="eyebrow text-xs">Kamis, 29 Oktober</span>
              <h2 className="text-2xl font-semibold">
                Halo, Ayu. <span className="font-mono text-sm text-[var(--c3)] font-normal ml-2">2 ruangan · 3 tugas · 45 poin</span>
              </h2>
            </div>

            {/* Zona 2: Daftar baris ruangan satu kolom */}
            <div className="space-y-2.5">
              <Panel
                className="cursor-pointer hover:border-[var(--c4)] transition-all p-4.5 space-y-3"
                onClick={() => setCurrentView('room')}
              >
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium">Riset Pasar Digital</span>
                  <span className="font-mono text-xs text-[var(--c3)]">RPD-4K7</span>
                </div>
                <Track done={40} review={30} doing={20} open={10} />
                <div className="flex justify-between text-xs text-[var(--c3)] font-mono">
                  <span>40% selesai</span>
                  <span>5 anggota</span>
                </div>
              </Panel>

              <Panel
                className="cursor-pointer hover:border-[var(--c4)] transition-all p-4.5 space-y-3"
                onClick={() => setCurrentView('room')}
              >
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium">Proyek Akhir Basis Data</span>
                  <span className="font-mono text-xs text-[var(--c3)]">PBD-9M2</span>
                </div>
                <Track done={20} doing={30} open={50} />
                <div className="flex justify-between text-xs text-[var(--c3)] font-mono">
                  <span>20% selesai</span>
                  <span>4 anggota</span>
                </div>
              </Panel>

              {/* Baris dashed masuk kode */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="p-4 rounded-[18px] border border-dashed border-[var(--c2)] hover:bg-[var(--c1)]/40 flex items-center justify-between text-xs text-[var(--c3)] cursor-pointer transition-all"
              >
                <span>+ Masuk kode ruangan…</span>
                <span className="font-mono text-[var(--c4)]">Gabung</span>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            VIEW 4: ROOM — 2 Zona: Strip Progres + TaskRow 1 Kolom (DESIGN.md v2 §5.4)
           ============================================================== */}
        {currentView === 'room' && (
          <div className="space-y-5 animate-in fade-in duration-700">
            {/* Zona 1: Kepala + Strip Progres tipis */}
            <div className="space-y-3 border-b border-[var(--c1)] pb-5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 font-mono text-[var(--c3)]">
                  <span>RPD-4K7</span>
                  <span>·</span>
                  <span className="text-[var(--c4)]">Ketua</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="font-mono text-xs text-[var(--c3)] hover:text-[var(--c4)] flex items-center gap-1 cursor-pointer"
                >
                  Anggota <span className="text-[10px]">⌄</span>
                </button>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight">Riset Pasar Digital</h2>

              {/* Strip Tipis Progres: angka 20-28px, bar 8px (Hard Rule §1.5) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-lg font-semibold text-[var(--c4)]">
                    <Odometer value="40%" />
                  </span>
                  <span className="text-[var(--c3)]">16/40 poin</span>
                </div>
                <Track done={40} review={30} doing={20} open={10} />
              </div>

              {/* 2 Tab saja (DESIGN.md v2 §3 #3) */}
              <div className="pt-2">
                <TabsPill tabs={['Semua', 'Bisa diambil']} activeTab={activeTab} onChange={setActiveTab} />
              </div>
            </div>

            {/* Zona 2: Satu Kolom Daftar Tugas (TaskRow) */}
            <div className="space-y-2">
              <TaskRow
                status="review"
                title="Rangkum 10 jurnal relevan"
                points={15}
                assignee="Bima"
                reviewStatus="1/2 setuju"
                onClick={() => setToastMessage('Membuka modal detail suara tugas...')}
              />
              <TaskRow
                status="doing"
                title="Kumpulkan 30 responden survei"
                points={20}
                assignee="Dimas"
                isOverdue={true}
                onClick={() => setToastMessage('Tugas lewat tenggat — siap diambil alih!')}
              />
              <TaskRow
                status="doing"
                title="Olah data di spreadsheet"
                points={15}
                assignee="Esa"
                dueText="5 hari lagi"
                onClick={() => setToastMessage('Membuka detail tugas...')}
              />
              <TaskRow
                status="open"
                title="Desain slide presentasi akhir"
                points={10}
                dueText="Bisa diambil"
                onClick={() => setToastMessage('Ambil tugas ini dengan 1 ketukan!')}
              />
              <TaskRow
                status="done"
                title="Tulis bab latar belakang"
                points={10}
                assignee="Ayu"
                dueText="Selesai"
                onClick={() => setToastMessage('Tugas sudah disetujui penuh.')}
              />
            </div>
          </div>
        )}

        {/* ==============================================================
            VIEW 5: LAPORAN PUBLIK — 1 Kolom Ringkas (DESIGN.md v2 §5.5)
           ============================================================== */}
        {currentView === 'laporan' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <Panel className="space-y-5 border border-[var(--c2)] p-6">
              <div className="space-y-1.5 border-b border-[var(--c1)] pb-4">
                <span className="eyebrow text-xs">Laporan Kontribusi</span>
                <h2 className="text-2xl font-semibold">Riset Pasar Digital</h2>
                <p className="text-xs font-mono text-[var(--c3)]">RPD-4K7 · 5 orang · 40 poin · Terkunci 30 Okt</p>
              </div>

              {/* Pie / Strip Kontribusi ringkas */}
              <div className="space-y-2">
                <span className="eyebrow text-[11px]">Kontribusi Anggota</span>
                <p className="text-xs text-[var(--c3)] font-mono leading-relaxed">
                  Ayu 25% · Bima 30% · Citra 20% · Dimas 15% · Esa 10%
                </p>
                <Track done={25} review={30} doing={20} open={25} />
              </div>

              {/* Timeline ringkas */}
              <div className="space-y-2 pt-2 border-t border-[var(--c1)]">
                <span className="eyebrow text-[11px]">Linimasa</span>
                <div className="space-y-1.5 text-xs text-[var(--c3)] font-mono">
                  <div>30 Okt ● Kontrak terkunci</div>
                  <div>02 Nov ● Ayu ambil bab latar belakang</div>
                  <div>04 Nov ● Bima kirim rangkuman jurnal</div>
                  <div>05 Nov ● 3 orang menyetujui tugas</div>
                </div>
              </div>

              {/* Tabel / Baris Bukti Selesai */}
              <div className="space-y-2 pt-2 border-t border-[var(--c1)]">
                <span className="eyebrow text-[11px]">Hasil & Bukti</span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-3 bg-[var(--c1)] rounded-[12px] flex justify-between items-center">
                    <span>✓ Tulis bab latar belakang (10p) · Ayu</span>
                    <span className="font-mono text-[var(--c3)]">[Dokumen]</span>
                  </div>
                  <div className="p-3 bg-[var(--c1)] rounded-[12px] flex justify-between items-center">
                    <span>✓ Rangkum 10 jurnal (15p) · Bima</span>
                    <span className="font-mono text-[var(--c3)]">[GitHub]</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-[11px] font-mono text-[var(--c3)]">
                Dibuat dengan FairWorks · Tanpa Login
              </div>
            </Panel>
          </div>
        )}

        {/* ==============================================================
            BONUS: STORY VIEW — Showcase 8 Komponen v2
           ============================================================== */}
        {currentView === 'story' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="space-y-1">
              <span className="eyebrow text-xs">Design System v2 Showcase</span>
              <h2 className="text-2xl font-semibold">8 Komponen Inti + Drawer</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel className="space-y-3">
                <h4 className="text-sm font-semibold">1 & 2. Btn & Kinetic Title</h4>
                <KineticTitle text="Judul Animasi Halus" className="text-lg font-semibold" tag="h3" />
                <div className="flex gap-2">
                  <Btn onClick={() => setToastMessage('Tombol ditekan!')}>Solid</Btn>
                  <Btn variant="outline" onClick={() => setStoryModalOpen(true)}>Buka Modal</Btn>
                </div>
              </Panel>

              <Panel className="space-y-3">
                <h4 className="text-sm font-semibold">3 & 4. Track (8px) & TabsPill</h4>
                <TabsPill tabs={['Semua', 'Bisa diambil']} activeTab="Semua" onChange={() => {}} />
                <Track done={50} review={25} doing={15} open={10} />
              </Panel>

              <Panel className="space-y-3">
                <h4 className="text-sm font-semibold">5 & 8. AvatarStack & Odometer</h4>
                <AvatarStack
                  members={[
                    { name: 'Ayu', isOwner: true },
                    { name: 'Bima' },
                    { name: 'Citra' },
                  ]}
                />
                <p className="text-xs text-[var(--c3)] font-mono">
                  Progres: <Odometer value="82.4%" />
                </p>
              </Panel>

              <Panel className="space-y-3">
                <h4 className="text-sm font-semibold">Drawer & TaskRow</h4>
                <Btn variant="outline" onClick={() => setIsDrawerOpen(true)} className="text-xs">
                  Buka Drawer Anggota
                </Btn>
              </Panel>
            </div>
          </div>
        )}
      </div>

      {/* Global Toast */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Global Modal (Join Kode) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Masuk Ruangan">
        <div className="space-y-4">
          <Field label="Kode Ruangan" placeholder="Contoh: RPD-4K7" />
          <Btn onClick={() => { setIsModalOpen(false); setToastMessage('Berhasil masuk ruangan!'); }} className="w-full">
            Gabung
          </Btn>
        </div>
      </Modal>

      {/* Story Modal */}
      <Modal isOpen={storyModalOpen} onClose={() => setStoryModalOpen(false)} title="Modal Keputusan">
        <div className="space-y-4">
          <p className="text-xs text-[var(--c3)] leading-relaxed">
            Satu layar, satu keputusan. Modal aksi selalu satu keputusan fokus.
          </p>
          <Btn onClick={() => { setStoryModalOpen(false); setToastMessage('Aksi tersimpan'); }} className="w-full">
            Konfirmasi
          </Btn>
        </div>
      </Modal>

      {/* Drawer Anggota & Aktivitas (DESIGN.md v2 §1.5 #2 & §5.4) */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Anggota & Aktivitas">
        <div className="space-y-4">
          <span className="eyebrow text-[11px]">Anggota Tim</span>
          <AvatarStack
            members={[
              { name: 'Ayu', isOwner: true },
              { name: 'Bima' },
              { name: 'Citra' },
              { name: 'Dimas' },
              { name: 'Esa' },
            ]}
          />
          <div className="space-y-2 pt-2 text-xs font-mono text-[var(--c3)]">
            <div className="flex justify-between"><span>Ayu (Ketua)</span><span>10p</span></div>
            <div className="flex justify-between"><span>Bima</span><span>15p</span></div>
            <div className="flex justify-between"><span>Citra</span><span>0p</span></div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[var(--c1)]">
          <span className="eyebrow text-[11px]">Aktivitas Terkini</span>
          <div className="space-y-2 text-xs text-[var(--c3)] font-mono">
            <div>Bima kirim bukti jurnal</div>
            <div>Ayu setujui tugas rangkum</div>
            <div>Kontrak terkunci otomatis</div>
          </div>
        </div>
      </Drawer>

      {/* Thumb Bar — Satu Aksi Utama Kontekstual (DESIGN.md v2 §4) */}
      {currentView !== 'laporan' && (
        <ThumbBar
          view={activeMood}
          onNavigate={setCurrentView}
          primaryText={
            currentView === 'landing'
              ? 'Mulai gratis'
              : currentView === 'auth'
              ? 'Kirim tautan masuk'
              : currentView === 'dashboard'
              ? 'Buat ruangan'
              : 'Ambil tugas'
          }
          onPrimaryClick={() => {
            if (currentView === 'landing') setCurrentView('auth');
            else if (currentView === 'auth') setAuthSent(true);
            else if (currentView === 'dashboard') setToastMessage('Buka form buat ruangan');
            else setToastMessage('Tugas diambil!');
          }}
          secondaryText={currentView === 'room' ? 'Anggota' : undefined}
          onSecondaryClick={() => {
            if (currentView === 'room') setIsDrawerOpen(true);
          }}
        />
      )}
    </main>
  );
}

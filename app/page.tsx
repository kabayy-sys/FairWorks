'use client';

import React, { useState } from 'react';
import { BackgroundMood, LineBackgroundEngine } from './components/LineBackgroundEngine';
import { KineticTitle } from './components/KineticTitle';
import { Btn, Panel, Track, AvatarStack, Modal, Toast, Odometer, TabsPill, Field } from './components/DesignSystem';
import { ThumbBar } from './components/ThumbBar';

export default function Home() {
  const [currentView, setCurrentView] = useState<BackgroundMood | 'story'>('landing');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Semua');
  const [emailInput, setEmailInput] = useState('');
  const [authSent, setAuthSent] = useState(false);

  // Story demo states
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  const activeMood: BackgroundMood = currentView === 'story' ? 'landing' : (currentView as BackgroundMood);

  return (
    <main className="min-h-screen relative overflow-x-hidden pb-24 text-[var(--c4)] bg-[var(--c0)] selection:bg-[var(--c4)] selection:text-[var(--c0)]">
      {/* Background Engine */}
      <LineBackgroundEngine mood={activeMood} />

      {/* Top Header / View Switcher Bar for Review & Story */}
      <header className="relative z-30 border-b border-[var(--c1)] bg-[var(--c0)]/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="eyebrow text-sm font-bold text-[var(--c4)]">FairWorks</span>
          <span className="text-[var(--c3)] text-xs">/ STACK 2026 GDGoC ITB</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {(['landing', 'auth', 'dashboard', 'room', 'laporan', 'story'] as const).map((v) => {
            const isActive = currentView === v;
            return (
              <button
                key={v}
                onClick={() => setCurrentView(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  isActive ? 'bg-[var(--c4)] text-[var(--c0)] font-semibold' : 'bg-[var(--c1)] text-[var(--c3)] hover:text-[var(--c4)]'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </header>

      {/* View Container with Transition wrapper */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 transition-all duration-700 ease-[var(--ease)]">
        {/* VIEW 1: LANDING */}
        {currentView === 'landing' && (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-8">
              <div className="space-y-6">
                <span className="eyebrow text-xs">Kerja kelompok yang adil dan terlihat</span>
                <KineticTitle text="Kerja kelompok yang kelihatan progresnya." className="text-4xl sm:text-6xl font-semibold leading-tight tracking-tight" />
                <p className="text-[var(--c3)] text-base sm:text-lg max-w-lg leading-relaxed">
                  Ketua membagi tugas berpoin, anggota mengambil porsinya, hasil dihitung setelah disetujui teman. Dosen terima laporan bersih tanpa login.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Btn onClick={() => setCurrentView('auth')}>Mulai gratis</Btn>
                  <Btn variant="outline" onClick={() => setCurrentView('story')}>Lihat contoh komponen</Btn>
                </div>
              </div>

              {/* Preview Card */}
              <Panel className="space-y-6 border border-[var(--c2)] bg-[var(--c0)]/90 shadow-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="eyebrow text-xs">RPD-4K7</span>
                    <h3 className="text-lg font-semibold text-[var(--c4)]">Riset Pasar Digital</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-[var(--c1)] text-xs font-mono rounded-full text-[var(--c3)]">40% selesai</span>
                </div>
                <Track done={40} review={30} doing={20} open={10} size="large" />
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-[var(--c1)] rounded-[12px] border border-[var(--c2)]">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[var(--c4)]" />
                      <span className="text-sm font-medium">Tulis bab latar belakang</span>
                    </div>
                    <span className="text-xs font-mono text-[var(--c3)]">10 poin · Ayu</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--c1)] rounded-[12px] border border-[var(--c2)]">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[var(--c2)]" />
                      <span className="text-sm font-medium">Rangkum 10 jurnal relevan</span>
                    </div>
                    <span className="text-xs font-mono text-[var(--c3)]">15 poin · Bima</span>
                  </div>
                </div>
              </Panel>
            </div>

            {/* 3 Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <Panel className="space-y-3">
                <span className="eyebrow text-xs text-[var(--c4)]">01 / Kontrak</span>
                <h4 className="text-lg font-semibold">Tugas berpoin</h4>
                <p className="text-sm text-[var(--c3)]">Semua sepakat di awal. Tidak ada argumen siapa kerjakan apa di tengah jalan.</p>
              </Panel>
              <Panel className="space-y-3">
                <span className="eyebrow text-xs text-[var(--c4)]">02 / Siklus</span>
                <h4 className="text-lg font-semibold">Porsi bisa diambil</h4>
                <p className="text-sm text-[var(--c3)]">Ambil tugas dengan satu klik. Kalau lewat tenggat, rekan lain bisa ambil alih.</p>
              </Panel>
              <Panel className="space-y-3">
                <span className="eyebrow text-xs text-[var(--c4)]">03 / Verifikasi</span>
                <h4 className="text-lg font-semibold">Disetujui teman</h4>
                <p className="text-sm text-[var(--c3)]">Poin sah setelah diverifikasi mayoritas anggota tim. Adil mutlak.</p>
              </Panel>
            </div>
          </div>
        )}

        {/* VIEW 2: AUTH */}
        {currentView === 'auth' && (
          <div className="min-h-[75vh] flex items-center justify-center animate-in fade-in duration-700">
            <Panel className="w-full max-w-md space-y-6 text-center bg-[var(--c0)]/95 border border-[var(--c2)] shadow-2xl">
              <div className="space-y-2">
                <span className="eyebrow text-xs">Selamat datang</span>
                <h2 className="text-2xl font-semibold tracking-tight">Masuk ke FairWorks</h2>
              </div>

              {!authSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (emailInput) setAuthSent(true);
                  }}
                  className="space-y-4 text-left"
                >
                  <Field
                    label="Email kampus"
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
                <div className="space-y-4 py-4 bg-[var(--c1)] rounded-[16px] p-6 border border-[var(--c2)]">
                  <p className="text-sm text-[var(--c4)]">
                    Cek email kamu <strong className="text-white">({emailInput})</strong>, tautan masuk sudah dikirim. 🤍
                  </p>
                  <Btn variant="outline" onClick={() => setAuthSent(false)} className="w-full text-xs">
                    Kirim ulang / ganti email
                  </Btn>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* VIEW 3: DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-700 pt-4">
            <div className="space-y-1">
              <span className="eyebrow text-xs">Kamis, 29 Oktober 2026</span>
              <h2 className="text-3xl font-semibold tracking-tight">Halo, Ayu. Ini kerja kelompok kamu.</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Panel className="flex flex-col justify-between space-y-2">
                <span className="eyebrow text-xs text-[var(--c3)]">Ruangan aktif</span>
                <span className="text-4xl font-semibold tracking-tight">
                  <Odometer value="2" />
                </span>
              </Panel>
              <Panel className="flex flex-col justify-between space-y-2">
                <span className="eyebrow text-xs text-[var(--c3)]">Tugas saya</span>
                <span className="text-4xl font-semibold tracking-tight">
                  <Odometer value="3" />
                </span>
              </Panel>
              <Panel className="flex flex-col justify-between space-y-2">
                <span className="eyebrow text-xs text-[var(--c3)]">Total poin terkumpul</span>
                <span className="text-4xl font-semibold tracking-tight">
                  <Odometer value="45" />
                </span>
              </Panel>
            </div>

            {/* Ruangan Saya */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Ruangan Kamu</h3>
                <Btn variant="outline" onClick={() => setToastMessage('Fitur buat ruangan dibuka!')} className="text-xs px-4 py-2 min-h-0">
                  + Buat ruangan
                </Btn>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Panel className="space-y-4 cursor-pointer hover:border-[var(--c4)] transition-all" onClick={() => setCurrentView('room')}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="eyebrow text-xs">RPD-4K7</span>
                      <h4 className="text-lg font-semibold">Riset Pasar Digital</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-[var(--c1)] text-xs font-mono rounded-full">40%</span>
                  </div>
                  <Track done={40} review={30} doing={20} open={10} />
                  <div className="flex justify-between items-center text-xs text-[var(--c3)] pt-2 border-t border-[var(--c1)]">
                    <span>5 anggota</span>
                    <span>3 hari lagi</span>
                  </div>
                </Panel>

                <Panel className="space-y-4 border-dashed border-[var(--c2)] flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:bg-[var(--c1)]/50 transition-all" onClick={() => setIsModalOpen(true)}>
                  <span className="text-2xl text-[var(--c3)]">+</span>
                  <span className="text-sm font-medium text-[var(--c4)]">Masuk dengan kode ruangan</span>
                  <span className="text-xs text-[var(--c3)]">Punya kode undangan? Masukkan di sini.</span>
                </Panel>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ROOM */}
        {currentView === 'room' && (
          <div className="space-y-6 animate-in fade-in duration-700 pt-4">
            <div className="flex flex-wrap justify-between items-end gap-4 border-b border-[var(--c1)] pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="eyebrow text-xs">KODE RPD-4K7</span>
                  <span className="px-2 py-0.5 bg-[var(--c1)] text-xs font-mono rounded text-[var(--c3)]">Ketua</span>
                </div>
                <KineticTitle text="Riset Pasar Digital" className="text-3xl font-semibold" tag="h2" />
              </div>
              <AvatarStack
                members={[
                  { name: 'Ayu Pratiwi', role: 'Ketua', isOwner: true },
                  { name: 'Bima Sakti', role: 'Anggota' },
                  { name: 'Citra Kirana', role: 'Anggota' },
                  { name: 'Dimas Anggara', role: 'Anggota' },
                  { name: 'Esa Prakasa', role: 'Anggota' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main task board */}
              <div className="lg:col-span-2 space-y-6">
                <Panel className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-semibold">40%</span>
                      <span className="text-xs text-[var(--c3)] ml-2 font-mono">16/40 poin disetujui</span>
                    </div>
                  </div>
                  <Track done={40} review={30} doing={20} open={10} size="large" />
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--c3)] pt-1">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--c4)]" /> Selesai</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[var(--c3)]" /> Review</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--c2)]" /> Dikerjakan</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-dashed border-[var(--c2)]" /> Bisa diambil</span>
                  </div>
                </Panel>

                <div className="space-y-4">
                  <TabsPill tabs={['Semua', 'Bisa diambil', 'Dikerjakan', 'Perlu disetujui', 'Selesai']} activeTab={activeTab} onChange={setActiveTab} />

                  <div className="space-y-3">
                    <Panel className="flex justify-between items-center p-5 cursor-pointer hover:border-[var(--c4)] transition-all" onClick={() => setToastMessage('Membuka detail tugas...')}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[var(--c3)] border border-[var(--c2)]" />
                          <h4 className="text-base font-semibold">Rangkum 10 jurnal relevan</h4>
                        </div>
                        <p className="text-xs text-[var(--c3)]">Pengumpulan via GitHub · 1/2 suara setuju</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-semibold">15p</span>
                        <p className="text-xs text-[var(--c3)]">Bima</p>
                      </div>
                    </Panel>

                    <Panel className="flex justify-between items-center p-5 cursor-pointer hover:border-[var(--c4)] transition-all" onClick={() => setToastMessage('Membuka detail tugas...')}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[var(--c2)]" />
                          <h4 className="text-base font-semibold">Desain slide presentasi akhir</h4>
                        </div>
                        <p className="text-xs text-[var(--c3)]">Belum ada pengumpulan · ⚠ Lewat 2 hari</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-semibold">10p</span>
                        <p className="text-xs text-[var(--c3)]">—</p>
                      </div>
                    </Panel>
                  </div>
                </div>
              </div>

              {/* Sidebar: members & feed */}
              <div className="space-y-6">
                <Panel className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wider">Aktivitas Realtime</h4>
                  <div className="space-y-3 text-xs text-[var(--c3)] divide-y divide-[var(--c1)]">
                    <div className="pt-2"><strong>Bima</strong> mengirim hasil jurnal</div>
                    <div className="pt-2"><strong>Ayu</strong> menyetujui tugas Rangkum</div>
                    <div className="pt-2"><strong>Ketua</strong> mengunci kontrak</div>
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: LAPORAN PUBLIK */}
        {currentView === 'laporan' && (
          <div className="space-y-8 animate-in fade-in duration-700 pt-4 max-w-4xl mx-auto">
            <Panel className="space-y-6 border border-[var(--c2)]">
              <div className="border-b border-[var(--c1)] pb-6 space-y-2">
                <span className="eyebrow text-xs">Laporan Kontribusi Resmi · Tanpa Login</span>
                <h2 className="text-3xl font-semibold">Riset Pasar Digital</h2>
                <p className="text-sm text-[var(--c3)]">Kode: RPD-4K7 · 5 Anggota · Total 40 Poin · Terkunci 30 Okt 2026</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kontribusi Anggota</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Ayu Pratiwi (Ketua)</span>
                        <span className="font-mono">25% (10p)</span>
                      </div>
                      <Track done={25} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Bima Sakti</span>
                        <span className="font-mono">35% (14p)</span>
                      </div>
                      <Track done={35} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Citra Kirana</span>
                        <span className="font-mono">20% (8p)</span>
                      </div>
                      <Track done={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Linimasa Proyek</h3>
                  <div className="space-y-3 text-xs text-[var(--c3)] font-mono border-l border-[var(--c2)] pl-4">
                    <div>30 Okt — Kontrak terkunci otomatis</div>
                    <div>02 Nov — Ayu ambil tugas latar belakang</div>
                    <div>04 Nov — Bima kirim bukti GitHub</div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* BONUS: STORY VIEW (Halaman Story - contoh pakai semua komponen) */}
        {currentView === 'story' && (
          <div className="space-y-12 animate-in fade-in duration-700 pt-4">
            <div className="space-y-2">
              <span className="eyebrow text-xs">Design System Showcase</span>
              <h2 className="text-3xl font-semibold">Halaman Story — Contoh Pakai Semua Komponen</h2>
              <p className="text-[var(--c3)] text-sm">Sesuai DESIGN.md §3: 8 komponen utama FairWorks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel className="space-y-4">
                <h3 className="text-lg font-semibold">1 & 2. Kinetic Title & Btn</h3>
                <KineticTitle text="Judul Animasi Halus" className="text-xl font-semibold" tag="h3" />
                <div className="flex flex-wrap gap-3">
                  <Btn onClick={() => setToastMessage('Tombol Solid ditekan!')}>Solid Button</Btn>
                  <Btn variant="outline" onClick={() => setIsModalOpen(true)}>Buka Modal</Btn>
                </div>
              </Panel>

              <Panel className="space-y-4">
                <h3 className="text-lg font-semibold">3 & 4. TabsPill & Track</h3>
                <TabsPill tabs={['Semua', 'Aktif', 'Selesai']} activeTab={activeTab} onChange={setActiveTab} />
                <Track done={60} review={20} doing={10} open={10} size="large" />
              </Panel>

              <Panel className="space-y-4">
                <h3 className="text-lg font-semibold">5 & 8. AvatarStack & Odometer</h3>
                <AvatarStack
                  members={[
                    { name: 'Ayu', role: 'Ketua', isOwner: true },
                    { name: 'Bima' },
                    { name: 'Citra' },
                  ]}
                />
                <p className="text-sm text-[var(--c3)]">
                  Total skor: <Odometer value="98.4%" />
                </p>
              </Panel>

              <Panel className="space-y-4">
                <h3 className="text-lg font-semibold">7 & 8. Field Input</h3>
                <Field label="Contoh Input Teks" placeholder="Ketik sesuatu..." />
              </Panel>
            </div>

            <div className="pt-6 text-center">
              <Btn onClick={() => setStoryModalOpen(true)}>Uji Modal & Toast Interaktif</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Global Toast */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Global Modal for Join Code */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Masuk Ruangan">
        <div className="space-y-4">
          <Field label="Kode Ruangan" placeholder="Contoh: RPD-4K7" />
          <Btn onClick={() => { setIsModalOpen(false); setToastMessage('Berhasil masuk ruangan!'); }} className="w-full">
            Gabung Sekarang
          </Btn>
        </div>
      </Modal>

      {/* Story Modal */}
      <Modal isOpen={storyModalOpen} onClose={() => setStoryModalOpen(false)} title="Modal Demo">
        <div className="space-y-4">
          <p className="text-sm text-[var(--c3)]">Ini adalah contoh komponen Modal dari Design System FairWorks.</p>
          <Btn onClick={() => { setStoryModalOpen(false); setToastMessage('Aksi modal berhasil dijalankan!'); }} className="w-full">
            Konfirmasi Aksi
          </Btn>
        </div>
      </Modal>

      {/* Thumb Bar for Bottom Actions */}
      <ThumbBar
        view={activeMood}
        onNavigate={setCurrentView}
        primaryText={currentView === 'landing' ? 'Mulai Gratis' : currentView === 'auth' ? 'Kirim Tautan' : currentView === 'dashboard' ? 'Buat Ruangan' : currentView === 'room' ? 'Ambil Tugas' : 'Bagikan Laporan'}
        onPrimaryClick={() => {
          if (currentView === 'landing') setCurrentView('auth');
          else if (currentView === 'auth') setAuthSent(true);
          else setToastMessage('Aksi utama thumb bar dijalankan!');
        }}
        secondaryText={currentView !== 'landing' && currentView !== 'laporan' ? 'Kembali' : undefined}
        onSecondaryClick={() => {
          if (currentView === 'auth') setCurrentView('landing');
          else if (currentView === 'dashboard') setCurrentView('auth');
          else if (currentView === 'room') setCurrentView('dashboard');
        }}
      />
    </main>
  );
}

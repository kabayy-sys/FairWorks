import { Suspense } from 'react';
import { DossierReport } from '@/app/components/DossierReport';
import { LineBackgroundEngine } from '@/app/components/LineBackgroundEngine';

export const metadata = {
  title: 'Laporan Kontribusi Mahasiswa — FairWorks',
  description: 'Dossier publik kontribusi kerja kelompok untuk dosen tanpa login.',
};

async function ReportContainer({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  return <DossierReport token={resolvedParams.token} />;
}

export default function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <main className="min-h-screen relative overflow-x-hidden py-10 px-4 sm:px-6 text-[var(--c4)] bg-[var(--c0)] selection:bg-[var(--c4)] selection:text-[var(--c0)]">
      {/* Background mood laporan: tenang, nyaris statis (DESIGN.md §2) */}
      <LineBackgroundEngine mood="laporan" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <Suspense
          fallback={
            <div className="p-12 text-center font-mono text-xs text-[var(--c3)] animate-pulse">
              Memuat dossier publik...
            </div>
          }
        >
          <ReportContainer params={params} />
        </Suspense>
      </div>
    </main>
  );
}

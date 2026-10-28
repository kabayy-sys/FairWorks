import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FairWorks — kerja kelompok yang adil dan terlihat",
  description:
    "Ketua membagi tugas berpoin, anggota mengambil porsinya, hasil dihitung setelah disetujui teman satu kelompok. Laporan kontribusi untuk dosen, tanpa login.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

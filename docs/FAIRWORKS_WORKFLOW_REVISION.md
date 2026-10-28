# FairWorks — Spesifikasi Revisi Alur & Perbaikan Desain (Hasil Diskusi Tim)

Dokumen ini disusun berdasarkan hasil evaluasi langsung bersama Raken, Chello, dan Iwan terhadap implementasi MVP FairWorks saat ini. Seluruh temuan masalah, redudansi UI, dan perbaikan alur (*user journey*) dirumuskan secara rinci di sini agar menjadi panduan pegangan bersama seluruh anggota tim.

---

## 1. Daftar Evaluasi & Masalah yang Ditemukan

1. **Responsif Desktop yang Tidak Konsisten:** Tampilan 100% di layar laptop Raken berbeda dengan 100% di layar laptop Chello. Hal ini disebabkan oleh perbedaan resolusi, *display scaling* sistem operasi, dan penggunaan lebar kontainer (`max-w`) yang belum diseragamkan dengan *breakpoint* Tailwind yang kokoh.
2. **Halaman "Story" yang Membingungkan:** Keberadaan halaman *Story* (showcase komponen T1 buatan Chello) di navigasi utama membingungkan pengguna umum dan auditor. Halaman ini harus dipisahkan atau disembunyikan dari rute publik/auditor.
3. **Workflow yang Terasa "Gajelas" (Loncat-loncat):** Alur pembuatan ruangan hingga pengisian tugas sebelumnya terpecah dan tidak membentuk satu garis lurus yang intuitif bagi ketua kelompok.
4. **Redudansi di Dashboard:** Terdapat duplikasi form input kode ruangan dan tombol buat ruangan di beberapa tempat (atas dan bawah), membuat antarmuka terlihat penuh dan membingungkan.
5. **Kurangnya Fluiditas Animasi:** Transisi antar view/menu masih terasa patah-patah atau instan. Animasi harus dibuat saling menyambung (*smooth morphing/sliding*).
6. **Navbar Mobile:** Thumb bar di mobile perlu disempurnakan agar benar-benar ergonomis di bagian bawah layar tanpa menutupi konten penting atau mengalami *overflow*.

---

## 2. Alur Pengguna End-to-End (The New Definitive User Journey)

Berikut adalah urutan alur baru yang wajib diimplementasikan secara utuh dari awal hingga akhir:

### Langkah A: Autentikasi & Masuk Dashboard
1. Pengguna membuka situs FairWorks.
2. Halaman Landing menyambut dengan *hero kinetic* dan tombol "Mulai gratis".
3. Pengguna memasukkan email (Magic Link) tanpa kata sandi. Setelah sukses, pengguna langsung mendarat di **Dashboard Utama**.
4. Di Dashboard Utama, ditampilkan:
   - Sapaan personal beserta tanggal hari ini dalam Bahasa Indonesia.
   - 3 Statistik Odometer (`jumlah ruangan` · `tugas aktif` · `total poin`).
   - Daftar ruangan yang diikuti oleh pengguna.
   - Tombol tunggal yang jelas: **"+ Buat Ruangan"** di bagian atas/bawah, serta area khusus **"Masuk kode ruangan…"** untuk bergabung dengan kode undangan. *(Seluruh duplikasi form dihilangkan).*

### Langkah B: Pembuatan Ruangan & Penyusunan Kontrak (Alur Baru yang Disepakati)
1. Pengguna menekan tombol **"+ Buat Ruangan"**.
2. Muncul modal ringkas yang meminta **Nama Ruangan** (misal: "Riset Pasar Digital").
3. Setelah nama diisi dan ditekan lanjut, sistem secara otomatis:
   - Membuat entri ruangan di database Supabase.
   - Menghasilkan kode unik ruangan (format `RPD-4K7`) dan token laporan publik `report_token`.
   - Mengatur pembuat sebagai **Ketua**.
   - **Langsung mengarahkan (redirect) pengguna masuk ke Form Tugas Kontrak (Pre-lock Phase)** dalam ruangan tersebut.
4. Di dalam Form Tugas Kontrak ini, Ketua langsung menyusun daftar tugas kelompok berpoin (Judul wajib, deskripsi opsional, poin default 10, tenggat waktu default +7 hari).
5. Ketua dapat menambah, menghapus, atau mengubah daftar tugas sebelum dikunci.

### Langkah C: Pengiriman Kontrak & Ink-Stamp Lock
1. Setelah daftar tugas awal dirasa lengkap, Ketua menekan tombol **"Kirim Kontrak"**.
2. Sistem mendistribusikan kontrak ke seluruh anggota ruangan (melalui notifikasi in-app & email).
3. Anggota membaca kontrak dan memberikan suara **Setuju** atau **Minta Ubah** (dengan catatan wajib).
4. Begitu seluruh anggota menyetujui (atau setelah waktu *auto-lock* 24 jam tercapai), sistem mengunci kontrak.
5. Pada saat penguncian ini, muncul animasi spektakuler **Ink-Stamp Lock** (cap stempel tinta hitam/putih "TERKUNCI" yang tegas di layar), menandakan fase perencanaan selesai dan siklus pengerjaan tugas resmi dimulai.

### Langkah D: Papan Tugas Aktif & Siklus Kerja (Room Active)
1. Setelah kontrak terkunci, tampilan ruangan berubah menjadi **Papan Tugas Aktif** (Room View).
2. Anggota dapat melakukan aksi inti dengan maksimal 2 ketukan:
   - **Ambil Tugas:** Anggota mengklik "Ambil" pada tugas yang berstatus `open` (atau tugas `doing` yang sudah *overdue*).
   - **Kirim Bukti:** Assignee menempelkan URL tautan bukti (GitHub, Google Docs, Figma, Drive) yang otomatis terdeteksi jenisnya menjadi chip, lalu klik kirim. Status berubah menjadi `review`.
   - **Persetujuan Teman:** Anggota lain (kecuali assignee) meninjau bukti dan menekan "Setuju" atau "Revisi" (dengan catatan).
   - **Selesai (Done):** Jika jumlah suara "Setuju" mencapai kuorum mayoritas `floor((n-1)/2) + 1`, status tugas otomatis berubah menjadi `done`, dan odometer progres bertambah.

### Langkah E: Dossier Laporan Publik (`/l/{token}`)
1. Dosen atau pihak luar dapat mengakses tautan laporan publik melalui `report_token` unik tanpa perlu login sama sekali.
2. Halaman memuat kepala ruangan, diagram pai kontribusi poin per anggota, timeline aktivitas kronologis, dan tabel bukti kerja transparan.

---

## 3. Standar Teknis Implementasi

1. **Responsif Layout Desktop:** 
   - Seluruh container utama wajib menggunakan pembatas lebar yang seragam (`max-w-5xl` untuk halaman umum, `max-w-[760px]` untuk ruang/laporan) dengan margin horizontal terpusat (`mx-auto px-4 sm:px-6`).
   - Hindari ukuran absolut berbasis piksel murni pada layout utama; gunakan *flexbox/grid* dengan *gap* berbasis *rem/tailwind scale*.
2. **Transisi Animasi Antar Menu:**
   - Gunakan transisi CSS `transition-all duration-500 ease-[var(--ease)]` dipadu dengan `animate-in fade-in zoom-in-95` agar perpindahan antar view terasa mengalir dan saling menyambung.
3. **Penyembunyian Halaman Story:**
   - Navigasi header atas untuk audit/development dipisahkan dari alur produksi utama atau dikondisikan agar hanya tampil jika berada dalam mode *development environment*.
4. **Ergonomi Navbar Mobile (Thumb Bar):**
   - Bar aksi utama di perangkat mobile diposisikan tetap di bagian bawah layar (`fixed bottom-0 left-0 right-0 z-40 bg-[var(--c0)]/90 backdrop-blur-md border-t border-[var(--c1)]`), memastikan seluruh tombol utama terjangkau dengan satu ibu jari.

---

## 4. Pembagian Tugas Spesifik per Tim (Non-Overlapping Task Breakdown)

Supaya pengerjaan berjalan paralel tanpa ada tugas yang saling menabrak, berikut pembagian domain kerja yang jelas:

### ✦ Chello (Frontend A — Layout, Responsif & Animasi Visual)
- **Tugas 1:** Standarisasi lebar kontainer utama (`max-w-5xl` dan `max-w-[760px]`) di seluruh komponen utama untuk memastikan tampilan 100% konsisten di berbagai ukuran layar laptop (Raken & Chello).
- **Tugas 2:** Menyembunyikan atau memisahkan halaman *Story* dari navigasi publik/header utama sehingga hanya aktif saat mode development.
- **Tugas 3:** Menyempurnakan transisi animasi morph dan fade antar menu/view di `app/page.tsx` agar perpindahan terasa mengalir dan saling menyambung (*smooth morphing*).

### ✦ Iwan (Frontend B — Dashboard, Pembuatan Ruangan & Kontrak)
- **Tugas 1:** Membersihkan redudansi di `DashboardView.tsx` (menghapus duplikasi form input kode dan tombol buat ruangan yang bertumpuk).
- **Tugas 2:** Menyelaraskan alur pembuatan ruangan: tombol Buat Ruangan memicu modal input nama ruangan ➔ setelah dikonfirmasi, sistem membuat ruangan dan **langsung mengarahkan (*redirect*) ke Form Tugas Kontrak** (Pre-lock Phase).
- **Tugas 3:** Memastikan rekap kontrak dan tombol kirim kontrak berfungsi optimal sebelum memicu animasi Ink-Stamp Lock.

### ✦ Riski (Frontend C — Papan Tugas Aktif & Mobile Thumb Bar)
- **Tugas 1:** Menyempurnakan Papan Tugas Aktif (`RoomTaskLifecycle.tsx`) — tabs status, kartu tugas, aksi ambil tugas, dan pengiriman bukti dengan deteksi chip otomatis.
- **Tugas 2:** Merapikan dan mengoptimalkan *Thumb Bar* di bagian bawah perangkat mobile (`ThumbBar.tsx`) agar ergonomis, bebas *overflow*, dan tidak menutupi konten interaktif utama.

### ✦ Raken (Backend & Integrasi E2E)
- **Tugas 1:** Memastikan RPC Supabase (`submit_contract`, `take_task`, `submit_proof`, `cast_vote`) merespon dengan benar sesuai alur baru pembuatan ruangan berlanjut ke kontrak.
- **Tugas 2:** Melakukan audit RLS dan uji coba integrasi End-to-End (T6) bersama frontend setelah seluruh task di atas selesai digabung.

---
*Dokumen ini resmi berlaku sebagai acuan implementasi kode oleh Raken, Chello, Iwan, dan Riski untuk menyelesaikan seluruh tahapan menuju MVP Semifinal FairWorks.*

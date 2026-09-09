# 01. Product Overview

## Ringkasan

Competition Operations Dashboard adalah aplikasi operasional untuk lomba Vibe Code Competition MCC 2026. Aplikasi mengelola data peserta, menerima tautan karya Google AI Studio yang publik, memberi penilaian terstruktur, menentukan tiga pemenang otomatis, serta menampilkan countdown dan status submission secara realtime pada proyektor.

## Masalah yang diselesaikan

- Submission link berisiko tersebar di chat dan sulit direkap.
- Timestamp pengumpulan perlu tercatat secara konsisten.
- Juri membutuhkan form penilaian dan hitung skor yang seragam.
- Panitia membutuhkan penentuan pemenang cepat namun tetap dapat diaudit.
- Peserta membutuhkan indikator waktu yang jelas dan atmosfer kompetitif.

## Sasaran produk

1. Semua submission tercatat dengan timestamp server dan riwayat perubahan.
2. Penilaian lima kriteria dihitung otomatis hingga skor maksimal 100.
3. Tiga pemenang tampil otomatis setelah hasil dikunci.
4. Timer dan notifikasi submission tersinkron pada proyektor serta dashboard juri.

## Pengguna

| Pengguna | Kebutuhan utama |
| --- | --- |
| Peserta | Submit tautan karya, memperbarui sebelum deadline, melihat status submission. |
| Juri/Admin | Mengelola peserta dan waktu, membuka karya, memberi nilai, melihat rekap, mengunci hasil. |
| Operator proyektor | Membuka layar publik terbatas untuk timer dan status submission. |

## Batasan ruang lingkup

### Termasuk MVP

- Login dan hak akses peserta serta Juri/Admin.
- Manajemen/impor peserta.
- Submission tautan Google AI Studio publik.
- Timer resmi dari server dan Live Competition Board.
- Event realtime submission.
- Penilaian, leaderboard internal, tie-breaker, penguncian hasil, dan audit log dasar.

### Tidak termasuk MVP

- Integrasi API langsung dengan Google AI Studio.
- Pemeriksaan plagiarisme otomatis atau penilaian AI.
- Leaderboard nilai publik selama lomba.
- Penyimpanan source code karya peserta.

## Keputusan panitia yang wajib diselesaikan sebelum build

1. Waktu mulai, waktu selesai, dan kebijakan submit terlambat.
2. Metode login peserta: email kampus, kode peserta, atau akun buatan panitia.
3. Jumlah juri dan metode agregasi nilai antarjuri.
4. Apakah peserta boleh memperbarui tautan sebelum deadline. Rekomendasi: boleh, dengan riwayat.
5. SOP link tidak publik/tidak dapat dibuka dan gangguan internet.


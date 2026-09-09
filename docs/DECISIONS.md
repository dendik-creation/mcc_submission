# DECISIONS - Asumsi Milestone 0 (butuh review panitia)

Dokumen ini mencatat nilai default yang dipakai untuk membangun sistem karena
Milestone 0 (`docs/TASKS.md`) berisi keputusan panitia yang butuh persetujuan
manusia tertulis, bukan sesuatu yang bisa diselesaikan lewat kode. Semua nilai
di bawah ini **dapat diubah admin lewat halaman Pengaturan Lomba tanpa deploy
ulang** — dokumen ini hanya mencatat apa defaultnya saat sistem pertama kali
jalan, dan siapa yang harus mengonfirmasi sebelum hari-H.

Status: **BELUM direview panitia.** Jangan jalankan lomba sungguhan sebelum
setiap baris di bawah ini diperiksa dan (bila perlu) diubah oleh panitia.

## 1. Waktu lomba

- Default seed: `scheduled_start_at` dan `scheduled_end_at` diisi placeholder
  (lihat `scripts/seed.ts`), state awal `not_started`.
- Late submission: `late_submission_allowed` default **false** — submit/update
  setelah deadline ditolak API kecuali Juri/Admin membuka ulang submission
  tertentu dengan alasan tercatat (sesuai `docs/02`).
- **Wajib diisi panitia**: tanggal/jam mulai dan deadline sebenarnya, lewat
  halaman Pengaturan Lomba sebelum hari-H.

## 2. Identitas/login peserta

- Diputuskan bersama user: **nomor peserta + password**, password dibuat
  admin saat entri/impor CSV (opsi "akun buatan panitia" dari `docs/01`).
- Juri/Admin login pakai email + password.
- Data minimum peserta: nomor peserta (unik), nama, NIM (unik), kontak,
  status registrasi — sesuai `docs/02`.

## 3. Juri dan agregasi nilai

- Diputuskan bersama user: **Juri dan Admin adalah satu peran gabungan**
  (`role = judge`) untuk MVP ini — sesuai catatan P1 di `docs/TASKS.md` yang
  menyebut "akun Juri terpisah dari Admin" sebagai peningkatan masa depan,
  bukan kebutuhan MVP. Kedua akun berikut bisa menilai, mengontrol timer, dan
  mengunci hasil.
- Seed: **2 akun juri/admin** dibuat lewat `scripts/seed.ts`. Ganti password
  default segera setelah seed dijalankan di environment produksi.
- Agregasi nilai akhir: rata-rata skor total (0-100) dari seluruh penilaian
  **final** (bukan draft) milik peserta tersebut — sesuai `docs/05`. Peserta
  tanpa nilai final lengkap dari seluruh juri aktif tidak masuk leaderboard
  final (`docs/02`).

## 4. Revisi link, keterlambatan, link tidak publik, diskualifikasi

- Peserta boleh mengganti URL sampai deadline; versi lama tersimpan di
  `submission_revisions`, versi aktif terakhir yang dinilai — sesuai
  rekomendasi eksplisit `docs/01`.
- Status `Perlu diperbaiki` / `Tidak dapat diakses` diset **manual** oleh
  Juri/Admin saat mereka membuka link dan gagal (MVP tidak melakukan
  pengecekan aksesibilitas link otomatis — itu item P1).
- Submit setelah deadline: ditolak di level Server Action (bukan cuma UI).
  Juri/Admin dapat membuka ulang submission spesifik dengan alasan wajib
  diisi, tercatat di audit log.
- Diskualifikasi eksplisit **belum diimplementasikan sebagai status
  terpisah** di MVP ini — Juri/Admin bisa menonaktifkan peserta (`registration
  status = disabled`) yang mengeluarkannya dari leaderboard. Jika panitia
  butuh alur diskualifikasi formal (dengan alasan tercatat terpisah dari
  nonaktif biasa), ini perlu disepakati dan ditambahkan sebelum lomba.

## 5. Pengumuman pemenang

- Pemenang 1-3 hanya dihitung dan ditampilkan (di leaderboard internal)
  setelah admin melakukan **Kunci Hasil**. Sebelum dikunci, tidak ada
  urutan/pemenang yang bisa dilihat siapa pun, termasuk Juri/Admin.
- Ambang waktu countdown untuk dialog besar di proyektor: default
  **60, 30, 10, 5 menit** tersisa (`timer_threshold_seconds`), bisa diubah
  admin di Pengaturan Lomba.

## Yang tidak bisa diselesaikan lewat kode (butuh aksi panitia sungguhan)

- Tanda tangan/persetujuan tertulis SOP di atas.
- Konfigurasi domain, TLS, dan Nginx Proxy Manager nyata (belum ada instance
  NPM tersedia saat build ini) — lihat `docs/RUNBOOK.md` untuk konfigurasi
  yang perlu diterapkan operator.
- Gladi bersih dengan proyektor fisik dan jaringan lokasi sungguhan.
- Load test pada skala peserta sesungguhnya (disediakan skrip di
  `scripts/load-test.ts`, tapi belum dijalankan pada infrastruktur produksi).

# TASKS - Competition Operations Dashboard

Status: implementasi build selesai untuk seluruh item yang bisa diselesaikan
lewat kode. Item yang butuh keputusan/tindakan manusia sungguhan (tanda
tangan panitia, proyektor fisik, instance Nginx Proxy Manager nyata) tetap
`[ ]` dan dicatat alasannya — lihat `docs/DECISIONS.md` dan `docs/RUNBOOK.md`.

## Milestone 0 - Keputusan panitia

- [ ] Tetapkan tanggal/jam mulai, deadline, dan durasi lomba. **Selesai jika:** konfigurasi waktu resmi disetujui tertulis. _Mekanisme siap (Pengaturan > Waktu Selesai menggerakkan tombol Mulai) — nilai sungguhan belum diisi panitia, lihat docs/DECISIONS.md §1._
- [x] Tetapkan identitas/login peserta. **Selesai jika:** data minimum dan proses distribusi akses disetujui. Diputuskan: nomor peserta + password buatan admin (docs/DECISIONS.md §2), diimplementasikan.
- [x] Tetapkan jumlah juri serta aturan rata-rata nilai. **Selesai jika:** nama/akun juri dan agregasi nilai final disepakati. Diputuskan: 2 akun juri/admin gabungan, rata-rata skor final (docs/DECISIONS.md §3), diseed dan diimplementasikan.
- [ ] Setujui aturan revisi link, keterlambatan, link tidak publik, dan disqualifikasi. **Selesai jika:** SOP ditandatangani panitia/juri. _Mekanisme teknis lengkap (riwayat revisi, buka ulang, catat manual) — tanda tangan panitia belum ada._
- [ ] Setujui tata cara pengumuman tiga pemenang. **Selesai jika:** operator mengetahui kapan hasil dapat dibuka/diumumkan. _Mekanisme siap (hanya setelah Kunci Hasil) — komunikasi ke operator adalah keputusan panitia, bukan kode._

## Milestone 1 - Infrastruktur Docker dan fondasi

- [x] Inventarisir Next.js/shadcn starter yang ada. Next.js 16.2.6 (App Router, Turbopack) + shadcn `base-maia`, dicatat di `submission/README.md`.
- [x] Definisikan container produksi Next.js dan PostgreSQL Alpine. `Dockerfile` (multi-stage: Bun untuk build, Node 24 alpine untuk runtime — lihat komentar di Dockerfile soal kenapa), `docker-compose.yml`, health endpoint `/api/health`, migrasi otomatis saat boot.
- [x] Siapkan network eksternal `submission-app`. Dibuat dan diuji: container yang hanya bergabung ke network ini (simulasi Nginx Proxy Manager) berhasil mengakses app.
- [x] Siapkan network internal `submission-private`. Diuji: hanya `postgres` dan `app` yang bergabung.
- [x] Pastikan PostgreSQL tanpa port host/public. Diverifikasi langsung: host tidak bisa konek ke port 5432, container di network `submission-app` juga tidak bisa menjangkau `postgres`.
- [ ] Konfigurasi domain, HTTPS, dan WebSocket upgrade melalui Nginx Proxy Manager. **Selesai jika:** health check dan koneksi realtime lolos dari domain publik. _Tidak ada instance NPM nyata di environment build ini — konfigurasi (termasuk blok upgrade WebSocket) didokumentasikan di `docs/RUNBOOK.md` §2, belum diverifikasi lewat domain publik sungguhan._
- [x] Siapkan backup serta restore database. `scripts/backup.sh`/`scripts/restore.sh`. Diuji satu siklus penuh: seed data → backup → drop schema → restore → data kembali sama persis.

## Milestone 2 - Data dan autentikasi

- [x] Definisikan schema Drizzle dan migration baseline. 9 tabel, migration diterapkan ulang bersih dari database kosong (diuji dua kali: dev lokal dan container Docker).
- [x] Tambahkan constraint unik, foreign key, indeks pencarian, dan timestamps. Unique pada nomor peserta/NIM/login/pasangan juri-peserta, FK di seluruh relasi.
- [x] Buat autentikasi dan otorisasi Peserta, Juri/Admin, Proyektor. Session DB-backed + cookie httpOnly. Route guard diverifikasi (redirect saat belum login), gateway WebSocket diverifikasi (401 tanpa token/sesi valid, diterima dengan token proyektor valid). Uji klik login lewat browser sungguhan belum dilakukan (di luar cakupan — lihat catatan Playwright di bawah).
- [x] Buat audit log untuk aksi sensitif. Login, submission (create/update/reopen/catat manual/ubah status), nilai (draft/final), kontrol timer, kunci/buka hasil, nonaktif/aktifkan peserta, ubah pengaturan, rotasi token proyektor.

## Milestone 3 - Peserta dan submission

- [x] Buat impor dan pengelolaan data peserta. Tambah manual, impor CSV (dengan laporan error per baris), cari (client-side), nonaktifkan/aktifkan.
- [x] Buat halaman submission peserta. URL + checkbox pernyataan keaslian, Server Action.
- [x] Tambahkan validasi URL serta status akses. Wajib `https://aistudio.google.com/...`; status Perlu Diperbaiki/Tidak Dapat Diakses diset manual oleh juri.
- [x] Simpan timestamp server, status tepat waktu, dan revisi URL. Riwayat revisi tampil di dashboard peserta.
- [x] Buat daftar submission juri/admin. Tabel dengan filter status (tab: Semua/Belum submit/Diterima/Terlambat/Perlu diperbaiki/Tidak dapat diakses).

## Milestone 4 - Timer dan realtime

- [x] Bangun state machine lomba dan kontrol admin. `lib/timer.ts`, diuji otomatis (Vitest) untuk seluruh transisi valid/invalid.
- [x] Buat countdown server-authoritative. Deadline dicek di Server Action (`isSubmissionWindowOpen`), bukan di klien.
- [x] Tambahkan WebSocket event timer dan submission. Gateway `/ws` custom server, diverifikasi langsung (koneksi terbuka dengan token valid, ditolak 401 tanpa token).
- [x] Bangun Live Competition Board. `/board/[token]`: nama lomba, countdown, status, jumlah submission/terdaftar.
- [x] Tambahkan toast submission generik serta dialog ambang waktu. Teks generik persis "Submission baru diterima.", dialog besar pada ambang menit yang bisa dikonfigurasi admin.
- [x] Tambahkan reconnect/fallback polling. Reconnect exponential backoff + polling `router.refresh()` tiap 5 detik saat WebSocket putus.

## Milestone 5 - Penilaian dan pemenang

- [x] Bangun form penilaian lima kriteria. Draft/final, nilai 1-10, catatan opsional.
- [x] Implementasikan perhitungan skor terbobot. `lib/scoring.ts`, diuji otomatis — kombinasi nilai maksimum menghasilkan tepat 100.
- [x] Tambahkan monitor kelengkapan nilai. Daftar "Belum Lengkap Nilai" di halaman Hasil, memblokir Kunci Hasil selama masih ada.
- [x] Implementasikan rata-rata multi-juri dan tie-breaker. `lib/tie-breaker.ts`, diuji otomatis untuk seluruh 4 level (skor, kreativitas, timestamp, perlu keputusan panitia).
- [x] Bangun leaderboard internal. Hanya bisa diakses lewat layout Juri/Admin; tidak ada rute yang mengeksposnya ke peserta/proyektor.
- [x] Tambahkan Kunci Hasil dan snapshot. Snapshot immutable (`result_snapshots`), buka kunci wajib alasan, penguncian berikutnya membuat snapshot baru (riwayat lama tetap ada).

## Milestone 6 - QA dan event readiness

- [ ] Jalankan pengujian end-to-end seluruh alur lomba. **Selesai jika:** semua kriteria penerimaan pada dokumen operasional lulus. _Logic kritis diuji otomatis (Vitest); alur penuh lewat browser sungguhan (klik submit/nilai/kunci) belum diuji — disepakati tanpa Playwright di pass ini._
- [x] Uji keamanan dan privasi peran. Database tidak terekspos (diverifikasi langsung dari host dan dari network `submission-app`); payload event proyektor diaudit tidak pernah membawa field identitas peserta (`submission_updated` difilter dari proyektor di `lib/realtime/ws-server.ts`).
- [ ] Jalankan load test submission simultan sesuai proyeksi jumlah peserta. **Selesai jika:** event realtime dan penyimpanan tetap stabil. _Alat tersedia (`scripts/load-test.ts`, sudah diuji skala kecil), belum dijalankan pada skala peserta produksi sungguhan._
- [ ] Lakukan gladi bersih dengan proyektor serta jaringan lokasi. **Selesai jika:** operator menyetujui tampilan dan SOP cadangan. _Butuh perangkat fisik dan hari nyata — tidak bisa dilakukan dari sesi build ini._
- [x] Buat runbook hari-H untuk operator/juri. `docs/RUNBOOK.md` — persiapan, konfigurasi NPM, kontrol saat lomba, SOP insiden, penilaian/kunci hasil, backup/restore, load test.

## Prioritas MVP

P0 sebelum lomba: Milestone 0-4, penilaian dasar Milestone 5, serta seluruh QA inti Milestone 6.

P1 bila waktu cukup: dashboard metrik tambahan, validasi akses link yang lebih otomatis, dan akun Juri terpisah dari Admin.

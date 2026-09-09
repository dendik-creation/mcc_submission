# RUNBOOK - Operator Hari-H

Panduan operasional untuk Juri/Admin dan operator teknis saat menjalankan
Competition Operations Dashboard pada hari lomba. Baca `docs/DECISIONS.md`
dulu — beberapa nilai di sistem masih placeholder sampai panitia
mengonfirmasinya.

## 1. Persiapan sebelum hari-H

1. Pastikan Docker dan network eksternal `submission-app` sudah ada di host
   produksi (dibuat sekali): `docker network create submission-app`.
2. Salin `submission/.env.example` menjadi `submission/.env.production`,
   isi semua secret (jangan pakai nilai contoh), lalu jadikan variabel itu
   tersedia untuk `docker compose` (mis. `export $(cat .env.production)` atau
   gunakan `--env-file`).
3. `docker compose build && docker compose up -d`. Tunggu sampai `docker
   compose ps` menampilkan kedua service `healthy`.
4. Jalankan seed sekali: `docker exec <app-container> node scripts/seed.ts`
   — membuat 2 akun juri/admin dan satu baris kompetisi placeholder.
5. Login sebagai Juri/Admin lewat `/login/juri`, buka **Pengaturan**, isi
   nama lomba, waktu selesai (dipakai tombol Mulai), dan ambang dialog
   proyektor yang sesungguhnya. Ganti password kedua akun juri.
6. Impor data peserta lewat **Peserta > Impor CSV** (kolom: nomor_peserta,
   nama, nim, kontak, password). Simpan daftar password yang ditampilkan —
   tidak muncul lagi setelah halaman ditutup.
7. Ambil URL Live Board dari **Pengaturan > URL Live Board** dan buka di
   perangkat proyektor. Uji tampilan sebelum peserta datang.
8. Jalankan backup awal: `./scripts/backup.sh`.

## 2. Konfigurasi Nginx Proxy Manager

Domain/TLS tidak dapat diverifikasi langsung dari sesi build ini (tidak ada
instance NPM nyata tersedia) — terapkan konfigurasi berikut di NPM:

- **Proxy Host** → Forward Hostname/IP: nama service `app` (atau IP
  container) pada network `submission-app`, Forward Port: `3000`.
- **SSL**: aktifkan, paksa HTTPS, aktifkan HTTP/2 jika tersedia.
- **Advanced** (wajib untuk WebSocket `/ws`), tambahkan di custom Nginx
  config block:

  ```nginx
  location /ws {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
  }
  ```

- Pastikan opsi "Websockets Support" di tab proxy host NPM juga dicentang
  (jika tersedia di versi NPM yang dipakai) — ini yang memastikan header
  `Upgrade`/`Connection` diteruskan untuk seluruh path, bukan hanya `/ws`.
- Verifikasi: buka `/api/health` lewat domain publik (harus `{"status":"ok"}`),
  lalu buka Live Board dan pastikan countdown berjalan tanpa reload manual.

## 3. Selama lomba

- Kontrol timer ada di **Overview** (`/admin`): Mulai / Jeda / Lanjutkan /
  Akhiri. Semua aksi tercatat di audit log.
- Dashboard **Submission** menampilkan status tiap peserta secara realtime;
  proyektor hanya menampilkan notifikasi generik dan angka total.
- Jika WebSocket terputus, klien otomatis reconnect dan polling setiap 5
  detik sebagai fallback — timer server tetap berjalan terlepas dari
  koneksi klien.

## 4. SOP insiden (ringkas — detail di docs/06)

| Insiden | Tindakan |
| --- | --- |
| Link peserta tidak publik | Admin ubah status submission ke "Perlu diperbaiki" di halaman Submission; peserta perbarui sebelum deadline. |
| Peserta klaim sudah submit tapi gagal tersimpan | Cek audit log peserta tsb. Jika benar gagal karena isu sistem, gunakan **Buka Ulang** (jika sudah pernah submit) atau **Catat Manual** (jika belum pernah submit sama sekali), isi alasan. |
| Internet peserta terputus saat submit | Sama seperti di atas — **Catat Manual** dengan alasan, centang "sebenarnya tepat waktu" bila SOP panitia menyatakan demikian. |
| Proyektor/realtime putus | Timer server tetap jalan. Muat ulang halaman Live Board. |
| Hasil disengketakan | Rujuk ke snapshot di **Hasil** dan audit log. Jangan ubah nilai tanpa alasan tercatat lewat alur Buka Kunci Hasil. |
| Tautan proyektor bocor ke pihak tak berwenang | **Pengaturan > Ganti Token** — URL lama langsung tidak berlaku. |

## 5. Penilaian dan penguncian hasil

1. Setiap juri menilai lewat **Penilaian**, simpan sebagai draft dulu bila
   perlu, lalu **Simpan Final** setelah yakin.
2. Peserta tanpa nilai final dari seluruh juri aktif otomatis muncul di
   daftar "Belum Lengkap Nilai" di halaman **Hasil** dan tidak bisa dikunci.
3. **Kunci Hasil** butuh konfirmasi eksplisit. Setelah dikunci, nilai tidak
   bisa diubah dan leaderboard menjadi snapshot resmi.
4. Membuka kunci butuh alasan tertulis; hasil baru setelah itu membuat
   snapshot baru, bukan menimpa snapshot lama — riwayat penguncian tetap
   terlihat di halaman Hasil.

## 6. Backup dan restore

- Backup manual kapan saja: `./scripts/backup.sh` (tulis file ke
  `backups/<timestamp>.sql`). Jalankan sebelum lomba dan sebelum Kunci Hasil.
- Restore (hanya untuk pemulihan bencana, akan menghapus data saat ini):
  `./scripts/restore.sh backups/<file>.sql`. Sudah diuji satu siklus penuh
  restore pada environment non-produksi saat build ini (lihat riwayat kerja).

## 7. Load test

`scripts/load-test.ts` mengirim submission simulasi secara konkuren ke
endpoint yang sama seperti peserta sungguhan, untuk menguji kestabilan
sebelum hari-H pada skala peserta yang sesungguhnya. Belum dijalankan pada
skala produksi — jalankan di environment staging sebelum lomba:

```bash
node scripts/load-test.ts --url http://localhost:3000 --count 100 --concurrency 20
```

## Yang belum bisa diverifikasi dari sesi build ini

- Domain/TLS/NPM sungguhan (tidak ada instance tersedia) — ikuti bagian 2.
- Gladi bersih dengan proyektor fisik dan jaringan lokasi sungguhan.
- Load test pada jumlah peserta produksi sesungguhnya.

Yang **sudah** diverifikasi langsung selama build (lihat riwayat kerja):
Postgres tidak dapat diakses dari host maupun dari network `submission-app`
(disimulasikan sebagai NPM); app hanya dapat diakses lewat network
`submission-app`; kredensial app terpisah dari kredensial migrasi dengan hak
akses lebih rendah; migrasi berjalan otomatis dan aman saat container start;
WebSocket gateway menolak koneksi tanpa token/sesi valid (401) dan menerima
koneksi proyektor dengan token valid; satu siklus backup-drop-restore
berhasil memulihkan seluruh data.

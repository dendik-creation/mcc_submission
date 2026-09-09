# 04. Architecture and Docker

## Keputusan stack

| Area | Keputusan | Alasan |
| --- | --- | --- |
| Web app | Next.js App Router + shadcn/ui | Sudah tersedia; sesuai dashboard internal dan UI peserta. |
| ORM | Drizzle ORM | Ringan, type-safe, dekat dengan SQL, serta mendukung PostgreSQL dengan driver `node-postgres`. |
| Database | PostgreSQL image Alpine | Footprint container relatif kecil dan data relasional sesuai kebutuhan submission/penilaian/audit. |
| Realtime | WebSocket pada boundary aplikasi | Mendukung notifikasi instan dan sinkronisasi timer. |
| Reverse proxy | Nginx Proxy Manager yang sudah ada | Mengatur domain, TLS, dan akses dari luar. |

Drizzle direkomendasikan dibanding Prisma untuk proyek ini karena kebutuhan query bersifat relasional tetapi tidak memerlukan data framework yang lebih berat. Drizzle menyediakan API SQL-like dan relational, serta dukungan PostgreSQL resmi melalui driver `node-postgres`. genui{"citation":{"refs":["turn0search1","turn0search2"]}}

## Boundary layanan

1. **submission-app**: container Next.js yang memegang UI, API, autentikasi, logika timer resmi, penilaian, dan gateway WebSocket.
2. **postgres**: container PostgreSQL Alpine yang hanya menerima koneksi dari aplikasi.
3. **Nginx Proxy Manager**: layanan eksternal yang berada pada network bersama dan meneruskan trafik HTTPS ke aplikasi.

Tidak ada container tambahan yang wajib pada MVP. Jika WebSocket dipisahkan pada masa depan, layanan baru harus tetap berada pada network privat database bila membutuhkan akses data, serta diekspos hanya melalui reverse proxy yang terkontrol.

## Rancangan jaringan Docker

| Network | Tipe | Anggota | Tujuan |
| --- | --- | --- | --- |
| `submission-app` | External Docker network yang sudah ada | Nginx Proxy Manager, Next.js app | Jalur ingress proxy ke aplikasi. |
| `submission-private` | Internal/private Docker network khusus stack ini | Next.js app, PostgreSQL | Jalur data aplikasi ke database. Tidak dipakai Nginx Proxy Manager. |

Aturan koneksi:

- Next.js app bergabung ke **dua** network: `submission-app` dan `submission-private`.
- PostgreSQL hanya bergabung ke `submission-private`.
- PostgreSQL tidak menerbitkan port host dan tidak masuk ke `submission-app`.
- Nginx Proxy Manager hanya meneruskan trafik HTTPS ke Next.js app pada `submission-app`.
- Database connection string aplikasi menggunakan hostname service PostgreSQL pada network privat; tidak pernah diarahkan ke host public.

## Kontrak container (tanpa konfigurasi runnable)

### Next.js app

- Dibangun sebagai image produksi multi-stage; jangan gunakan development server untuk lomba.
- Menjalankan migrasi secara terkontrol sebelum aplikasi siap menerima trafik, dengan strategi yang aman terhadap deployment ulang.
- Memiliki health endpoint internal untuk dipantau reverse proxy.
- Membaca rahasia melalui environment variables/deployment secret, bukan disimpan di image atau repository.
- Hanya port aplikasi yang dapat diakses oleh Nginx Proxy Manager pada network eksternal.

### PostgreSQL Alpine

- Menggunakan volume persisten bernama agar data tidak hilang ketika container dibuat ulang.
- Menggunakan kredensial aplikasi terpisah dari superuser migrasi/operasional bila memungkinkan.
- Tidak memublikasikan port ke host.
- Memiliki kebijakan backup sebelum hari lomba dan snapshot/backup tambahan sebelum penguncian hasil.

## Data access dan migrasi

- Gunakan Drizzle schema TypeScript sebagai sumber deklarasi tabel serta migration files yang ter-versioning.
- Migrasi database diterapkan satu kali per release, tidak otomatis oleh setiap replica aplikasi.
- Aktifkan constraint database untuk keunikan NIM/nomor peserta, foreign key, dan integritas hasil.
- Gunakan transaksi pada submission, finalisasi penilaian, penguncian hasil, serta pembuatan audit log.

## Keamanan dan operasional

- Hanya endpoint aplikasi yang diekspos proxy; database tidak diekspos.
- Gunakan HTTPS dari Nginx Proxy Manager dan cookie sesi aman.
- Terapkan rate limit pada login, submission, dan endpoint realtime.
- Rotasi token URL proyektor bila tautan tersebar ke pihak tidak berwenang.
- Simpan audit log yang tidak dapat diedit lewat UI biasa.

## Catatan implementasi WebSocket

Next.js membutuhkan runtime yang mendukung koneksi WebSocket persisten. Karena aplikasi dijalankan dalam Docker sendiri, pilih satu runtime/gateway WebSocket yang dikelola bersama aplikasi dan pastikan reverse proxy meneruskan upgrade connection. Jangan mengandalkan mekanisme serverless yang dapat memutus koneksi persisten.


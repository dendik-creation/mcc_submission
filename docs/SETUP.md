# SETUP - Instalasi dan Menjalankan Aplikasi

Panduan teknis untuk developer: dari clone sampai aplikasi jalan, baik untuk
pengembangan lokal maupun lewat Docker. Untuk prosedur hari-H (operator/juri),
lihat `RUNBOOK.md`. Untuk nilai default yang masih perlu direview panitia,
lihat `DECISIONS.md`.

## Prasyarat

| Alat | Versi yang dipakai saat build | Keterangan |
| --- | --- | --- |
| [Bun](https://bun.sh) | 1.3.9 | Package manager + menjalankan skrip database (migrate/seed). |
| [Node.js](https://nodejs.org) | 24.x | Menjalankan server aplikasi (`server.ts`) — **wajib Node, bukan Bun**, lihat Troubleshooting. |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | — | PostgreSQL (dev maupun produksi) dan seluruh stack produksi. |

Source ada di `submission/` — semua perintah di bawah dijalankan dari
direktori itu kecuali disebutkan lain.

## 1. Setup development lokal

```bash
cd submission
bun install
```

### 1.1 Database lokal (bukan stack produksi)

Untuk pengembangan sehari-hari cukup satu container Postgres biasa (tanpa
network isolation ala produksi):

```bash
docker run -d --name submission-postgres-dev \
  -e POSTGRES_DB=submission \
  -e POSTGRES_USER=submission_migrator \
  -e POSTGRES_PASSWORD=devpassword \
  -p 127.0.0.1:5432:5432 \
  postgres:16-alpine
```

### 1.2 Environment variables

```bash
cp .env.example .env
```

Nilai default di `.env.example` sudah cocok dengan container dev di atas
(`devpassword`, `localhost:5432`) — cukup edit `SESSION_SECRET` jika mau,
tidak wajib untuk lokal. Lihat tabel lengkap variabel di bagian 4.

### 1.3 Migrasi dan seed

```bash
bun run db:migrate   # menerapkan drizzle/*.sql ke database kosong
bun run db:seed      # 2 akun juri/admin + 1 baris kompetisi placeholder
```

`db:seed` aman dijalankan berulang (pakai `onConflictDoNothing` untuk akun
juri). Kredensial hasil seed ada di bagian 5.

Setelah mengubah `lib/db/schema.ts`, buat migration baru dulu sebelum
migrate:

```bash
bun run db:generate
bun run db:migrate
```

### 1.4 Jalankan aplikasi

```bash
bun run dev
```

Ini menjalankan `node server.ts` — custom server Next.js yang juga membuka
WebSocket gateway di `/ws`. Buka `http://localhost:3000`.

- Login peserta: `/login/peserta`
- Login juri/admin: `/login/juri`
- Live Board (proyektor): `/board/<projector_token>` — token ada di kolom
  `projector_token` tabel `competitions`, atau lihat di halaman
  **Pengaturan** setelah login sebagai juri.

## 2. Testing dan quality checks

```bash
bun run typecheck   # tsc --noEmit
bun run lint        # eslint
bun run test        # vitest — scoring, tie-breaker, timer state machine, validasi URL
bun run build       # next build (production build, juga menjalankan type-check ulang)
```

Jalankan keempatnya sebelum menganggap suatu perubahan selesai.

## 3. Setup produksi (Docker Compose)

```bash
# Sekali saja per host, dipakai bersama Nginx Proxy Manager:
docker network create submission-app

cp .env.example .env.production
# isi semua nilai dengan kredensial asli — jangan pakai nilai contoh

docker compose build
docker compose up -d
```

`docker compose` otomatis membaca file `.env` di direktori yang sama untuk
substitusi variabel (`${POSTGRES_DB}` dst di `docker-compose.yml`) — pastikan
file itu bernama `.env` (bukan `.env.production`) di server produksi, atau
jalankan dengan `--env-file .env.production`.

Yang terjadi otomatis saat `up`:

- `postgres` start duluan, tunggu sampai health check lolos.
- `app` baru start setelahnya, entrypoint-nya menjalankan migrasi
  (`node scripts/migrate.ts`, dijaga advisory lock) sebelum start server.
- Tidak ada `ports:` yang dipublikasikan — baik Postgres maupun app hanya
  bisa diakses lewat network Docker (`submission-private` /
  `submission-app`), sesuai `docs/04-architecture-and-docker.md`.

Setelah `up`, jalankan seed sekali:

```bash
docker exec <nama-container-app> node scripts/seed.ts
```

Verifikasi:

```bash
docker compose ps                              # kedua service harus "healthy"
docker compose logs app --tail 50              # cek tidak ada error
```

App tidak punya akses langsung dari host/browser tanpa reverse proxy — lihat
`RUNBOOK.md` bagian 2 untuk konfigurasi Nginx Proxy Manager (termasuk blok
upgrade WebSocket yang wajib untuk `/ws`). Untuk sekadar mengintip di
`localhost` tanpa NPM, tambahkan file `docker-compose.override.yml` (sudah
di-gitignore) dengan:

```yaml
services:
  app:
    ports:
      - "127.0.0.1:3000:3000"
```

## 4. Referensi variabel lingkungan

| Variabel | Dipakai oleh | Keterangan |
| --- | --- | --- |
| `NODE_ENV` | app | `production` di Docker (di-set di `docker-compose.yml`, bukan lewat file `.env`); kosongkan/`development` untuk lokal. |
| `PORT` | app | Default `3000`. |
| `APP_URL` | app | Base URL aplikasi, dipakai untuk link absolut. |
| `DATABASE_URL` | app (runtime) | Koneksi dengan kredensial `submission_app` (hak akses terbatas). |
| `MIGRATIONS_DATABASE_URL` | `scripts/migrate.ts` | Koneksi dengan kredensial `submission_migrator` (superuser, hanya untuk migrasi). |
| `SESSION_SECRET` | app | Tidak dipakai langsung untuk enkripsi sesi (sesi opaque, disimpan di DB) — cadangan untuk pengembangan mendatang; tetap isi dengan nilai acak. |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | container `postgres` | Kredensial superuser/migrator, dipakai `docker-entrypoint-initdb.d` saat inisialisasi volume kosong. |
| `POSTGRES_APP_USER` / `POSTGRES_APP_PASSWORD` | container `postgres`, app | Role terbatas yang dibuat `docker/init-db/01-app-role.sh`, dipakai aplikasi saat runtime. |

## 5. Kredensial default (hasil `db:seed`)

| Peran | Login | Password |
| --- | --- | --- |
| Juri/Admin 1 | `juri1@mcc2026.local` | `ganti-password-1` |
| Juri/Admin 2 | `juri2@mcc2026.local` | `ganti-password-2` |

**Placeholder — wajib diganti sebelum lomba sungguhan.** Peserta belum ada
sampai admin menambahkan lewat halaman **Peserta** (manual atau impor CSV).

## 6. Troubleshooting

**`bun run server.ts` (atau menjalankan file itu langsung lewat Bun)
crash dengan `AsyncLocalStorage accessed in runtime where it is not
available`.**
Bug kompatibilitas Bun-runtime dengan internal Next.js 16 (custom server).
Jalankan server lewat Node (`node server.ts`, atau `bun run dev`/`bun run
start` yang sudah dikonfigurasi memanggil Node) — Bun tetap dipakai untuk
install paket dan `next build`, itu tidak bermasalah.

**Status lomba "Ditutup" dan tidak bisa mulai lagi.**
Sudah diperbaiki — tombol **Mulai Lomba Baru** muncul di halaman Overview
saat status Ditutup, mengembalikan state ke "Belum dibuka" tanpa menghapus
data peserta/nilai. Perbarui jadwal waktu selesai di Pengaturan dulu sebelum
menekan Mulai lagi.

**Perlu database bersih total untuk testing ulang.**

```bash
docker compose exec postgres psql -U submission_migrator -d submission -c "
TRUNCATE TABLE audit_logs, sessions, result_snapshots, scores,
  submission_revisions, submissions, participants, users, competitions
  RESTART IDENTITY CASCADE;"
docker exec <nama-container-app> node scripts/seed.ts
```

**Lupa token proyektor.**

```bash
docker compose exec postgres psql -U submission_migrator -d submission \
  -t -c "select projector_token from competitions order by created_at desc limit 1;"
```

Atau lihat di halaman **Pengaturan** setelah login sebagai juri/admin — ada
tombol untuk melihat sekaligus mengganti (rotate) token.

## 7. Dokumen terkait

| Dokumen | Isi |
| --- | --- |
| `README.md` | Daftar isi seluruh paket dokumentasi. |
| `01`–`06` (`*.md`) | Spesifikasi produk, fungsional, realtime, arsitektur, data/aturan, penerimaan/operasional. |
| `DECISIONS.md` | Nilai default Milestone 0 yang masih perlu direview/disetujui panitia. |
| `RUNBOOK.md` | Prosedur operator hari-H: persiapan, konfigurasi NPM, kontrol lomba, SOP insiden, backup/restore, load test. |
| `TASKS.md` | Status implementasi tiap task, per milestone. |

# Vibe Code Competition MCC 2026 - Product Documentation

Paket ini memecah PRD Competition Operations Dashboard menjadi dokumen yang dapat dipakai tim desain, pengembang, juri, dan operator lomba.

## Daftar dokumen

| File | Fungsi |
| --- | --- |
| `SETUP.md` | Instalasi dan menjalankan aplikasi: lokal, Docker, variabel lingkungan, troubleshooting. |
| `01-product-overview.md` | Latar belakang, tujuan, pengguna, ruang lingkup, serta keputusan panitia. |
| `02-functional-requirements.md` | Alur dan kebutuhan fungsional peserta, juri/admin, submission, penilaian, dan pemenang. |
| `03-realtime-and-timer.md` | Perilaku countdown, websocket, layar proyektor, dan fallback operasional. |
| `04-architecture-and-docker.md` | Batas layanan, Docker network, PostgreSQL privat, ORM, keamanan, dan deployment. |
| `05-data-and-rules.md` | Entitas data, rumus skor, penguncian hasil, audit, dan tie-breaker. |
| `06-acceptance-and-operations.md` | Kriteria penerimaan, QA, gladi bersih, dan SOP pelaksanaan. |
| `TASKS.md` | Backlog implementasi berurutan dengan definisi selesai, beserta status implementasi. |
| `DECISIONS.md` | Nilai default Milestone 0 yang masih perlu direview/disetujui panitia. |
| `RUNBOOK.md` | Prosedur operator hari-H: persiapan, konfigurasi NPM, kontrol lomba, SOP insiden, backup/restore, load test. |

## Status implementasi

Paket ini kini juga disertai source code aplikasi (`submission/`) beserta
konfigurasi Docker yang runnable — implementasi P0 dari `TASKS.md` sudah
selesai dibangun. Mulai dari `SETUP.md` untuk menjalankannya.

## Keputusan teknis utama

- Aplikasi: Next.js yang sudah tersedia, dengan UI shadcn.
- Data: PostgreSQL berbasis image Alpine, dengan volume persisten.
- ORM: Drizzle ORM + driver `node-postgres`.
- Realtime: WebSocket di layanan aplikasi atau gateway realtime yang dikelola dalam boundary aplikasi.
- Jaringan: aplikasi bergabung ke network eksternal `submission-app` untuk Nginx Proxy Manager dan network database internal privat; PostgreSQL hanya terhubung ke network database internal.


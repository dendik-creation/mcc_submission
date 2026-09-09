# 05. Data and Rules

## Entitas inti

| Entitas | Data penting | Catatan |
| --- | --- | --- |
| User | id, role, identitas login, status | Peran peserta atau Juri/Admin. |
| Participant | nomor peserta, nama, NIM, kontak, status registrasi | Satu participant terhubung ke satu user peserta bila login individu digunakan. |
| Competition | nama, jadwal, state, konfigurasi ambang timer | Satu record acara aktif untuk MVP. |
| Submission | participant, URL aktif, submitted_at server, status validasi, tepat waktu | Hanya satu submission aktif per peserta. |
| SubmissionRevision | submission, URL lama/baru, timestamp, pelaku, alasan | Riwayat tidak dihapus. |
| Score | juri, peserta, lima nilai, status draft/final, catatan | Unik per pasangan juri dan peserta. |
| ResultSnapshot | waktu penguncian, urutan, skor akhir, pemenang | Bukti hasil saat diumumkan. |
| AuditLog | aktor, aksi, target, waktu, metadata | Tidak dapat diubah melalui UI umum. |

## Status submission

| Status | Arti |
| --- | --- |
| Belum submit | Peserta belum memiliki submission aktif. |
| Diterima | Link tersimpan sebelum deadline. |
| Diterima terlambat | Link disimpan setelah deadline karena kebijakan/override. |
| Perlu diperbaiki | Format/akses link bermasalah. |
| Tidak dapat diakses | Link tidak publik atau gagal dibuka saat verifikasi. |

## Perhitungan skor

Untuk setiap kriteria: `skor terbobot = (nilai 1-10 / 10) × bobot`.

Skor total satu juri adalah jumlah lima skor terbobot, dengan nilai maksimum 100. Jika terdapat beberapa juri, skor akhir peserta adalah rata-rata skor total dari seluruh penilaian final yang lengkap.

## Urutan pemenang

1. Skor final tertinggi.
2. Jika seri: nilai rata-rata Kreativitas & Orisinalitas tertinggi.
3. Jika masih seri: timestamp submission aktif paling awal.
4. Jika masih seri: status `perlu keputusan panitia`; keputusan dicatat ke audit log dan snapshot hasil.

## Penguncian hasil

- Hasil hanya boleh dikunci oleh Juri/Admin.
- Sistem harus memperingatkan jika ada peserta eligible yang belum memiliki penilaian lengkap.
- Penguncian menghasilkan snapshot immutable untuk tiga pemenang dan seluruh peringkat.
- Membuka hasil kembali harus meminta alasan; setiap nilai/hasil setelahnya membuat snapshot baru, tidak menimpa snapshot lama.


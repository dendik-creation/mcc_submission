# 06. Acceptance and Operations

## Kriteria penerimaan

1. Peserta yang submit sebelum deadline menerima konfirmasi sukses hanya setelah URL dan timestamp server tersimpan.
2. Submission sukses memperbarui dashboard juri dan Live Competition Board tanpa refresh manual.
3. Layar proyektor hanya menampilkan notifikasi generik tanpa identitas atau tautan peserta.
4. Saat countdown habis, API menolak submit/pembaruan walaupun countdown browser belum tersinkron.
5. Juri dapat memberi lima nilai 1-10; total otomatis dan tidak melebihi 100.
6. Hasil final menampilkan tiga pemenang sesuai aturan skor dan tie-breaker.
7. Perubahan link, timer, nilai, dan penguncian hasil dapat ditelusuri di audit log.
8. PostgreSQL tidak dapat diakses dari network proxy atau host publik.

## Uji wajib

- Submit normal, submit link salah, link tidak publik, dan pembaruan link terakhir.
- Deadline serentak pada beberapa peserta.
- Timer mulai/jeda/lanjut/akhir pada beberapa layar.
- WebSocket terputus lalu reconnect.
- Pengujian semua bobot skor dan setiap kondisi tie-breaker.
- Pembatasan akses per peran, termasuk URL proyektor.
- Restart aplikasi dan database untuk memastikan volume dan pemulihan data.
- Jalur proxy HTTPS dan upgrade WebSocket melalui Nginx Proxy Manager.

## Gladi bersih

1. Impor data peserta simulasi dan buat akun juri/operator.
2. Jalankan timer dengan durasi pendek pada perangkat proyektor asli.
3. Submit beberapa karya simulasi dari jaringan yang berbeda.
4. Periksa toast proyektor tidak membocorkan data peserta.
5. Lakukan penilaian multi-juri, simulasikan seri, lalu kunci hasil.
6. Uji prosedur jaringan putus dan pencatatan manual cadangan.
7. Backup database sebelum lomba dan pastikan prosedur restore dipahami operator.

## SOP insiden ringkas

| Insiden | Tindakan awal |
| --- | --- |
| Link tidak publik | Tandai Perlu diperbaiki; peserta memperbarui sebelum deadline. |
| Peserta mengklaim sudah submit tetapi gagal | Periksa audit log; gunakan bukti waktu dan SOP panitia. |
| Internet bermasalah | Catat submission darurat melalui SOP manual; masukkan dengan audit trail setelah koneksi pulih. |
| Proyektor/realtime putus | Timer server tetap berjalan; operator memuat ulang layar proyektor. |
| Hasil sengketa | Gunakan ResultSnapshot dan audit log; jangan ubah tanpa alasan tercatat. |


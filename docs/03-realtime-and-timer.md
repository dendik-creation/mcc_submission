# 03. Realtime and Timer

## Prinsip waktu resmi

- Waktu server adalah satu-satunya sumber waktu resmi.
- Countdown di browser hanyalah representasi dari state server dan disinkronkan ulang saat reconnect.
- Admin dapat mengatur jadwal/waktu selesai serta melakukan mulai, jeda, lanjutkan, dan akhiri lomba.
- Semua aksi kontrol timer masuk audit log.

## State lomba

| State | Submission peserta | Layar proyektor |
| --- | --- | --- |
| Belum dibuka | Tidak tersedia | Informasi lomba akan dimulai. |
| Berjalan | Dapat submit/perbarui hingga deadline | Countdown besar dan jumlah submission. |
| Dijeda | Ditahan, tidak dapat submit selama jeda | Status lomba dijeda. |
| Ditutup | Ditolak; hanya admin dapat membuka ulang | Waktu pengerjaan selesai. |

## Event realtime

| Event | Penerima | Efek |
| --- | --- | --- |
| Perubahan timer | Peserta, Juri/Admin, proyektor | Perbarui state dan countdown. |
| Submission diterima | Juri/Admin, proyektor | Perbarui jumlah; tampilkan toast generik. |
| Submission diperbarui | Juri/Admin | Perbarui daftar tanpa mengganggu proyektor. |
| Status lomba diubah | Semua klien relevan | Tampilkan state terbaru. |

## Ketentuan Live Competition Board

- Menampilkan nama lomba, countdown besar, status lomba, dan total `submission/terdaftar`.
- Toast maksimal singkat dan generik: **“Submission baru diterima.”**
- Tidak pernah menampilkan nama, nomor peserta, tautan karya, urutan siapa paling cepat, skor, atau peringkat.
- Dialog besar digunakan untuk ambang waktu configurable, misalnya 60, 30, 10, dan 5 menit tersisa, serta saat waktu berakhir.
- Batasi animasi/notifikasi agar tidak mengganggu fokus peserta.

## Keandalan realtime

- Klien berusaha reconnect secara otomatis setelah putus koneksi.
- Setelah reconnect, klien meminta state timer dan jumlah submission terbaru dari server.
- Bila WebSocket tidak tersedia sementara, dashboard tetap memuat status melalui refresh/polling berkala sebagai fallback.
- Toast hanya dipicu oleh event submission yang sukses tersimpan, bukan saat formulir peserta baru dikirim.


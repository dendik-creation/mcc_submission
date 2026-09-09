# 02. Functional Requirements

## Peran dan akses

| Peran | Diizinkan | Dilarang |
| --- | --- | --- |
| Peserta | Mengelola submission sendiri sebelum deadline; melihat status sendiri. | Melihat peserta lain, skor, rekap, atau kontrol waktu. |
| Juri/Admin | Mengelola peserta; mengatur lomba; membuka karya; memberi nilai; mengunci hasil. | Mengubah submission atas nama peserta tanpa jejak audit. |
| Proyektor | Melihat timer, status lomba, jumlah submission, dan toast generik. | Mengakses link, nama, nomor peserta, skor, atau kontrol. |

## Submission karya

1. Peserta membuka halaman submission ketika lomba berstatus dibuka.
2. Peserta memasukkan satu URL Google AI Studio yang telah disetel public dan menyetujui pernyataan keaslian.
3. Sistem memvalidasi format URL, menyimpan submission, dan mencatat timestamp server.
4. Sistem memperbarui status submission peserta serta menerbitkan event realtime.
5. Peserta boleh mengganti URL hingga deadline. Versi sebelumnya disimpan sebagai riwayat; versi aktif terakhir menjadi bahan penilaian.
6. Saat waktu habis, pengiriman/pembaruan ditolak kecuali Juri/Admin membuka ulang submission dan alasan dicatat.

Timestamp server adalah bukti resmi waktu submit. Timestamp yang terlihat di Google AI Studio hanya boleh dicatat sebagai bukti pendukung.

## Manajemen peserta

- Juri/Admin dapat menambah, mengimpor CSV, mengedit, menonaktifkan, mencari, dan memfilter peserta.
- Data minimum: nomor peserta, nama, NIM, email atau kontak, status registrasi, dan status submission.
- Nomor peserta serta NIM wajib unik.

## Penilaian

| Kriteria | Bobot | Skala |
| --- | ---: | --- |
| Kesesuaian Tema & Kelengkapan Konten | 25% | 1-10 |
| Desain & UI/UX | 25% | 1-10 |
| Fungsionalitas & Responsive | 25% | 1-10 |
| Kreativitas & Orisinalitas | 15% | 1-10 |
| Efektivitas Pakai AI | 10% | 1-10 |

- Form menampilkan nilai, skor terbobot otomatis, dan catatan opsional.
- Juri dapat menyimpan draft sebelum final.
- Juri hanya dapat mengubah nilainya sendiri sebelum hasil dikunci.
- Peserta yang belum memiliki nilai lengkap dari seluruh juri aktif tidak masuk leaderboard final.

## Hasil dan pemenang

- Leaderboard hanya tersedia internal untuk Juri/Admin.
- Admin wajib mengonfirmasi tindakan Kunci Hasil.
- Sistem menyimpan snapshot peringkat saat dikunci.
- Jika hasil dibuka kembali, alasan, akun admin, dan waktu perubahan harus dicatat.
- Pemenang 1-3 hanya diumumkan setelah hasil dikunci.


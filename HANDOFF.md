# HANDOFF
Terakhir: 25 Nov 2026
Item: DASH-10 (ringkasan agenda) — SELESAI
File utama: app/Http/Controllers/AdminController.php,
  resources/js/pages/admin/index.jsx,
  tests/Feature/AdminDashboardTest.php
Status: Kartu ringkasan agenda menampilkan pekerjaan belum selesai (status != 'done')
  dengan tenggat hari ini dan minggu ini (Senin-Minggu) zona waktu Asia/Jakarta;
  tiap baris memuat status, prioritas, judul tertaut ke pekerjaan, dan tenggat;
  empty state untuk kedua kolom; test Carbon batas hari & minggu lulus; check.sh hijau.
Berikutnya: AUTH-09 (remember me & masa berlaku session) dari antrean FEATURES.md

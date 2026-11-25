# HANDOFF
Terakhir: 25 Nov 2026
Item: AUTH-09 (remember me & masa berlaku session) — SELESAI
File utama: app/Http/Controllers/AdminAuthController.php,
  resources/js/pages/auth/admin-login.jsx,
  tests/Feature/AdminAuthTest.php,
  config/session.php
Status: Checkbox "Ingat saya" ditambahkan ke form login admin dan diteruskan ke
  Auth::attempt; remember_token terisi saat remember me dan dibersihkan saat logout;
  masa berlaku session 120 menit (SESSION_LIFETIME); check.sh hijau.
Berikutnya: WORK-18 (riwayat aktivitas pekerjaan) dari antrean FEATURES.md

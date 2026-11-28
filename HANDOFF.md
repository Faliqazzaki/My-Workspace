# HANDOFF
Terakhir: 28 Nov 2026
Item: KNOW-02 Statistik pengetahuan (catatan/minggu, tag teratas) — SELESAI
File utama: app/Http/Controllers/AdminController.php, resources/js/pages/admin/index.jsx, tests/Feature/AdminDashboardTest.php, FEATURES.md, AGENT_CONTEXT.md
Status: kartu "Statistik pengetahuan" di dashboard: grafik batang 8 minggu (Senin–Minggu, Asia/Jakarta), tag teratas maks 8 dari catatan aktif, total + rata-rata/minggu; tanpa migrasi/dependency baru. check.sh hijau (pint/eslint/format/test/build); 18 test AdminDashboardTest lolos.
Verifikasi data nyata: 1 catatan aktif (2026-11-23) → minggu 23–29 Nov = 1, tag "Software Testing" = 1, rata-rata 0.1. Browser manual: buka /admin, cek kartu, bandingkan angka, dark mode, layar kecil.
Berikutnya: QA-10 Query performance review + index tambahan dari antrean FEATURES.md.

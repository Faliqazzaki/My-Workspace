# HANDOFF
Terakhir: 25 Nov 2026
Item: PROD-04 (pencarian global catatan & pekerjaan) — SELESAI
File utama: app/Http/Controllers/SearchController.php, routes/web.php,
  resources/js/components/command-palette.jsx,
  tests/Feature/SearchTest.php
Status: GET /admin/search?q= mengembalikan { notes, workItems } (maks 5 per
  model, catatan arsip dikecualikan, whereLike case-insensitive); command
  palette men-debounce 250ms, menampilkan grup Catatan/Pekerjaan, navigasi
  keyboard, dan empty state; check.sh hijau
Berikutnya: NOTE-13 (auto-save draft ke localStorage) dari "Antrean berikutnya"
  FEATURES.md

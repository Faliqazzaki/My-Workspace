# HANDOFF
Terakhir: 28 Nov 2026
Item: NEWS-01 Tabel sumber berita + konfigurasi RSS — SELESAI
File utama: database/migrations/2026_11_28_010000_create_news_tables.php, app/Models/News{Source,Article}.php, database/factories/News{Source,Article}Factory.php, app/Rules/SafeNewsUrl.php, app/Http/Controllers/NewsSourceController.php, routes/web.php, resources/js/pages/admin/news-sources.jsx, resources/js/layouts/admin-layout.jsx, tests/Feature/NewsSourceTest.php, e2e/tests/admin.spec.js, AGENT_CONTEXT.md, FEATURES.md
Status: halaman /admin/news/sources (sidebar) dengan daftar, tambah/edit, toggle aktif, hapus + konfirmasi; empty state tanpa data palsu. Validasi http/https, host lokal/privat ditolak, unik, maks 20. FK cascade + hapus artikel eksplisit.
Verifikasi: 20 test Pest lolos; npm run e2e 6/6 hijau termasuk halaman baru; check.sh hijau (pint/eslint/format/test/build). Migrasi PostgreSQL up→rollback→up sukses; baris pribadi tidak berubah (users=1 notes=1 work_items=2 projects=1 subtasks=5 activities=0 saved_views=0 note_work_item=0), tabel news kosong. Tidak ada panggilan jaringan/AI. graphify update . dijalankan.
Berikutnya: NEWS-02 Pengambilan RSS sumber berita (network, perlu izin/jadwal).

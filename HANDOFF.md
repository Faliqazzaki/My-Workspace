# HANDOFF
Terakhir: 28 Nov 2026
Item: QA-06 Test browser end-to-end (Playwright) — SELESAI
File utama: playwright.config.js, e2e/env.js, e2e/check-db.php, e2e/global-setup.js, e2e/tests/admin.spec.js, package.json, package-lock.json, .gitignore, FEATURES.md, AGENT_CONTEXT.md
Status: 6 test Chromium hijau (login, semua halaman utama + toggle Daftar/Papan/Kalender, buat pekerjaan + detail + ubah status, buat catatan + detail Markdown, command palette + notifikasi, dark mode). Tiap test gagal pada pageerror/console.error. check.sh hijau (pint/eslint/format/test/build).
Isolasi: DB SQLite `database/e2e.sqlite` (di-gitignore), admin dummy `e2e-admin` dibuat saat setup, penjaga DB menghentikan test jika koneksi bukan SQLite/e2e; server e2e port 8001 dengan build production dan service worker diblokir, mati otomatis setelah test. `npm run e2e` tidak masuk check.sh/CI.
Verifikasi: jumlah baris PostgreSQL pribadi sama sebelum/sesudah (users=1 notes=1 work_items=2 projects=1 subtasks=5 activities=0 saved_views=0 note_work_item=0); port 8001 kosong, tidak ada server uji tertinggal (composer dev milik pengguna tidak disentuh). graphify update . sudah dijalankan.
Berikutnya: QA-10 Query performance review + index tambahan dari antrean FEATURES.md.

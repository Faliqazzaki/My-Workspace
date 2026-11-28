# 0008 — Isolasi e2e dengan SQLite

## Konteks
Test Pest tidak menjalankan React, sehingga error JavaScript yang membuat
halaman blank lolos. Test browser tidak boleh menyentuh database PostgreSQL
pribadi.

## Keputusan
Tambahkan Playwright + Chromium dengan `npm run e2e`. Global setup memaksa
`DB_CONNECTION=sqlite`, `DB_DATABASE=database/e2e.sqlite` (di-gitignore),
kredensial admin dummy, dan berhenti lebih awal bila koneksi bukan e2e.
WebServer memakai port 8001 + build production; service worker diblokir.

## Konsekuensi
- `npm run e2e` tidak masuk `scripts/check.sh`/CI; dijalankan manual.
- Test berserial karena satu database bersama.
- Artefak Playwright dan DB e2e tidak ikut ter-commit.

## Status
Diterima (QA-06; §12 `AGENT_CONTEXT.md`).

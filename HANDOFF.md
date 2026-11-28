# HANDOFF
Terakhir: 28 Nov 2026
Item: NEWS-02 + NEWS-03 Pengambilan RSS terjadwal + dedupe — SELESAI
File utama: app/Console/Commands/FetchNewsCommand.php, app/Jobs/FetchNewsSource.php, app/Services/News/*, routes/console.php, app/Providers/AppServiceProvider.php, tests/Feature/NewsFetchTest.php, docs/adr/0011-safe-rss-fetch.md, AGENT_CONTEXT.md, FEATURES.md
Status: news:fetch mengantre satu job per sumber aktif (opsi --source), scheduler harian tanpaOverlapping. Fetcher aman: HostResolver + blokir IP privat/link-local/metadata, redirect maks 3 divalidasi ulang, timeout 5/10 dtk, maks 2 MB, UA tetap. Parser RSS/Atom SimpleXML LIBXML_NONET tanpa NOENT. Dedupe NewsUrl::normalize/hash + insertOrIgnore. last_fetched_at hanya saat sukses.
Verifikasi: 11 test Pest lolos (Http::fake + preventStrayRequests + resolver palsu); check.sh hijau (pint/eslint/format/test/build). Tidak ada panggilan jaringan/AI sungguhan, tanpa dependency/migrasi baru. Baris pribadi PostgreSQL tidak berubah; tabel news kosong. graphify update . dijalankan.
Berikutnya: NEWS-05 Pilih 3 berita terbaik per hari dan NEWS-07 Fallback saat AI/API gagal.

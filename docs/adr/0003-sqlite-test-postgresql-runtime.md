# 0003 — SQLite untuk test, PostgreSQL untuk runtime

## Konteks
Test harus cepat dan tidak bergantung pada server database pribadi, tetapi
runtime memakai PostgreSQL (kolom `jsonb`, `pg_dump`).

## Keputusan
`phpunit.xml` memaksa `DB_CONNECTION=sqlite` dan `DB_DATABASE=:memory:` untuk
Pest. Kompatibilitas PostgreSQL diverifikasi terpisah secara manual; fitur
baru diuji juga di PostgreSQL bila relevan.

## Konsekuensi
- Query harus berjalan di kedua driver; hindari SQL khusus PostgreSQL tanpa
  pengecekan driver.
- Agregasi tag dilakukan di PHP, bukan fungsi SQL khusus.
- Perbedaan perilaku menjadi known issue yang didokumentasikan.

## Status
Diterima (§4, §12, §19 `AGENT_CONTEXT.md`).

# 0009 — Index berbasis bukti EXPLAIN

## Konteks
Data nyata masih kecil, sehingga penambahan index berdasarkan tebakan berisiko
menambah biaya tulis tanpa manfaat.

## Keputusan
Ukur query utama dengan `EXPLAIN (ANALYZE, BUFFERS)` pada data sintetik di
schema sementara, lalu tambahkan index hanya bila bentuk plan membaik. Index
khusus PostgreSQL dibungkus pengecekan driver; detail ada di
[`docs/query-review.md`](../query-review.md).

## Konsekuensi
- Index `notes.created_at`, `work_items.completed_at`, dan parsial
  `work_items(due_date) WHERE status <> 'done'` ditambahkan lewat migrasi baru.
- GIN pada `tags` dan `pg_trgm` sengaja tidak dipakai (tidak ada bukti/butuh
  hak superuser).
- Migrasi harus punya `down()` dan diverifikasi naik-turun di PostgreSQL.

## Status
Diterima (QA-10; §8, §10 `AGENT_CONTEXT.md`).

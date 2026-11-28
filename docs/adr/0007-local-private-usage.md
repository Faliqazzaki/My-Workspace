# 0007 — Pemakaian lokal pribadi, tanpa deployment

## Konteks
Proyek ini dipakai sendiri di mesin lokal, bukan untuk layanan publik multiuser.

## Keputusan
Tidak menyiapkan deployment ke server publik. Fitur yang bergantung layanan
eksternal/biaya (berita AI, agen, beberapa item produksi) ditunda atau
dibatalkan. Backup mengandalkan `pg_dump` lokal + scheduler saat mesin aktif.

## Konsekuensi
- Satu akun admin dan data lokal menjadi model keamanan yang memadai.
- UI bahasa Indonesia, kode Inggris.
- Backup tidak punya retry otomatis bila jadwal terlewat.

## Status
Diterima (FND-09, NOTE-16, PROD-06/07a; §19 `AGENT_CONTEXT.md`).

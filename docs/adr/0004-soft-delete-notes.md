# 0004 — Arsip catatan dengan soft delete

## Konteks
Catatan perlu "diarsipkan" dan dipulihkan tanpa kehilangan tautan ke pekerjaan.

## Keputusan
`Note` memakai `SoftDeletes`. Rute arsip memakai `withTrashed()` hanya untuk
restore; query normal otomatis mengecualikan catatan terarsip. Baris pivot
`note_work_item` tidak dihapus saat arsip.

## Konsekuensi
- Tautan kembali otomatis saat catatan dipulihkan.
- `forceDelete()` tetap cascade ke pivot.
- Filter tag/arsip dan hitungan arsip memakai query scoped yang sesuai.

## Status
Diterima (NOTE-11; §8.1 `AGENT_CONTEXT.md`).

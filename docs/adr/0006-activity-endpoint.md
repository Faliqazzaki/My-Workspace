# 0006 — Riwayat aktivitas lewat endpoint terpisah

## Konteks
Detail pekerjaan menampilkan riwayat perubahan, tetapi riwayat tidak perlu
dikirim pada setiap halaman daftar.

## Keputusan
Aktivitas dicatat di tabel `work_item_activities` dan diambil malas melalui
`GET /admin/work-items/{workItem}/activities` (maks 20 baris) ketika dialog
detail dibuka.

## Konsekuensi
- Props daftar pekerjaan tetap ringan.
- Perubahan status dicatat `completed_at`/aktivitas dari controller, bukan
  constraint database.
- Index `(work_item_id, created_at)` melayani endpoint ini.

## Status
Diterima (WORK-*; §19 `AGENT_CONTEXT.md`).

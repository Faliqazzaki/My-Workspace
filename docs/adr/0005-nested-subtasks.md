# 0005 — Subtask sebagai payload bersarang

## Konteks
Subtask selalu diedit bersama pekerjaan induknya dalam satu dialog; tidak ada
kebutuhan mengelola subtask dari halaman terpisah.

## Keputusan
Subtask dikirim sebagai array bersarang pada payload pekerjaan dan disinkronkan
oleh `WorkItemController::syncSubtasks()` (update, buat, hapus yang hilang,
posisi mengikuti urutan kiriman). Tidak ada endpoint CRUD tersendiri.

## Konsekuensi
- Satu request menyimpan pekerjaan + seluruh subtasknya.
- Urutan kartu/progres dihitung dari kolom `position` dan `is_done`.
- Perlu validasi array di `validatedData()` pada controller.

## Status
Diterima (WORK-*; §19 `AGENT_CONTEXT.md`).

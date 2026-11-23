# Spesifikasi fitur yang sudah selesai
Arsip dari AGENT_CONTEXT §15. Baca hanya jika perlu mengubah fitur terkait.

### 15.1 NOTE-08/09/10 — Detail & Markdown (selesai)

**Tujuan:** catatan bisa dibaca sebagai dokumen, bukan hanya di kartu.

**Perubahan:**

- Route `GET /admin/notes/{note}` → `admin.notes.show`.
- `NoteController@show` → `Inertia::render('admin/notes/show', ['note' => $note])`.
- Halaman baru `resources/js/pages/admin/notes/show.jsx`.
- Dependency: `react-markdown`, `remark-gfm`, `rehype-sanitize`.
- Preview di dialog editor: tab **Tulis / Pratinjau**.

**Alur:** daftar → klik judul → detail → **Edit** membuka dialog yang sama →
**Kembali**.

**Acceptance:**

- Markdown aman (HTML mentah disanitasi; tidak ada XSS).
- Code block, list, tabel, link, dan heading tampil benar.
- Catatan tidak ditemukan → 404.
- Tanggal, tag, status pin tampil.
- Test: guest redirect, admin bisa buka, 404, sanitasi.

**Out of scope:** komentar, versi catatan, kolaborasi.

### 15.2 NOTE-11 — Tautan catatan ↔ pekerjaan (selesai)

**Tujuan:** pekerjaan bisa merujuk pengetahuan pendukung.

**Data:**

```
note_work_item
  note_id FK notes cascade
  work_item_id FK work_items cascade
  timestamps
  unique(note_id, work_item_id)
```

**Model:** `Note::workItems()`, `WorkItem::notes()` (belongsToMany).

**Backend:**

- `WorkItemController` menerima `notes: array` berisi ID; validasi `exists:notes,id`;
  `sync()` setelah create/update.
- `NoteController@index`/`show` memuat `workItems` ringkas.
- Dashboard tidak perlu berubah.

**Frontend:**

- Di form pekerjaan: pemilih catatan (multi-select / checklist dengan pencarian).
- Di detail catatan: daftar pekerjaan terkait + status.
- Bisa lepas tautan.

**Acceptance:** tautan tersimpan dua arah, tidak duplikat, validasi ID,
test attach/detach.

**Out of scope:** membuat catatan baru dari form pekerjaan (bisa menyusul).

### 15.3 WORK-11/12 — Kanban (selesai)

**Tujuan:** mengelola alur kerja secara visual.

**Frontend:**

- Toggle **Daftar / Papan** (query `?view=board` atau state).
- 4 kolom: Backlog, To do, Dikerjakan, Selesai.
- `@dnd-kit/core` + `@dnd-kit/sortable`.
- Kartu: judul, prioritas, tenggat, tag, overdue.
- Drop → `PATCH /admin/work-items/{id}/status` (endpoint sudah ada).
- Optimistic update; rollback jika gagal.
- Alternatif keyboard: select status di kartu (aksesibilitas).

**Backend:** tidak ada perubahan wajib. `?view=board` mengembalikan
`boardItems` (semua item terfilter, tanpa pagination); daftar tetap paginated.
Jika butuh urutan manual, tambah `position` + endpoint reorder (fase berikutnya,
butuh `@dnd-kit/sortable`).

**Acceptance:** drag mengubah status + `completed_at`, jumlah tab ikut berubah,
mobile bisa scroll horizontal, list view tidak regresi.

**Out of scope:** WIP limit, kolom kustom, swimlane.

### 15.4 WORK-13 — Proyek / area (selesai)

**Data:**

```
projects
  id, name, description nullable, color nullable,
  archived_at nullable, timestamps
work_items.project_id FK nullable nullOnDelete
```

**Backend:** CRUD proyek, filter `project_id` di index pekerjaan, progress
`done/total` per proyek.

**Frontend:** halaman `/admin/projects`, pemilih proyek di form pekerjaan,
filter proyek di halaman pekerjaan, progress bar di kartu proyek.

**Acceptance:** pekerjaan tanpa proyek tetap valid; hapus proyek tidak menghapus
pekerjaan; filter dan progress benar.

### 15.5 WORK-14 — Subtask (selesai)

**Data:**

```
work_item_subtasks
  id, work_item_id FK cascade, title,
  is_done boolean default false, position int default 0, timestamps
```

**Frontend:** di dialog/detail pekerjaan, tambah/hapus/centang subtask;
tampilkan `x/y` dan progress bar di kartu.

**Acceptance:** urutan stabil, progress dihitung benar, cascade delete,
test CRUD subtask.

### 15.5a WORK-15 — Kalender (selesai)

**Backend:** `?view=calendar` mengembalikan `calendarItems` — semua item
terfilter yang punya `due_date`, urut tenggat lalu prioritas (urgent→low).
Filter pencarian, prioritas, dan proyek tetap berlaku; filter status diabaikan.
Tanpa pagination.

**Frontend:** `resources/js/components/work-items/work-calendar.jsx` merender
grid 6×7 minggu mulai Senin, navigasi bulan di client (tanpa request tambahan),
penanda hari ini, jumlah tenggat per hari/bulan, dan legenda status. Item
selesai dicoret; item terlambat berwarna merah. Klik item → dialog edit.
Tampilan bisa di-scroll horizontal di mobile.

**Acceptance:** semua item bertenggat muncul di tanggal yang benar, item tanpa
tenggat tidak tampil, filter proyek/pencarian/prioritas bekerja, dan item bisa
diedit dari kalender.
# QA-10 — Query performance review

## Metode

Pengukuran memakai data sintetis di schema sementara `qa10_tmp` (dibuat dengan
`CREATE TABLE ... LIKE public.<tabel> INCLUDING ALL`, lalu `ANALYZE`). Schema
`public` tidak disentuh. Ukuran data: 5.000 catatan, 5.000 pekerjaan, 15.000
subtask, 20.000 aktivitas, 10.000 tautan catatan–pekerjaan, 20 proyek.

Tiap query dijalankan dengan `EXPLAIN (ANALYZE, BUFFERS)` memakai SQL yang
dihasilkan Eloquent (bukan SQL tulisan ulang). Angka waktu adalah satu kali
eksekusi pada mesin lokal dan dapat berfluktuasi; keputusan lebih banyak
berdasarkan **bentuk plan** dan jumlah buffer yang disentuh, bukan satu angka.

## Query yang diperiksa

| Query (sumber) | Plan sebelum | Plan sesudah | Waktu sebelum → sesudah |
| --- | --- | --- | --- |
| Daftar catatan + `withCount`, urut pin/updated (`NoteController::index`) | Index Scan Backward `notes_is_pinned_updated_at_idx`, 88 buffer | sama | 0,81 → 0,43 ms |
| Daftar catatan filter tag (`whereJsonContains`) | Index Scan Backward + filter; 50 baris cocok | sama (GIN kandidat tidak dipakai planner) | 0,46 → 0,16 ms |
| Cari catatan `ILIKE %...%` (`NoteController::index`, `SearchController`) | Seq Scan + top-N sort, 500 baris cocok | sama | 14,8 → 8,5 ms |
| Agregasi semua tag (`NoteController::index`) | Seq Scan 5.000 baris | sama | 2,11 → 1,28 ms |
| Daftar pekerjaan + filter + urutan (`WorkItemController::index`) | Bitmap Index Scan `work_items_status_idx` + top-N sort | sama | 2,80 → 1,66 ms |
| Hitungan status `groupBy` | Index Only Scan `work_items_status_idx` | sama | 1,30 → 1,07 ms |
| Papan/ kalender (semua baris) | Seq Scan + quicksort 5.000 baris | sama | 11,1 → 10,0 ms |
| Eager-load subtask per 30 pekerjaan | Bitmap Index Scan `work_item_subtasks_work_item_id_position_idx` | sama | 0,11 → 0,11 ms |
| Pencarian global pekerjaan | Seq Scan + top-N sort | sama | 8,72 → 8,76 ms |
| Notifikasi tenggat (`NotificationController`) | Index Scan `work_items_due_date_index` | Index Scan index parsial baru | 0,04 → 0,11 ms (fluktuasi cache) |
| Riwayat satu pekerjaan (`WorkItemController::activities`) | Bitmap Index Scan `work_item_activities_work_item_id_created_at_idx` | sama | 0,08 → 0,08 ms |
| Jumlah terlambat (`AdminController::index`) | Bitmap Heap Scan `work_items_due_date_index`, 87 buffer, cost 141,7 | **Index Only Scan** index parsial baru, 3 buffer, cost 40,6 | 0,64 → 0,44 ms |
| Pekerjaan aktif 5 teratas | Seq Scan + top-N sort | sama | 2,74 → 3,46 ms |
| Agenda minggu ini (`agendaSummary`) | Bitmap Index Scan `work_items_due_date_index` | Bitmap Index Scan index parsial baru | 0,45 → 0,35 ms |
| Grafik aktivitas 30 hari — catatan | Seq Scan, 67 buffer | **Bitmap Index Scan** `notes_created_at_idx` | 0,93 → 0,46 ms |
| Grafik aktivitas 30 hari — selesai | Seq Scan, 84 buffer | **Index Only Scan** `work_items_completed_at_idx`, 4 buffer | 0,96 → 0,26 ms |
| Statistik 8 minggu — catatan (`knowledgeStats`) | Seq Scan 2.309/5.000 baris | tetap Seq Scan (selektivitas terlalu rendah) | 1,35 → 1,11 ms |
| Export catatan & pekerjaan (`AdminDataController`) | Index Scan primary key | sama | ~1,5 ms |

## N+1

Tidak ada N+1 yang ditemukan. Daftar pekerjaan (list/board/calendar) sudah
`with('notes:id,title', 'project:id,name,color', 'subtasks:...')`; notifikasi
sudah `with('project:id,name,color')`; export pekerjaan sudah `with('subtasks')`;
`NoteController::index` memakai `withCount('workItems')`, bukan memuat relasi per
baris. Catatan tambahan: `NoteController::index` mengambil `tags` dari seluruh
catatan aktif dalam satu query (O(n) baris, bukan N+1); ini disengaja agar
kompatibel SQLite/PostgreSQL dan masih murah pada skala saat ini.

## Keputusan

Ditambahkan lewat migrasi baru `2026_11_28_000000_add_query_performance_indexes`
(lengkap dengan `down()`):

1. `notes (created_at)` — grafik aktivitas 30 hari berubah dari Seq Scan ke
   Bitmap Index Scan (0,93 → 0,46 ms).
2. `work_items (completed_at)` — grafik selesai berubah dari Seq Scan ke
   Index Only Scan (0,96 → 0,26 ms, buffer 84 → 4).
3. `work_items (due_date) WHERE status <> 'done'` (hanya PostgreSQL) — dipakai
   notifikasi/agenda, dan hitungan terlambat berubah menjadi Index Only Scan
   dengan cost 141,7 → 40,6.

Migrasi diuji di PostgreSQL: `migrate --force`, `migrate:rollback --step=1`,
lalu `migrate --force` lagi; index hilang dan muncul sesuai `up()`/`down()`.

## Sengaja tidak dilakukan

- **GIN pada `notes.tags` (jsonb):** kandidat index dibuat di schema uji tetapi
  planner tetap memilih `notes_is_pinned_updated_at_idx` karena filter tag hanya
  menyisakan 50/5.000 baris dan urutan sudah terpenuhi index tersebut. Tidak ada
  bukti manfaat, jadi tidak ditambahkan.
- **`pg_trgm` untuk pencarian `ILIKE %...%`:** butuh ekstensi dan hak superuser.
  Opsi ini dicatat untuk kemudian jika pencarian menjadi bottleneck; saat ini
  biayanya ~8–15 ms pada 5.000 baris dan tidak ada index btree yang membantu.
- **Index komposit `(status, due_date, created_at)`:** filter status sudah
  memakai `work_items_status_idx` dan sorting memakai top-N heap sort; tidak ada
  perbaikan plan yang terlihat.
- **Perubahan perilaku query:** tidak ada, sehingga tidak ada test baru. Seluruh
  test lama tetap hijau.

# HANDOFF
Terakhir: 28 Nov 2026
Item: QA-10 Query performance review + index tambahan — SELESAI
File utama: database/migrations/2026_11_28_000000_add_query_performance_indexes.php, docs/query-review.md, FEATURES.md, AGENT_CONTEXT.md
Status: EXPLAIN (ANALYZE, BUFFERS) pada 5.000 catatan/pekerjaan di schema sementara qa10_tmp. Index baru: notes.created_at, work_items.completed_at, dan parsial PostgreSQL work_items(due_date) WHERE status <> 'done' (ddl dibungkus pengecekan driver). Migrasi up→rollback→up di PostgreSQL sukses. check.sh hijau.
Keputusan: GIN jsonb tags tidak dipakai planner (tidak ditambahkan); pg_trgm butuh superuser (hanya didokumentasikan). Tidak ada N+1; tanpa perubahan perilaku maka tanpa test baru.
Verifikasi: qa10_tmp sudah dihapus; baris public tidak berubah (users=1 notes=1 work_items=2 projects=1 subtasks=5 activities=0 saved_views=0 note_work_item=0). graphify update . dijalankan.
Berikutnya: QA-12 Dokumentasi arsitektur & ADR dari antrean FEATURES.md.

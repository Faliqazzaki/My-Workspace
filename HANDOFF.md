# HANDOFF
Terakhir: 28 Nov 2026
Item: QA-12 Dokumentasi arsitektur & ADR — SELESAI
File utama: docs/architecture.md, docs/adr/ (README + 0001–0009), AGENT_CONTEXT.md §5, FEATURES.md
Status: dokumentasi saja, tanpa perubahan kode. architecture.md (151 baris) memuat stack, alur Inertia, auth admin, peta modul, diagram Mermaid 8 tabel, strategi Pest+SQLite dan Playwright terisolasi, konteks lokal; tautan ke backup-restore.md dan query-review.md. 9 ADR singkat (≤21 baris) dengan format Konteks/Keputusan/Konsekuensi/Status.
Verifikasi: setiap klaim dicek lewat graphify query dan kode (routes/web.php, model, middleware, phpunit.xml, §19 AGENT_CONTEXT). graphify update . dijalankan. check.sh tidak dijalankan karena tidak ada perubahan kode; tidak ada test baru.
Berikutnya: WORK-17 Lampiran file pada pekerjaan dari antrean FEATURES.md.

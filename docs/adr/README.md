# Architecture Decision Records (ADR)

Format tiap berkas: Konteks, Keputusan, Konsekuensi, Status. Penomoran
berurutan dan tidak diubah setelah diterima.

| ADR | Keputusan | Status |
| --- | --- | --- |
| [0001](0001-laravel-inertia-react.md) | Laravel + Inertia + React, tanpa rewrite | Diterima |
| [0002](0002-auth-database-is-admin.md) | Auth berbasis database dengan `is_admin` | Diterima |
| [0003](0003-sqlite-test-postgresql-runtime.md) | SQLite untuk test, PostgreSQL untuk runtime | Diterima |
| [0004](0004-soft-delete-notes.md) | Arsip catatan dengan soft delete | Diterima |
| [0005](0005-nested-subtasks.md) | Subtask sebagai payload bersarang | Diterima |
| [0006](0006-activity-endpoint.md) | Riwayat aktivitas lewat endpoint terpisah | Diterima |
| [0007](0007-local-private-usage.md) | Pemakaian lokal pribadi, tanpa deployment | Diterima |
| [0008](0008-isolated-e2e-sqlite.md) | Isolasi e2e dengan SQLite | Diterima |
| [0009](0009-evidence-based-indexes.md) | Index berbasis bukti EXPLAIN | Diterima |
| [0010](0010-ai-provider-default-null.md) | Provider AI OpenAI-compatible, default null | Diterima |
| [0011](0011-safe-rss-fetch.md) | Pengambilan RSS dengan validasi target | Diterima |

Rujukan keputusan lain: §19 `AGENT_CONTEXT.md`. Gambaran sistem:
[`docs/architecture.md`](../architecture.md).

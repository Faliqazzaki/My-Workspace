# My Workspace

Ruang kerja digital pribadi untuk mengelola catatan, pekerjaan, dan aktivitas
sehari-hari dalam satu tempat.

**Stack:** Laravel 12 · Inertia v2 · React 19 · Tailwind CSS v4 · PostgreSQL

## Status

Fitur yang sudah berjalan:

- Login admin + shell admin responsif dengan dark mode
- Dashboard berisi statistik, pekerjaan aktif, distribusi status, catatan terbaru
- Catatan: CRUD, Markdown, tag, pin, pencarian, filter tag, pagination
- Pekerjaan: CRUD, status, prioritas, tenggat, tag, filter, pencarian, overdue

Lihat [`FEATURES.md`](FEATURES.md) untuk checklist lengkap dan rencana fitur.

## Menjalankan

```bash
composer install
npm install
cp .env.example .env      # jika belum ada
php artisan key:generate
php artisan migrate
composer dev
```

Buka `http://localhost:8000`.

Login sementara:

- Username: `my-workspace`
- Password: `admin123`

> Kredensial ini masih hardcoded dan akan diganti dengan autentikasi berbasis
> database. Lihat `AUTH-07` di [`FEATURES.md`](FEATURES.md).

## Database

Runtime memakai PostgreSQL (`my_workspace`). Test memakai SQLite in-memory
sesuai `phpunit.xml`, jadi tidak perlu database test terpisah.

## Quality gate

```bash
vendor/bin/pint
npx prettier --write resources/
npx eslint resources/
php artisan test
npm run build
```

## Dokumentasi

- [`FEATURES.md`](FEATURES.md) — checklist fitur selesai dan roadmap.
- [`AGENT_CONTEXT.md`](AGENT_CONTEXT.md) — konteks lengkap untuk agent atau
  developer berikutnya: arsitektur, konvensi, data model, workflow, dan
  protokol kolaborasi.

## Struktur singkat

```
app/Http/Controllers/   # auth, dashboard, notes, work items
app/Models/             # Note, WorkItem, User
resources/js/pages/     # halaman Inertia
resources/js/layouts/   # shell admin
resources/js/lib/       # helper tanggal & metadata
routes/web.php          # route admin
tests/Feature/          # test Pest
```

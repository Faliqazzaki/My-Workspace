# My Workspace

Ruang kerja digital pribadi untuk mengelola catatan, pekerjaan, dan aktivitas
sehari-hari dalam satu tempat.

**Stack:** Laravel 12 · Inertia v2 · React 19 · Tailwind CSS v4 · PostgreSQL

## Status

Fitur yang sudah berjalan:

- Login admin berbasis database + halaman **Keamanan** untuk ubah password
- Shell admin responsif dengan dark mode
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
php artisan db:seed --class=AdminUserSeeder
composer dev
```

Buka `http://localhost:8000`.

## Akun admin

Akun admin dibuat dari environment (`ADMIN_USERNAME`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`). Default untuk pengembangan:

- Username: `my-workspace`
- Password: `admin123`

Setelah login, ganti password lewat menu **Keamanan** (`/admin/password`).
Jangan gunakan password default di lingkungan yang bisa diakses publik.

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

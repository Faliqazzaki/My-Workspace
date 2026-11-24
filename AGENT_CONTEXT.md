# AGENT_CONTEXT — My Workspace

Dokumen ini adalah **kontrak kerja** untuk siapa pun (manusia atau coding agent)
yang melanjutkan proyek ini. Baca **bagian atas sampai §0**, `HANDOFF.md`, dan
bagian `FEATURES.md` yang relevan; bagian lain dibaca hanya jika dibutuhkan.
Jika ada konflik antara dokumen dan kode, **kode yang berjalan adalah
kebenaran**, lalu perbarui dokumen.

> Terakhir diperbarui: 24 November 2026
> Status: fondasi + Dashboard (termasuk kebiasaan mencatat) + Catatan (detail,
> Markdown, tautan pekerjaan, arsip/restore) + Pekerjaan (list + Kanban +
> kalender + proyek + subtask + saved views) sudah berjalan.

---

## Lokasi kerja & shift (WAJIB)

- Bekerja langsung di direktori repo ini (root berisi `artisan`, `composer.json`, `.git`).
- Semua pekerjaan di branch `main`. Jangan membuat branch, folder baru, salinan,
  clone, atau worktree.
- Jika `pwd` bukan root repo, berhenti dan laporkan.
- Hanya **satu agent aktif pada satu waktu** (sistem shift). Agent lain tidak
  boleh mengedit repo sampai shift diserahterimakan.

### Awal shift
1. `git status` dan `git log --oneline -5`.
2. Baca `HANDOFF.md` (pendek). Jika ada pekerjaan tertinggal (`[~]` di
   `FEATURES.md` atau perubahan belum di-commit), **lanjutkan itu dulu**;
   jangan mulai item baru.
3. Pastikan baseline hijau sebelum menambah fitur.

### Akhir shift (atau saat kuota hampir habis)
- **Item selesai:** jalankan `bash scripts/check.sh`, centang `FEATURES.md`,
  lalu commit `feat(<area>): ...`.
- **Item belum selesai:** jangan biarkan perubahan menggantung. Commit sebagai
  `wip(<ID>): <apa yang sudah dan belum>`, biarkan `[~]` di `FEATURES.md`.
- Tulis ulang `HANDOFF.md` (maks ±10 baris, timpa isi lama): item, status,
  file utama, yang belum selesai, langkah berikutnya, apakah test/build hijau.
- Jangan `git add .` secara buta; stage hanya file yang terkait item.
- Jangan commit `.env` atau kredensial.

## Hemat token (WAJIB)

**Membaca**
- Baca hanya bagian dokumen yang relevan dengan item yang dikerjakan. Spesifikasi
  fitur yang sudah selesai ada di `docs/specs-done.md`; jangan dibaca kecuali perlu.
- Cari dulu (grep / nama simbol / graph), baru baca rentang baris yang dibutuhkan.
  Jangan membaca seluruh file besar.
- Jangan membaca: `package-lock.json`, `composer.lock`, `vendor/`, `node_modules/`,
  `public/build/`, `storage/`, `bootstrap/cache/`.
- Jangan membaca ulang file yang baru saja kamu edit.

**Menjalankan perintah**
- Selama iterasi: `php artisan test --compact --filter=<NamaTest>` dan
  `npx eslint <file>` hanya pada file yang diubah.
- Format PHP: `vendor/bin/pint --dirty`.
- Quality gate penuh cukup **sekali di akhir** lewat `bash scripts/check.sh`
  (hanya mencetak yang gagal).
- Lihat perubahan dengan `git diff --stat`, bukan diff penuh.
- Jangan menjalankan `npm install` / `composer install` kecuali dependency berubah.
- Jangan menjalankan dev server atau `pail` di sesi agent.

**Menghindari pemborosan**
- Jika test/build gagal dengan error yang sama 2 kali, berhenti dan laporkan
  error-nya. Jangan menebak berulang.
- Satu sesi = satu item `FEATURES.md`. Setelah commit, akhiri sesi.
- Jika terkena limit/kuota, berhenti, tulis handoff singkat, dan jangan pindah
  ke folder/repo lain.
- Jangan merekap langkah kerja. Laporan akhir: hasil, file utama, status test.
- Handoff maksimal ±10 baris, tanpa menempel diff atau log.

**Jika graph tersedia**
- Untuk pertanyaan struktur ("di mana X", "apa yang memanggil Y"), query graph
  dulu (`/graphify query ...`), baru buka file yang ditunjuk.

## 0. TL;DR

- Produk: **My Workspace**, ruang kerja digital pribadi untuk satu admin.
- Stack: **Laravel 12 + Inertia v2 + React 19 + Tailwind v4 + PostgreSQL**.
- UI: bahasa Indonesia, font **Plus Jakarta Sans**, aksen indigo/fuchsia/sky,
  tombol **solid tanpa gradient**, mendukung dark mode.
- Auth saat ini: database (`users.username`, password hash, flag `is_admin`),
  halaman **Keamanan** untuk ubah password.
- Fitur selesai: login, shell admin, Dashboard (statistik + kebiasaan mencatat),
  Catatan (detail + Markdown + pratinjau + tautan ke pekerjaan), Pekerjaan
  (list + Kanban + kalender + proyek + subtask), Proyek/area
  (CRUD + arsip + progress).
- Test: **127 test Pest lolos** (995 assertions), build Vite berhasil.
- Cara kerja: **satu increment kecil**, backend → frontend → test → quality gate
  → verifikasi PostgreSQL → update checklist.

---

## 1. Visi produk & prinsip

**Visi:** ruang kerja digital pribadi yang fleksibel untuk mengelola pengetahuan,
informasi, pekerjaan, dan aktivitas sehari-hari dalam satu platform yang tumbuh
mengikuti kebutuhan nyata.

**Prinsip:**

1. **Personal-first** — satu pengguna, keputusan berdasarkan kebutuhan nyata.
2. **Incremental** — satu fitur kecil per iterasi, selalu dalam keadaan bisa dipakai.
3. **Practicality over quantity** — kegunaan lebih penting daripada jumlah fitur.
4. **Maintainability** — struktur jelas, konvensi konsisten, test memadai.
5. **No fake data** — dashboard dan statistik hanya menampilkan data nyata.
6. **Local data first** — fitur inti tetap berguna tanpa layanan eksternal.

**Batasan yang disengaja:**

- Bukan aplikasi multi-user. Tidak ada registrasi publik.
- Tidak ada kolaborasi real-time.
- Agent AI tidak dijalankan di dalam proses Laravel (lihat §17).
- Tidak ada rewrite stack.

---

## 2. Aturan kerja wajib

### 2.1 Sebelum menulis kode

1. Baca bagian atas `AGENT_CONTEXT` (sampai §0), `HANDOFF.md`, dan bagian `FEATURES.md` yang relevan.
2. Jalankan `git status`. **Jangan menimpa perubahan yang belum di-commit** milik
   orang lain. Jika file yang ingin diubah sedang berubah, koordinasikan dulu.
3. Pilih **satu** item dari `FEATURES.md` yang dependensinya selesai.
4. Tulis rencana singkat: file yang disentuh, migrasi, route, test.

### 2.2 Saat menulis kode

- Ikuti pola yang sudah ada; jangan memperkenalkan pola baru tanpa alasan.
- Jangan refactor file yang tidak terkait fitur.
- Jangan mengubah format seluruh repo. Prettier/ESLint hanya pada file yang diubah.
- Jangan commit `.env`, kredensial, atau API key.
- Jangan menambah dependency besar tanpa menjelaskan alasannya.
- Jangan menghapus fitur/test yang ada untuk membuat test baru lolos.

### 2.3 Setelah menulis kode

Jalankan berurutan:

```bash
# 1. Rapikan format hanya pada file yang diubah
vendor/bin/pint --dirty
npx prettier --write <file-yang-diubah>

# 2. Quality gate (Pint check, ESLint, seluruh test, build). Diam jika lulus.
bash scripts/check.sh
```

Jangan mencentang item di `FEATURES.md` sebelum `check.sh` menampilkan ✓ untuk
semua langkah. Selama iterasi, cukup jalankan test dan ESLint yang relevan
(lihat bagian *Hemat token*); `check.sh` dijalankan sekali di akhir.

Jika migrasi berubah, verifikasi juga di PostgreSQL (bukan hanya SQLite):

```bash
php artisan migrate --force
php artisan tinker
```

Terakhir: perbarui `FEATURES.md` (centang item + tabel ringkasan progres) dan
timpa `HANDOFF.md`. Hapus data uji yang dibuat di PostgreSQL.

---

## 3. Snapshot status saat ini

| Area | Status |
| --- | --- |
| Login admin | Selesai (database + halaman Keamanan) |
| Shell admin | Selesai |
| Dashboard | Selesai (data nyata + kebiasaan/streak + grafik aktivitas 7/30 hari) |
| Catatan | Selesai (CRUD, detail, Markdown, tautan pekerjaan, arsip/restore, search, tag, pin) |
| Pekerjaan | Selesai (CRUD, filter, status, tenggat, catatan, proyek, subtask, saved views, aksi massal) |
| Markdown preview | Selesai (halaman detail + tab pratinjau editor) |
| Tautan catatan ↔ pekerjaan | Selesai (pivot `note_work_item`, dua arah) |
| Kanban | Selesai (toggle Daftar/Papan, drag & drop, select status) |
| Kebiasaan mencatat | Selesai (streak harian, zona waktu Asia/Jakarta) |
| Proyek / area | Selesai (CRUD, arsip, filter, progress `done/total`) |
| Subtask | Selesai (checklist di form, progress `x/y` di kartu) |
| Kalender | Selesai (tampilan bulan, navigasi, klik untuk edit) |
| Berita AI | Belum |
| Multi-agent | Belum |

Angka test terakhir: **127 passed, 995 assertions**.

---

## 4. Stack & environment

| Lapisan | Teknologi |
| --- | --- |
| Backend | PHP 8.2+, Laravel 12 |
| Frontend | React 19, Inertia v2 (`@inertiajs/react` 2.3) |
| Build | Vite 7 |
| CSS | Tailwind CSS v4 |
| Komponen | shadcn/ui (Radix + CVA) |
| Ikon | `lucide-react` |
| Drag & drop | `@dnd-kit/core` (Kanban) |
| Database runtime | PostgreSQL, database `my_workspace` |
| Database test | SQLite `:memory:` |
| Test | Pest 3 + `RefreshDatabase` |
| Format | Pint (PHP), Prettier (JS), ESLint |

### Environment runtime

`.env` (gitignored) menggunakan:

```dotenv
DB_CONNECTION=pgsql
DB_DATABASE=my_workspace
DB_USERNAME=my_workspace
DB_PASSWORD=workspace_dev
```

### Environment test

`phpunit.xml` memaksa:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
<env name="SESSION_DRIVER" value="array"/>
<env name="CACHE_STORE" value="array"/>
<env name="QUEUE_CONNECTION" value="sync"/>
```

**Implikasi:** semua query harus kompatibel dengan **PostgreSQL dan SQLite**.
Hindari fungsi SQL khusus PostgreSQL di jalur yang dites, atau sediakan fallback.
`jsonb` di SQLite otomatis menjadi teks; cast Eloquent tetap bekerja.

### Perintah penting

| Perintah | Fungsi |
| --- | --- |
| `composer dev` | serve + queue + pail + vite sekaligus |
| `npm run dev` | Vite dev server |
| `npm run build` | production build |
| `php artisan test` | seluruh test |
| `php artisan test --filter=WorkItemTest` | test tertentu |
| `vendor/bin/pint` | format PHP |
| `npm run format` | format seluruh `resources/` |
| `npm run lint` | ESLint fix |
| `php artisan migrate` | migrasi PostgreSQL |

---

## 5. Peta repository

```
app/
  Http/
    Controllers/
      AdminAuthController.php      # login/logout admin
      AdminController.php          # dashboard
      AdminPasswordController.php  # ubah password admin
      NoteController.php           # CRUD catatan + pin
      SavedViewController.php      # simpan/hapus tampilan filter pekerjaan
      WorkItemController.php       # CRUD pekerjaan + status + filter
      Settings/                    # sisa starter kit (belum dipakai admin)
    Middleware/
      EnsureAdminAuthenticated.php # alias admin.auth
      HandleInertiaRequests.php    # share admin, flash, auth, sidebar
  Models/
    Note.php
    SavedView.php                  # preset filter pekerjaan
    WorkItem.php
    User.php                       # auth admin (username, is_admin)
config/
  admin.php                        # env akun admin awal
database/
  factories/UserFactory.php        # state admin()
  migrations/
    2026_11_21_120000_create_notes_table.php
    2026_11_21_130000_create_work_items_table.php
    2026_11_22_000000_add_username_and_is_admin_to_users_table.php
    2026_11_23_160000_create_note_work_item_table.php
    2026_11_23_170000_create_projects_table.php
    2026_11_23_180000_create_work_item_subtasks_table.php
    2026_11_23_190000_create_saved_views_table.php
    2026_11_24_000000_add_deleted_at_to_notes_table.php
  seeders/AdminUserSeeder.php      # akun admin dari config
resources/
  css/app.css                      # token tema + font
  js/
    app.jsx                        # entry Inertia
    layouts/admin-layout.jsx       # shell admin
    lib/
      date.js                      # format tanggal, overdue
      work-item-meta.js            # label/badge status & prioritas
      utils.js                     # cn()
    pages/
      admin/index.jsx              # dashboard
      admin/password.jsx           # keamanan / ubah password
      admin/notes/index.jsx        # daftar catatan
      admin/notes/show.jsx         # detail catatan + Markdown
      admin/work-items/index.jsx   # pekerjaan + filter + saved views
      admin/projects/index.jsx     # proyek + progress
      auth/admin-login.jsx         # login
    components/
      markdown-content.jsx         # render Markdown aman (GFM + sanitize)
      notes/note-editor-dialog.jsx # dialog tambah/edit + pratinjau
      work-items/kanban-board.jsx  # papan Kanban + drag & drop
      work-items/work-calendar.jsx # kalender tenggat bulanan
      ui/                          # shadcn
routes/web.php                     # semua route admin
tests/Feature/                     # test Pest
tests/Pest.php                     # helper adminUser()
FEATURES.md                        # checklist fitur
AGENT_CONTEXT.md                   # dokumen ini
```

---

## 6. Arsitektur & alur request

Alur standar (Inertia, tanpa API terpisah):

```
Browser
  → Laravel route (routes/web.php)
  → middleware web + admin.auth
  → Controller
  → Eloquent / validasi
  → Inertia::render('admin/<page>', props)
  → React page (resources/js/pages/...)
  → AdminLayout
```

- **Tidak ada REST API publik** untuk fitur admin saat ini.
- Aksi tulis memakai redirect + flash `success`, bukan JSON.
- Halaman memakai URL string literal (`/admin/work-items`), bukan Wayfinder.
  Plugin Wayfinder terpasang tetapi belum dipakai untuk fitur admin.
- Shared props dari `HandleInertiaRequests`:
  - `admin` → `{ username }` atau `null`
  - `auth.user` → user Fortify (tidak dipakai admin)
  - `flash.success`
  - `sidebarOpen`, `name`

---

## 7. Auth & keamanan

### Yang berjalan sekarang

- `GET /` → halaman login (`auth/admin-login`).
- `POST /masuk` → `Auth::attempt` dengan:
  - `username`
  - `password`
  - `is_admin => true`
- Hanya user dengan `is_admin = true` yang bisa masuk ke `/admin`.
- Session memakai guard Laravel standar (`web`).
- `POST /keluar` → `Auth::logout()`, invalidate session, regenerate token.
- Middleware `admin.auth` (`EnsureAdminAuthenticated`) mengecek
  `Auth::check()` **dan** `user->is_admin`; tamu diarahkan ke `route('home')`.
- Login memakai throttle `10,1`.
- Halaman **Keamanan** di `/admin/password` untuk mengganti password
  (validasi `current_password`, konfirmasi, minimal 8 karakter).
- Akun admin dibuat oleh `AdminUserSeeder`:

```bash
php artisan db:seed --class=AdminUserSeeder
```

- Konfigurasi akun awal ada di `config/admin.php` dan `.env`:
  `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- Login page **tidak lagi menampilkan kredensial**.
- `users` memiliki kolom `username` (unik) dan `is_admin` (boolean).

### Sudah selesai

- `AUTH-07` — kredensial hardcoded diganti tabel `users` + hash.
- `AUTH-08` — halaman ubah password.

### Berikutnya

- `AUTH-09` — remember me + masa berlaku session.
- `AUTH-10` — audit log login.
- `AUTH-11` — hapus/integrasikan route Fortify dan settings yang tidak dipakai.
- `AUTH-12` — 2FA untuk admin.

### Aturan

- Jangan memakai session key lama `admin_authenticated` / `admin_username`;
  keduanya sudah dihapus dari alur.
- Gunakan `Auth::user()` dan pastikan `is_admin` untuk akses admin.
- Jangan menampilkan kredensial di UI atau log.
- Jika menambah user selain admin, tetap batasi akses `/admin` lewat `is_admin`.
- Route Fortify (`/login`, `/register`, settings) masih ada tetapi tidak
  terhubung ke UI admin. Registrasi Fortify tidak memberi akses `/admin`
  karena middleware mengecek `is_admin`.

---

## 8. Data model

### 8.1 `notes`

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | bigint PK | |
| `title` | varchar(150) | wajib |
| `content` | text | wajib, Markdown |
| `tags` | jsonb | default `[]`, maks 10, tiap tag maks 30 |
| `is_pinned` | boolean | default false |
| `deleted_at` | timestamp nullable | soft delete (arsip) |
| `created_at`, `updated_at` | timestamp | |

Index: `(is_pinned, updated_at)`.

**Invarian:** tag di-trim, dibuang yang kosong, di-`unique`, di-`values`.
Urutan tag dipertahankan.

**Arsip:** `Note` memakai `SoftDeletes`. Query default (daftar, dashboard,
picker pekerjaan, relasi `workItems`) otomatis mengecualikan catatan terarsip.
Baris pivot `note_work_item` **tetap disimpan** saat arsip, sehingga tautan
kembali saat catatan dipulihkan; `forceDelete()` tetap cascade ke pivot.

### 8.2 `work_items`

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | bigint PK | |
| `project_id` | FK `projects` nullable | `nullOnDelete`, index |
| `title` | varchar(150) | wajib |
| `description` | text nullable | |
| `status` | varchar(20) | default `backlog`, index |
| `priority` | varchar(20) | default `medium`, index |
| `due_date` | date nullable | index |
| `tags` | jsonb | default `[]`, maks 10 |
| `completed_at` | timestamp nullable | |
| `created_at`, `updated_at` | timestamp | |

Status valid: `backlog`, `todo`, `in_progress`, `done` (`WorkItem::STATUSES`).
Prioritas valid: `low`, `medium`, `high`, `urgent` (`WorkItem::PRIORITIES`).

**Invarian:** `completed_at` diisi saat status menjadi `done` dan dikosongkan
saat keluar dari `done`. Ini dijaga controller, **bukan** constraint database.

### 8.3 `projects`

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | bigint PK | |
| `name` | varchar(100) | wajib |
| `description` | text nullable | |
| `color` | varchar(20) nullable | salah satu `ProjectController::COLORS` |
| `archived_at` | timestamp nullable | arsip = tidak null |
| `created_at`, `updated_at` | timestamp | |

Relasi: `Project::workItems()` (hasMany). Progress dihitung lewat
`withCount` (`work_items_count`, `done_work_items_count`). Hapus proyek
me-null-kan `work_items.project_id`, pekerjaan tetap ada.

### 8.4 `work_item_subtasks`

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | bigint PK | |
| `work_item_id` | FK `work_items` | cascade delete, index `(work_item_id, position)` |
| `title` | varchar(150) | wajib |
| `is_done` | boolean | default false |
| `position` | unsigned int | default 0, urutan tampil |
| `created_at`, `updated_at` | timestamp | |

Relasi: `WorkItem::subtasks()` (hasMany, urut `position` lalu `id`).
Subtask dikirim bersarang di payload pekerjaan (`subtasks[]`), bukan endpoint
terpisah. `WorkItemController::syncSubtasks()` memperbarui baris ber-ID,
membuat baris baru, menghapus yang tidak dikirim, dan menetapkan `position`
sesuai urutan array. Jika `subtasks` tidak ada di payload update, subtask lama
tidak diubah.

### 8.5 `note_work_item` (pivot)

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | bigint PK | |
| `note_id` | FK `notes` | cascade delete |
| `work_item_id` | FK `work_items` | cascade delete |
| `created_at`, `updated_at` | timestamp | |

Unique: `(note_id, work_item_id)`. Relasi: `Note::workItems()` dan
`WorkItem::notes()` (belongsToMany, `withTimestamps`). Sinkronisasi lewat
`sync()` di controller; jangan menulis pivot langsung.

### 8.6 `users` (auth admin)

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | bigint PK | |
| `name` | varchar | |
| `username` | varchar, unik, nullable | dipakai login |
| `email` | varchar, unik | |
| `email_verified_at` | timestamp nullable | |
| `password` | varchar | hash, cast `hashed` |
| `is_admin` | boolean | default false |
| `remember_token` | varchar nullable | |
| `two_factor_*` | nullable | Fortify |
| `created_at`, `updated_at` | timestamp | |

Akun admin dibuat oleh `AdminUserSeeder`; password di-hash oleh cast `hashed`.
Middleware admin mensyaratkan `is_admin = true`.

Tabel bawaan lain: `password_reset_tokens`, `sessions`, `cache`, `jobs`,
`failed_jobs`, `two_factor_*` (Fortify). Sebagian tidak dipakai alur admin saat ini.

### 8.7 Aturan migrasi

- Nama file: `YYYY_MM_DD_HHMMSS_description.php`, timestamp setelah migrasi terakhir.
- Selalu tulis `down()`.
- Gunakan `jsonb` untuk data fleksibel; cast `array` di model.
- Untuk relasi baru, gunakan foreign key + `cascadeOnDelete` atau `nullOnDelete`
  secara sadar.
- Jangan mengedit migrasi yang sudah dijalankan di PostgreSQL; buat migrasi baru.

---

## 9. Routes

Prefix `/admin`, name prefix `admin.`, middleware `admin.auth`.

| Method | URI | Name | Aksi |
| --- | --- | --- | --- |
| GET | `/` | `home` | halaman login |
| POST | `/masuk` | `admin.login` | login (throttle 10,1) |
| POST | `/keluar` | `admin.logout` | logout |
| GET | `/admin` | `admin.index` | dashboard |
| GET | `/admin/password` | `admin.password.edit` | halaman keamanan |
| PUT | `/admin/password` | `admin.password.update` | ubah password |
| GET | `/admin/notes` | `admin.notes.index` | daftar catatan |
| GET | `/admin/notes/{note}` | `admin.notes.show` | detail catatan |
| POST | `/admin/notes` | `admin.notes.store` | simpan catatan |
| PUT | `/admin/notes/{note}` | `admin.notes.update` | ubah catatan |
| PATCH | `/admin/notes/{note}/pin` | `admin.notes.pin` | toggle pin |
| PATCH | `/admin/notes/{note}/restore` | `admin.notes.restore` | pulihkan dari arsip (`withTrashed`) |
| DELETE | `/admin/notes/{note}/work-items/{workItem}` | `admin.notes.work-items.detach` | lepas tautan pekerjaan |
| DELETE | `/admin/notes/{note}` | `admin.notes.destroy` | hapus catatan |
| GET | `/admin/work-items` | `admin.work-items.index` | daftar pekerjaan |
| POST | `/admin/work-items/views` | `admin.work-items.views.store` | simpan tampilan filter |
| DELETE | `/admin/work-items/views/{view}` | `admin.work-items.views.destroy` | hapus tampilan filter |
| GET | `/admin/projects` | `admin.projects.index` | daftar proyek + progress |
| POST | `/admin/projects` | `admin.projects.store` | simpan proyek |
| PUT | `/admin/projects/{project}` | `admin.projects.update` | ubah proyek |
| PATCH | `/admin/projects/{project}/archive` | `admin.projects.archive` | arsip / kembalikan |
| DELETE | `/admin/projects/{project}` | `admin.projects.destroy` | hapus proyek (pekerjaan tetap) |
| POST | `/admin/work-items` | `admin.work-items.store` | simpan pekerjaan |
| PATCH | `/admin/work-items/bulk-status` | `admin.work-items.bulk-status` | ubah status banyak item (maks 100) |
| DELETE | `/admin/work-items/bulk` | `admin.work-items.bulk-destroy` | hapus banyak item (maks 100) |
| PUT | `/admin/work-items/{workItem}` | `admin.work-items.update` | ubah pekerjaan |
| PATCH | `/admin/work-items/{workItem}/status` | `admin.work-items.status` | ubah status |
| DELETE | `/admin/work-items/{workItem}` | `admin.work-items.destroy` | hapus pekerjaan |

Route tampilan tersimpan menerima `name` (unik, maks 50) dan `filters`
opsional (`q`, `status`, `priority`, `project`, `view`). Filter kosong dibuang,
`view=list` tidak disimpan, dan `destroy` memakai route model binding `{view}`.

Route lain yang ada tetapi **tidak dipakai**: `GET /dashboard` (Fortify auth),
`/settings/*`, `/login`, `/register`.

Saat menambah route baru: ikuti pola di atas, tambahkan test tamu → redirect.

---

## 10. Konvensi backend

### Controller

- Satu controller per resource.
- `index` mengembalikan `Inertia::render`.
- Aksi tulis mengembalikan `RedirectResponse` ke route index dengan
  `->with('success', '<pesan bahasa Indonesia>')`.
- Validasi di method privat `validatedData(Request $request): array`.
- Gunakan `Rule::in(...)` untuk enum.
- Normalisasi array (tag) sebelum simpan.
- Gunakan route model binding (`{note}`, `{workItem}`).
- Eager-load relasi jika dipakai di halaman untuk menghindari N+1.
- Pagination memakai `->withQueryString()`.

### Query

- Pencarian: `whereLike(..., caseSensitive: false)` agar kompatibel
  PostgreSQL dan SQLite.
- Filter: `when(...)`.
- Hitungan status: `selectRaw('status, count(*) as total')->groupBy('status')`.
- Urutan pekerjaan: belum selesai dulu, lalu `due_date` (null terakhir), lalu
  `created_at` terbaru.
- Dashboard: agregasi langsung, batasi daftar (5 pekerjaan aktif, 4 catatan).

### Model

- Konstanta untuk enum (`STATUSES`, `PRIORITIES`).
- `$fillable` eksplisit.
- Cast di method `casts()`: `tags => array`, `due_date => date`,
  `completed_at => datetime`, `is_pinned => boolean`.

### Pesan & bahasa

- Semua teks UI dan flash dalam **bahasa Indonesia**.
- Nama variabel/kode dalam bahasa Inggris.
- Contoh flash: `Catatan berhasil disimpan.`,
  `Pekerjaan berhasil diperbarui.`, `Status pekerjaan diperbarui.`

---

## 11. Konvensi frontend & desain

### Struktur halaman

- Halaman admin berada di `resources/js/pages/admin/...`.
- Selalu bungkus dengan `AdminLayout` dan beri `title`.
- Gunakan komponen `@/components/ui/*` (button, dialog, input, label, spinner).
- Gunakan `InputError` untuk error validasi.
- Gunakan `useForm` Inertia untuk form; `router.patch/delete/get` untuk aksi lain.
- `preserveScroll: true` untuk aksi yang tidak mengganti halaman.
- Loading state memakai `processing` + `Spinner`.

### Desain

- Font: **Plus Jakarta Sans** (di `resources/css/app.css` dan root view).
- Aksen: indigo, fuchsia, sky. Status memakai warna semantik:
  backlog slate, todo sky, in_progress indigo, done emerald.
- Prioritas: low slate, medium blue, high amber, urgent red.
- **Tombol solid, tanpa gradient.** CTA utama saat ini memakai
  `bg-neutral-900` / dark `bg-white`; aksen indigo untuk link dan state aktif.
  Jangan menambahkan `bg-gradient-*` pada tombol.
- Radius: kartu `rounded-xl`, panel `rounded-2xl`.
- Dark mode wajib berfungsi (lihat `ThemeToggle`).
- Layout harus responsif (mobile → desktop), sidebar menjadi drawer di mobile.
- Gunakan `cn()` dari `@/lib/utils` untuk conditional class.

### Helper bersama

- `@/lib/date`: `formatDate`, `formatLongDate`, `toDateInput`, `todayIso`,
  `isOverdue`.
- `@/lib/work-item-meta`: `statusMeta` (`label`, `badge`, `bar`),
  `priorityMeta` (`label`, `badge`).
- Jangan menduplikasi label/warna status di halaman baru; impor helper.
- Markdown dirender lewat `@/components/markdown-content` (react-markdown +
  remark-gfm + rehype-sanitize). Styling elemen Markdown ada di kelas
  `.markdown-body` pada `resources/css/app.css`.
- Editor catatan memakai `@/components/notes/note-editor-dialog` dengan tab
  **Tulis / Pratinjau**. Jangan menulis ulang dialog editor di halaman lain.
- Kanban memakai `@/components/work-items/kanban-board` (`@dnd-kit/core`).
  Kolom adalah droppable (`status`), kartu draggable. Perubahan status
  di-optimistic-update di state lokal lalu `PATCH`; rollback lewat `onError`.
  Urutan manual belum didukung (belum ada `position`/endpoint reorder).

### Pola UI yang sudah ada

- Header halaman: judul + deskripsi + tombol aksi.
- Bar filter: pencarian (debounce 300ms), select filter, tombol reset.
  Sinkronisasi nilai pencarian dengan query param dilakukan saat render
  (pola adjust-state-on-prop-change), bukan di `useEffect`, agar tidak kena
  aturan `react-hooks/set-state-in-effect`.
- Tab status dengan jumlah.
- Kartu list dengan badge, tenggat, tag, aksi edit/hapus.
- Dialog tambah/edit dan dialog konfirmasi hapus.
- Empty state dengan ikon, judul, deskripsi, dan CTA.
- Flash sukses ditampilkan layout di atas konten.

---

## 12. Testing & quality gates

### Struktur

- Semua test fitur di `tests/Feature`.
- `tests/Pest.php` mengaktifkan `RefreshDatabase` untuk folder `Feature`
  dan menyediakan helper `adminUser()`.
- Test admin memakai helper tersebut:

```php
$this->actingAs(adminUser())->get('/admin/work-items');
```

`adminUser()` membuat user dengan `is_admin = true`. Untuk atribut khusus:

```php
$admin = adminUser([
    'username' => 'my-workspace',
    'password' => 'admin123',
]);
```

> **Pitfall:** jangan menambah helper global baru dengan nama generik.
> Gunakan `adminUser()` dari `tests/Pest.php`; jika butuh helper khusus,
> beri nama unik agar tidak bentrok antar file.

### Cakupan minimal per fitur

1. Tamu dialihkan ke login.
2. Admin bisa membuka halaman dan props benar (`assertInertia`).
3. Aksi sukses mengubah database.
4. Validasi menolak input salah.
5. Edge case fitur (mis. overdue, completed_at, filter).
6. Hapus / aksi destruktif.

### Gaya assertion

```php
->assertInertia(fn (Assert $page) => $page
    ->component('admin/work-items/index')
    ->has('workItems.data', 1)
    ->where('workItems.data.0.title', 'Rancang skema agent')
    ->where('counts.todo', 1)
);
```

### Quality gate

Jalankan `bash scripts/check.sh` (Pint check, ESLint, seluruh test, build).
Format dulu dengan `vendor/bin/pint --dirty` dan `npx prettier --write <file>`.

Jangan mencentang item di `FEATURES.md` sebelum semua langkah menampilkan ✓.


---

## 13. Workflow pengembangan per fitur

Gunakan urutan ini agar hasilnya konsisten:

1. **Pilih item** dari `FEATURES.md`, tandai `[~]`.
2. **Rencana** — tulis file/migrasi/route/test yang akan disentuh.
3. **Backend**
   - migrasi (jika perlu) + model + cast
   - controller + validasi + route
   - test fitur
4. **Frontend**
   - halaman/komponen + props
   - state loading/empty/error
   - responsif + dark mode
5. **Test** — selama iterasi: `php artisan test --compact --filter=...`.
6. **Quality gate** — sekali di akhir: `bash scripts/check.sh` (§2.3).
7. **Verifikasi PostgreSQL** (hanya jika migrasi berubah)
   - `php artisan migrate --force`
   - uji query/CRUD lewat tinker atau aplikasi
   - hapus data uji yang dibuat (kecuali data milik user)
8. **Dokumentasi** — update `FEATURES.md`, timpa `HANDOFF.md`.
9. **Commit** — satu commit per fitur dengan pesan jelas.

---

## 14. Workflow produk yang sudah berjalan

### 14.1 Login

1. Buka `/`.
2. Isi username & password akun admin.
3. `Auth::attempt` memvalidasi username, password, dan `is_admin = true`.
4. Jika valid → session dibuat → redirect `/admin`.
5. Jika salah → error `Username atau password salah.`
6. Jika sudah login sebagai admin dan membuka `/` → redirect `/admin`.

### 14.1a Ubah password

1. Sidebar **Keamanan** → `/admin/password`.
2. Isi password saat ini, password baru, dan konfirmasi.
3. Simpan → password di-hash ulang → flash sukses.
4. Password lama tidak berlaku lagi untuk login berikutnya.

### 14.2 Catatan

1. Sidebar **Catatan** → `/admin/notes`.
2. Klik **Catatan baru** → dialog.
3. Isi judul, konten Markdown, tag (dipisah koma), pin.
4. Simpan → redirect + flash.
5. Cari (debounce) / filter tag / halaman.
6. Pin → catatan naik ke atas.
7. Klik judul → halaman detail `/admin/notes/{note}`; konten dirender sebagai
   Markdown (GFM, aman dari HTML mentah).
8. Di halaman detail: **Edit** (dialog dengan tab Tulis/Pratinjau) dan
   **Hapus** (memindahkan ke arsip). Setelah edit, kembali ke detail; setelah
   arsip, kembali ke daftar.
9. Edit / hapus juga bisa langsung dari kartu di daftar.
10. Toggle **Aktif / Arsip** di header. Tab Arsip menampilkan catatan
    terarsip + jumlahnya, mendukung pencarian/filter tag, dan tombol
    **Pulihkan** per kartu. Catatan terarsip tidak muncul di daftar aktif,
    dashboard, maupun picker pekerjaan sampai dipulihkan.
11. Bagian **Pekerjaan terkait** menampilkan pekerjaan yang tertaut beserta
    status dan tenggat; tombol **Lepas** menghapus tautan tanpa menghapus data.
    Tautan dibuat dari form pekerjaan dan tetap tersimpan saat catatan
    diarsipkan.

### 14.3 Pekerjaan

1. Sidebar **Pekerjaan** → `/admin/work-items`.
2. Klik **Pekerjaan baru** → dialog.
3. Isi judul, deskripsi, proyek (opsional), status, prioritas, tenggat, tag,
   dan subtask (checklist).
4. Simpan → redirect + flash.
5. Filter status (tab + jumlah), prioritas, proyek (termasuk **Tanpa proyek**),
   cari.
6. Ubah status langsung dari select di kartu.
7. Jika status `done` → `completed_at` diisi; jika dikembalikan → dikosongkan.
8. Tenggat lewat + belum selesai → indikator merah "terlambat".
9. Di form, pilih **Catatan terkait** lewat daftar centang dengan pencarian;
   tautan disimpan dua arah dan bisa dilepas dari detail catatan.
10. Toggle **Daftar / Papan** di header. Papan menampilkan 4 kolom status
    (Backlog, To do, Dikerjakan, Selesai) dan mengabaikan filter status.
11. Tarik kartu ke kolom lain (atau ubah select status di kartu) → status dan
    `completed_at` diperbarui; jumlah kolom ikut berubah.
12. Kartu menampilkan badge proyek (titik warna + nama) jika ada.
13. Tambah subtask lewat input + **Tambah** (atau Enter). Centang untuk selesai,
    ubah judul langsung di baris, hapus lewat ikon tempat sampah. Semua
    perubahan tersimpan saat pekerjaan disimpan.
14. Kartu menampilkan progress subtask `x/y` + bar (hijau saat 100%); kartu
    Kanban menampilkan `x/y` ringkas.
15. Toggle **Kalender** menampilkan bulan berjalan (mulai Senin). Navigasi
    bulan lewat panah / **Hari ini**; item bertenggat muncul di tanggalnya
    (maks 3 + "+N lagi"). Klik item membuka dialog edit. Item tanpa tenggat
    tidak tampil, dan filter status diabaikan seperti papan.
16. Di tampilan **Daftar**, centang pekerjaan (atau **Pilih semua di halaman
    ini**) untuk memunculkan bilah aksi massal. Pilih status lalu **Terapkan**
    untuk mengubah banyak item sekaligus (`completed_at` mengikuti aturan yang
    sama), atau **Hapus** untuk menghapus massal setelah konfirmasi. Pilihan
    otomatis dibersihkan saat filter, tampilan, atau halaman berubah, dan
    dibatasi maksimal 100 item per aksi. Aksi massal tidak tersedia di Papan
    dan Kalender.

### 14.4 Dashboard

1. Buka `/admin`.
2. Melihat sapaan + tanggal.
3. Statistik: catatan, pekerjaan, dikerjakan, terlambat.
4. Pekerjaan aktif (todo + in_progress, maks 5, urut tenggat).
5. Distribusi status dengan progress bar.
6. Catatan terbaru (maks 4).
7. Widget **1 Hari 1 Pengetahuan**: status hari ini, jumlah catatan hari ini,
   streak beruntun, dan CTA ke halaman catatan.
8. Klik **Lihat semua** → halaman terkait.
9. Kartu **Grafik aktivitas** menampilkan 7 atau 30 hari terakhir (toggle).
   Dua batang per hari: catatan dibuat dan pekerjaan selesai. Data dikirim
   server untuk 30 hari (hari kosong diisi nol) dan dihitung per tanggal zona
   waktu Asia/Jakarta: catatan dari `created_at` (tanpa yang terarsip),
   pekerjaan dari `completed_at`. Ringkasan jumlah catatan/selesai pada rentang
   tampil di header kartu.

### 14.5 Proyek

1. Sidebar **Proyek** → `/admin/projects`.
2. Klik **Proyek baru** → dialog: nama, deskripsi, warna (8 swatch).
3. Kartu proyek menampilkan deskripsi, progress `done/total` + bar, dan
   tombol **Lihat pekerjaan** (membuka `/admin/work-items?project={id}`).
4. **Arsipkan** menyembunyikan proyek dari daftar aktif (tetap muncul di
   bagian **Diarsipkan** dan di picker dengan label `(arsip)`); **Kembalikan**
   membatalkan arsip.
5. **Hapus** meminta konfirmasi; pekerjaan di dalamnya tidak dihapus, hanya
   kehilangan label proyek.

---

## 15. Rancangan fitur berikutnya (spesifikasi)

> Detail checklist dan ID ada di `FEATURES.md`. Bagian ini menjelaskan
> **bagaimana** membangunnya.

> Spesifikasi fitur selesai (NOTE-08..11, WORK-11..15) ada di `docs/specs-done.md`.

### 15.6 KNOW-01/02 — Kebiasaan & statistik (KNOW-01 selesai)

**Kebiasaan "1 Hari 1 Pengetahuan":** selesai (KNOW-01).

- Streak dihitung dari tanggal `notes.created_at` (zona waktu `Asia/Jakarta`).
- Satu hari dihitung sekali walau ada banyak catatan.
- Streak berakhir hari ini atau kemarin (grace 1 hari).
- Widget dashboard: "Hari ini sudah mencatat?" + streak + CTA.
- Implementasi awal tanpa tabel baru; jika butuh backfill/riwayat, tambah
  `daily_knowledge_logs (date unique, note_count, created_at)`.
- Logika ada di `AdminController::knowledgeHabit()`; prop `knowledge` berisi
  `has_note_today`, `notes_today`, `streak`, `timezone`.

**Statistik:**

- Catatan per minggu (7/30 hari).
- Tag teratas.
- Pekerjaan selesai per minggu.
- Grafik sederhana (bar) tanpa library berat; CSS/SVG cukup.

**Acceptance:** test dengan `Carbon::setTestNow` untuk streak lintas bulan/tahun;
zona waktu eksplisit; tidak ada data palsu.

### 15.7 NEWS-01…08 — Berita teknologi + AI

**Tujuan:** dashboard menampilkan 3 berita teknologi pilihan, diringkas AI.

**Data:**

```
news_sources
  id, name, url, type ('rss'|'api'), enabled, last_fetched_at, timestamps

news_articles
  id, news_source_id FK, title, url, url_hash unique,
  excerpt nullable, content nullable, published_at nullable,
  summary nullable, summary_generated_at nullable,
  status ('new'|'summarized'|'selected'|'archived'),
  selected_date date nullable, metadata jsonb, timestamps

ai_usages
  id, provider, model, purpose, input_tokens, output_tokens,
  cost_usd numeric, created_at
```

**Backend:**

- `php artisan news:fetch` → queue job per sumber → simpan artikel baru
  (dedupe `url_hash`).
- `php artisan news:summarize` → pilih kandidat, ringkas via provider AI.
- Scheduler di `routes/console.php` (harian).
- `App\Services\Ai\AiProvider` interface:
  `summarize(string $text): string`, `chat(array $messages): string`.
  Implementasi OpenAI/Anthropic/Null; pilih lewat `config/ai.php`.
- Gagal AI → artikel tetap ada, `summary` null, dashboard pakai excerpt.
- Pilih 3 berita: skor recency + relevansi topik (AI, software, security),
  simpan `selected_date = today`.
- Batas biaya & timeout; catat `ai_usages`.

**Frontend:**

- Widget dashboard "Berita teknologi" (3 kartu) + halaman arsip.
- Tombol refresh manual (rate-limited).
- Tampilkan sumber dan waktu terbit.

**Acceptance:** dedupe benar, `Http::fake` di test, dashboard tetap tampil saat
AI gagal, tidak ada panggilan AI di test tanpa fake, biaya tercatat.

**Out of scope:** personalisasi pembaca, newsletter, komentar.

### 15.8 AI-01…05 — Asisten & pencarian semantik

**Tujuan:** bertanya ke catatan sendiri dan menemukan catatan secara semantik.

**Data (PostgreSQL):**

```sql
CREATE EXTENSION IF NOT EXISTS vector;

note_embeddings
  id, note_id FK cascade, model, embedding vector(1536), timestamps
```

**Backend:**

- Job `EmbedNote` dipicu saat note dibuat/diubah; command backfill.
- `POST /admin/assistant` → embed pertanyaan → ambil top-k catatan
  (`embedding <=> query`) → prompt dengan kutipan → jawaban + `note_ids`.
- Fallback SQLite/test: lewati embedding, gunakan `whereLike`.
- Batas token, timeout, dan rate limit.

**Frontend:** halaman `/admin/assistant` atau panel; tampilkan jawaban + kartu
sumber yang bisa diklik.

**Acceptance:** jawaban menyebut sumber, tidak ada catatan yang bocor ke provider
tanpa konfigurasi, test memakai fake provider, fitur tidak mematahkan suite SQLite.

**Out of scope:** agent yang menulis ke database, tool calling.

### 15.9 AGT-01…10 — Multi-agent (control plane)

**Arsitektur:**

```
Laravel (control plane)                  Service eksternal (worker)
  - CRUD agent                             - menerima run
  - buat agent_run                         - menjalankan model/tools
  - dispatch job (HTTP)        ────────▶   - mengirim callback
  - terima callback bertanda tangan ◀────  - tidak punya akses DB langsung
  - review & approval
```

**Data:**

```
agents
  id, name, role, system_prompt, model, tools jsonb,
  enabled, timestamps

agent_runs
  id, work_item_id FK nullable, agent_id FK,
  status ('queued'|'running'|'waiting_approval'|'succeeded'|'failed'|'cancelled'),
  input text, output text nullable, error text nullable,
  prompt_tokens, completion_tokens, cost_usd,
  started_at, finished_at, timestamps

agent_approvals
  id, agent_run_id FK, status ('pending'|'approved'|'rejected'),
  note nullable, decided_at, timestamps

agent_artifacts
  id, agent_run_id FK, type ('diff'|'file'|'link'|'text'),
  name, content/path/url, metadata jsonb, timestamps
```

**Alur run:**

1. Dari pekerjaan, pilih agent → **Jalankan**.
2. Laravel membuat `agent_run` status `queued`.
3. Job `DispatchAgentRun` mengirim payload bertanda tangan ke service.
4. Service update `running`, lalu callback:
   `POST /api/agent-runs/{run}/callback` dengan HMAC.
5. Jika butuh persetujuan → `waiting_approval`; user approve/reject.
6. Selesai → `succeeded`/`failed`; output + artifact disimpan.
7. UI menampilkan timeline run dan hasil.

**Keamanan:** token per run, HMAC callback, allowlist, timeout, batas biaya,
tidak ada kredensial DB ke service, audit log.

**Acceptance:** run lifecycle teruji dengan fake HTTP, callback tidak sah ditolak,
pembatalan bekerja, biaya tercatat, UI tidak nge-block.

### 15.10 PROD-01/04 — Quick capture & pencarian global

**Quick capture:** `Ctrl/Cmd + K` membuka dialog; pilih catatan cepat /
pekerjaan cepat / navigasi. Simpan lewat endpoint yang sudah ada.

**Pencarian global:** `GET /admin/search?q=` mengembalikan
`{ notes: [...], workItems: [...] }`; awalnya `whereLike`, nanti PostgreSQL FTS.
Tampilkan hasil terkelompok + shortcut buka.

**Acceptance:** debounce, keyboard navigation, hasil kosong yang jelas, test
search lintas model.

---

## 16. Workflow AI & berita (ringkas)

```
Scheduler harian
  → news:fetch
  → job per sumber (RSS/API)
  → dedupe url_hash
  → simpan news_articles (status new)
  → news:summarize
  → AI provider (timeout + retry terbatas)
  → summary + ai_usages
  → pilih 3 artikel (selected_date = today)
  → dashboard query selected hari ini
  → jika kosong/gagal: tampilkan artikel terbaru / sembunyikan widget
```

Aturan:

- Jangan memanggil API eksternal di test tanpa `Http::fake`.
- Jangan menampilkan berita dummy.
- Widget tidak boleh membuat halaman gagal jika layanan AI down.
- Simpan biaya dan jumlah token.

---

## 17. Workflow multi-agent (produk)

```
User → Work Item → Pilih Agent → Run
  → Laravel simpan agent_run (queued)
  → DispatchAgentRun job (HTTP bertanda tangan)
  → Worker menjalankan agent
  → Callback status/output
  → waiting_approval (jika perlu)
  → User review → approve/reject
  → Artifact & output tersimpan
```

Aturan:

- Laravel = control plane; worker = eksekusi.
- Worker **tidak** mengakses database Laravel secara langsung.
- Semua callback diverifikasi HMAC.
- Setiap run punya batas waktu, biaya, dan bisa dibatalkan.
- Human-in-the-loop wajib untuk aksi yang mengubah file/data.

---

## 18. Kolaborasi antar coding agent

Karena proyek bisa dikerjakan beberapa agent, ikuti aturan ini.

### 18.1 Klaim pekerjaan
- Satu item `FEATURES.md` = satu agent pada satu waktu (sistem shift).
- Tandai `[~]` di `FEATURES.md` saat mulai; serah-terima lewat `HANDOFF.md`.
- Jangan mengerjakan item yang dependensinya belum selesai.

### 18.2 Commit
- Semua commit langsung ke `main`.
- Format: `feat(notes): add markdown detail page`; pekerjaan belum selesai:
  `wip(<ID>): ...`.
- Jenis: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `wip`.
- Satu commit per fitur selesai; jangan campur refactor besar.

### 18.3 File panas (rawan konflik)

Koordinasikan sebelum mengubah:

- `routes/web.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `resources/js/layouts/admin-layout.jsx`
- `app/Http/Controllers/AdminController.php`
- `resources/js/lib/date.js`, `resources/js/lib/work-item-meta.js`
- `tests/Pest.php`
- `FEATURES.md`, `AGENT_CONTEXT.md`

Aturan:

- Tambahkan route di blok yang sesuai; jangan reorder tanpa alasan.
- Jangan mengubah shared props tanpa mengecek semua halaman.
- Jangan mengganti helper bersama; tambah fungsi baru.
- Untuk helper test, gunakan nama unik atau pindahkan ke `tests/Pest.php`.

### 18.4 Migrasi

- Jangan pernah mengedit migrasi yang sudah jalan.
- Gunakan timestamp sekarang + 1 detik dari migrasi terakhir.
- Sertakan `down()`.
- Uji di SQLite (test) **dan** PostgreSQL (`migrate`).

### 18.5 Definition of Done

Sebuah item boleh dicentang jika:

- [ ] Fungsional sesuai acceptance criteria.
- [ ] UI bahasa Indonesia, responsif, dark mode.
- [ ] Validasi server + pesan error di UI.
- [ ] Middleware/auth benar.
- [ ] Test fitur (happy path, validasi, tamu, edge case).
- [ ] `vendor/bin/pint` lolos.
- [ ] `npx prettier --check` / `eslint` lolos untuk file terkait.
- [ ] `php artisan test` seluruh suite lolos.
- [ ] `npm run build` lolos.
- [ ] Migrasi diverifikasi di PostgreSQL.
- [ ] `FEATURES.md` diperbarui.
- [ ] Tidak ada data uji tertinggal (kecuali milik user).
- [ ] Tidak ada secret/API key di repo.

### 18.6 Handoff

Serah-terima memakai `HANDOFF.md` (lihat bagian *Lokasi kerja & shift*), maks ±10
baris, ditimpa setiap akhir shift. Isi: item, status, file utama, belum selesai,
berikutnya, test/build hijau.

### 18.7 Jika menemukan pekerjaan orang lain

- Jangan revert atau format ulang file mereka.
- Jika perlu mengubah baris yang sama, buat perubahan minimal dan jelaskan.
- Jika menemukan bug di luar scope, catat di `FEATURES.md` sebagai item baru;
  jangan perbaiki diam-diam dalam commit fitur lain.

---

## 19. Keputusan & known issues

| Topik | Keputusan | Catatan |
| --- | --- | --- |
| Stack | Laravel + Inertia + React | Tidak rewrite ke Node |
| Auth | Database + `is_admin` | AUTH-07/08 selesai; Fortify belum dibersihkan |
| Dashboard | Data lokal nyata + kebiasaan | Berita AI ditunda |
| Notes | Markdown + detail + preview + tautan pekerjaan | NOTE-08/09/10/11 selesai |
| Work Items | List + Kanban + Kalender | Drag mengubah status |
| Kalender | Bulanan berbasis tenggat | Navigasi di client |
| Projects | CRUD + arsip + progress | Hapus tidak menghapus pekerjaan |
| Subtasks | Nested payload + progress kartu | Tanpa endpoint terpisah |
| Notes | Detail `/admin/notes/{note}` | Update diarahkan ke detail |
| Agent | Service terpisah | Laravel control plane |
| Wayfinder | Tidak dipakai admin | URL string literal |
| Fortify | Terpasang, tidak terhubung | Hapus/integrasikan nanti |
| `/dashboard` | Tidak dipakai | Entry admin adalah `/` |
| Tests | SQLite in-memory | Verifikasi terpisah di PostgreSQL |
| Bahasa | UI Indonesia, kode Inggris | Konsisten |

Known issues:

1. Route Fortify dan settings tidak terhubung ke UI admin; registrasi Fortify
   masih aktif tetapi tidak memberi akses `/admin` karena cek `is_admin`.
2. Helper test global bisa bentrok nama. Gunakan `adminUser()` dari
   `tests/Pest.php`; helper baru harus unik.
3. Tidak ada CI.
4. Belum ada backup otomatis.
5. Belum ada halaman detail pekerjaan; edit lewat dialog.
6. `completed_at` dijaga controller, bukan constraint database.
7. Urutan kartu Kanban mengikuti tenggat, belum bisa diatur manual.
8. Streak dihitung di PHP dari seluruh `notes.created_at`; cukup untuk data
   personal, perlu query agregat jika jumlah catatan sangat besar.
9. Kalender memuat semua item bertenggat tanpa pagination; perlu dibatasi per
   rentang bulan jika jumlah item sudah sangat besar.

---

## 20. Glossary

| Istilah | Arti |
| --- | --- |
| Catatan / Note | Dokumen Markdown dengan tag dan pin |
| Pekerjaan / Work Item | Tugas dengan status, prioritas, tenggat |
| Subtask | Checklist kecil di dalam pekerjaan |
| Backlog | Belum dijadwalkan |
| To do | Siap dikerjakan |
| Dikerjakan / in progress | Sedang berjalan |
| Selesai / done | Selesai, `completed_at` terisi |
| Terlambat / overdue | Tenggat lewat dan belum selesai |
| 1 Hari 1 Pengetahuan | Kebiasaan mencatat minimal satu pengetahuan per hari |
| Control plane | Laravel yang mengatur run agent, bukan mengeksekusi |
| Artifact | Hasil run agent (diff, file, link, teks) |

---

## 21. Cara memulai cepat untuk agent baru

### Awal shift (rutin, repo sudah siap)

```bash
# 1. Cek kondisi repo
git status
git log --oneline -5

# 2. Baca konteks (jangan baca seluruh dokumen)
cat HANDOFF.md
grep -n "\[~\]" FEATURES.md      # item yang sedang dikerjakan
# Lalu baca AGENT_CONTEXT.md bagian atas saja (sampai §0 TL;DR)
# dan bagian FEATURES.md "Antrean berikutnya".

# 3. Pastikan baseline hijau
bash scripts/check.sh

# 4. Lanjutkan item di HANDOFF.md / yang bertanda [~];
#    jika tidak ada, ambil item pertama di "Antrean berikutnya".
```

Jika baseline tidak hijau, **perbaiki dulu** sebelum menambah fitur, dan catat
apa yang diperbaiki di `HANDOFF.md`.

### Setup awal (hanya di mesin baru atau repo baru di-clone)

```bash
composer install
npm install
cp .env.example .env   # jika belum ada
php artisan key:generate
php artisan migrate
```

Jangan jalankan blok setup ini di awal shift biasa; hanya jika dependency
berubah atau environment belum ada.

---

> **My Workspace — a personal digital space that grows with my needs.**

# AGENT_CONTEXT — My Workspace

Dokumen ini adalah **kontrak kerja** untuk siapa pun (manusia atau coding agent)
yang melanjutkan proyek ini. Baca dokumen ini dan `FEATURES.md` sebelum menulis
kode. Jika ada konflik antara dokumen dan kode, **kode yang berjalan adalah
kebenaran**, lalu perbarui dokumen.

> Terakhir diperbarui: 23 November 2026
> Status: fondasi + Dashboard (termasuk kebiasaan mencatat) + Catatan (detail,
> Markdown, tautan pekerjaan) + Pekerjaan (list + Kanban) sudah berjalan.

---

## Lokasi kerja (WAJIB)

- Bekerja langsung di direktori repo ini (root berisi `artisan`, `composer.json`, `.git`).
- Jangan membuat folder baru, salinan, clone, atau worktree di luar repo ini.
- Jika `pwd` bukan root repo, berhenti dan laporkan; jangan membuat proyek baru.
- Isolasi pekerjaan memakai branch (`feat/<id>-<slug>`), bukan folder baru.

## 0. TL;DR

- Produk: **My Workspace**, ruang kerja digital pribadi untuk satu admin.
- Stack: **Laravel 12 + Inertia v2 + React 19 + Tailwind v4 + PostgreSQL**.
- UI: bahasa Indonesia, font **Plus Jakarta Sans**, aksen indigo/fuchsia/sky,
  tombol **solid tanpa gradient**, mendukung dark mode.
- Auth saat ini: database (`users.username`, password hash, flag `is_admin`),
  halaman **Keamanan** untuk ubah password.
- Fitur selesai: login, shell admin, Dashboard (statistik + kebiasaan mencatat),
  Catatan (detail + Markdown + pratinjau + tautan ke pekerjaan), Pekerjaan
  (list + Kanban drag & drop).
- Test: **88 test Pest lolos** (589 assertions), build Vite berhasil.
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

1. Baca `AGENT_CONTEXT.md`, `FEATURES.md`, dan `my-workspace-project-overview.md`
   (jika tersedia).
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

Wajib lolos semua:

```bash
vendor/bin/pint
npx prettier --write <file-yang-diubah>
npx eslint <file-yang-diubah>
php artisan test
npm run build
```

Lalu verifikasi di PostgreSQL (bukan hanya SQLite):

```bash
php artisan migrate --force
php artisan tinker
```

Dan perbarui `FEATURES.md` + tulis handoff.

---

## 3. Snapshot status saat ini

| Area | Status |
| --- | --- |
| Login admin | Selesai (database + halaman Keamanan) |
| Shell admin | Selesai |
| Dashboard | Selesai (data nyata + widget kebiasaan & streak) |
| Catatan | Selesai (CRUD, detail, Markdown, tautan pekerjaan, search, tag, pin) |
| Pekerjaan | Selesai (CRUD, filter, status, tenggat, pilih catatan terkait) |
| Markdown preview | Selesai (halaman detail + tab pratinjau editor) |
| Tautan catatan ↔ pekerjaan | Selesai (pivot `note_work_item`, dua arah) |
| Kanban | Selesai (toggle Daftar/Papan, drag & drop, select status) |
| Kebiasaan mencatat | Selesai (streak harian, zona waktu Asia/Jakarta) |
| Berita AI | Belum |
| Multi-agent | Belum |

Angka test terakhir: **88 passed, 589 assertions**.

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
      WorkItemController.php       # CRUD pekerjaan + status
      Settings/                    # sisa starter kit (belum dipakai admin)
    Middleware/
      EnsureAdminAuthenticated.php # alias admin.auth
      HandleInertiaRequests.php    # share admin, flash, auth, sidebar
  Models/
    Note.php
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
      admin/work-items/index.jsx   # pekerjaan
      auth/admin-login.jsx         # login
    components/
      markdown-content.jsx         # render Markdown aman (GFM + sanitize)
      notes/note-editor-dialog.jsx # dialog tambah/edit + pratinjau
      work-items/kanban-board.jsx  # papan Kanban + drag & drop
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
| `created_at`, `updated_at` | timestamp | |

Index: `(is_pinned, updated_at)`.

**Invarian:** tag di-trim, dibuang yang kosong, di-`unique`, di-`values`.
Urutan tag dipertahankan.

### 8.2 `work_items`

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | bigint PK | |
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

### 8.3 `note_work_item` (pivot)

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | bigint PK | |
| `note_id` | FK `notes` | cascade delete |
| `work_item_id` | FK `work_items` | cascade delete |
| `created_at`, `updated_at` | timestamp | |

Unique: `(note_id, work_item_id)`. Relasi: `Note::workItems()` dan
`WorkItem::notes()` (belongsToMany, `withTimestamps`). Sinkronisasi lewat
`sync()` di controller; jangan menulis pivot langsung.

### 8.4 `users` (auth admin)

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

### 8.5 Aturan migrasi

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
| DELETE | `/admin/notes/{note}/work-items/{workItem}` | `admin.notes.work-items.detach` | lepas tautan pekerjaan |
| DELETE | `/admin/notes/{note}` | `admin.notes.destroy` | hapus catatan |
| GET | `/admin/work-items` | `admin.work-items.index` | daftar pekerjaan |
| POST | `/admin/work-items` | `admin.work-items.store` | simpan pekerjaan |
| PUT | `/admin/work-items/{workItem}` | `admin.work-items.update` | ubah pekerjaan |
| PATCH | `/admin/work-items/{workItem}/status` | `admin.work-items.status` | ubah status |
| DELETE | `/admin/work-items/{workItem}` | `admin.work-items.destroy` | hapus pekerjaan |

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

```bash
vendor/bin/pint
npx prettier --write <file>
npx eslint <file>
php artisan test
npm run build
```

Jangan mencentang item di `FEATURES.md` sebelum kelima perintah di atas lolos.

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
5. **Test** — jalankan test fitur, lalu seluruh suite.
6. **Quality gate** — Pint, Prettier, ESLint, build.
7. **Verifikasi PostgreSQL**
   - `php artisan migrate --force`
   - uji query/CRUD lewat tinker atau aplikasi
   - hapus data uji yang dibuat (kecuali data milik user)
8. **Dokumentasi** — update `FEATURES.md`, tulis handoff.
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
   **Hapus**. Setelah edit, kembali ke detail; setelah hapus, kembali ke daftar.
9. Edit / hapus juga bisa langsung dari kartu di daftar.
10. Bagian **Pekerjaan terkait** menampilkan pekerjaan yang tertaut beserta
    status dan tenggat; tombol **Lepas** menghapus tautan tanpa menghapus data.
    Tautan dibuat dari form pekerjaan.

### 14.3 Pekerjaan

1. Sidebar **Pekerjaan** → `/admin/work-items`.
2. Klik **Pekerjaan baru** → dialog.
3. Isi judul, deskripsi, status, prioritas, tenggat, tag.
4. Simpan → redirect + flash.
5. Filter status (tab + jumlah), prioritas, cari.
6. Ubah status langsung dari select di kartu.
7. Jika status `done` → `completed_at` diisi; jika dikembalikan → dikosongkan.
8. Tenggat lewat + belum selesai → indikator merah "terlambat".
9. Di form, pilih **Catatan terkait** lewat daftar centang dengan pencarian;
   tautan disimpan dua arah dan bisa dilepas dari detail catatan.
10. Toggle **Daftar / Papan** di header. Papan menampilkan 4 kolom status
    (Backlog, To do, Dikerjakan, Selesai) dan mengabaikan filter status.
11. Tarik kartu ke kolom lain (atau ubah select status di kartu) → status dan
    `completed_at` diperbarui; jumlah kolom ikut berubah.

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

---

## 15. Rancangan fitur berikutnya (spesifikasi)

> Detail checklist dan ID ada di `FEATURES.md`. Bagian ini menjelaskan
> **bagaimana** membangunnya.

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

### 15.4 WORK-13 — Proyek / area

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

### 15.5 WORK-14 — Subtask

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

- Satu item `FEATURES.md` = satu agent pada satu waktu.
- Tandai `[~]` dan tulis nama/branch di commit atau handoff.
- Jangan mengerjakan item yang dependensinya belum selesai tanpa koordinasi.

### 18.2 Branch & commit

- Branch: `feat/<id>-<slug>` (mis. `feat/note-11-link`).
- Commit kecil dan fokus: `feat(notes): add markdown detail page`.
- Jenis: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- Satu commit/PR per fitur; jangan campur refactor besar.

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

### 18.6 Format handoff

Tulis di akhir pekerjaan:

```md
## Handoff — <FEATURE-ID>

Status: selesai / sebagian
Branch: feat/...
File utama: ...
Migrasi: ...
Test: ... (jumlah)
Verifikasi PostgreSQL: ya/tidak, catatan
Perubahan dokumen: FEATURES.md ...
Belum selesai / risiko: ...
Langkah berikutnya: ...
```

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
| Work Items | List + Kanban | Drag mengubah status |
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

---

## 20. Glossary

| Istilah | Arti |
| --- | --- |
| Catatan / Note | Dokumen Markdown dengan tag dan pin |
| Pekerjaan / Work Item | Tugas dengan status, prioritas, tenggat |
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

```bash
# 1. Cek kondisi repo
git status
git log --oneline -5

# 2. Baca konteks
cat AGENT_CONTEXT.md
cat FEATURES.md

# 3. Siapkan environment
composer install
npm install
cp .env.example .env   # jika belum ada
php artisan key:generate
php artisan migrate

# 4. Pastikan baseline hijau
php artisan test
npm run build

# 5. Mulai satu item dari FEATURES.md
```

Jika baseline tidak hijau, **perbaiki dulu** sebelum menambah fitur, dan catat
apa yang diperbaiki.

---

> **My Workspace — a personal digital space that grows with my needs.**

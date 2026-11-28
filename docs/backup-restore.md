# Backup & restore database lokal

Backup database PostgreSQL memakai `pg_dump`. File backup berisi data pribadi,
jadi jangan pernah di-commit ke git.

## Konfigurasi

Tambahkan/ubah di `.env` (lihat juga `.env.example`):

```dotenv
DB_CONNECTION=pgsql
DB_DATABASE=my_workspace
DB_USERNAME=my_workspace
DB_PASSWORD=...

BACKUP_PATH=storage/app/backups
BACKUP_RETENTION=14
```

- `BACKUP_PATH`: folder tujuan. Path relatif dihitung dari root project;
  default `storage/app/backups` (sudah diabaikan `.gitignore`).
  Jika memakai folder lain, tambahkan folder itu ke `.gitignore` sendiri.
- `BACKUP_RETENTION`: jumlah backup terbaru yang disimpan (default 14).
  Backup lebih lama otomatis dihapus setelah backup berhasil.
- Nama file: `my_workspace_YYYYMMDD_HHMMSS.sql` (waktu aplikasi, default UTC).
- Password database dikirim ke `pg_dump` hanya lewat environment variable
  `PGPASSWORD`, bukan argumen command line, dan tidak pernah dicetak.

## Menjalankan backup

Manual:

```bash
php artisan db:backup
```

Opsional, timpa retensi untuk sekali jalan:

```bash
php artisan db:backup --retention=7
```

Jadwal harian sudah terdaftar di `routes/console.php`. Jalankan salah satu:

```bash
# Cara 1: proses scheduler aktif selama terminal ini terbuka
php artisan schedule:work

# Cara 2: cron (jalankan schedule:run setiap menit)
* * * * * cd /path/ke/project && php artisan schedule:run >> /dev/null 2>&1
```

**Catatan penting:** jadwal hanya berjalan saat komputer menyala **dan** proses
scheduler (`schedule:work` atau cron) aktif. Jika komputer mati atau scheduler
tidak berjalan pada jam tersebut, backup untuk hari itu tidak dibuat dan tidak
diulang otomatis.

## Restore ke database baru

Lakukan restore ke database **baru**, bukan ke database yang sedang dipakai
aplikasi. Ganti nama file dan kredensial sesuai kondisi setempat.

```bash
# 1. Siapkan password tanpa menaruhnya di argumen command line
read -rsp 'Password DB: ' PGPASSWORD; echo; export PGPASSWORD

# 2. Buat database tujuan
createdb -h 127.0.0.1 -U my_workspace my_workspace_restore_test

# 3. Restore dari file backup
psql -h 127.0.0.1 -U my_workspace -d my_workspace_restore_test \
  -f storage/app/backups/my_workspace_20261128_203400.sql

# 4. Cek jumlah baris tabel utama
psql -h 127.0.0.1 -U my_workspace -d my_workspace_restore_test -c \
  'SELECT (SELECT count(*) FROM users) AS users,
          (SELECT count(*) FROM notes) AS notes,
          (SELECT count(*) FROM work_items) AS work_items,
          (SELECT count(*) FROM projects) AS projects;'

# 5. Bersihkan database uji setelah selesai
dropdb -h 127.0.0.1 -U my_workspace my_workspace_restore_test
unset PGPASSWORD
```

Jika perlu memulihkan ke database utama, lakukan ketika aplikasi tidak sedang
dipakai, dan backup kondisi saat ini terlebih dahulu. File backup berupa SQL
plain sehingga bisa dibaca dengan `psql -f`.

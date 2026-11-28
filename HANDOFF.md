# HANDOFF
Terakhir: 28 Nov 2026
Item: FND-10 Backup database terjadwal + dokumentasi restore — SELESAI
File utama: app/Console/Commands/DatabaseBackupCommand.php, config/backup.php, routes/console.php, tests/Feature/DatabaseBackupCommandTest.php, docs/backup-restore.md, .env.example, .gitignore
Status: `db:backup` memakai pg_dump (PGPASSWORD, nama bertimestamp, retensi 14, file diabaikan git), scheduler harian; 6 test Process::fake lolos; check.sh hijau (pint/eslint/format/test/build).
Verifikasi: backup nyata + restore cocok untuk semua tabel utama. Role `my_workspace` tanpa CREATEDB (dilarang sudo), jadi restore diverifikasi di schema uji sementara, bukan database; schema, database uji, dan file backup uji sudah dihapus — tidak ada sisa data uji.
Berikutnya: KNOW-02 Statistik pengetahuan (catatan/minggu, tag teratas) dari antrean FEATURES.md.

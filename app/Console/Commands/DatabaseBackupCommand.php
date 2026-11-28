<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Process;

class DatabaseBackupCommand extends Command
{
    protected $signature = 'db:backup {--retention= : Jumlah backup terbaru yang dipertahankan}';

    protected $description = 'Membuat backup database PostgreSQL dengan pg_dump dan membersihkan backup lama';

    public function handle(Filesystem $files): int
    {
        $connection = config('database.connections.pgsql');
        $database = $connection['database'];
        $password = (string) ($connection['password'] ?? '');

        $version = Process::timeout(15)->run(['pg_dump', '--version']);

        if ($version->failed()) {
            $this->error('pg_dump tidak ditemukan. Pasang PostgreSQL client (mis. postgresql-client) lalu jalankan lagi.');

            return self::FAILURE;
        }

        $directory = $this->backupPath();

        if (! $files->isDirectory($directory) && ! $files->makeDirectory($directory, 0755, true)) {
            $this->error("Folder backup tidak dapat dibuat: {$directory}");

            return self::FAILURE;
        }

        $filename = $database.'_'.now()->format('Ymd_His').'.sql';
        $file = $directory.DIRECTORY_SEPARATOR.$filename;

        $command = ['pg_dump', '--no-password'];

        foreach (['host', 'port', 'username'] as $key) {
            if (! empty($connection[$key])) {
                $command[] = '--'.$key.'='.$connection[$key];
            }
        }

        $command[] = '--file='.$file;
        $command[] = $database;

        // Password hanya dikirim lewat environment, bukan argumen command line atau output.
        $result = Process::timeout(600)
            ->env(['PGPASSWORD' => $password])
            ->run($command);

        if ($result->failed()) {
            $files->delete($file);
            $this->error('Backup database gagal: '.trim($result->errorOutput().' '.$result->output()));

            return self::FAILURE;
        }

        $retention = $this->retention();
        $removed = $this->prune($files, $directory, $database, $retention);

        $this->info("Backup database {$database} berhasil dibuat: {$file}");
        $this->line("Disimpan {$retention} backup terbaru; {$removed} backup lama dihapus.");

        return self::SUCCESS;
    }

    protected function retention(): int
    {
        $value = $this->option('retention') ?? config('backup.retention', 14);

        return max(1, (int) $value);
    }

    protected function backupPath(): string
    {
        $path = (string) config('backup.path', 'storage/app/backups');

        return str_starts_with($path, DIRECTORY_SEPARATOR) ? $path : base_path($path);
    }

    protected function prune(Filesystem $files, string $directory, string $database, int $retention): int
    {
        $pattern = '/^'.preg_quote($database, '/').'_\d{8}_\d{6}\.sql$/';

        $backups = collect($files->files($directory))
            ->filter(fn ($file) => preg_match($pattern, $file->getFilename()))
            ->sortByDesc(fn ($file) => $file->getFilename())
            ->values();

        $removed = 0;

        foreach ($backups->slice($retention) as $file) {
            $files->delete($file->getPathname());
            $removed++;
        }

        return $removed;
    }
}

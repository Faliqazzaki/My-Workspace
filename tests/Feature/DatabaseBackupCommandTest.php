<?php

use Illuminate\Filesystem\Filesystem;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Process;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-28 20:34:00', 'UTC'));

    config()->set('database.connections.pgsql.host', '127.0.0.1');
    config()->set('database.connections.pgsql.port', 5432);
    config()->set('database.connections.pgsql.database', 'my_workspace');
    config()->set('database.connections.pgsql.username', 'my_workspace');
    config()->set('database.connections.pgsql.password', 'rahasia-yang-tidak-boleh-muncul');

    $this->backupDir = sys_get_temp_dir().'/my-workspace-backup-test-'.bin2hex(random_bytes(4));
    config()->set('backup.path', $this->backupDir);

    // Handler '*' ditimpa oleh closure di test yang butuh hasil berbeda.
    Process::fake(fn () => Process::result());
    Process::preventStrayProcesses();
});

afterEach(function () {
    Carbon::setTestNow();
    (new Filesystem)->deleteDirectory($this->backupDir);
});

it('membangun perintah pg_dump dengan password di environment dan nama file bertimestamp', function () {
    $password = 'rahasia-yang-tidak-boleh-muncul';

    $this->artisan('db:backup')->assertSuccessful();

    Process::assertRan(function (PendingProcess $process) use ($password) {
        if (in_array('--version', (array) $process->command, true)) {
            return false;
        }

        expect($process->command)->toBe([
            'pg_dump',
            '--no-password',
            '--host=127.0.0.1',
            '--port=5432',
            '--username=my_workspace',
            '--file='.$this->backupDir.'/my_workspace_20261128_203400.sql',
            'my_workspace',
        ]);
        expect($process->environment['PGPASSWORD'])->toBe($password);
        expect(implode(' ', (array) $process->command))->not->toContain($password);

        return true;
    });
});

it('tidak mencetak password ke output', function () {
    $this->artisan('db:backup')
        ->doesntExpectOutputToContain('rahasia-yang-tidak-boleh-muncul')
        ->assertSuccessful();
});

it('menyimpan 14 backup terbaru secara default', function () {
    $files = new Filesystem;
    $files->ensureDirectoryExists($this->backupDir);

    foreach (range(13, 28) as $day) {
        $files->put($this->backupDir.'/my_workspace_202611'.$day.'_000000.sql', '-- dummy');
    }

    $this->artisan('db:backup')->assertSuccessful();

    expect($files->files($this->backupDir))->toHaveCount(14);
    expect($files->exists($this->backupDir.'/my_workspace_20261113_000000.sql'))->toBeFalse();
    expect($files->exists($this->backupDir.'/my_workspace_20261128_000000.sql'))->toBeTrue();
});

it('menghapus backup lama sesuai opsi retention tanpa menyentuh file lain', function () {
    $files = new Filesystem;
    $files->ensureDirectoryExists($this->backupDir);

    foreach ([20, 21, 22, 23] as $day) {
        $files->put($this->backupDir.'/my_workspace_202611'.$day.'_000000.sql', '-- dummy');
    }
    $files->put($this->backupDir.'/catatan.txt', '-- bukan backup');

    $this->artisan('db:backup', ['--retention' => 2])->assertSuccessful();

    expect($files->exists($this->backupDir.'/my_workspace_20261120_000000.sql'))->toBeFalse();
    expect($files->exists($this->backupDir.'/my_workspace_20261121_000000.sql'))->toBeFalse();
    expect($files->exists($this->backupDir.'/my_workspace_20261122_000000.sql'))->toBeTrue();
    expect($files->exists($this->backupDir.'/my_workspace_20261123_000000.sql'))->toBeTrue();
    expect($files->exists($this->backupDir.'/catatan.txt'))->toBeTrue();
});

it('gagal dengan pesan jelas jika pg_dump tidak tersedia', function () {
    Process::fake(fn () => Process::result(output: 'sh: 1: pg_dump: not found', exitCode: 127));

    $this->artisan('db:backup')
        ->expectsOutputToContain('pg_dump tidak ditemukan')
        ->assertFailed();
});

it('gagal dengan pesan jelas dan membersihkan file saat pg_dump gagal', function () {
    Process::fake(function (PendingProcess $process) {
        return in_array('--version', (array) $process->command, true)
            ? Process::result(output: 'pg_dump (PostgreSQL) 16.0')
            : Process::result(errorOutput: 'pg_dump: error: permission denied', exitCode: 1);
    });

    $this->artisan('db:backup')
        ->expectsOutputToContain('Backup database gagal: pg_dump: error: permission denied')
        ->assertFailed();

    expect((new Filesystem)->files($this->backupDir))->toHaveCount(0);
});

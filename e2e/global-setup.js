import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { E2E_DB_PATH, PROJECT_ROOT, e2eEnv } from './env.js';

function abort(message) {
    console.error(`\n[e2e] ${message}\n`);
    throw new Error(message);
}

function assertE2eDatabase() {
    const connection = e2eEnv.DB_CONNECTION;
    const database = path.resolve(e2eEnv.DB_DATABASE);
    const expected = path.resolve(E2E_DB_PATH);

    if (connection !== 'sqlite' || database !== expected) {
        abort(
            'E2E dibatalkan: koneksi harus SQLite di database/e2e.sqlite, bukan database lain.',
        );
    }

    if (
        path.basename(database) !== 'e2e.sqlite' ||
        database.includes('my_workspace')
    ) {
        abort(
            'E2E dibatalkan: database bukan database e2e yang diizinkan (database/e2e.sqlite).',
        );
    }

    if (process.env.DB_CONNECTION && process.env.DB_CONNECTION !== 'sqlite') {
        abort(
            `E2E dibatalkan: DB_CONNECTION warisan "${process.env.DB_CONNECTION}" bukan sqlite.`,
        );
    }

    if (
        process.env.DB_DATABASE &&
        path.resolve(process.env.DB_DATABASE) !== expected
    ) {
        abort('E2E dibatalkan: DB_DATABASE warisan bukan database/e2e.sqlite.');
    }
}

function runArtisan(args, env) {
    execFileSync('php', ['artisan', ...args], {
        cwd: PROJECT_ROOT,
        env,
        stdio: 'inherit',
    });
}

function assertResolvedDatabase(env) {
    const output = execFileSync('php', ['e2e/check-db.php'], {
        cwd: PROJECT_ROOT,
        env,
        encoding: 'utf8',
    });
    const [connection, database] = output.trim().split('\n');

    if (
        connection !== 'sqlite' ||
        path.resolve(database ?? '') !== path.resolve(E2E_DB_PATH)
    ) {
        abort(
            `E2E dibatalkan: aplikasi membaca koneksi "${connection}" / "${database}", bukan SQLite database/e2e.sqlite.`,
        );
    }
}

export default async function globalSetup() {
    assertE2eDatabase();

    const env = { ...process.env, ...e2eEnv };

    // Pastikan config cache lama tidak membuat aplikasi memakai .env asli.
    runArtisan(['config:clear'], env);
    assertResolvedDatabase(env);

    for (const suffix of ['', '-journal', '-wal', '-shm']) {
        fs.rmSync(`${E2E_DB_PATH}${suffix}`, { force: true });
    }
    fs.mkdirSync(path.dirname(E2E_DB_PATH), { recursive: true });
    fs.writeFileSync(E2E_DB_PATH, '');

    runArtisan(['migrate:fresh', '--force'], env);
    runArtisan(['db:seed', '--class=AdminUserSeeder', '--force'], env);
}

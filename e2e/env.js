import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);

export const PROJECT_ROOT = projectRoot;
export const E2E_PORT = 8001;
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;
export const E2E_DB_PATH = path.join(projectRoot, 'database', 'e2e.sqlite');

export const E2E_ADMIN = {
    username: 'e2e-admin',
    email: 'e2e-admin@example.test',
    password: 'e2e-password',
};

// Env khusus e2e. Nilai ini menimpa .env asli karena Laravel memakai
// Dotenv immutable: environment proses yang sudah ada tidak ditimpa.
export const e2eEnv = {
    APP_ENV: 'e2e',
    APP_DEBUG: 'false',
    APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    APP_URL: E2E_BASE_URL,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: E2E_DB_PATH,
    DB_FOREIGN_KEYS: 'true',
    SESSION_DRIVER: 'file',
    CACHE_STORE: 'file',
    QUEUE_CONNECTION: 'sync',
    MAIL_MAILER: 'array',
    LOG_CHANNEL: 'stack',
    LOG_LEVEL: 'error',
    BCRYPT_ROUNDS: '4',
    ADMIN_USERNAME: E2E_ADMIN.username,
    ADMIN_EMAIL: E2E_ADMIN.email,
    ADMIN_PASSWORD: E2E_ADMIN.password,
};

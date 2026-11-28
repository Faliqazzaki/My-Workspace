import { defineConfig, devices } from '@playwright/test';

import { E2E_BASE_URL, e2eEnv } from './e2e/env.js';

export default defineConfig({
    testDir: './e2e/tests',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    forbidOnly: true,
    reporter: [['list'], ['html', { open: 'never' }]],
    globalSetup: './e2e/global-setup.js',
    use: {
        baseURL: E2E_BASE_URL,
        colorScheme: 'light',
        serviceWorkers: 'block',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command:
            'php artisan config:clear && npm run build && php artisan serve --host=127.0.0.1 --port=8001',
        url: E2E_BASE_URL,
        reuseExistingServer: false,
        timeout: 180_000,
        env: { ...process.env, ...e2eEnv },
    },
});

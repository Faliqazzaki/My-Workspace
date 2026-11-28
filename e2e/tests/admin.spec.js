import { test as base, expect } from '@playwright/test';

import { E2E_ADMIN } from '../env.js';

const test = base.extend({
    page: async ({ page }, use) => {
        const browserErrors = [];

        page.on('pageerror', (error) => {
            browserErrors.push(`pageerror: ${error.message}`);
        });
        page.on('console', (message) => {
            if (message.type() === 'error') {
                browserErrors.push(`console.error: ${message.text()}`);
            }
        });

        await use(page);

        if (browserErrors.length > 0) {
            throw new Error(
                `Kesalahan browser terdeteksi:\n${browserErrors.join('\n')}`,
            );
        }
    },
});

async function login(page) {
    await page.goto('/');
    await page.getByLabel('Username').fill(E2E_ADMIN.username);
    await page.getByLabel('Password', { exact: true }).fill(E2E_ADMIN.password);
    await page.getByRole('button', { name: 'Masuk' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: /Halo,/ })).toBeVisible();
}

test('login admin berhasil dan dashboard tampil', async ({ page }) => {
    await login(page);

    await expect(
        page.getByRole('heading', { name: 'Statistik pengetahuan' }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Beranda', exact: true }),
    ).toBeVisible();
});

test('semua halaman utama terbuka tanpa error', async ({ page }) => {
    await login(page);

    await page.getByRole('link', { name: 'Catatan', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/notes$/);
    await expect(
        page.getByRole('button', { name: 'Catatan baru' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Pekerjaan', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/work-items$/);
    await expect(
        page.getByRole('button', { name: 'Pekerjaan baru' }),
    ).toBeVisible();

    const viewGroup = page.getByRole('group', { name: 'Tampilan pekerjaan' });
    await viewGroup.getByRole('button', { name: 'Papan' }).click();
    await expect(
        page.getByRole('heading', { name: 'Backlog', exact: true }),
    ).toBeVisible();

    await viewGroup.getByRole('button', { name: 'Kalender' }).click();
    await expect(page.getByRole('button', { name: 'Hari ini' })).toBeVisible();

    await viewGroup.getByRole('button', { name: 'Daftar' }).click();

    await page.getByRole('link', { name: 'Proyek', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/projects$/);
    await expect(
        page.getByRole('heading', { level: 1, name: /^Proyek/ }),
    ).toBeVisible();

    await page
        .getByRole('link', { name: 'Sumber berita', exact: true })
        .click();
    await expect(page).toHaveURL(/\/admin\/news\/sources$/);
    await expect(
        page.getByRole('heading', { level: 1, name: /^Sumber berita/ }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Data', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/data$/);
    await expect(
        page.getByRole('heading', { name: 'Data & cadangan' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Keamanan', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/password$/);
    await expect(
        page.getByRole('heading', { name: 'Keamanan akun' }),
    ).toBeVisible();
});

test('membuat pekerjaan, membuka detail, dan mengubah status di daftar', async ({
    page,
}) => {
    await login(page);
    await page.getByRole('link', { name: 'Pekerjaan', exact: true }).click();

    await page.getByRole('button', { name: 'Pekerjaan baru' }).click();

    const editor = page.getByRole('dialog');
    await expect(
        editor.getByRole('heading', { name: 'Pekerjaan baru' }),
    ).toBeVisible();
    await editor.getByLabel('Judul').fill('Pekerjaan uji e2e');
    await editor.getByRole('button', { name: 'Simpan' }).click();

    await expect(
        page.getByText('Pekerjaan berhasil ditambahkan.'),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Pekerjaan uji e2e' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Lihat detail pekerjaan' }).click();
    const detail = page.getByRole('dialog');
    await expect(
        detail.getByRole('heading', { name: 'Pekerjaan uji e2e' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(detail).toBeHidden();

    const status = page.getByLabel('Ubah status Pekerjaan uji e2e');
    await status.selectOption('in_progress');
    await expect(page.getByText('Status pekerjaan diperbarui.')).toBeVisible();
    await expect(status).toHaveValue('in_progress');
});

test('membuat catatan lalu membuka detail Markdown', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Catatan', exact: true }).click();

    await page.getByRole('button', { name: 'Catatan baru' }).click();

    const editor = page.getByRole('dialog');
    await expect(
        editor.getByRole('heading', { name: 'Catatan baru' }),
    ).toBeVisible();
    await editor.getByLabel('Judul').fill('Catatan uji e2e');
    await editor
        .getByLabel('Isi catatan')
        .fill('## Ringkasan\n\nIsi **tebal** dan `kode`.');
    await editor.getByRole('button', { name: 'Simpan' }).click();

    await expect(page.getByText('Catatan berhasil disimpan.')).toBeVisible();

    await page.getByRole('button', { name: 'Catatan uji e2e' }).click();
    const detail = page.getByRole('dialog');
    await expect(
        detail.getByRole('heading', { name: 'Catatan uji e2e' }),
    ).toBeVisible();
    await expect(
        detail.getByRole('heading', { name: 'Ringkasan' }),
    ).toBeVisible();
    await expect(detail.getByText('tebal', { exact: true })).toBeVisible();
});

test('command palette dan dropdown notifikasi terbuka', async ({ page }) => {
    await login(page);

    await page.keyboard.press('Control+k');
    const paletteInput = page.getByRole('combobox', {
        name: 'Cari halaman, catatan, atau pekerjaan',
    });
    await expect(paletteInput).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(paletteInput).toBeHidden();

    await page.getByRole('button', { name: /^Notifikasi/ }).click();
    await expect(
        page.getByText('Notifikasi Tenggat', { exact: true }),
    ).toBeVisible();
});

test('toggle dark mode tanpa error', async ({ page }) => {
    await login(page);

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Aktifkan mode gelap' }).click();
    await expect(html).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Aktifkan mode terang' }).click();
    await expect(html).not.toHaveClass(/dark/);
});

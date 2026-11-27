<?php

it('dapat mengakses web app manifest dengan spesifikasi yang benar', function () {
    $response = $this->get('/manifest.webmanifest')
        ->assertOk();

    $manifest = json_decode($response->getContent(), true);

    expect($manifest)->toBeArray()
        ->and($manifest['name'])->toBe('My Workspace')
        ->and($manifest['short_name'])->toBe('Workspace')
        ->and($manifest['start_url'])->toBe('/admin')
        ->and($manifest['display'])->toBe('standalone')
        ->and($manifest['theme_color'])->toBe('#4f46e5')
        ->and($manifest['background_color'])->toBe('#09090b')
        ->and($manifest['icons'])->toHaveCount(3);

    expect(collect($manifest['icons'])->pluck('sizes')->all())
        ->toContain('192x192', '512x512');
});

it('dapat mengakses service worker public/sw.js', function () {
    $response = $this->get('/sw.js')
        ->assertOk();

    $content = $response->getContent();

    expect($content)->toContain('my-workspace-v1')
        ->and($content)->toContain('/offline.html')
        ->and($content)->toContain('/build/assets/')
        ->and($content)->toContain('caches.delete');
});

it('dapat mengakses halaman offline statis dengan konten yang tepat', function () {
    $response = $this->get('/offline.html')
        ->assertOk();

    $content = $response->getContent();

    expect($content)->toContain('Koneksi Terputus')
        ->and($content)->toContain('Coba Lagi')
        ->and($content)->toContain('My Workspace')
        ->and($content)->toContain('prefers-color-scheme: dark');
});

it('memastikan file ikon PWA tersedia secara fisik di direktori public/icons', function () {
    expect(file_exists(public_path('icons/icon-192x192.png')))->toBeTrue()
        ->and(file_exists(public_path('icons/icon-512x512.png')))->toBeTrue()
        ->and(file_exists(public_path('icons/icon-maskable-512x512.png')))->toBeTrue();
});

it('memuat tautan manifest dan meta tema pada tampilan html utama', function () {
    $response = $this->get('/')
        ->assertOk();

    $html = $response->getContent();

    expect($html)->toContain('<link rel="manifest" href="/manifest.webmanifest">')
        ->and($html)->toContain('name="theme-color"')
        ->and($html)->toContain('name="apple-mobile-web-app-capable"');
});

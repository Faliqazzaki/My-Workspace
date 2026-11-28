<?php

use App\Models\NewsArticle;
use App\Models\NewsSource;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia as Assert;

it('mengalihkan tamu dari halaman sumber berita', function () {
    $this->get('/admin/news/sources')->assertRedirect(route('home'));
});

it('menampilkan daftar sumber berita', function () {
    NewsSource::factory()->count(2)->create();

    $this->actingAs(adminUser())
        ->get('/admin/news/sources')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/news-sources')
            ->has('sources', 2)
            ->where('sources.0.type', 'rss')
            ->where('sources.0.enabled', true)
            ->where('maxSources', 20)
        );
});

it('menyimpan sumber baru dengan URL valid', function () {
    $this->actingAs(adminUser())
        ->post('/admin/news/sources', [
            'name' => 'Berita Teknologi',
            'url' => 'https://contoh.test/feed.xml',
            'type' => 'rss',
            'enabled' => true,
        ])
        ->assertRedirect(route('admin.news.sources.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('news_sources', [
        'name' => 'Berita Teknologi',
        'url' => 'https://contoh.test/feed.xml',
        'type' => 'rss',
        'enabled' => true,
    ]);
});

it('menolak skema URL bukan http atau https', function () {
    $this->actingAs(adminUser())
        ->post('/admin/news/sources', [
            'name' => 'Feed FTP',
            'url' => 'ftp://contoh.test/feed.xml',
            'type' => 'rss',
        ])
        ->assertSessionHasErrors('url');

    expect(NewsSource::count())->toBe(0);
});

it('menolak host lokal dan privat', function (string $url) {
    $this->actingAs(adminUser())
        ->post('/admin/news/sources', [
            'name' => 'Feed tidak aman',
            'url' => $url,
            'type' => 'rss',
        ])
        ->assertSessionHasErrors('url');

    expect(NewsSource::count())->toBe(0);
})->with([
    'localhost' => ['http://localhost/feed.xml'],
    'loopback' => ['http://127.0.0.1/feed.xml'],
    'private 10.x' => ['http://10.1.2.3/feed.xml'],
    'private 172.16.x' => ['http://172.16.0.1/feed.xml'],
    'private 172.31.x' => ['http://172.31.255.254/feed.xml'],
    'private 192.168.x' => ['http://192.168.1.10/feed.xml'],
    'link-local' => ['http://169.254.169.254/feed.xml'],
    'ipv6 loopback' => ['http://[::1]/feed.xml'],
    'unspecified' => ['http://0.0.0.0/feed.xml'],
]);

it('memperbolehkan rentang 172.x di luar blok privat', function () {
    $this->actingAs(adminUser())
        ->post('/admin/news/sources', [
            'name' => 'Feed publik',
            'url' => 'https://172.32.0.1/feed.xml',
            'type' => 'rss',
        ])
        ->assertSessionHasNoErrors();

    expect(NewsSource::count())->toBe(1);
});

it('menolak URL duplikat', function () {
    NewsSource::factory()->create(['url' => 'https://contoh.test/feed.xml']);

    $this->actingAs(adminUser())
        ->post('/admin/news/sources', [
            'name' => 'Duplikat',
            'url' => 'https://contoh.test/feed.xml',
            'type' => 'rss',
        ])
        ->assertSessionHasErrors('url');

    expect(NewsSource::count())->toBe(1);
});

it('mengizinkan URL yang sama saat mengedit sumber itu sendiri', function () {
    $source = NewsSource::factory()->create(['url' => 'https://contoh.test/feed.xml']);

    $this->actingAs(adminUser())
        ->put("/admin/news/sources/{$source->id}", [
            'name' => 'Nama baru',
            'url' => 'https://contoh.test/feed.xml',
            'type' => 'rss',
            'enabled' => false,
        ])
        ->assertSessionHasNoErrors();

    expect($source->refresh()->name)->toBe('Nama baru')
        ->and($source->enabled)->toBeFalse();
});

it('menolak sumber ke-21', function () {
    NewsSource::factory()->count(20)->create();

    $this->actingAs(adminUser())
        ->post('/admin/news/sources', [
            'name' => 'Sumber ke-21',
            'url' => 'https://contoh.test/ke-21.xml',
            'type' => 'rss',
        ])
        ->assertSessionHasErrors('name');

    expect(NewsSource::count())->toBe(20);
});

it('mengaktifkan dan menonaktifkan sumber', function () {
    $source = NewsSource::factory()->create(['enabled' => true]);

    $this->actingAs(adminUser())
        ->patch("/admin/news/sources/{$source->id}/toggle")
        ->assertSessionHas('success');

    expect($source->refresh()->enabled)->toBeFalse();

    $this->actingAs(adminUser())
        ->patch("/admin/news/sources/{$source->id}/toggle")
        ->assertSessionHas('success');

    expect($source->refresh()->enabled)->toBeTrue();
});

it('menghapus sumber beserta artikelnya', function () {
    $source = NewsSource::factory()->create();
    NewsArticle::factory()->count(3)->create(['news_source_id' => $source->id]);

    expect(NewsArticle::count())->toBe(3);

    $this->actingAs(adminUser())
        ->delete("/admin/news/sources/{$source->id}")
        ->assertRedirect(route('admin.news.sources.index'));

    expect(NewsSource::count())->toBe(0)
        ->and(NewsArticle::count())->toBe(0);
});

it('menjaga url_hash unik dan cast nilai artikel', function () {
    $hash = hash('sha256', 'https://contoh.test/artikel');

    $article = NewsArticle::factory()->create([
        'url_hash' => $hash,
        'published_at' => now()->subDays(2),
        'selected_date' => '2026-11-28',
        'metadata' => ['skor' => 1],
        'status' => 'selected',
    ]);

    expect(fn () => NewsArticle::factory()->create(['url_hash' => $hash]))
        ->toThrow(QueryException::class);

    $article->refresh();

    expect($article->published_at)->toBeInstanceOf(CarbonInterface::class)
        ->and($article->selected_date->toDateString())->toBe('2026-11-28')
        ->and($article->metadata)->toBe(['skor' => 1])
        ->and($article->status)->toBe('selected')
        ->and(NewsArticle::STATUSES)->toBe(['new', 'summarized', 'selected', 'archived'])
        ->and($article->newsSource)->toBeInstanceOf(NewsSource::class);
});

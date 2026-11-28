<?php

use App\Jobs\FetchNewsSource;
use App\Models\NewsArticle;
use App\Models\NewsSource;
use App\Services\News\FeedFetcher;
use App\Services\News\FetchSummary;
use App\Services\News\HostResolver;
use App\Services\News\NewsUrl;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;

class FakeHostResolver implements HostResolver
{
    public function __construct(public array $map = ['contoh.test' => ['93.184.216.34']]) {}

    public function resolve(string $host): array
    {
        return $this->map[$host] ?? ['93.184.216.34'];
    }
}

function newsRssFixture(): string
{
    return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Contoh</title>
<item><title>&lt;b&gt;Judul &amp; Valid&lt;/b&gt;</title><link>https://contoh.test/artikel-1?utm_source=rss#bagian</link><description>&lt;p&gt;Ringkasan &lt;strong&gt;tebal&lt;/strong&gt;.&lt;/p&gt;</description><pubDate>Tue, 24 Nov 2026 10:00:00 +0000</pubDate></item>
<item><title>Tanpa link</title><description>Dilewati.</description></item>
<item><title>Skema salah</title><link>ftp://contoh.test/x</link></item>
</channel></rss>
XML;
}

function newsAtomFixture(): string
{
    return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>Atom &lt;i&gt;Miring&lt;/i&gt;</title><link href="https://contoh.test/atom-1" rel="alternate"/><summary>&lt;p&gt;Ringkasan atom.&lt;/p&gt;</summary><published>2026-11-25T08:30:00Z</published></entry>
</feed>
XML;
}

beforeEach(function () {
    Http::preventStrayRequests();
    config()->set('queue.default', 'sync');
    app()->instance(HostResolver::class, new FakeHostResolver);
});

it('mengantre satu job per sumber aktif dan menghormati opsi source', function () {
    Queue::fake();

    $active = NewsSource::factory()->create(['enabled' => true]);
    NewsSource::factory()->disabled()->create();

    $this->artisan('news:fetch')->assertSuccessful();

    Queue::assertPushed(FetchNewsSource::class, 1);
    Queue::assertPushed(FetchNewsSource::class, fn (FetchNewsSource $job) => $job->newsSourceId === $active->id);

    Queue::fake();
    $this->artisan('news:fetch', ['--source' => (string) $active->id])->assertSuccessful();
    Queue::assertPushed(FetchNewsSource::class, 1);
});

it('mendaftarkan news:fetch harian tanpa tumpang tindih', function () {
    $event = collect(app(Schedule::class)->events())
        ->first(fn ($event) => str_contains($event->command ?? '', 'news:fetch'));

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('0 0 * * *')
        ->and($event->withoutOverlapping)->toBeTrue();
});

it('mengurai RSS, membersihkan HTML, dan menyimpan artikel baru', function () {
    $source = NewsSource::factory()->create(['url' => 'https://contoh.test/feed.xml']);
    Http::fake(['https://contoh.test/feed.xml' => Http::response(newsRssFixture(), 200)]);

    $this->artisan('news:fetch')->assertSuccessful();

    expect(NewsArticle::count())->toBe(1);

    $article = NewsArticle::firstOrFail();

    expect($article->title)->toBe('Judul & Valid')
        ->and($article->url)->toBe('https://contoh.test/artikel-1?utm_source=rss#bagian')
        ->and($article->excerpt)->toBe('Ringkasan tebal.')
        ->and($article->published_at->toIso8601String())->toBe('2026-11-24T10:00:00+00:00')
        ->and($article->url_hash)->toBe(hash('sha256', NewsUrl::normalize($article->url)))
        ->and($article->status)->toBe('new')
        ->and($source->refresh()->last_fetched_at)->not->toBeNull();
});

it('tidak menggandakan artikel pada pengambilan kedua dan dedupe utm/fragment', function () {
    NewsSource::factory()->create(['url' => 'https://contoh.test/feed.xml']);
    Http::fake(['https://contoh.test/feed.xml' => Http::response(newsRssFixture(), 200)]);

    $this->artisan('news:fetch');
    $this->artisan('news:fetch');

    expect(NewsArticle::count())->toBe(1);

    $clean = str_replace(
        'https://contoh.test/artikel-1?utm_source=rss#bagian',
        'https://Contoh.test/artikel-1',
        newsRssFixture(),
    );
    Http::fake(['https://contoh.test/feed.xml' => Http::response($clean, 200)]);
    $this->artisan('news:fetch');

    expect(NewsArticle::count())->toBe(1)
        ->and(NewsUrl::hash('https://contoh.test/a/?utm_medium=rss#x'))
        ->toBe(NewsUrl::hash('https://CONTOH.test/a'));
});

it('mengurai feed Atom', function () {
    NewsSource::factory()->create(['url' => 'https://contoh.test/atom.xml']);
    Http::fake(['https://contoh.test/atom.xml' => Http::response(newsAtomFixture(), 200)]);

    $this->artisan('news:fetch');

    expect(NewsArticle::count())->toBe(1);

    $article = NewsArticle::firstOrFail();

    expect($article->title)->toBe('Atom Miring')
        ->and($article->excerpt)->toBe('Ringkasan atom.')
        ->and($article->published_at->toIso8601String())->toBe('2026-11-25T08:30:00+00:00');
});

it('menandai gagal tanpa menghentikan sumber lain dan mencatat metadata saja', function () {
    $bad = NewsSource::factory()->create(['url' => 'https://contoh.test/rusak.xml', 'name' => 'Rusak']);
    $good = NewsSource::factory()->create(['url' => 'https://contoh.test/bagus.xml', 'name' => 'Bagus']);

    $captured = [];
    Log::shouldReceive('warning')->andReturnUsing(
        function (string $message, array $context = []) use (&$captured): void {
            $captured[] = ['message' => $message, 'context' => $context];
        },
    );

    Http::fake([
        'https://contoh.test/rusak.xml' => Http::response('<rss><channel><item>', 200),
        'https://contoh.test/bagus.xml' => Http::response(newsRssFixture(), 200),
    ]);

    $this->artisan('news:fetch');

    expect(NewsArticle::count())->toBe(1)
        ->and($bad->refresh()->last_fetched_at)->toBeNull()
        ->and($good->refresh()->last_fetched_at)->not->toBeNull()
        ->and($captured)->not->toBeEmpty();

    foreach ($captured as $entry) {
        expect($entry['context'])->toHaveKeys(['source_id', 'status'])
            ->and(json_encode($entry))->not->toContain('<rss>');
    }
});

it('menolak respons terlalu besar dan timeout', function () {
    $source = NewsSource::factory()->create(['url' => 'https://contoh.test/besar.xml']);
    Http::fake([
        'https://contoh.test/besar.xml' => Http::response(str_repeat('a', 2 * 1024 * 1024 + 1), 200),
    ]);

    $this->artisan('news:fetch');

    expect(NewsArticle::count())->toBe(0)
        ->and($source->refresh()->last_fetched_at)->toBeNull();

    Http::fake([
        'https://contoh.test/besar.xml' => fn () => throw new ConnectionException('timeout'),
    ]);

    $this->artisan('news:fetch');

    expect(NewsArticle::count())->toBe(0);
});

it('menolak resolusi ke alamat privat', function () {
    $source = NewsSource::factory()->create(['url' => 'https://contoh.test/feed.xml']);
    app()->instance(HostResolver::class, new FakeHostResolver(['contoh.test' => ['10.0.0.5']]));
    Http::fake(['https://contoh.test/feed.xml' => Http::response(newsRssFixture(), 200)]);

    (new FetchNewsSource($source->id))->handle(
        app(FeedFetcher::class),
        app(HostResolver::class),
        app(FetchSummary::class),
    );

    expect(NewsArticle::count())->toBe(0)
        ->and($source->refresh()->last_fetched_at)->toBeNull();
});

it('menolak redirect ke alamat privat', function () {
    $source = NewsSource::factory()->create(['url' => 'https://contoh.test/feed.xml']);
    Http::fake([
        'https://contoh.test/feed.xml' => Http::response('', 302, ['Location' => 'https://169.254.169.254/latest/meta-data']),
    ]);

    (new FetchNewsSource($source->id))->handle(
        app(FeedFetcher::class),
        app(HostResolver::class),
        app(FetchSummary::class),
    );

    expect(NewsArticle::count())->toBe(0)
        ->and($source->refresh()->last_fetched_at)->toBeNull();
});

it('tidak membaca entitas eksternal pada payload XXE', function () {
    NewsSource::factory()->create(['url' => 'https://contoh.test/xxe.xml']);

    $xxe = <<<'XML'
<?xml version="1.0"?>
<!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<rss version="2.0"><channel><item><title>&xxe;</title><link>https://contoh.test/xxe-1</link><description>&xxe;</description></item></channel></rss>
XML;

    Http::fake(['https://contoh.test/xxe.xml' => Http::response($xxe, 200)]);
    $this->artisan('news:fetch');

    // Parser menolak XML dengan entitas eksternal; tidak ada isi file yang dibaca.
    expect(NewsArticle::where('title', 'like', '%root:%')->count())->toBe(0)
        ->and(NewsArticle::where('excerpt', 'like', '%root:%')->count())->toBe(0);
});

it('melewati sumber nonaktif', function () {
    $source = NewsSource::factory()->disabled()->create(['url' => 'https://contoh.test/feed.xml']);
    Http::fake(['https://contoh.test/feed.xml' => Http::response(newsRssFixture(), 200)]);

    $this->artisan('news:fetch');

    expect(NewsArticle::count())->toBe(0)
        ->and($source->refresh()->last_fetched_at)->toBeNull();
});

<?php

namespace App\Jobs;

use App\Models\NewsSource;
use App\Services\News\FeedFetcher;
use App\Services\News\FeedFetchException;
use App\Services\News\FetchSummary;
use App\Services\News\HostResolver;
use App\Services\News\NewsUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FetchNewsSource implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 30;

    public function __construct(public readonly int $newsSourceId)
    {
        //
    }

    public function handle(
        FeedFetcher $fetcher,
        HostResolver $resolver,
        FetchSummary $summary,
    ): void {
        $source = NewsSource::find($this->newsSourceId);

        if ($source === null || ! $source->enabled) {
            $summary->skipped++;

            return;
        }

        try {
            $items = $fetcher->fetch($source->url, $resolver);
        } catch (FeedFetchException $exception) {
            $summary->failed++;

            // Hanya metadata; isi respons tidak pernah dicatat.
            Log::warning('news.fetch_failed', [
                'source_id' => $source->id,
                'status' => $exception->status,
            ]);

            return;
        }

        $now = now()->toDateTimeString();
        $rows = [];

        foreach ($items as $item) {
            $rows[] = [
                'news_source_id' => $source->id,
                'title' => $item['title'],
                'url' => $item['url'],
                'url_hash' => NewsUrl::hash($item['url']),
                'excerpt' => $item['excerpt'],
                'content' => null,
                'published_at' => $item['published_at'],
                'summary' => null,
                'summary_generated_at' => null,
                'status' => 'new',
                'selected_date' => null,
                'metadata' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $inserted = $rows === []
            ? 0
            : DB::table('news_articles')->insertOrIgnore($rows);

        $summary->new += $inserted;
        $summary->skipped += count($rows) - $inserted;

        $source->update(['last_fetched_at' => now()]);
    }
}

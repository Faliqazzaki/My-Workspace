<?php

namespace App\Console\Commands;

use App\Jobs\FetchNewsSource;
use App\Models\NewsSource;
use App\Services\News\FetchSummary;
use Illuminate\Console\Command;

class FetchNewsCommand extends Command
{
    protected $signature = 'news:fetch {--source= : ID sumber tertentu yang diambil}';

    protected $description = 'Mengantre pengambilan RSS untuk sumber berita yang aktif';

    public function handle(FetchSummary $summary): int
    {
        $summary->reset();

        $query = NewsSource::query()->where('enabled', true);

        if ($sourceId = $this->option('source')) {
            $query->where('id', (int) $sourceId);
        }

        $sources = $query->get();

        foreach ($sources as $source) {
            FetchNewsSource::dispatch($source->id);
        }

        $this->info("Sumber diantrekan: {$sources->count()}");
        $this->line(
            "Artikel baru: {$summary->new} · dilewati: {$summary->skipped} · sumber gagal: {$summary->failed}",
        );

        if (config('queue.default') !== 'sync') {
            $this->comment('Ringkasan final dihitung saat worker memproses antrean.');
        }

        return self::SUCCESS;
    }
}

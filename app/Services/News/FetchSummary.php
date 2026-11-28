<?php

namespace App\Services\News;

class FetchSummary
{
    public int $new = 0;

    public int $skipped = 0;

    public int $failed = 0;

    public function reset(): void
    {
        $this->new = 0;
        $this->skipped = 0;
        $this->failed = 0;
    }
}

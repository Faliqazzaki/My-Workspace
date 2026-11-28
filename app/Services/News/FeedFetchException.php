<?php

namespace App\Services\News;

use RuntimeException;

class FeedFetchException extends RuntimeException
{
    public function __construct(
        public readonly ?int $status,
        string $safeReason,
    ) {
        parent::__construct($safeReason);
    }
}

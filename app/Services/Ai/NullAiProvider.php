<?php

namespace App\Services\Ai;

class NullAiProvider implements AiProvider
{
    public function summarize(string $text): string
    {
        throw new AiUnavailableException(
            'Provider AI belum dikonfigurasi.',
        );
    }

    public function chat(array $messages): string
    {
        throw new AiUnavailableException(
            'Provider AI belum dikonfigurasi.',
        );
    }

    public function isAvailable(): bool
    {
        return false;
    }
}

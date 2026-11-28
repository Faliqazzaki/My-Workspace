<?php

namespace App\Services\Ai;

interface AiProvider
{
    /**
     * Ringkas teks menjadi beberapa kalimat bahasa Indonesia.
     *
     * @throws AiUnavailableException
     */
    public function summarize(string $text): string;

    /**
     * Kirim percakapan berbentuk array pesan ('role' => ..., 'content' => ...).
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     *
     * @throws AiUnavailableException
     */
    public function chat(array $messages): string;

    /**
     * Apakah provider siap dipakai tanpa mengirim permintaan jaringan.
     */
    public function isAvailable(): bool;
}

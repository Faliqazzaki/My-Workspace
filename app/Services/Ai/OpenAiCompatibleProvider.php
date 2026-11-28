<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiCompatibleProvider implements AiProvider
{
    /**
     * @param  array<string, mixed>  $config
     */
    public function __construct(private readonly array $config)
    {
        //
    }

    public function isAvailable(): bool
    {
        return filled($this->config['api_key'] ?? null)
            && filled($this->config['base_url'] ?? null)
            && filled($this->config['model'] ?? null);
    }

    public function summarize(string $text): string
    {
        return $this->chat([
            [
                'role' => 'system',
                'content' => 'Ringkas teks berikut dalam bahasa Indonesia, maksimal tiga kalimat. Jangan menambahkan informasi baru.',
            ],
            ['role' => 'user', 'content' => $text],
        ]);
    }

    public function chat(array $messages): string
    {
        if (! $this->isAvailable()) {
            throw new AiUnavailableException(
                'Provider AI belum dikonfigurasi lengkap.',
            );
        }

        $maxAttempts = 1 + max(0, (int) ($this->config['retry']['max'] ?? 0));
        $delayMs = max(0, (int) ($this->config['retry']['delay_ms'] ?? 0));

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $startedAt = microtime(true);

            try {
                $response = Http::timeout(max(1, (int) ($this->config['timeout'] ?? 30)))
                    ->withToken((string) $this->config['api_key'])
                    ->post(rtrim((string) $this->config['base_url'], '/').'/chat/completions', [
                        'model' => $this->config['model'],
                        'messages' => array_values($messages),
                        'max_tokens' => max(1, (int) ($this->config['max_tokens'] ?? 1024)),
                        'temperature' => (float) ($this->config['temperature'] ?? 0),
                    ]);
            } catch (ConnectionException) {
                // Jangan sertakan pesan asli: bisa memuat detail koneksi.
                Log::warning('ai.request_failed', [
                    'status' => null,
                    'duration_ms' => $this->durationMs($startedAt),
                    'attempt' => $attempt,
                ]);

                if ($attempt >= $maxAttempts) {
                    throw new AiUnavailableException(
                        'Permintaan AI gagal (jaringan atau timeout).',
                    );
                }

                continue;
            }

            $durationMs = $this->durationMs($startedAt);
            $status = $response->status();

            if ($response->successful()) {
                return $this->content($response->json());
            }

            // Hanya 429 dan 5xx yang diulang, dengan jeda pendek.
            Log::warning('ai.request_failed', [
                'status' => $status,
                'duration_ms' => $durationMs,
                'attempt' => $attempt,
            ]);

            if (($status === 429 || $status >= 500) && $attempt < $maxAttempts) {
                usleep($delayMs * 1000);

                continue;
            }

            throw new AiUnavailableException(
                "Permintaan AI gagal (status {$status}).",
            );
        }

        throw new AiUnavailableException('Permintaan AI gagal.');
    }

    private function content(mixed $payload): string
    {
        $content = is_array($payload)
            ? data_get($payload, 'choices.0.message.content')
            : null;

        if (! is_string($content) || trim($content) === '') {
            throw new AiUnavailableException(
                'Respons AI tidak valid atau kosong.',
            );
        }

        return trim($content);
    }

    private function durationMs(float $startedAt): int
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }
}

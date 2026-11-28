<?php

return [
    // Kosong/null = tidak ada provider; tidak ada data yang dikirim keluar.
    'provider' => env('AI_PROVIDER'),

    'base_url' => env('AI_BASE_URL', 'https://api.openai.com/v1'),
    'api_key' => env('AI_API_KEY'),
    'model' => env('AI_MODEL', 'gpt-4o-mini'),

    'timeout' => max(1, (int) (env('AI_TIMEOUT', 30) ?: 30)),
    'max_tokens' => max(1, (int) (env('AI_MAX_TOKENS', 1024) ?: 1024)),
    'temperature' => (float) (env('AI_TEMPERATURE', 0.2) ?: 0),

    // Jumlah percobaan ulang setelah percobaan pertama, dan jeda (ms)
    // hanya untuk status 429/5xx.
    'retry' => [
        'max' => min(3, max(0, (int) (env('AI_RETRY_MAX', 2) ?: 0))),
        'delay_ms' => min(2000, max(0, (int) (env('AI_RETRY_DELAY_MS', 250) ?: 0))),
    ],
];

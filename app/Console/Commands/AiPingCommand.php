<?php

namespace App\Console\Commands;

use App\Services\Ai\AiProvider;
use App\Services\Ai\AiUnavailableException;
use Illuminate\Console\Command;

class AiPingCommand extends Command
{
    protected $signature = 'ai:ping';

    protected $description = 'Uji koneksi provider AI dengan satu prompt sangat pendek (memakai token)';

    public function handle(AiProvider $provider): int
    {
        if (! $provider->isAvailable()) {
            $this->error('Provider AI belum dikonfigurasi. Isi AI_PROVIDER, AI_BASE_URL, AI_API_KEY, dan AI_MODEL di .env.');

            return self::FAILURE;
        }

        if (! $this->confirm(
            'Perintah ini memakai token penyedia AI untuk satu prompt singkat. Lanjutkan?',
            false,
        )) {
            $this->info('Dibatalkan; tidak ada permintaan yang dikirim.');

            return self::SUCCESS;
        }

        try {
            $answer = $provider->chat([
                ['role' => 'user', 'content' => 'Balas hanya dengan satu kata: pong'],
            ]);
        } catch (AiUnavailableException) {
            // Pesan exception sudah aman, tetapi jangan tampilkan detail lain.
            $this->error('Provider AI tidak dapat merespons. Periksa konfigurasi, kuota, dan koneksi.');

            return self::FAILURE;
        }

        $this->line($answer);

        return self::SUCCESS;
    }
}

<?php

namespace App\Providers;

use App\Services\Ai\AiProvider;
use App\Services\Ai\NullAiProvider;
use App\Services\Ai\OpenAiCompatibleProvider;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class AiServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AiProvider::class, function (Application $app): AiProvider {
            if ($app['config']->get('ai.provider') === 'openai_compatible') {
                return new OpenAiCompatibleProvider(
                    (array) $app['config']->get('ai', []),
                );
            }

            return new NullAiProvider;
        });
    }
}

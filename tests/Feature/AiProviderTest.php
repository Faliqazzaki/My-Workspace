<?php

use App\Console\Commands\AiPingCommand;
use App\Services\Ai\AiProvider;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\NullAiProvider;
use App\Services\Ai\OpenAiCompatibleProvider;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

beforeEach(function () {
    Http::preventStrayRequests();

    config()->set('ai.provider', 'openai_compatible');
    config()->set('ai.base_url', 'https://ai.example.test/v1');
    config()->set('ai.api_key', 'kunci-rahasia-ai-xyz');
    config()->set('ai.model', 'model-uji');
    config()->set('ai.timeout', 5);
    config()->set('ai.max_tokens', 256);
    config()->set('ai.temperature', 0.3);
    config()->set('ai.retry.max', 0);
    config()->set('ai.retry.delay_ms', 0);

    app()->forgetInstance(AiProvider::class);
});

function aiSuccess(string $content = 'Ringkasan uji.')
{
    return Http::response([
        'choices' => [['message' => ['role' => 'assistant', 'content' => $content]]],
    ]);
}

it('memilih NullAiProvider ketika provider tidak dikonfigurasi', function () {
    config()->set('ai.provider', null);
    app()->forgetInstance(AiProvider::class);

    $provider = app(AiProvider::class);

    expect($provider)->toBeInstanceOf(NullAiProvider::class)
        ->and($provider->isAvailable())->toBeFalse();

    expect(fn () => $provider->chat([['role' => 'user', 'content' => 'Halo']]))
        ->toThrow(AiUnavailableException::class);
    expect(fn () => $provider->summarize('Teks'))->toThrow(AiUnavailableException::class);
});

it('memilih OpenAiCompatibleProvider sesuai konfigurasi', function () {
    expect(app(AiProvider::class))
        ->toBeInstanceOf(OpenAiCompatibleProvider::class)
        ->and(app(AiProvider::class)->isAvailable())->toBeTrue();
});

it('mengirim request ke URL, header Bearer, dan body yang benar', function () {
    Http::fake(['https://ai.example.test/v1/chat/completions' => aiSuccess()]);

    app(AiProvider::class)->chat([
        ['role' => 'user', 'content' => 'Halo'],
    ]);

    Http::assertSent(function (Request $request) {
        expect($request->method())->toBe('POST')
            ->and($request->url())->toBe('https://ai.example.test/v1/chat/completions')
            ->and($request->hasHeader('Authorization', 'Bearer kunci-rahasia-ai-xyz'))->toBeTrue()
            ->and($request['model'])->toBe('model-uji')
            ->and($request['messages'])->toBe([['role' => 'user', 'content' => 'Halo']])
            ->and($request['max_tokens'])->toBe(256)
            ->and($request['temperature'])->toBe(0.3);

        return true;
    });
    Http::assertSentCount(1);
});

it('mengurai jawaban dari choices dan memakai prompt sistem berbahasa Indonesia untuk summarize', function () {
    Http::fake(['https://ai.example.test/v1/chat/completions' => aiSuccess('  Ringkasan akhir.  ')]);

    $provider = app(AiProvider::class);

    expect($provider->chat([['role' => 'user', 'content' => 'Halo']]))->toBe('Ringkasan akhir.');
    expect($provider->summarize('Teks panjang.'))->toBe('Ringkasan akhir.');

    Http::assertSent(function (Request $request) {
        $messages = $request['messages'];

        return $messages[0]['role'] === 'system'
            && str_contains($messages[0]['content'], 'bahasa Indonesia')
            && $messages[1]['content'] === 'Teks panjang.';
    });
});

it('mengubah timeout menjadi AiUnavailableException', function () {
    Http::fake([
        'https://ai.example.test/v1/chat/completions' => fn () => throw new ConnectionException('timeout'),
    ]);

    expect(fn () => app(AiProvider::class)->chat([['role' => 'user', 'content' => 'Halo']]))
        ->toThrow(AiUnavailableException::class);
});

it('mengulang 429 dan 5xx sesuai batas retry', function () {
    config()->set('ai.retry.max', 2);
    Http::fake([
        'https://ai.example.test/v1/chat/completions' => Http::sequence()
            ->pushStatus(429)
            ->pushStatus(503)
            ->push(['choices' => [['message' => ['content' => 'Oke']]]]),
    ]);

    expect(app(AiProvider::class)->chat([['role' => 'user', 'content' => 'Halo']]))
        ->toBe('Oke');
    Http::assertSentCount(3);
});

it('berhenti setelah batas retry dan melempar AiUnavailableException', function () {
    config()->set('ai.retry.max', 2);
    Http::fake([
        'https://ai.example.test/v1/chat/completions' => Http::response([], 500),
    ]);

    expect(fn () => app(AiProvider::class)->chat([['role' => 'user', 'content' => 'Halo']]))
        ->toThrow(AiUnavailableException::class);
    Http::assertSentCount(3);
});

it('tidak mengulang 4xx selain 429', function () {
    config()->set('ai.retry.max', 3);
    Http::fake(['https://ai.example.test/v1/chat/completions' => Http::response([], 401)]);

    expect(fn () => app(AiProvider::class)->chat([['role' => 'user', 'content' => 'Halo']]))
        ->toThrow(AiUnavailableException::class, 'status 401');
    Http::assertSentCount(1);
});

it('menolak JSON tidak valid dan choices kosong', function () {
    Http::fake(['https://ai.example.test/v1/chat/completions' => Http::response('bukan json', 200)]);

    expect(fn () => app(AiProvider::class)->chat([['role' => 'user', 'content' => 'Halo']]))
        ->toThrow(AiUnavailableException::class, 'Respons AI tidak valid');

    Http::fake(['https://ai.example.test/v1/chat/completions' => Http::response(['choices' => []], 200)]);

    expect(fn () => app(AiProvider::class)->chat([['role' => 'user', 'content' => 'Halo']]))
        ->toThrow(AiUnavailableException::class, 'Respons AI tidak valid');
});

it('tidak pernah membocorkan kunci API ke exception atau log', function () {
    $captured = [];
    Log::shouldReceive('warning')->andReturnUsing(
        function (string $message, array $context = []) use (&$captured): void {
            $captured[] = $message.' '.json_encode($context);
        },
    );

    Http::fake(['https://ai.example.test/v1/chat/completions' => Http::response([], 500)]);

    $error = null;

    try {
        app(AiProvider::class)->chat([['role' => 'user', 'content' => 'Kata sandi rahasia']]);
    } catch (AiUnavailableException $exception) {
        $error = $exception;
    }

    expect($error)->not->toBeNull()
        ->and($error->getMessage())->not->toContain('kunci-rahasia-ai-xyz')
        ->and($error->getMessage())->not->toContain('Kata sandi rahasia')
        ->and($captured)->not->toBeEmpty();

    foreach ($captured as $line) {
        expect($line)->not->toContain('kunci-rahasia-ai-xyz')
            ->and($line)->not->toContain('Kata sandi rahasia');
    }
});

it('ai:ping memakai fake dan tidak mengirim permintaan bila dibatalkan', function () {
    Http::fake(['https://ai.example.test/v1/chat/completions' => aiSuccess('pong')]);

    $this->artisan(AiPingCommand::class)
        ->expectsConfirmation(
            'Perintah ini memakai token penyedia AI untuk satu prompt singkat. Lanjutkan?',
            'no',
        )
        ->assertExitCode(0);

    Http::assertNothingSent();

    $this->artisan(AiPingCommand::class)
        ->expectsConfirmation(
            'Perintah ini memakai token penyedia AI untuk satu prompt singkat. Lanjutkan?',
            'yes',
        )
        ->expectsOutputToContain('pong')
        ->assertExitCode(0);

    Http::assertSentCount(1);
});

it('ai:ping gagal aman tanpa provider', function () {
    config()->set('ai.provider', null);
    app()->forgetInstance(AiProvider::class);

    $this->artisan(AiPingCommand::class)
        ->expectsOutputToContain('belum dikonfigurasi')
        ->assertExitCode(1);

    Http::assertNothingSent();
});

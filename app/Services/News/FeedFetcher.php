<?php

namespace App\Services\News;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class FeedFetcher
{
    private const MAX_REDIRECTS = 3;

    private const MAX_BYTES = 2 * 1024 * 1024;

    public function __construct(private readonly FeedParser $parser)
    {
        //
    }

    /**
     * @return array<int, array{title: string, url: string, excerpt: ?string, published_at: ?string}>
     */
    public function fetch(string $url, HostResolver $resolver): array
    {
        $current = $url;

        for ($redirect = 0; $redirect <= self::MAX_REDIRECTS; $redirect++) {
            $this->assertSafeTarget($current, $resolver);

            try {
                $response = Http::connectTimeout(5)
                    ->timeout(10)
                    ->withUserAgent('MyWorkspace/1.0')
                    ->withOptions(['allow_redirects' => false])
                    ->get($current);
            } catch (ConnectionException) {
                throw new FeedFetchException(null, 'Gagal terhubung ke sumber berita.');
            }

            $location = $response->header('Location');

            if ($response->redirect() && is_string($location) && $location !== '') {
                if ($redirect === self::MAX_REDIRECTS) {
                    throw new FeedFetchException(null, 'Terlalu banyak redirect.');
                }

                $current = $this->absoluteUrl($current, $location);

                continue;
            }

            if (! $response->successful()) {
                throw new FeedFetchException($response->status(), 'Sumber berita mengembalikan status gagal.');
            }

            if (strlen($response->body()) > self::MAX_BYTES) {
                throw new FeedFetchException(null, 'Respons sumber berita terlalu besar.');
            }

            return $this->parser->parse($response->body());
        }

        throw new FeedFetchException(null, 'Pengambilan sumber berita gagal.');
    }

    private function assertSafeTarget(string $url, HostResolver $resolver): void
    {
        if (! NetworkTarget::isSafeUrl($url)) {
            throw new FeedFetchException(null, 'URL sumber tidak aman.');
        }

        $host = (string) parse_url($url, PHP_URL_HOST);
        $addresses = $resolver->resolve($host);

        if ($addresses === []) {
            throw new FeedFetchException(null, 'Host sumber tidak dapat diresolusi.');
        }

        foreach ($addresses as $address) {
            if (NetworkTarget::isBlockedIp((string) $address)) {
                throw new FeedFetchException(null, 'Sumber mengarah ke alamat privat.');
            }
        }
    }

    private function absoluteUrl(string $base, string $location): string
    {
        if (str_starts_with($location, 'http://') || str_starts_with($location, 'https://')) {
            return $location;
        }

        $parts = parse_url($base);
        $scheme = $parts['scheme'] ?? 'https';
        $authority = $parts['host'] ?? '';

        if (isset($parts['port'])) {
            $authority .= ':'.$parts['port'];
        }

        if (str_starts_with($location, '/')) {
            return "{$scheme}://{$authority}{$location}";
        }

        $path = $parts['path'] ?? '/';
        $directory = rtrim(substr($path, 0, (int) strrpos($path, '/') + 1), '/');

        return "{$scheme}://{$authority}{$directory}/{$location}";
    }
}

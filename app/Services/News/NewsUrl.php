<?php

namespace App\Services\News;

class NewsUrl
{
    private const TRACKING_PARAMS = [
        'fbclid',
        'gclid',
        'dclid',
        'mc_cid',
        'mc_eid',
    ];

    public static function normalize(string $url): string
    {
        $parts = parse_url($url);

        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            return $url;
        }

        $scheme = strtolower($parts['scheme']);
        $host = strtolower($parts['host']);
        $path = $parts['path'] ?? '';

        if ($path !== '' && $path !== '/') {
            $path = rtrim($path, '/');
        }

        $normalized = "{$scheme}://{$host}";

        if (isset($parts['port'])) {
            $normalized .= ':'.$parts['port'];
        }

        $normalized .= $path !== '' ? $path : '/';

        $query = [];

        if (! empty($parts['query'])) {
            parse_str($parts['query'], $pairs);

            foreach ($pairs as $key => $value) {
                $lower = strtolower((string) $key);

                if (str_starts_with($lower, 'utm_') || in_array($lower, self::TRACKING_PARAMS, true)) {
                    continue;
                }

                $query[$key] = $value;
            }

            ksort($query);
        }

        if ($query !== []) {
            $normalized .= '?'.http_build_query($query);
        }

        return $normalized;
    }

    public static function hash(string $url): string
    {
        return hash('sha256', self::normalize($url));
    }
}

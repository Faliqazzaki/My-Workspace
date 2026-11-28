<?php

namespace App\Services\News;

class NetworkTarget
{
    public static function isSafeUrl(string $url): bool
    {
        $parts = parse_url($url);

        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            return false;
        }

        if (! in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower(rtrim((string) $parts['host'], '.'));

        if ($host === '' || $host === 'localhost' || str_ends_with($host, '.localhost')) {
            return false;
        }

        if (str_starts_with($host, '[') && str_ends_with($host, ']')) {
            $host = substr($host, 1, -1);
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return ! self::isBlockedIp($host);
        }

        return true;
    }

    public static function isBlockedIp(string $ip): bool
    {
        $ip = strtolower($ip);

        if (str_starts_with($ip, '::ffff:')) {
            $mapped = substr($ip, 7);

            return filter_var($mapped, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)
                ? self::isBlockedIp($mapped)
                : true;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            [$a, $b] = array_values(unpack('C4', inet_pton($ip)));

            return $a === 0
                || $a === 127
                || $a === 10
                || ($a === 100 && $b >= 64 && $b <= 127)
                || ($a === 169 && $b === 254)
                || ($a === 172 && $b >= 16 && $b <= 31)
                || ($a === 192 && $b === 168);
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $bytes = unpack('C16', inet_pton($ip));
            $first = $bytes[1];
            $second = $bytes[2];

            return $ip === '::1'
                || empty(array_filter($bytes))
                || ($first & 0xFE) === 0xFC
                || ($first === 0xFE && ($second & 0xC0) === 0x80);
        }

        return true;
    }
}

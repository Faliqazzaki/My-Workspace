<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

/**
 * Menolak URL dengan skema bukan http/https dan host literal lokal/privat.
 * Resolusi DNS sengaja tidak dilakukan di sini (NEWS-02).
 */
class SafeNewsUrl implements Rule
{
    public function passes($attribute, $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        $parts = parse_url($value);

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

        if (filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $this->isPublicIpv4($host);
        }

        if (filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return $this->isPublicIpv6($host);
        }

        return true;
    }

    public function message(): string
    {
        return 'URL harus memakai http/https dan tidak boleh mengarah ke host lokal atau privat.';
    }

    private function isPublicIpv4(string $host): bool
    {
        [$a, $b] = array_values(unpack('C4', inet_pton($host)));

        if ($a === 0 || $a === 127) {
            return false;
        }

        if ($a === 10 || $a === 192 && $b === 168) {
            return false;
        }

        if ($a === 172 && $b >= 16 && $b <= 31) {
            return false;
        }

        return ! ($a === 169 && $b === 254);
    }

    private function isPublicIpv6(string $host): bool
    {
        $bytes = unpack('C16', inet_pton($host));
        $first = $bytes[1];
        $second = $bytes[2];

        if ($host === '::1' || empty(array_filter($bytes))) {
            return false;
        }

        if (($first & 0xFE) === 0xFC) {
            return false;
        }

        return ! ($first === 0xFE && ($second & 0xC0) === 0x80);
    }
}

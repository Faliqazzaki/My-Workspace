<?php

namespace App\Services\News;

interface HostResolver
{
    /**
     * @return array<int, string> Daftar alamat IP (v4/v6) hasil resolusi host.
     */
    public function resolve(string $host): array;
}

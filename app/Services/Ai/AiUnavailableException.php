<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * Satu-satunya exception yang dilempar provider AI agar pemanggil bisa
 * melakukan fallback tanpa halaman rusak. Pesan exception tidak pernah
 * memuat kunci API, prompt, atau jawaban.
 */
class AiUnavailableException extends RuntimeException
{
    //
}

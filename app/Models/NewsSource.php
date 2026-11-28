<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsSource extends Model
{
    use HasFactory;

    public const TYPES = ['rss'];

    protected $fillable = [
        'name',
        'url',
        'type',
        'enabled',
        'last_fetched_at',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'last_fetched_at' => 'datetime',
        ];
    }

    public function articles(): HasMany
    {
        return $this->hasMany(NewsArticle::class);
    }
}

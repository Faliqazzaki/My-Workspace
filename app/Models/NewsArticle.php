<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsArticle extends Model
{
    use HasFactory;

    public const STATUSES = [
        'new',
        'summarized',
        'selected',
        'archived',
    ];

    protected $fillable = [
        'news_source_id',
        'title',
        'url',
        'url_hash',
        'excerpt',
        'content',
        'published_at',
        'summary',
        'summary_generated_at',
        'status',
        'selected_date',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'summary_generated_at' => 'datetime',
            'selected_date' => 'date',
            'metadata' => 'array',
        ];
    }

    public function newsSource(): BelongsTo
    {
        return $this->belongsTo(NewsSource::class);
    }
}

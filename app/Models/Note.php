<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Note extends Model
{
    protected $fillable = [
        'title',
        'content',
        'tags',
        'is_pinned',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'is_pinned' => 'boolean',
        ];
    }

    public function workItems(): BelongsToMany
    {
        return $this->belongsToMany(WorkItem::class)->withTimestamps();
    }
}

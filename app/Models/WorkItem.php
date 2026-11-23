<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class WorkItem extends Model
{
    public const STATUSES = ['backlog', 'todo', 'in_progress', 'done'];

    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'tags',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function notes(): BelongsToMany
    {
        return $this->belongsToMany(Note::class)->withTimestamps();
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}

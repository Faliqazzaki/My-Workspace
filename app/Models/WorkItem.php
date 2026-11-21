<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkItem extends Model
{
    public const STATUSES = ['backlog', 'todo', 'in_progress', 'done'];

    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    protected $fillable = [
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
}

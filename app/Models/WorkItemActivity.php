<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkItemActivity extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['work_item_id', 'type', 'changes'];

    protected function casts(): array
    {
        return ['changes' => 'array'];
    }

    public function workItem(): BelongsTo
    {
        return $this->belongsTo(WorkItem::class);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\WorkItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    private const LIMIT = 5;

    public function index(Request $request): JsonResponse
    {
        $term = trim($request->string('q')->toString());

        if ($term === '') {
            return response()->json([
                'notes' => [],
                'workItems' => [],
            ]);
        }

        $notes = Note::query()
            ->where(function ($query) use ($term) {
                $query
                    ->whereLike('title', "%{$term}%", caseSensitive: false)
                    ->orWhereLike('content', "%{$term}%", caseSensitive: false);
            })
            ->latest('updated_at')
            ->limit(self::LIMIT)
            ->get(['id', 'title', 'content', 'tags', 'updated_at'])
            ->map(fn (Note $note) => [
                'id' => $note->id,
                'title' => $note->title,
                'excerpt' => $this->excerpt($note->content),
                'tags' => $note->tags,
                'updated_at' => $note->updated_at,
            ]);

        $workItems = WorkItem::query()
            ->where(function ($query) use ($term) {
                $query
                    ->whereLike('title', "%{$term}%", caseSensitive: false)
                    ->orWhereLike('description', "%{$term}%", caseSensitive: false);
            })
            ->orderByRaw("CASE WHEN status = 'done' THEN 1 ELSE 0 END")
            ->latest('updated_at')
            ->limit(self::LIMIT)
            ->get(['id', 'title', 'description', 'status', 'priority', 'due_date'])
            ->map(fn (WorkItem $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'excerpt' => $this->excerpt($item->description),
                'status' => $item->status,
                'priority' => $item->priority,
                'due_date' => $item->due_date?->toDateString(),
            ]);

        return response()->json([
            'notes' => $notes,
            'workItems' => $workItems,
        ]);
    }

    private function excerpt(?string $content): string
    {
        $plain = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $content)));

        return Str::limit($plain, 90);
    }
}

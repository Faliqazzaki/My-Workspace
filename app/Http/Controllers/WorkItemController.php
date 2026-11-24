<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Project;
use App\Models\SavedView;
use App\Models\WorkItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkItemController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->string('q')->toString());
        $status = trim($request->string('status')->toString());
        $priority = trim($request->string('priority')->toString());
        $projectId = trim($request->string('project')->toString());
        $view = $request->string('view')->toString();
        $view = in_array($view, ['board', 'calendar'], true) ? $view : 'list';

        $baseQuery = WorkItem::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query
                        ->whereLike('title', "%{$search}%", caseSensitive: false)
                        ->orWhereLike('description', "%{$search}%", caseSensitive: false);
                });
            })
            ->when(
                in_array($priority, WorkItem::PRIORITIES, true),
                fn ($query) => $query->where('priority', $priority),
            )
            ->when(
                $projectId === 'none',
                fn ($query) => $query->whereNull('project_id'),
            )
            ->when(
                ctype_digit($projectId) && $projectId !== '0',
                fn ($query) => $query->where('project_id', (int) $projectId),
            );

        $counts = (clone $baseQuery)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $boardItems = $view === 'board'
            ? (clone $baseQuery)
                ->with([
                    'notes:id,title',
                    'project:id,name,color',
                    'subtasks:id,work_item_id,title,is_done,position',
                ])
                ->orderByRaw('due_date IS NULL')
                ->orderBy('due_date')
                ->latest('created_at')
                ->get()
            : [];

        $calendarItems = $view === 'calendar'
            ? (clone $baseQuery)
                ->with([
                    'notes:id,title',
                    'project:id,name,color',
                    'subtasks:id,work_item_id,title,is_done,position',
                ])
                ->whereNotNull('due_date')
                ->orderBy('due_date')
                ->orderByRaw("CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END")
                ->latest('created_at')
                ->get()
            : [];

        $workItems = $baseQuery
            ->with([
                'notes:id,title',
                'project:id,name,color',
                'subtasks:id,work_item_id,title,is_done,position',
            ])
            ->when(
                $view === 'list' && in_array($status, WorkItem::STATUSES, true),
                fn ($query) => $query->where('status', $status),
            )
            ->orderByRaw("CASE WHEN status = 'done' THEN 1 ELSE 0 END")
            ->orderByRaw('due_date IS NULL')
            ->orderBy('due_date')
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/work-items/index', [
            'workItems' => $workItems,
            'boardItems' => $boardItems,
            'calendarItems' => $calendarItems,
            'counts' => $counts,
            'filters' => [
                'q' => $search,
                'status' => $status,
                'priority' => $priority,
                'project' => $projectId,
                'view' => $view,
            ],
            'statuses' => WorkItem::STATUSES,
            'priorities' => WorkItem::PRIORITIES,
            'projects' => Project::query()
                ->orderByRaw('archived_at IS NOT NULL')
                ->orderBy('name')
                ->get(['id', 'name', 'color', 'archived_at']),
            'savedViews' => SavedView::query()
                ->orderBy('name')
                ->get(['id', 'name', 'filters']),
            'notes' => Note::query()
                ->orderByDesc('is_pinned')
                ->latest('updated_at')
                ->get(['id', 'title']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $noteIds = $data['notes'] ?? [];
        $subtasks = $data['subtasks'] ?? [];
        unset($data['notes'], $data['subtasks']);

        $workItem = WorkItem::create($data + [
            'completed_at' => $data['status'] === 'done' ? now() : null,
        ]);

        $workItem->notes()->sync($noteIds);
        $this->syncSubtasks($workItem, $subtasks);

        return redirect()
            ->route('admin.work-items.index')
            ->with('success', 'Pekerjaan berhasil ditambahkan.');
    }

    public function update(Request $request, WorkItem $workItem): RedirectResponse
    {
        $data = $this->validatedData($request);
        $noteIds = $data['notes'] ?? [];
        $hasSubtasks = array_key_exists('subtasks', $data);
        $subtasks = $data['subtasks'] ?? [];
        unset($data['notes'], $data['subtasks']);

        $workItem->update($data + [
            'completed_at' => $data['status'] === 'done'
                ? ($workItem->completed_at ?? now())
                : null,
        ]);

        $workItem->notes()->sync($noteIds);

        if ($hasSubtasks) {
            $this->syncSubtasks($workItem, $subtasks);
        }

        return redirect()
            ->route('admin.work-items.index')
            ->with('success', 'Pekerjaan berhasil diperbarui.');
    }

    public function updateStatus(Request $request, WorkItem $workItem): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(WorkItem::STATUSES)],
        ]);

        $workItem->update([
            'status' => $data['status'],
            'completed_at' => $data['status'] === 'done'
                ? ($workItem->completed_at ?? now())
                : null,
        ]);

        return back()->with('success', 'Status pekerjaan diperbarui.');
    }

    public function destroy(WorkItem $workItem): RedirectResponse
    {
        $workItem->delete();

        return back()->with('success', 'Pekerjaan berhasil dihapus.');
    }

    public function bulkStatus(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct', 'exists:work_items,id'],
            'status' => ['required', Rule::in(WorkItem::STATUSES)],
        ]);

        $workItems = WorkItem::query()
            ->whereIn('id', $data['ids'])
            ->get();

        foreach ($workItems as $workItem) {
            $workItem->update([
                'status' => $data['status'],
                'completed_at' => $data['status'] === 'done'
                    ? ($workItem->completed_at ?? now())
                    : null,
            ]);
        }

        return back()->with(
            'success',
            $workItems->count().' pekerjaan diperbarui.',
        );
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct', 'exists:work_items,id'],
        ]);

        $deleted = WorkItem::query()
            ->whereIn('id', $data['ids'])
            ->delete();

        return back()->with('success', $deleted.' pekerjaan dihapus.');
    }

    /**
     * @return array{project_id: int|null, title: string, description: string|null, status: string, priority: string, due_date: string|null, tags: array<int, string>, notes: array<int, int>, subtasks: array<int, array{id?: int|null, title: string, is_done?: bool}>}
     */
    private function validatedData(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(WorkItem::STATUSES)],
            'priority' => ['required', Rule::in(WorkItem::PRIORITIES)],
            'due_date' => ['nullable', 'date'],
            'tags' => ['nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:30'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'notes' => ['nullable', 'array', 'distinct'],
            'notes.*' => ['integer', 'exists:notes,id'],
            'subtasks' => ['nullable', 'array', 'max:50'],
            'subtasks.*.id' => ['nullable', 'integer'],
            'subtasks.*.title' => ['required', 'string', 'max:150'],
            'subtasks.*.is_done' => ['boolean'],
        ]);

        $data['description'] = $data['description'] ?? null;
        $data['due_date'] = $data['due_date'] ?? null;
        $data['project_id'] = $data['project_id'] ?? null;
        $data['notes'] = $data['notes'] ?? [];
        $data['tags'] = collect($data['tags'] ?? [])
            ->map(fn (string $tag) => trim($tag))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $data;
    }

    /**
     * Sinkronisasi subtask berdasarkan urutan array. ID yang tidak lagi ada
     * dihapus; baris baru dibuat; posisi mengikuti urutan kiriman.
     *
     * @param  array<int, array{id?: int|null, title: string, is_done?: bool}>  $rows
     */
    private function syncSubtasks(WorkItem $workItem, array $rows): void
    {
        $keptIds = [];
        $position = 0;

        foreach (array_values($rows) as $row) {
            $title = trim($row['title'] ?? '');

            if ($title === '') {
                continue;
            }

            $attributes = [
                'title' => $title,
                'is_done' => (bool) ($row['is_done'] ?? false),
                'position' => $position++,
            ];

            $id = $row['id'] ?? null;
            $subtask = $id
                ? $workItem->subtasks()->whereKey($id)->first()
                : null;

            if ($subtask) {
                $subtask->update($attributes);
            } else {
                $subtask = $workItem->subtasks()->create($attributes);
            }

            $keptIds[] = $subtask->id;
        }

        $workItem->subtasks()->whereNotIn('id', $keptIds)->delete();
    }
}

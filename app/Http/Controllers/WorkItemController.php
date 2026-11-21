<?php

namespace App\Http\Controllers;

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
            );

        $counts = (clone $baseQuery)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $workItems = $baseQuery
            ->when(
                in_array($status, WorkItem::STATUSES, true),
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
            'counts' => $counts,
            'filters' => [
                'q' => $search,
                'status' => $status,
                'priority' => $priority,
            ],
            'statuses' => WorkItem::STATUSES,
            'priorities' => WorkItem::PRIORITIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);

        WorkItem::create($data + [
            'completed_at' => $data['status'] === 'done' ? now() : null,
        ]);

        return redirect()
            ->route('admin.work-items.index')
            ->with('success', 'Pekerjaan berhasil ditambahkan.');
    }

    public function update(Request $request, WorkItem $workItem): RedirectResponse
    {
        $data = $this->validatedData($request);

        $workItem->update($data + [
            'completed_at' => $data['status'] === 'done'
                ? ($workItem->completed_at ?? now())
                : null,
        ]);

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

    /**
     * @return array{title: string, description: string|null, status: string, priority: string, due_date: string|null, tags: array<int, string>}
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
        ]);

        $data['description'] = $data['description'] ?? null;
        $data['due_date'] = $data['due_date'] ?? null;
        $data['tags'] = collect($data['tags'] ?? [])
            ->map(fn (string $tag) => trim($tag))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $data;
    }
}

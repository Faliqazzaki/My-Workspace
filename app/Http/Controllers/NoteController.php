<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\WorkItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->string('q')->toString());
        $activeTag = trim($request->string('tag')->toString());

        $notes = Note::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query
                        ->whereLike('title', "%{$search}%", caseSensitive: false)
                        ->orWhereLike('content', "%{$search}%", caseSensitive: false);
                });
            })
            ->when($activeTag !== '', fn ($query) => $query->whereJsonContains('tags', $activeTag))
            ->withCount('workItems')
            ->orderByDesc('is_pinned')
            ->latest('updated_at')
            ->paginate(12)
            ->withQueryString();

        $tags = Note::query()
            ->get(['tags'])
            ->pluck('tags')
            ->flatten()
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('admin/notes/index', [
            'notes' => $notes,
            'tags' => $tags,
            'filters' => [
                'q' => $search,
                'tag' => $activeTag,
            ],
        ]);
    }

    public function show(Note $note): Response
    {
        $note->load(['workItems:id,title,status,priority,due_date']);

        return Inertia::render('admin/notes/show', [
            'note' => $note,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Note::create($this->validatedData($request));

        return redirect()
            ->route('admin.notes.index')
            ->with('success', 'Catatan berhasil disimpan.');
    }

    public function update(Request $request, Note $note): RedirectResponse
    {
        $note->update($this->validatedData($request));

        return redirect()
            ->route('admin.notes.show', $note)
            ->with('success', 'Catatan berhasil diperbarui.');
    }

    public function detachWorkItem(Note $note, WorkItem $workItem): RedirectResponse
    {
        $note->workItems()->detach($workItem->id);

        return redirect()
            ->route('admin.notes.show', $note)
            ->with('success', 'Tautan pekerjaan dilepas.');
    }

    public function destroy(Note $note): RedirectResponse
    {
        $note->delete();

        return redirect()
            ->route('admin.notes.index')
            ->with('success', 'Catatan berhasil dihapus.');
    }

    public function togglePin(Note $note): RedirectResponse
    {
        $note->update(['is_pinned' => ! $note->is_pinned]);

        return redirect()
            ->route('admin.notes.index')
            ->with(
                'success',
                $note->is_pinned
                    ? 'Catatan disematkan.'
                    : 'Sematkan catatan dilepas.',
            );
    }

    /**
     * @return array{title: string, content: string, tags: array<int, string>, is_pinned: bool}
     */
    private function validatedData(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string'],
            'tags' => ['nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:30'],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);

        $data['tags'] = collect($data['tags'] ?? [])
            ->map(fn (string $tag) => trim($tag))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $data['is_pinned'] = $request->boolean('is_pinned');

        return $data;
    }
}

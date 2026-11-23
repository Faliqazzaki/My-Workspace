<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\WorkItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Palet warna proyek. UI memakai swatch, validasi tetap membatasi hex
     * yang dipakai agar konsisten dengan tampilan.
     */
    public const COLORS = [
        '#6366f1',
        '#0ea5e9',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#ec4899',
        '#8b5cf6',
        '#64748b',
    ];

    public function index(): Response
    {
        $projects = Project::query()
            ->withCount([
                'workItems',
                'workItems as done_work_items_count' => fn ($query) => $query->where('status', 'done'),
            ])
            ->orderByRaw('archived_at IS NOT NULL')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/projects/index', [
            'projects' => $projects,
            'colors' => self::COLORS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Project::create($this->validatedData($request));

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Proyek berhasil ditambahkan.');
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        $project->update($this->validatedData($request));

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Proyek berhasil diperbarui.');
    }

    public function toggleArchive(Project $project): RedirectResponse
    {
        $archived = $project->archived_at === null;

        $project->update([
            'archived_at' => $archived ? now() : null,
        ]);

        return back()->with(
            'success',
            $archived
                ? 'Proyek diarsipkan.'
                : 'Proyek dikembalikan dari arsip.',
        );
    }

    public function destroy(Project $project): RedirectResponse
    {
        // Pekerjaan tetap ada walau proyeknya dihapus. FK juga memakai
        // nullOnDelete, tetapi null-kan eksplisit agar perilakunya jelas.
        WorkItem::query()
            ->where('project_id', $project->id)
            ->update(['project_id' => null]);

        $project->delete();

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Proyek dihapus. Pekerjaannya tetap tersimpan.');
    }

    /**
     * @return array{name: string, description: string|null, color: string|null}
     */
    private function validatedData(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['nullable', 'string', Rule::in(self::COLORS)],
        ]);

        $data['description'] = $data['description'] ?? null;
        $data['color'] = $data['color'] ?? null;

        return $data;
    }
}

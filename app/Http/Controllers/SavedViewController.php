<?php

namespace App\Http\Controllers;

use App\Models\SavedView;
use App\Models\WorkItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SavedViewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'name' => trim($request->string('name')->toString()),
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:saved_views,name'],
            'filters' => ['nullable', 'array'],
            'filters.q' => ['nullable', 'string', 'max:150'],
            'filters.status' => ['nullable', Rule::in(WorkItem::STATUSES)],
            'filters.priority' => ['nullable', Rule::in(WorkItem::PRIORITIES)],
            'filters.project' => ['nullable', 'regex:/^(none|\d+)$/'],
            'filters.view' => ['nullable', Rule::in(['list', 'board', 'calendar'])],
        ]);

        SavedView::create([
            'name' => $data['name'],
            'filters' => $this->normalizedFilters($data['filters'] ?? []),
        ]);

        return back()->with('success', 'Tampilan berhasil disimpan.');
    }

    public function destroy(SavedView $view): RedirectResponse
    {
        $view->delete();

        return back()->with('success', 'Tampilan tersimpan dihapus.');
    }

    /**
     * Hanya simpan filter yang terisi; `view=list` dianggap default.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, string>
     */
    private function normalizedFilters(array $filters): array
    {
        $normalized = [];

        foreach (['q', 'status', 'priority', 'project', 'view'] as $key) {
            $value = trim((string) ($filters[$key] ?? ''));

            if ($value !== '') {
                $normalized[$key] = $value;
            }
        }

        if (($normalized['view'] ?? null) === 'list') {
            unset($normalized['view']);
        }

        return $normalized;
    }
}

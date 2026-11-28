<?php

namespace App\Http\Controllers;

use App\Models\NewsSource;
use App\Rules\SafeNewsUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewsSourceController extends Controller
{
    private const MAX_SOURCES = 20;

    public function index(): Response
    {
        $sources = NewsSource::query()
            ->withCount('articles')
            ->orderByDesc('enabled')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/news-sources', [
            'sources' => $sources,
            'maxSources' => self::MAX_SOURCES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);

        if (NewsSource::count() >= self::MAX_SOURCES) {
            throw ValidationException::withMessages([
                'name' => 'Maksimal 20 sumber berita.',
            ]);
        }

        NewsSource::create($data);

        return redirect()
            ->route('admin.news.sources.index')
            ->with('success', 'Sumber berita berhasil ditambahkan.');
    }

    public function update(Request $request, NewsSource $newsSource): RedirectResponse
    {
        $newsSource->update($this->validatedData($request, $newsSource));

        return redirect()
            ->route('admin.news.sources.index')
            ->with('success', 'Sumber berita berhasil diperbarui.');
    }

    public function toggle(NewsSource $newsSource): RedirectResponse
    {
        $enabled = ! $newsSource->enabled;

        $newsSource->update(['enabled' => $enabled]);

        return back()->with(
            'success',
            $enabled
                ? 'Sumber berita diaktifkan.'
                : 'Sumber berita dinonaktifkan.',
        );
    }

    public function destroy(NewsSource $newsSource): RedirectResponse
    {
        // FK juga memakai cascadeOnDelete; hapus eksplisit agar perilaku
        // konsisten walau foreign key SQLite tidak aktif.
        $newsSource->articles()->delete();
        $newsSource->delete();

        return redirect()
            ->route('admin.news.sources.index')
            ->with('success', 'Sumber berita dan artikelnya dihapus.');
    }

    /**
     * @return array{name: string, url: string, type: string, enabled: bool}
     */
    private function validatedData(Request $request, ?NewsSource $source = null): array
    {
        $unique = Rule::unique('news_sources', 'url');

        if ($source !== null) {
            $unique->ignore($source->id);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'url' => [
                'required',
                'string',
                'max:2048',
                'url',
                $unique,
                new SafeNewsUrl,
            ],
            'type' => ['required', Rule::in(NewsSource::TYPES)],
            'enabled' => ['nullable', 'boolean'],
        ]);

        $data['enabled'] = array_key_exists('enabled', $data)
            ? (bool) $data['enabled']
            : (bool) ($source?->enabled ?? true);

        return $data;
    }
}

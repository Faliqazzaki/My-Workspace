<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Project;
use App\Models\WorkItem;
use App\Models\WorkItemSubtask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

class AdminDataController extends Controller
{
    private const MAX_IMPORT_ITEMS = 5000;

    public function index(): Response
    {
        return Inertia::render('admin/data', [
            'counts' => [
                'notes' => Note::count(),
                'archivedNotes' => Note::onlyTrashed()->count(),
                'workItems' => WorkItem::count(),
                'projects' => Project::count(),
            ],
            'maxUploadKb' => 2048,
        ]);
    }

    public function exportJson(Request $request): JsonResponse
    {
        $includeArchived = $request->boolean('archived');

        $projects = Project::query()->orderBy('id')->get();
        $notes = Note::query()
            ->when($includeArchived, fn ($query) => $query->withTrashed())
            ->orderBy('id')
            ->get();
        $workItems = WorkItem::query()
            ->with(['subtasks'])
            ->orderBy('id')
            ->get();

        $payload = [
            'format' => 'my-workspace-export',
            'version' => 1,
            'exported_at' => now()->toIso8601String(),
            'projects' => $projects->map(fn (Project $project) => [
                'key' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'color' => $project->color,
                'archived_at' => $project->archived_at?->toIso8601String(),
            ])->values(),
            'notes' => $notes->map(fn (Note $note) => [
                'title' => $note->title,
                'content' => $note->content,
                'tags' => $note->tags ?? [],
                'is_pinned' => $note->is_pinned,
                'archived_at' => $note->deleted_at?->toIso8601String(),
            ])->values(),
            'work_items' => $workItems->map(fn (WorkItem $workItem) => [
                'title' => $workItem->title,
                'description' => $workItem->description,
                'status' => $workItem->status,
                'priority' => $workItem->priority,
                'due_date' => $workItem->due_date?->toDateString(),
                'tags' => $workItem->tags ?? [],
                'completed_at' => $workItem->completed_at?->toIso8601String(),
                'project_key' => $workItem->project_id,
                'subtasks' => $workItem->subtasks->map(fn (WorkItemSubtask $subtask) => [
                    'title' => $subtask->title,
                    'is_done' => $subtask->is_done,
                    'position' => $subtask->position,
                ])->values(),
            ])->values(),
        ];

        return response()->json(
            $payload,
            200,
            [
                'Content-Disposition' => 'attachment; filename="my-workspace-'.now()->format('Ymd-His').'.json"',
            ],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        );
    }

    public function exportMarkdown(): BinaryFileResponse
    {
        $notes = Note::query()->orderBy('id')->get();

        $path = tempnam(sys_get_temp_dir(), 'my-workspace-notes-');
        $zip = new ZipArchive;

        if ($zip->open($path, ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Gagal membuat arsip Markdown.');
        }

        foreach ($notes as $index => $note) {
            $slug = Str::slug($note->title) ?: 'catatan';
            $filename = sprintf('%03d-%s.md', $index + 1, $slug);
            $meta = [];

            if ($note->is_pinned) {
                $meta[] = 'Disematkan';
            }

            if (! empty($note->tags)) {
                $meta[] = 'Tag: '.implode(', ', $note->tags);
            }

            $body = '# '.$note->title."\n\n";

            if ($meta !== []) {
                $body .= implode("  \n", $meta)."\n\n";
            }

            $body .= $note->content."\n";

            $zip->addFromString($filename, $body);
        }

        $zip->close();

        return response()
            ->download(
                $path,
                'my-workspace-notes-'.now()->format('Ymd-His').'.zip',
            )
            ->deleteFileAfterSend(true);
    }

    public function importPreview(Request $request): JsonResponse
    {
        $payload = $this->validatedImportPayload($request);

        return response()->json([
            'summary' => $this->importPayload($payload, commit: false),
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $payload = $this->validatedImportPayload($request);

        $summary = DB::transaction(
            fn () => $this->importPayload($payload, commit: true),
        );

        return response()->json(['summary' => $summary]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedImportPayload(Request $request): array
    {
        $request->validate([
            'file' => ['required', 'file', 'max:2048', 'extensions:json'],
        ], [
            'file.required' => 'Pilih file JSON terlebih dahulu.',
            'file.max' => 'Ukuran file maksimal 2 MB.',
            'file.extensions' => 'File harus berekstensi .json.',
        ]);

        try {
            $payload = json_decode(
                $request->file('file')->get(),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
        } catch (\JsonException) {
            throw ValidationException::withMessages([
                'file' => 'Isi file bukan JSON yang valid.',
            ]);
        }

        if (! is_array($payload)) {
            throw ValidationException::withMessages([
                'file' => 'Isi file JSON harus berupa objek.',
            ]);
        }

        $validator = Validator::make($payload, [
            'format' => ['required', 'string', Rule::in(['my-workspace-export'])],
            'version' => ['required', 'integer', Rule::in([1])],
            'projects' => ['present', 'array', 'max:500'],
            'projects.*.key' => ['required', 'integer'],
            'projects.*.name' => ['required', 'string', 'max:100'],
            'projects.*.description' => ['nullable', 'string', 'max:5000'],
            'projects.*.color' => ['nullable', 'string', 'max:20', Rule::in(ProjectController::COLORS)],
            'projects.*.archived_at' => ['nullable', 'date'],
            'notes' => ['present', 'array', 'max:2000'],
            'notes.*.title' => ['required', 'string', 'max:150'],
            'notes.*.content' => ['required', 'string', 'max:100000'],
            'notes.*.tags' => ['nullable', 'array', 'max:10'],
            'notes.*.tags.*' => ['string', 'max:30'],
            'notes.*.is_pinned' => ['boolean'],
            'notes.*.archived_at' => ['nullable', 'date'],
            'work_items' => ['present', 'array', 'max:2000'],
            'work_items.*.title' => ['required', 'string', 'max:150'],
            'work_items.*.description' => ['nullable', 'string', 'max:100000'],
            'work_items.*.status' => ['required', Rule::in(WorkItem::STATUSES)],
            'work_items.*.priority' => ['required', Rule::in(WorkItem::PRIORITIES)],
            'work_items.*.due_date' => ['nullable', 'date'],
            'work_items.*.tags' => ['nullable', 'array', 'max:10'],
            'work_items.*.tags.*' => ['string', 'max:30'],
            'work_items.*.completed_at' => ['nullable', 'date'],
            'work_items.*.project_key' => ['nullable', 'integer'],
            'work_items.*.subtasks' => ['nullable', 'array', 'max:50'],
            'work_items.*.subtasks.*.title' => ['required', 'string', 'max:150'],
            'work_items.*.subtasks.*.is_done' => ['boolean'],
            'work_items.*.subtasks.*.position' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                'file' => 'Struktur file tidak valid: '.$validator->errors()->first(),
            ]);
        }

        $totalItems = count($payload['projects'])
            + count($payload['notes'])
            + count($payload['work_items']);

        if ($totalItems > self::MAX_IMPORT_ITEMS) {
            throw ValidationException::withMessages([
                'file' => 'Jumlah item melebihi batas '.self::MAX_IMPORT_ITEMS.'.',
            ]);
        }

        $projectKeys = collect($payload['projects'])
            ->pluck('key')
            ->map(fn ($key) => (int) $key);

        if ($projectKeys->count() !== $projectKeys->unique()->count()) {
            throw ValidationException::withMessages([
                'file' => 'Kunci proyek pada file harus unik.',
            ]);
        }

        foreach ($payload['work_items'] as $workItem) {
            $projectKey = $workItem['project_key'] ?? null;

            if ($projectKey !== null && ! $projectKeys->contains((int) $projectKey)) {
                throw ValidationException::withMessages([
                    'file' => 'Ada pekerjaan yang merujuk proyek yang tidak ada di file.',
                ]);
            }
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, array{total: int, new: int, skipped: int}>
     */
    private function importPayload(array $payload, bool $commit): array
    {
        $summary = [
            'projects' => ['total' => count($payload['projects']), 'new' => 0, 'skipped' => 0],
            'notes' => ['total' => count($payload['notes']), 'new' => 0, 'skipped' => 0],
            'work_items' => ['total' => count($payload['work_items']), 'new' => 0, 'skipped' => 0],
            'subtasks' => ['total' => 0, 'new' => 0, 'skipped' => 0],
        ];

        $existingProjects = Project::query()
            ->get()
            ->keyBy(fn (Project $project) => $this->normalizeProjectName($project->name));
        $projectIdsByKey = [];
        $projectNamesByKey = [];
        $seenProjectNames = [];

        foreach ($payload['projects'] as $project) {
            $key = (int) $project['key'];
            $name = trim($project['name']);
            $normalized = $this->normalizeProjectName($name);
            $projectNamesByKey[$key] = $name;
            $existing = $existingProjects->get($normalized);

            if ($existing) {
                $projectIdsByKey[$key] = $existing->id;
                $summary['projects']['skipped']++;

                continue;
            }

            if (isset($seenProjectNames[$normalized])) {
                $summary['projects']['skipped']++;

                continue;
            }

            $seenProjectNames[$normalized] = true;
            $summary['projects']['new']++;

            if ($commit) {
                $created = Project::create([
                    'name' => $name,
                    'description' => $project['description'] ?? null,
                    'color' => $project['color'] ?? null,
                    'archived_at' => $project['archived_at'] ?? null,
                ]);
                $existingProjects->put($normalized, $created);
                $projectIdsByKey[$key] = $created->id;
            }
        }

        $existingNoteKeys = Note::query()
            ->withTrashed()
            ->get(['title', 'content'])
            ->mapWithKeys(fn (Note $note) => [
                $this->noteKey($note->title, $note->content) => true,
            ])
            ->all();
        $seenNoteKeys = [];

        foreach ($payload['notes'] as $note) {
            $key = $this->noteKey($note['title'], $note['content']);

            if (isset($existingNoteKeys[$key]) || isset($seenNoteKeys[$key])) {
                $summary['notes']['skipped']++;

                continue;
            }

            $seenNoteKeys[$key] = true;
            $summary['notes']['new']++;

            if ($commit) {
                $created = Note::create([
                    'title' => trim($note['title']),
                    'content' => $note['content'],
                    'tags' => $this->normalizeTags($note['tags'] ?? []),
                    'is_pinned' => (bool) ($note['is_pinned'] ?? false),
                ]);

                if (! empty($note['archived_at'])) {
                    $created->deleted_at = Carbon::parse($note['archived_at']);
                    $created->save();
                }
            }
        }

        $existingWorkItemKeys = WorkItem::query()
            ->with('project:id,name')
            ->get(['id', 'title', 'due_date', 'project_id'])
            ->mapWithKeys(fn (WorkItem $workItem) => [
                $this->workItemKey(
                    $workItem->title,
                    $workItem->due_date?->toDateString(),
                    $workItem->project?->name,
                ) => true,
            ])
            ->all();
        $seenWorkItemKeys = [];

        foreach ($payload['work_items'] as $workItem) {
            $subtasks = $workItem['subtasks'] ?? [];
            $summary['subtasks']['total'] += count($subtasks);

            $projectKey = $workItem['project_key'] ?? null;
            $projectName = $projectKey !== null
                ? ($projectNamesByKey[(int) $projectKey] ?? null)
                : null;
            $dueDate = ! empty($workItem['due_date'])
                ? Carbon::parse($workItem['due_date'])->toDateString()
                : null;
            $key = $this->workItemKey(
                $workItem['title'],
                $dueDate,
                $projectName,
            );

            if (isset($existingWorkItemKeys[$key]) || isset($seenWorkItemKeys[$key])) {
                $summary['work_items']['skipped']++;
                $summary['subtasks']['skipped'] += count($subtasks);

                continue;
            }

            $seenWorkItemKeys[$key] = true;
            $summary['work_items']['new']++;
            $summary['subtasks']['new'] += count($subtasks);

            if (! $commit) {
                continue;
            }

            $projectId = $projectKey !== null
                ? ($projectIdsByKey[(int) $projectKey] ?? null)
                : null;
            $completedAt = $workItem['status'] === 'done'
                ? (! empty($workItem['completed_at'])
                    ? Carbon::parse($workItem['completed_at'])
                    : now())
                : null;

            $created = WorkItem::create([
                'project_id' => $projectId,
                'title' => trim($workItem['title']),
                'description' => $workItem['description'] ?? null,
                'status' => $workItem['status'],
                'priority' => $workItem['priority'],
                'due_date' => $dueDate,
                'tags' => $this->normalizeTags($workItem['tags'] ?? []),
                'completed_at' => $completedAt,
            ]);

            foreach (array_values($subtasks) as $index => $subtask) {
                WorkItemSubtask::create([
                    'work_item_id' => $created->id,
                    'title' => trim($subtask['title']),
                    'is_done' => (bool) ($subtask['is_done'] ?? false),
                    'position' => $subtask['position'] ?? $index,
                ]);
            }
        }

        return $summary;
    }

    /**
     * @param  array<int, string>  $tags
     * @return array<int, string>
     */
    private function normalizeTags(array $tags): array
    {
        return collect($tags)
            ->map(fn (string $tag) => trim($tag))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function normalizeProjectName(string $name): string
    {
        return mb_strtolower(trim($name));
    }

    private function noteKey(string $title, string $content): string
    {
        return hash('sha256', trim($title)."\0".$content);
    }

    private function workItemKey(
        string $title,
        ?string $dueDate,
        ?string $projectName,
    ): string {
        return hash('sha256', implode("\0", [
            trim($title),
            $dueDate ?? '',
            $this->normalizeProjectName($projectName ?? ''),
        ]));
    }
}

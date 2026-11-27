<?php

use App\Models\Note;
use App\Models\Project;
use App\Models\WorkItem;
use Illuminate\Http\UploadedFile;

function validImportPayload(): array
{
    return [
        'format' => 'my-workspace-export',
        'version' => 1,
        'exported_at' => now()->toIso8601String(),
        'projects' => [
            [
                'key' => 10,
                'name' => 'Proyek Import',
                'description' => 'Proyek dari file export.',
                'color' => '#6366f1',
                'archived_at' => null,
            ],
        ],
        'notes' => [
            [
                'title' => 'Catatan Import',
                'content' => 'Isi catatan import.',
                'tags' => ['import', 'baru'],
                'is_pinned' => true,
                'archived_at' => null,
            ],
            [
                'title' => 'Catatan Arsip Import',
                'content' => 'Isi catatan arsip.',
                'tags' => [],
                'is_pinned' => false,
                'archived_at' => '2026-01-01T00:00:00+00:00',
            ],
        ],
        'work_items' => [
            [
                'title' => 'Pekerjaan Import',
                'description' => 'Pekerjaan dari file export.',
                'status' => 'todo',
                'priority' => 'high',
                'due_date' => '2026-12-01',
                'tags' => ['import'],
                'completed_at' => null,
                'project_key' => 10,
                'subtasks' => [
                    [
                        'title' => 'Subtask import',
                        'is_done' => false,
                        'position' => 0,
                    ],
                ],
            ],
        ],
    ];
}

function importFile(array $payload): UploadedFile
{
    return UploadedFile::fake()->createWithContent(
        'export.json',
        json_encode($payload, JSON_THROW_ON_ERROR),
    );
}

it('mengalihkan tamu dari halaman data dan endpoint export/import', function () {
    $this->get('/admin/data')->assertRedirect(route('home'));
    $this->get('/admin/data/export/json')->assertRedirect(route('home'));
    $this->get('/admin/data/export/markdown')->assertRedirect(route('home'));
    $this->post('/admin/data/import/preview')->assertRedirect(route('home'));
    $this->post('/admin/data/import')->assertRedirect(route('home'));
});

it('mengekspor catatan, pekerjaan, subtask, dan proyek sebagai JSON', function () {
    $project = Project::create([
        'name' => 'Proyek Export',
        'description' => 'Deskripsi proyek.',
        'color' => '#6366f1',
    ]);

    Note::create([
        'title' => 'Catatan export',
        'content' => 'Isi catatan export.',
        'tags' => ['laravel'],
        'is_pinned' => true,
    ]);

    $workItem = WorkItem::create([
        'project_id' => $project->id,
        'title' => 'Pekerjaan export',
        'description' => 'Deskripsi pekerjaan.',
        'status' => 'in_progress',
        'priority' => 'urgent',
        'due_date' => '2026-12-01',
        'tags' => ['penting'],
    ]);

    $workItem->subtasks()->create([
        'title' => 'Subtask export',
        'is_done' => true,
        'position' => 0,
    ]);

    $response = $this->actingAs(adminUser())
        ->get('/admin/data/export/json')
        ->assertOk()
        ->assertDownload();

    $payload = $response->json();

    expect($payload['format'])->toBe('my-workspace-export')
        ->and($payload['version'])->toBe(1)
        ->and($payload['projects'])->toHaveCount(1)
        ->and($payload['projects'][0]['name'])->toBe('Proyek Export')
        ->and($payload['notes'])->toHaveCount(1)
        ->and($payload['notes'][0]['title'])->toBe('Catatan export')
        ->and($payload['notes'][0]['tags'])->toBe(['laravel'])
        ->and($payload['notes'][0]['is_pinned'])->toBeTrue()
        ->and($payload['work_items'])->toHaveCount(1)
        ->and($payload['work_items'][0]['title'])->toBe('Pekerjaan export')
        ->and($payload['work_items'][0]['project_key'])->toBe($project->id)
        ->and($payload['work_items'][0]['due_date'])->toBe('2026-12-01')
        ->and($payload['work_items'][0]['subtasks'][0]['title'])->toBe('Subtask export')
        ->and($payload['work_items'][0]['subtasks'][0]['is_done'])->toBeTrue();
});

it('menyertakan catatan terarsip hanya saat diminta', function () {
    Note::create([
        'title' => 'Catatan aktif',
        'content' => 'Isi aktif.',
    ]);

    $archived = Note::create([
        'title' => 'Catatan arsip',
        'content' => 'Isi arsip.',
    ]);
    $archived->delete();

    $default = $this->actingAs(adminUser())
        ->get('/admin/data/export/json')
        ->assertOk();

    $withArchived = $this->actingAs(adminUser())
        ->get('/admin/data/export/json?archived=1')
        ->assertOk();

    expect($default->json('notes'))->toHaveCount(1)
        ->and($withArchived->json('notes'))->toHaveCount(2)
        ->and(collect($withArchived->json('notes'))->firstWhere('title', 'Catatan arsip')['archived_at'])->not->toBeNull();
});

it('tidak mengekspor data pengguna atau kredensial', function () {
    $admin = adminUser(['email' => 'rahasia@example.com']);

    Note::create([
        'title' => 'Catatan aman',
        'content' => 'Tidak ada data sensitif.',
    ]);

    $response = $this->actingAs($admin)
        ->get('/admin/data/export/json')
        ->assertOk();

    $body = $response->getContent();
    $payload = $response->json();

    expect($body)->not->toContain($admin->email)
        ->not->toContain('remember_token')
        ->not->toContain('password')
        ->not->toContain('users')
        ->and(array_keys($payload))->toBe([
            'format',
            'version',
            'exported_at',
            'projects',
            'notes',
            'work_items',
        ]);
});

it('mengekspor catatan sebagai file Markdown dalam zip', function () {
    Note::create([
        'title' => 'Catatan Markdown',
        'content' => 'Isi markdown.',
        'tags' => ['export'],
        'is_pinned' => true,
    ]);

    $response = $this->actingAs(adminUser())
        ->get('/admin/data/export/markdown')
        ->assertOk()
        ->assertDownload();

    $zip = new ZipArchive;
    $path = tempnam(sys_get_temp_dir(), 'zip-test-');
    file_put_contents($path, $response->streamedContent());

    expect($zip->open($path))->toBeTrue()
        ->and($zip->numFiles)->toBe(1);

    $content = $zip->getFromIndex(0);

    expect($content)->toContain('# Catatan Markdown')
        ->toContain('Tag: export')
        ->toContain('Isi markdown.');

    $zip->close();
    unlink($path);
});

it('menampilkan ringkasan lalu mengimpor data valid tanpa menimpa data lama', function () {
    $payload = validImportPayload();

    $preview = $this->actingAs(adminUser())
        ->post('/admin/data/import/preview', ['file' => importFile($payload)], [
            'Accept' => 'application/json',
        ])
        ->assertOk()
        ->assertJsonPath('summary.projects.new', 1)
        ->assertJsonPath('summary.notes.new', 2)
        ->assertJsonPath('summary.work_items.new', 1)
        ->assertJsonPath('summary.subtasks.new', 1);

    expect($preview->json('summary.projects.total'))->toBe(1)
        ->and(Note::withTrashed()->count())->toBe(0)
        ->and(Project::count())->toBe(0);

    $imported = $this->actingAs(adminUser())
        ->post('/admin/data/import', ['file' => importFile($payload)], [
            'Accept' => 'application/json',
        ])
        ->assertOk()
        ->assertJsonPath('summary.notes.new', 2);

    $project = Project::firstOrFail();
    $workItem = WorkItem::firstOrFail();

    expect($imported->json('summary.projects.new'))->toBe(1)
        ->and(Note::count())->toBe(1)
        ->and(Note::withTrashed()->count())->toBe(2)
        ->and(Note::onlyTrashed()->firstOrFail()->title)->toBe('Catatan Arsip Import')
        ->and($workItem->project_id)->toBe($project->id)
        ->and($workItem->due_date->toDateString())->toBe('2026-12-01')
        ->and($workItem->subtasks()->count())->toBe(1);

    $again = $this->actingAs(adminUser())
        ->post('/admin/data/import', ['file' => importFile($payload)], [
            'Accept' => 'application/json',
        ])
        ->assertOk()
        ->assertJsonPath('summary.projects.new', 0)
        ->assertJsonPath('summary.projects.skipped', 1)
        ->assertJsonPath('summary.notes.new', 0)
        ->assertJsonPath('summary.notes.skipped', 2)
        ->assertJsonPath('summary.work_items.new', 0)
        ->assertJsonPath('summary.work_items.skipped', 1);

    expect($again->json('summary.subtasks.skipped'))->toBe(1)
        ->and(Note::withTrashed()->count())->toBe(2)
        ->and(Project::count())->toBe(1)
        ->and(WorkItem::count())->toBe(1);
});

it('menolak file import yang tidak valid', function () {
    $this->actingAs(adminUser())
        ->post('/admin/data/import/preview', [
            'file' => UploadedFile::fake()->createWithContent(
                'export.json',
                'bukan json',
            ),
        ], ['Accept' => 'application/json'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('file');

    $wrongFormat = validImportPayload();
    $wrongFormat['format'] = 'format-lain';

    $this->actingAs(adminUser())
        ->post('/admin/data/import', [
            'file' => importFile($wrongFormat),
        ], ['Accept' => 'application/json'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('file');

    $invalidStatus = validImportPayload();
    $invalidStatus['work_items'][0]['status'] = 'status-lain';

    $this->actingAs(adminUser())
        ->post('/admin/data/import', [
            'file' => importFile($invalidStatus),
        ], ['Accept' => 'application/json'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('file');

    $unknownProject = validImportPayload();
    $unknownProject['work_items'][0]['project_key'] = 999;

    $this->actingAs(adminUser())
        ->post('/admin/data/import', [
            'file' => importFile($unknownProject),
        ], ['Accept' => 'application/json'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('file');

    expect(Note::withTrashed()->count())->toBe(0)
        ->and(WorkItem::count())->toBe(0)
        ->and(Project::count())->toBe(0);
});

it('menolak file import yang melebihi batas ukuran', function () {
    $file = UploadedFile::fake()->createWithContent(
        'besar.json',
        str_repeat('a', (2 * 1024 * 1024) + 1),
    );

    $this->actingAs(adminUser())
        ->post('/admin/data/import/preview', ['file' => $file], [
            'Accept' => 'application/json',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('file');
});

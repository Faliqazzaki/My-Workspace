<?php

use App\Models\Note;
use App\Models\Project;
use App\Models\WorkItem;
use Inertia\Testing\AssertableInertia as Assert;

it('mengalihkan tamu dari halaman pekerjaan', function () {
    $this->get('/admin/work-items')->assertRedirect(route('home'));
});

it('menampilkan halaman pekerjaan untuk admin', function () {
    WorkItem::create([
        'title' => 'Rancang skema agent',
        'description' => 'Tentukan tabel dan alur eksekusi.',
        'status' => 'todo',
        'priority' => 'high',
        'tags' => ['ai'],
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/work-items')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/work-items/index')
            ->has('workItems.data', 1)
            ->where('workItems.data.0.title', 'Rancang skema agent')
            ->where('counts.todo', 1)
            ->where('filters.view', 'list')
        );
});

it('menyimpan pekerjaan baru beserta tag', function () {
    $this->actingAs(adminUser())
        ->post('/admin/work-items', [
            'title' => 'Bangun halaman pekerjaan',
            'description' => 'List, filter, dan CRUD.',
            'status' => 'in_progress',
            'priority' => 'medium',
            'due_date' => '2026-12-01',
            'tags' => ['laravel', 'react', 'laravel'],
        ])
        ->assertRedirect(route('admin.work-items.index'));

    $workItem = WorkItem::firstOrFail();

    expect($workItem->title)->toBe('Bangun halaman pekerjaan')
        ->and($workItem->status)->toBe('in_progress')
        ->and($workItem->priority)->toBe('medium')
        ->and($workItem->tags)->toBe(['laravel', 'react'])
        ->and($workItem->completed_at)->toBeNull()
        ->and($workItem->due_date->toDateString())->toBe('2026-12-01');
});

it('menandai pekerjaan selesai saat dibuat dengan status done', function () {
    $this->actingAs(adminUser())
        ->post('/admin/work-items', [
            'title' => 'Tugas selesai',
            'status' => 'done',
            'priority' => 'low',
        ])
        ->assertRedirect(route('admin.work-items.index'));

    expect(WorkItem::firstOrFail()->completed_at)->not->toBeNull();
});

it('memvalidasi judul, status, dan prioritas', function () {
    $this->actingAs(adminUser())
        ->post('/admin/work-items', [
            'title' => '',
            'status' => 'invalid',
            'priority' => 'invalid',
        ])
        ->assertSessionHasErrors(['title', 'status', 'priority']);

    expect(WorkItem::count())->toBe(0);
});

it('memperbarui pekerjaan', function () {
    $workItem = WorkItem::create([
        'title' => 'Judul lama',
        'status' => 'todo',
        'priority' => 'low',
        'tags' => ['lama'],
    ]);

    $this->actingAs(adminUser())
        ->put("/admin/work-items/{$workItem->id}", [
            'title' => 'Judul baru',
            'description' => 'Deskripsi baru.',
            'status' => 'done',
            'priority' => 'urgent',
            'due_date' => '2026-12-05',
            'tags' => ['baru'],
        ])
        ->assertRedirect(route('admin.work-items.index'));

    $fresh = $workItem->fresh();

    expect($fresh->title)->toBe('Judul baru')
        ->and($fresh->status)->toBe('done')
        ->and($fresh->priority)->toBe('urgent')
        ->and($fresh->tags)->toBe(['baru'])
        ->and($fresh->completed_at)->not->toBeNull();
});

it('mengubah status dengan cepat dan mengatur completed_at', function () {
    $workItem = WorkItem::create([
        'title' => 'Ubah status',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->from('/admin/work-items')
        ->patch("/admin/work-items/{$workItem->id}/status", [
            'status' => 'done',
        ])
        ->assertRedirect('/admin/work-items');

    expect($workItem->fresh()->status)->toBe('done')
        ->and($workItem->fresh()->completed_at)->not->toBeNull();

    $this->actingAs(adminUser())
        ->from('/admin/work-items')
        ->patch("/admin/work-items/{$workItem->id}/status", [
            'status' => 'todo',
        ]);

    expect($workItem->fresh()->status)->toBe('todo')
        ->and($workItem->fresh()->completed_at)->toBeNull();
});

it('menghapus pekerjaan', function () {
    $workItem = WorkItem::create([
        'title' => 'Akan dihapus',
        'status' => 'backlog',
        'priority' => 'low',
    ]);

    $this->actingAs(adminUser())
        ->from('/admin/work-items')
        ->delete("/admin/work-items/{$workItem->id}")
        ->assertRedirect('/admin/work-items');

    expect(WorkItem::count())->toBe(0);
});

it('mencari dan menyaring pekerjaan', function () {
    WorkItem::create([
        'title' => 'Rancang multi agent',
        'status' => 'todo',
        'priority' => 'high',
        'tags' => ['ai'],
    ]);

    WorkItem::create([
        'title' => 'Buat catatan',
        'status' => 'backlog',
        'priority' => 'low',
        'tags' => ['notes'],
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/work-items?q=agent')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('workItems.data', 1)
            ->where('workItems.data.0.title', 'Rancang multi agent')
        );

    $this->actingAs(adminUser())
        ->get('/admin/work-items?status=backlog')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('workItems.data', 1)
            ->where('workItems.data.0.title', 'Buat catatan')
        );

    $this->actingAs(adminUser())
        ->get('/admin/work-items?priority=high')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('workItems.data', 1)
            ->where('workItems.data.0.title', 'Rancang multi agent')
        );
});

it('menautkan catatan saat menyimpan pekerjaan', function () {
    $first = Note::create([
        'title' => 'Riset PostgreSQL',
        'content' => 'Catatan pendukung.',
        'tags' => [],
    ]);

    $second = Note::create([
        'title' => 'Panduan Inertia',
        'content' => 'Catatan pendukung lainnya.',
        'tags' => [],
    ]);

    $this->actingAs(adminUser())
        ->post('/admin/work-items', [
            'title' => 'Implementasi tautan catatan',
            'status' => 'todo',
            'priority' => 'medium',
            'notes' => [$first->id, $second->id],
        ])
        ->assertRedirect(route('admin.work-items.index'));

    $workItem = WorkItem::firstOrFail();

    expect($workItem->notes->pluck('id')->sort()->values()->all())
        ->toBe([$first->id, $second->id]);
});

it('menyinkronkan tautan catatan saat memperbarui pekerjaan', function () {
    $first = Note::create(['title' => 'Catatan A', 'content' => 'A.', 'tags' => []]);
    $second = Note::create(['title' => 'Catatan B', 'content' => 'B.', 'tags' => []]);
    $third = Note::create(['title' => 'Catatan C', 'content' => 'C.', 'tags' => []]);

    $workItem = WorkItem::create([
        'title' => 'Pekerjaan dengan tautan',
        'status' => 'todo',
        'priority' => 'medium',
    ]);
    $workItem->notes()->sync([$first->id, $second->id]);

    $this->actingAs(adminUser())
        ->put("/admin/work-items/{$workItem->id}", [
            'title' => 'Pekerjaan dengan tautan',
            'status' => 'todo',
            'priority' => 'medium',
            'notes' => [$second->id, $third->id],
        ])
        ->assertRedirect(route('admin.work-items.index'));

    expect($workItem->fresh()->notes->pluck('id')->sort()->values()->all())
        ->toBe([$second->id, $third->id]);
});

it('menolak tautan catatan yang tidak ada', function () {
    $this->actingAs(adminUser())
        ->post('/admin/work-items', [
            'title' => 'Pekerjaan',
            'status' => 'todo',
            'priority' => 'medium',
            'notes' => [999],
        ])
        ->assertSessionHasErrors('notes.0');

    expect(WorkItem::count())->toBe(0);
});

it('menampilkan papan kanban untuk semua status', function () {
    WorkItem::create([
        'title' => 'Ide backlog',
        'status' => 'backlog',
        'priority' => 'low',
    ]);

    WorkItem::create([
        'title' => 'Siap dikerjakan',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    WorkItem::create([
        'title' => 'Sudah selesai',
        'status' => 'done',
        'priority' => 'high',
        'completed_at' => now(),
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/work-items?view=board')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/work-items/index')
            ->where('filters.view', 'board')
            ->has('boardItems', 3)
            ->where('counts.backlog', 1)
            ->where('counts.todo', 1)
            ->where('counts.done', 1)
        );
});

it('mengabaikan filter status pada tampilan papan', function () {
    WorkItem::create([
        'title' => 'Backlog',
        'status' => 'backlog',
        'priority' => 'low',
    ]);

    WorkItem::create([
        'title' => 'To do',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/work-items?view=board&status=todo')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.view', 'board')
            ->has('boardItems', 2)
        );
});

it('menyaring papan dengan pencarian dan prioritas', function () {
    WorkItem::create([
        'title' => 'Riset kanban',
        'status' => 'backlog',
        'priority' => 'high',
    ]);

    WorkItem::create([
        'title' => 'Riset catatan',
        'status' => 'todo',
        'priority' => 'low',
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/work-items?view=board&q=kanban&priority=high')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.view', 'board')
            ->has('boardItems', 1)
            ->where('boardItems.0.title', 'Riset kanban')
        );
});

it('menyaring pekerjaan berdasarkan proyek', function () {
    $project = Project::create([
        'name' => 'Proyek A',
        'color' => '#6366f1',
    ]);

    WorkItem::create([
        'project_id' => $project->id,
        'title' => 'Masuk proyek',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    WorkItem::create([
        'title' => 'Tanpa proyek',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->get("/admin/work-items?project={$project->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.project', (string) $project->id)
            ->has('workItems.data', 1)
            ->where('workItems.data.0.title', 'Masuk proyek')
            ->where('workItems.data.0.project.name', 'Proyek A')
            ->where('counts.todo', 1)
            ->has('projects', 1)
        );
});

it('menyaring pekerjaan tanpa proyek', function () {
    $project = Project::create([
        'name' => 'Proyek B',
        'color' => '#0ea5e9',
    ]);

    WorkItem::create([
        'project_id' => $project->id,
        'title' => 'Masuk proyek',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    WorkItem::create([
        'title' => 'Tanpa proyek',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/work-items?project=none')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.project', 'none')
            ->has('workItems.data', 1)
            ->where('workItems.data.0.title', 'Tanpa proyek')
        );
});

it('menyimpan pekerjaan dengan proyek dan menolak proyek tidak valid', function () {
    $project = Project::create([
        'name' => 'Proyek C',
        'color' => '#10b981',
    ]);

    $this->actingAs(adminUser())
        ->post('/admin/work-items', [
            'title' => 'Tugas proyek',
            'status' => 'todo',
            'priority' => 'medium',
            'project_id' => $project->id,
        ])
        ->assertRedirect(route('admin.work-items.index'));

    expect(WorkItem::firstOrFail()->project_id)->toBe($project->id);

    $this->actingAs(adminUser())
        ->post('/admin/work-items', [
            'title' => 'Tugas tanpa proyek valid',
            'status' => 'todo',
            'priority' => 'medium',
            'project_id' => 9999,
        ])
        ->assertSessionHasErrors('project_id');

    expect(WorkItem::count())->toBe(1);
});

it('memindahkan pekerjaan ke proyek lain dan melepasnya', function () {
    $first = Project::create(['name' => 'Pertama', 'color' => '#6366f1']);
    $second = Project::create(['name' => 'Kedua', 'color' => '#ef4444']);

    $workItem = WorkItem::create([
        'project_id' => $first->id,
        'title' => 'Pindah proyek',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->put("/admin/work-items/{$workItem->id}", [
            'title' => 'Pindah proyek',
            'status' => 'todo',
            'priority' => 'medium',
            'project_id' => $second->id,
        ]);

    expect($workItem->refresh()->project_id)->toBe($second->id);

    $this->actingAs(adminUser())
        ->put("/admin/work-items/{$workItem->id}", [
            'title' => 'Pindah proyek',
            'status' => 'todo',
            'priority' => 'medium',
            'project_id' => null,
        ]);

    expect($workItem->refresh()->project_id)->toBeNull();
});

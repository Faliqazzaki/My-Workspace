<?php

use App\Models\Project;
use App\Models\WorkItem;
use Inertia\Testing\AssertableInertia as Assert;

it('mengalihkan tamu dari halaman proyek', function () {
    $this->get('/admin/projects')->assertRedirect(route('home'));
});

it('menampilkan proyek beserta progres pekerjaan', function () {
    $project = Project::create([
        'name' => 'My Workspace v1',
        'description' => 'Fitur inti workspace.',
        'color' => '#6366f1',
    ]);

    $archived = Project::create([
        'name' => 'Proyek lama',
        'color' => '#64748b',
        'archived_at' => now(),
    ]);

    WorkItem::create([
        'project_id' => $project->id,
        'title' => 'Selesai',
        'status' => 'done',
        'priority' => 'low',
        'completed_at' => now(),
    ]);

    WorkItem::create([
        'project_id' => $project->id,
        'title' => 'Berjalan',
        'status' => 'in_progress',
        'priority' => 'medium',
    ]);

    WorkItem::create([
        'project_id' => $archived->id,
        'title' => 'Masih backlog',
        'status' => 'backlog',
        'priority' => 'low',
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/projects')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/projects/index')
            ->has('projects', 2)
            ->where('projects.0.name', 'My Workspace v1')
            ->where('projects.0.work_items_count', 2)
            ->where('projects.0.done_work_items_count', 1)
            ->where('projects.1.name', 'Proyek lama')
            ->whereNot('projects.1.archived_at', null)
            ->has('colors', 8)
        );
});

it('menyimpan proyek baru beserta warna', function () {
    $this->actingAs(adminUser())
        ->post('/admin/projects', [
            'name' => 'Website pribadi',
            'description' => 'Portofolio dan tulisan.',
            'color' => '#10b981',
        ])
        ->assertRedirect(route('admin.projects.index'))
        ->assertSessionHas('success');

    $project = Project::firstOrFail();

    expect($project->name)->toBe('Website pribadi')
        ->and($project->description)->toBe('Portofolio dan tulisan.')
        ->and($project->color)->toBe('#10b981')
        ->and($project->archived_at)->toBeNull();
});

it('memvalidasi nama dan warna proyek', function () {
    $this->actingAs(adminUser())
        ->post('/admin/projects', [
            'name' => '',
            'color' => '#123456',
        ])
        ->assertSessionHasErrors(['name', 'color']);

    expect(Project::count())->toBe(0);
});

it('memperbarui proyek', function () {
    $project = Project::create([
        'name' => 'Nama lama',
        'color' => '#6366f1',
    ]);

    $this->actingAs(adminUser())
        ->put("/admin/projects/{$project->id}", [
            'name' => 'Nama baru',
            'description' => 'Deskripsi baru.',
            'color' => '#ef4444',
        ])
        ->assertRedirect(route('admin.projects.index'));

    $project->refresh();

    expect($project->name)->toBe('Nama baru')
        ->and($project->description)->toBe('Deskripsi baru.')
        ->and($project->color)->toBe('#ef4444');
});

it('mengarsipkan dan mengembalikan proyek', function () {
    $project = Project::create([
        'name' => 'Proyek aktif',
        'color' => '#0ea5e9',
    ]);

    $this->actingAs(adminUser())
        ->patch("/admin/projects/{$project->id}/archive")
        ->assertSessionHas('success');

    expect($project->refresh()->archived_at)->not->toBeNull();

    $this->actingAs(adminUser())
        ->patch("/admin/projects/{$project->id}/archive")
        ->assertSessionHas('success');

    expect($project->refresh()->archived_at)->toBeNull();
});

it('menghapus proyek tanpa menghapus pekerjaannya', function () {
    $project = Project::create([
        'name' => 'Proyek sementara',
        'color' => '#f59e0b',
    ]);

    $workItem = WorkItem::create([
        'project_id' => $project->id,
        'title' => 'Tetap ada',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->delete("/admin/projects/{$project->id}")
        ->assertRedirect(route('admin.projects.index'))
        ->assertSessionHas('success');

    expect(Project::count())->toBe(0)
        ->and($workItem->refresh()->project_id)->toBeNull()
        ->and(WorkItem::count())->toBe(1);
});

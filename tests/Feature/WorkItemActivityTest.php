<?php

use App\Models\Project;
use App\Models\WorkItem;
use App\Models\WorkItemActivity;
use Inertia\Testing\AssertableInertia as Assert;

it('mengalihkan tamu dari riwayat aktivitas pekerjaan', function () {
    $workItem = WorkItem::create([
        'title' => 'Riwayat privat',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->get("/admin/work-items/{$workItem->id}/activities")
        ->assertRedirect(route('home'));
});

it('mencatat aktivitas saat pekerjaan dibuat', function () {
    $this->actingAs(adminUser())
        ->post('/admin/work-items', [
            'title' => 'Pekerjaan baru',
            'status' => 'todo',
            'priority' => 'medium',
        ])
        ->assertRedirect(route('admin.work-items.index'));

    $workItem = WorkItem::firstOrFail();
    $activity = WorkItemActivity::firstOrFail();

    expect($activity->work_item_id)->toBe($workItem->id)
        ->and($activity->type)->toBe('created')
        ->and($activity->changes)->toBeNull();
});

it('mencatat perubahan status beserta nilai lama dan baru', function () {
    $workItem = WorkItem::create([
        'title' => 'Ubah status',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->from('/admin/work-items')
        ->patch("/admin/work-items/{$workItem->id}/status", [
            'status' => 'in_progress',
        ])
        ->assertRedirect('/admin/work-items');

    $activity = WorkItemActivity::query()
        ->where('type', 'status_changed')
        ->firstOrFail();

    expect($activity->changes)->toBe([
        'old' => 'todo',
        'new' => 'in_progress',
    ]);
});

it('tidak mencatat aktivitas saat update tanpa perubahan nilai', function () {
    $workItem = WorkItem::create([
        'title' => 'Tetap sama',
        'status' => 'todo',
        'priority' => 'low',
        'due_date' => '2026-12-01',
    ]);

    $this->actingAs(adminUser())
        ->put("/admin/work-items/{$workItem->id}", [
            'title' => 'Tetap sama',
            'description' => null,
            'status' => 'todo',
            'priority' => 'low',
            'due_date' => '2026-12-01',
            'tags' => [],
            'project_id' => null,
        ])
        ->assertRedirect(route('admin.work-items.index'));

    expect(WorkItemActivity::count())->toBe(0);
});

it('mencatat perubahan judul, prioritas, tenggat, dan proyek', function () {
    $oldProject = Project::create(['name' => 'Proyek lama', 'color' => '#111111']);
    $newProject = Project::create(['name' => 'Proyek baru', 'color' => '#222222']);

    $workItem = WorkItem::create([
        'project_id' => $oldProject->id,
        'title' => 'Judul lama',
        'status' => 'todo',
        'priority' => 'low',
        'due_date' => '2026-12-01',
    ]);

    $this->actingAs(adminUser())
        ->put("/admin/work-items/{$workItem->id}", [
            'title' => 'Judul baru',
            'description' => null,
            'status' => 'todo',
            'priority' => 'high',
            'due_date' => '2026-12-10',
            'tags' => [],
            'project_id' => $newProject->id,
        ])
        ->assertRedirect(route('admin.work-items.index'));

    $activities = WorkItemActivity::all()->keyBy('type');

    expect($activities)->toHaveCount(4)
        ->and($activities['title_changed']->changes)->toBe([
            'old' => 'Judul lama',
            'new' => 'Judul baru',
        ])
        ->and($activities['priority_changed']->changes)->toBe([
            'old' => 'low',
            'new' => 'high',
        ])
        ->and($activities['due_date_changed']->changes)->toBe([
            'old' => '2026-12-01',
            'new' => '2026-12-10',
        ])
        ->and($activities['project_changed']->changes)->toBe([
            'old' => $oldProject->id,
            'new' => $newProject->id,
        ]);
});

it('mencatat perubahan status lewat aksi massal', function () {
    $first = WorkItem::create([
        'title' => 'Pertama',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $second = WorkItem::create([
        'title' => 'Kedua',
        'status' => 'backlog',
        'priority' => 'low',
    ]);

    $alreadyDone = WorkItem::create([
        'title' => 'Sudah selesai',
        'status' => 'done',
        'priority' => 'high',
    ]);

    $this->actingAs(adminUser())
        ->from('/admin/work-items')
        ->patch('/admin/work-items/bulk-status', [
            'ids' => [$first->id, $second->id, $alreadyDone->id],
            'status' => 'done',
        ])
        ->assertRedirect('/admin/work-items');

    expect(WorkItemActivity::count())->toBe(2)
        ->and($first->activities()->firstOrFail()->changes)->toBe([
            'old' => 'todo',
            'new' => 'done',
        ])
        ->and($second->activities()->firstOrFail()->changes)->toBe([
            'old' => 'backlog',
            'new' => 'done',
        ])
        ->and($alreadyDone->activities()->count())->toBe(0);
});

it('mengembalikan maksimal 20 aktivitas terbaru', function () {
    $workItem = WorkItem::create([
        'title' => 'Banyak riwayat',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    foreach (range(1, 25) as $index) {
        $activity = new WorkItemActivity([
            'type' => "test_{$index}",
            'changes' => ['old' => 'todo', 'new' => 'done'],
        ]);
        $activity->work_item_id = $workItem->id;
        $activity->created_at = now()->addSeconds($index);
        $activity->save();
    }

    $response = $this->actingAs(adminUser())
        ->getJson("/admin/work-items/{$workItem->id}/activities")
        ->assertOk()
        ->assertJsonCount(20, 'activities');

    expect($response->json('activities.0.type'))->toBe('test_25')
        ->and($response->json('activities.19.type'))->toBe('test_6')
        ->and($response->json('activities.0.created_at'))->not->toBeNull();
});

it('menghapus riwayat saat pekerjaan dihapus', function () {
    $workItem = WorkItem::create([
        'title' => 'Akan dihapus',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    WorkItemActivity::create([
        'work_item_id' => $workItem->id,
        'type' => 'created',
    ]);

    $this->actingAs(adminUser())
        ->from('/admin/work-items')
        ->delete("/admin/work-items/{$workItem->id}")
        ->assertRedirect('/admin/work-items');

    expect(WorkItem::count())->toBe(0)
        ->and(WorkItemActivity::count())->toBe(0);
});

it('tidak memuat aktivitas pada payload daftar pekerjaan', function () {
    WorkItem::create([
        'title' => 'Tanpa riwayat di daftar',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/work-items')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/work-items/index')
            ->missing('workItems.data.0.activities')
        );
});

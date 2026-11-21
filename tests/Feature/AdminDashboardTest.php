<?php

use App\Models\Note;
use App\Models\WorkItem;
use Inertia\Testing\AssertableInertia as Assert;

function dashboardAdminSession(): array
{
    return [
        'admin_authenticated' => true,
        'admin_username' => 'my-workspace',
    ];
}

it('mengalihkan tamu dari dashboard', function () {
    $this->get('/admin')->assertRedirect(route('home'));
});

it('menampilkan ringkasan dashboard untuk admin', function () {
    Note::create([
        'title' => 'Riset PostgreSQL',
        'content' => 'Catatan tentang JSONB dan indexing.',
        'tags' => ['database'],
    ]);

    WorkItem::create([
        'title' => 'Tugas terlambat',
        'status' => 'in_progress',
        'priority' => 'urgent',
        'due_date' => today()->subDay()->toDateString(),
    ]);

    WorkItem::create([
        'title' => 'Tugas berikutnya',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => today()->addDays(3)->toDateString(),
    ]);

    WorkItem::create([
        'title' => 'Tugas selesai',
        'status' => 'done',
        'priority' => 'low',
        'due_date' => today()->subWeek()->toDateString(),
    ]);

    $this->withSession(dashboardAdminSession())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/index')
            ->where('admin.username', 'my-workspace')
            ->where('stats.notes', 1)
            ->where('stats.workItems', 3)
            ->where('stats.inProgress', 1)
            ->where('stats.done', 1)
            ->where('stats.overdue', 1)
            ->where('statusCounts.todo', 1)
            ->where('statusCounts.in_progress', 1)
            ->where('statusCounts.done', 1)
            ->has('activeWorkItems', 2)
            ->where('activeWorkItems.0.title', 'Tugas terlambat')
            ->where('activeWorkItems.1.title', 'Tugas berikutnya')
            ->has('recentNotes', 1)
            ->where('recentNotes.0.title', 'Riset PostgreSQL')
        );
});

it('menampilkan dashboard kosong tanpa data', function () {
    $this->withSession(dashboardAdminSession())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/index')
            ->where('stats.notes', 0)
            ->where('stats.workItems', 0)
            ->where('stats.inProgress', 0)
            ->where('stats.done', 0)
            ->where('stats.overdue', 0)
            ->has('activeWorkItems', 0)
            ->has('recentNotes', 0)
        );
});

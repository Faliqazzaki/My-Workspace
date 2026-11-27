<?php

use App\Models\Project;
use App\Models\WorkItem;
use Illuminate\Support\Carbon;

afterEach(function () {
    Carbon::setTestNow();
});

it('mengalihkan tamu saat mengakses endpoint notifikasi', function () {
    $this->get('/admin/notifications')->assertRedirect(route('home'));
});

it('mengelompokkan kategori terlambat, hari ini, dan besok berdasarkan zona waktu Asia/Jakarta', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-27 10:00:00', 'Asia/Jakarta'));

    $project = Project::create([
        'name' => 'Proyek Alpha',
        'color' => '#6366f1',
    ]);

    $overdue = WorkItem::create([
        'project_id' => $project->id,
        'title' => 'Pekerjaan Terlambat',
        'status' => 'todo',
        'priority' => 'urgent',
        'due_date' => '2026-11-26',
    ]);

    $today = WorkItem::create([
        'title' => 'Pekerjaan Hari Ini',
        'status' => 'in_progress',
        'priority' => 'high',
        'due_date' => '2026-11-27',
    ]);

    $tomorrow = WorkItem::create([
        'title' => 'Pekerjaan Besok',
        'status' => 'backlog',
        'priority' => 'medium',
        'due_date' => '2026-11-28',
    ]);

    // Pekerjaan di luar jendela notifikasi (lusa)
    WorkItem::create([
        'title' => 'Pekerjaan Lusa',
        'status' => 'todo',
        'priority' => 'low',
        'due_date' => '2026-11-29',
    ]);

    // Pekerjaan selesai (tidak boleh muncul meski tenggatnya kemarin)
    WorkItem::create([
        'title' => 'Pekerjaan Selesai',
        'status' => 'done',
        'priority' => 'urgent',
        'due_date' => '2026-11-26',
        'completed_at' => now(),
    ]);

    // Pekerjaan tanpa tenggat (tidak boleh muncul)
    WorkItem::create([
        'title' => 'Pekerjaan Tanpa Tenggat',
        'status' => 'todo',
        'priority' => 'urgent',
        'due_date' => null,
    ]);

    $response = $this->actingAs(adminUser())
        ->getJson('/admin/notifications')
        ->assertOk();

    $items = $response->json('items');

    expect($items)->toHaveCount(3)
        ->and($items[0]['id'])->toBe($overdue->id)
        ->and($items[0]['category'])->toBe('overdue')
        ->and($items[0]['read_key'])->toBe($overdue->id.':2026-11-26')
        ->and($items[0]['project']['name'])->toBe('Proyek Alpha')
        ->and($items[1]['id'])->toBe($today->id)
        ->and($items[1]['category'])->toBe('today')
        ->and($items[2]['id'])->toBe($tomorrow->id)
        ->and($items[2]['category'])->toBe('tomorrow');

    expect($response->json('counts.overdue'))->toBe(1)
        ->and($response->json('counts.today'))->toBe(1)
        ->and($response->json('counts.tomorrow'))->toBe(1)
        ->and($response->json('counts.total'))->toBe(3);
});

it('memperhitungkan batas pergantian tengah malam dalam zona waktu Asia/Jakarta', function () {
    // 17:01 UTC tanggal 27 Nov = 00:01 WIB tanggal 28 Nov
    Carbon::setTestNow(Carbon::parse('2026-11-27 17:01:00', 'UTC'));

    WorkItem::create([
        'title' => 'Pekerjaan Kemarin Baru Saja Lewat',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-27',
    ]);

    WorkItem::create([
        'title' => 'Pekerjaan Hari Ini Baru Masuk',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-28',
    ]);

    WorkItem::create([
        'title' => 'Pekerjaan Besok',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-29',
    ]);

    $response = $this->actingAs(adminUser())
        ->getJson('/admin/notifications')
        ->assertOk();

    $items = $response->json('items');

    expect($items)->toHaveCount(3)
        ->and($items[0]['due_date'])->toBe('2026-11-27')
        ->and($items[0]['category'])->toBe('overdue')
        ->and($items[1]['due_date'])->toBe('2026-11-28')
        ->and($items[1]['category'])->toBe('today')
        ->and($items[2]['due_date'])->toBe('2026-11-29')
        ->and($items[2]['category'])->toBe('tomorrow');
});

it('tidak memunculkan pekerjaan yang sudah selesai atau tanpa tanggal tenggat', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-27 12:00:00', 'Asia/Jakarta'));

    WorkItem::create([
        'title' => 'Tuntas 1',
        'status' => 'done',
        'priority' => 'urgent',
        'due_date' => '2026-11-26',
    ]);

    WorkItem::create([
        'title' => 'Tuntas 2',
        'status' => 'done',
        'priority' => 'urgent',
        'due_date' => '2026-11-27',
    ]);

    WorkItem::create([
        'title' => 'Tanpa Tenggat',
        'status' => 'todo',
        'priority' => 'urgent',
        'due_date' => null,
    ]);

    $response = $this->actingAs(adminUser())
        ->getJson('/admin/notifications')
        ->assertOk();

    expect($response->json('items'))->toBeEmpty()
        ->and($response->json('counts.total'))->toBe(0);
});

it('membatasi maksimal 20 entri notifikasi', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-27 12:00:00', 'Asia/Jakarta'));

    for ($i = 1; $i <= 25; $i++) {
        WorkItem::create([
            'title' => "Pekerjaan {$i}",
            'status' => 'todo',
            'priority' => 'medium',
            'due_date' => '2026-11-26',
        ]);
    }

    $response = $this->actingAs(adminUser())
        ->getJson('/admin/notifications')
        ->assertOk();

    expect($response->json('items'))->toHaveCount(20)
        ->and($response->json('counts.total'))->toBe(20);
});

it('mengurutkan notifikasi paling mendesak terlebih dahulu berdasarkan kategori, tanggal, dan prioritas', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-27 12:00:00', 'Asia/Jakarta'));

    // Besok dengan prioritas urgent
    $tomorrowUrgent = WorkItem::create([
        'title' => 'Besok Urgent',
        'status' => 'todo',
        'priority' => 'urgent',
        'due_date' => '2026-11-28',
    ]);

    // Hari ini prioritas low
    $todayLow = WorkItem::create([
        'title' => 'Hari Ini Low',
        'status' => 'todo',
        'priority' => 'low',
        'due_date' => '2026-11-27',
    ]);

    // Hari ini prioritas urgent
    $todayUrgent = WorkItem::create([
        'title' => 'Hari Ini Urgent',
        'status' => 'todo',
        'priority' => 'urgent',
        'due_date' => '2026-11-27',
    ]);

    // Terlambat 3 hari lalu
    $overdueOlder = WorkItem::create([
        'title' => 'Terlambat 3 Hari',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-24',
    ]);

    // Terlambat 1 hari lalu
    $overdueRecent = WorkItem::create([
        'title' => 'Terlambat 1 Hari',
        'status' => 'todo',
        'priority' => 'urgent',
        'due_date' => '2026-11-26',
    ]);

    $response = $this->actingAs(adminUser())
        ->getJson('/admin/notifications')
        ->assertOk();

    $titles = collect($response->json('items'))->pluck('title')->all();

    expect($titles)->toBe([
        $overdueOlder->title,
        $overdueRecent->title,
        $todayUrgent->title,
        $todayLow->title,
        $tomorrowUrgent->title,
    ]);
});

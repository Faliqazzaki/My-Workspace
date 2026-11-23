<?php

use App\Models\Note;
use App\Models\WorkItem;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

afterEach(fn () => Date::setTestNow());

function noteCreatedAtInJakarta(string $dateTime, string $title = 'Catatan'): Note
{
    $timestamp = Date::parse($dateTime, 'Asia/Jakarta')->utc()->toDateTimeString();

    $note = Note::create([
        'title' => $title,
        'content' => 'Isi catatan.',
        'tags' => [],
    ]);

    DB::table('notes')->where('id', $note->id)->update([
        'created_at' => $timestamp,
        'updated_at' => $timestamp,
    ]);

    return $note->refresh();
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

    $this->actingAs(adminUser())
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
    $this->actingAs(adminUser())
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
            ->where('knowledge.has_note_today', false)
            ->where('knowledge.notes_today', 0)
            ->where('knowledge.streak', 0)
            ->where('knowledge.timezone', 'Asia/Jakarta')
        );
});

it('menghitung streak kebiasaan mencatat hari ini', function () {
    Date::setTestNow(Date::parse('2026-11-23 09:00:00', 'Asia/Jakarta'));

    noteCreatedAtInJakarta('2026-11-21 20:00:00', 'Hari pertama');
    noteCreatedAtInJakarta('2026-11-22 08:00:00', 'Hari kedua');
    noteCreatedAtInJakarta('2026-11-23 07:00:00', 'Hari ketiga pagi');
    noteCreatedAtInJakarta('2026-11-23 08:30:00', 'Hari ketiga sore');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('knowledge.has_note_today', true)
            ->where('knowledge.notes_today', 2)
            ->where('knowledge.streak', 3)
        );
});

it('mempertahankan streak jika terakhir mencatat kemarin', function () {
    Date::setTestNow(Date::parse('2026-11-23 09:00:00', 'Asia/Jakarta'));

    noteCreatedAtInJakarta('2026-11-21 20:00:00', 'Dua hari lalu');
    noteCreatedAtInJakarta('2026-11-22 08:00:00', 'Kemarin');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('knowledge.has_note_today', false)
            ->where('knowledge.notes_today', 0)
            ->where('knowledge.streak', 2)
        );
});

it('mengosongkan streak jika catatan terakhir lebih dari sehari', function () {
    Date::setTestNow(Date::parse('2026-11-23 09:00:00', 'Asia/Jakarta'));

    noteCreatedAtInJakarta('2026-11-20 20:00:00', 'Tiga hari lalu');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('knowledge.has_note_today', false)
            ->where('knowledge.streak', 0)
        );
});

it('menghitung tanggal catatan memakai zona waktu Asia/Jakarta', function () {
    Date::setTestNow(Date::parse('2026-11-23 09:00:00', 'Asia/Jakarta'));

    // 22 Nov 23:30 dan 23 Nov 00:30 di Jakarta; keduanya 22 Nov di UTC.
    noteCreatedAtInJakarta('2026-11-22 23:30:00', 'Malam');
    noteCreatedAtInJakarta('2026-11-23 00:30:00', 'Dini hari');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('knowledge.has_note_today', true)
            ->where('knowledge.notes_today', 1)
            ->where('knowledge.streak', 2)
        );
});

it('menghitung streak lintas akhir tahun', function () {
    Date::setTestNow(Date::parse('2027-01-01 10:00:00', 'Asia/Jakarta'));

    noteCreatedAtInJakarta('2026-12-30 20:00:00', 'Awal');
    noteCreatedAtInJakarta('2026-12-31 20:00:00', 'Akhir tahun');
    noteCreatedAtInJakarta('2027-01-01 08:00:00', 'Tahun baru');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('knowledge.has_note_today', true)
            ->where('knowledge.streak', 3)
        );
});

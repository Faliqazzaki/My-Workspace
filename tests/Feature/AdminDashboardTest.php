<?php

use App\Models\Note;
use App\Models\WorkItem;
use Carbon\Carbon;
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

function completedAtInJakarta(string $dateTime, string $title = 'Pekerjaan selesai'): WorkItem
{
    $timestamp = Date::parse($dateTime, 'Asia/Jakarta')->utc()->toDateTimeString();

    $workItem = WorkItem::create([
        'title' => $title,
        'status' => 'done',
        'priority' => 'medium',
    ]);

    DB::table('work_items')->where('id', $workItem->id)->update([
        'completed_at' => $timestamp,
    ]);

    return $workItem->refresh();
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
            ->has('activity.days', 30)
            ->where('activity.timezone', 'Asia/Jakarta')
            ->where('activity.days.0.notes', 0)
            ->where('activity.days.29.completed', 0)
            ->where('knowledge.has_note_today', false)
            ->where('knowledge.notes_today', 0)
            ->where('knowledge.streak', 0)
            ->where('knowledge.timezone', 'Asia/Jakarta')
            ->has('agenda.today', 0)
            ->has('agenda.this_week', 0)
            ->where('agenda.timezone', 'Asia/Jakarta')
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

it('mengirim grafik aktivitas 30 hari dengan hitungan per hari', function () {
    Date::setTestNow(Date::parse('2026-11-23 09:00:00', 'Asia/Jakarta'));

    noteCreatedAtInJakarta('2026-11-22 10:00:00', 'Catatan kemarin');
    noteCreatedAtInJakarta('2026-11-23 08:00:00', 'Catatan hari ini');
    completedAtInJakarta('2026-11-22 20:00:00', 'Selesai kemarin');
    completedAtInJakarta('2026-11-23 07:00:00', 'Selesai hari ini');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('activity.days', 30)
            ->where('activity.timezone', 'Asia/Jakarta')
            ->where('activity.days.0.date', '2026-10-25')
            ->where('activity.days.28.date', '2026-11-22')
            ->where('activity.days.28.notes', 1)
            ->where('activity.days.28.completed', 1)
            ->where('activity.days.29.date', '2026-11-23')
            ->where('activity.days.29.notes', 1)
            ->where('activity.days.29.completed', 1)
        );
});

it('mengabaikan aktivitas di luar 30 hari terakhir', function () {
    Date::setTestNow(Date::parse('2026-11-23 09:00:00', 'Asia/Jakarta'));

    noteCreatedAtInJakarta('2026-10-24 12:00:00', 'Catatan lama');
    completedAtInJakarta('2026-10-24 12:00:00', 'Selesai lama');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('activity.days', 30)
            ->where('activity.days.0.date', '2026-10-25')
            ->where('activity.days', fn ($days) => collect($days)->sum('notes') === 0
                && collect($days)->sum('completed') === 0)
        );
});

it('menghitung aktivitas memakai zona waktu Asia/Jakarta', function () {
    Date::setTestNow(Date::parse('2026-11-23 09:00:00', 'Asia/Jakarta'));

    // 22 Nov 23:30 dan 23 Nov 00:30 di Jakarta; keduanya 22 Nov di UTC.
    noteCreatedAtInJakarta('2026-11-22 23:30:00', 'Malam');
    completedAtInJakarta('2026-11-23 00:30:00', 'Dini hari');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('activity.days.28.date', '2026-11-22')
            ->where('activity.days.28.notes', 1)
            ->where('activity.days.28.completed', 0)
            ->where('activity.days.29.date', '2026-11-23')
            ->where('activity.days.29.notes', 0)
            ->where('activity.days.29.completed', 1)
        );
});

it('menampilkan agenda tenggat hari ini dan minggu ini untuk pekerjaan belum selesai', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-25 10:00:00', 'Asia/Jakarta')); // Rabu

    // Senin minggu ini (23 Nov)
    WorkItem::create([
        'title' => 'Tugas awal minggu',
        'status' => 'todo',
        'priority' => 'high',
        'due_date' => '2026-11-23',
    ]);

    // Hari ini (Rabu 25 Nov)
    WorkItem::create([
        'title' => 'Tugas hari ini urgent',
        'status' => 'in_progress',
        'priority' => 'urgent',
        'due_date' => '2026-11-25',
    ]);

    WorkItem::create([
        'title' => 'Tugas hari ini medium',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-25',
    ]);

    // Minggu minggu ini (29 Nov)
    WorkItem::create([
        'title' => 'Tugas akhir minggu',
        'status' => 'backlog',
        'priority' => 'low',
        'due_date' => '2026-11-29',
    ]);

    // Sudah selesai (tidak boleh muncul di agenda walau hari ini)
    WorkItem::create([
        'title' => 'Tugas selesai hari ini',
        'status' => 'done',
        'priority' => 'high',
        'due_date' => '2026-11-25',
    ]);

    // Di luar minggu ini (Minggu lalu, 22 Nov)
    WorkItem::create([
        'title' => 'Tugas minggu lalu',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-22',
    ]);

    // Di luar minggu ini (Senin depan, 30 Nov)
    WorkItem::create([
        'title' => 'Tugas minggu depan',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-30',
    ]);

    // Tanpa tenggat
    WorkItem::create([
        'title' => 'Tugas tanpa tenggat',
        'status' => 'in_progress',
        'priority' => 'high',
        'due_date' => null,
    ]);

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('agenda.today', 2)
            ->where('agenda.today.0.title', 'Tugas hari ini urgent')
            ->where('agenda.today.0.priority', 'urgent')
            ->where('agenda.today.0.status', 'in_progress')
            ->where('agenda.today.0.due_date', '2026-11-25T00:00:00.000000Z')
            ->where('agenda.today.1.title', 'Tugas hari ini medium')
            ->has('agenda.this_week', 4)
            ->where('agenda.this_week.0.title', 'Tugas awal minggu')
            ->where('agenda.this_week.1.title', 'Tugas hari ini urgent')
            ->where('agenda.this_week.2.title', 'Tugas hari ini medium')
            ->where('agenda.this_week.3.title', 'Tugas akhir minggu')
            ->where('agenda.today_date', '2026-11-25')
            ->where('agenda.start_of_week', '2026-11-23')
            ->where('agenda.end_of_week', '2026-11-29')
            ->where('agenda.timezone', 'Asia/Jakarta')
        );
});

it('menghitung batas hari dan minggu agenda memakai zona waktu Asia/Jakarta', function () {
    // 25 Nov 2026 17:30:00 UTC = 26 Nov 2026 00:30:00 di Asia/Jakarta (Kamis)
    Carbon::setTestNow(Carbon::parse('2026-11-25 17:30:00', 'UTC'));

    WorkItem::create([
        'title' => 'Tugas kemarin di Jakarta',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-25',
    ]);

    WorkItem::create([
        'title' => 'Tugas hari ini di Jakarta',
        'status' => 'todo',
        'priority' => 'urgent',
        'due_date' => '2026-11-26',
    ]);

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('agenda.today_date', '2026-11-26')
            ->where('agenda.start_of_week', '2026-11-23')
            ->where('agenda.end_of_week', '2026-11-29')
            ->has('agenda.today', 1)
            ->where('agenda.today.0.title', 'Tugas hari ini di Jakarta')
            ->has('agenda.this_week', 2)
        );
});

it('menghitung batas minggu dari Senin sampai Minggu', function () {
    // Minggu malam 29 Nov 2026 23:00:00 di Jakarta
    Carbon::setTestNow(Carbon::parse('2026-11-29 23:00:00', 'Asia/Jakarta'));

    WorkItem::create([
        'title' => 'Tugas Senin awal minggu',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-23',
    ]);

    WorkItem::create([
        'title' => 'Tugas Minggu akhir minggu',
        'status' => 'todo',
        'priority' => 'high',
        'due_date' => '2026-11-29',
    ]);

    WorkItem::create([
        'title' => 'Tugas Senin minggu depan',
        'status' => 'todo',
        'priority' => 'medium',
        'due_date' => '2026-11-30',
    ]);

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('agenda.today_date', '2026-11-29')
            ->where('agenda.start_of_week', '2026-11-23')
            ->where('agenda.end_of_week', '2026-11-29')
            ->has('agenda.today', 1)
            ->where('agenda.today.0.title', 'Tugas Minggu akhir minggu')
            ->has('agenda.this_week', 2)
            ->where('agenda.this_week.0.title', 'Tugas Senin awal minggu')
            ->where('agenda.this_week.1.title', 'Tugas Minggu akhir minggu')
        );
});

it('menghitung tag teratas dari catatan aktif dan mengabaikan arsip', function () {
    Note::create(['title' => 'Catatan A', 'content' => 'Isi.', 'tags' => ['laravel', 'php']]);
    Note::create(['title' => 'Catatan B', 'content' => 'Isi.', 'tags' => ['laravel']]);
    Note::create(['title' => 'Catatan C', 'content' => 'Isi.', 'tags' => ['php', 'sqlite']]);
    Note::create(['title' => 'Catatan arsip', 'content' => 'Isi.', 'tags' => ['laravel', 'arsip']])->delete();

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('knowledgeStats.total_notes', 3)
            ->has('knowledgeStats.top_tags', 3)
            ->where('knowledgeStats.top_tags.0.tag', 'laravel')
            ->where('knowledgeStats.top_tags.0.count', 2)
            ->where('knowledgeStats.top_tags.1.tag', 'php')
            ->where('knowledgeStats.top_tags.1.count', 2)
            ->where('knowledgeStats.top_tags.2.tag', 'sqlite')
            ->where('knowledgeStats.top_tags.2.count', 1)
        );
});

it('membatasi tag teratas maksimal delapan', function () {
    Note::create([
        'title' => 'Banyak tag',
        'content' => 'Isi.',
        'tags' => ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'],
    ]);

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('knowledgeStats.top_tags', 8)
            ->where('knowledgeStats.top_tags.0.tag', 't1')
            ->where('knowledgeStats.top_tags.7.tag', 't8')
        );
});

it('menghitung catatan per minggu dengan batas Senin sampai Minggu dan minggu kosong nol', function () {
    Date::setTestNow(Date::parse('2026-01-08 12:00:00', 'Asia/Jakarta')); // Kamis

    // Jendela 8 minggu: 17 Nov 2025 (Senin) sampai 11 Jan 2026 (Minggu).
    noteCreatedAtInJakarta('2025-11-16 23:59:00', 'Sebelum jendela');
    noteCreatedAtInJakarta('2025-11-17 00:00:00', 'Senin minggu pertama');
    noteCreatedAtInJakarta('2025-11-23 23:59:00', 'Minggu minggu pertama');
    noteCreatedAtInJakarta('2025-11-24 00:00:00', 'Senin minggu kedua');
    noteCreatedAtInJakarta('2025-12-31 23:59:00', 'Malam tahun baru');
    noteCreatedAtInJakarta('2026-01-01 00:00:00', 'Awal tahun');
    noteCreatedAtInJakarta('2026-01-05 00:00:00', 'Senin minggu berjalan');
    noteCreatedAtInJakarta('2026-01-11 23:59:00', 'Minggu minggu berjalan');
    noteCreatedAtInJakarta('2026-01-12 00:00:00', 'Senin minggu depan');

    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('knowledgeStats.weeks', 8)
            ->where('knowledgeStats.timezone', 'Asia/Jakarta')
            ->where('knowledgeStats.weeks.0.start', '2025-11-17')
            ->where('knowledgeStats.weeks.0.end', '2025-11-23')
            ->where('knowledgeStats.weeks.0.notes', 2)
            ->where('knowledgeStats.weeks.1.start', '2025-11-24')
            ->where('knowledgeStats.weeks.1.notes', 1)
            ->where('knowledgeStats.weeks.2.notes', 0)
            ->where('knowledgeStats.weeks.6.start', '2025-12-29')
            ->where('knowledgeStats.weeks.6.notes', 2)
            ->where('knowledgeStats.weeks.7.start', '2026-01-05')
            ->where('knowledgeStats.weeks.7.end', '2026-01-11')
            ->where('knowledgeStats.weeks.7.notes', 2)
            ->where('knowledgeStats.total_notes', 9)
            ->where('knowledgeStats.average_per_week', fn ($value) => round((float) $value, 1) === 0.9)
        );
});

it('mengirim statistik pengetahuan kosong tanpa catatan', function () {
    $this->actingAs(adminUser())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('knowledgeStats.total_notes', 0)
            ->where('knowledgeStats.average_per_week', fn ($value) => (float) $value === 0.0)
            ->has('knowledgeStats.top_tags', 0)
            ->has('knowledgeStats.weeks', 8)
            ->where('knowledgeStats.weeks', fn ($weeks) => collect($weeks)->every(fn ($week) => $week['notes'] === 0))
        );
});

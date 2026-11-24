<?php

use App\Models\Note;
use App\Models\WorkItem;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

it('mengalihkan tamu dari halaman catatan', function () {
    $this->get('/admin/notes')->assertRedirect(route('home'));
});

it('menampilkan halaman catatan untuk admin', function () {
    Note::create([
        'title' => 'Catatan pertama',
        'content' => 'Isi catatan pertama.',
        'tags' => ['laravel'],
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/notes')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/notes/index')
            ->has('notes.data', 1)
            ->where('notes.data.0.title', 'Catatan pertama')
        );
});

it('menyimpan catatan baru beserta tag', function () {
    $this->actingAs(adminUser())
        ->post('/admin/notes', [
            'title' => 'Belajar PostgreSQL',
            'content' => 'JSONB cocok untuk data fleksibel.',
            'tags' => ['postgres', 'database', 'postgres'],
            'is_pinned' => true,
        ])
        ->assertRedirect(route('admin.notes.index'));

    $note = Note::firstOrFail();

    expect($note->title)->toBe('Belajar PostgreSQL')
        ->and($note->tags)->toBe(['postgres', 'database'])
        ->and($note->is_pinned)->toBeTrue();
});

it('memvalidasi judul dan isi catatan', function () {
    $this->actingAs(adminUser())
        ->post('/admin/notes', [
            'title' => '',
            'content' => '',
        ])
        ->assertSessionHasErrors(['title', 'content']);

    expect(Note::count())->toBe(0);
});

it('memperbarui catatan', function () {
    $note = Note::create([
        'title' => 'Judul lama',
        'content' => 'Isi lama.',
        'tags' => ['lama'],
    ]);

    $this->actingAs(adminUser())
        ->put("/admin/notes/{$note->id}", [
            'title' => 'Judul baru',
            'content' => 'Isi baru.',
            'tags' => ['baru'],
            'is_pinned' => false,
        ])
        ->assertRedirect(route('admin.notes.show', $note));

    expect($note->fresh())
        ->title->toBe('Judul baru')
        ->content->toBe('Isi baru.')
        ->tags->toBe(['baru']);
});

it('mengarsipkan catatan tanpa menghapus permanen', function () {
    $note = Note::create([
        'title' => 'Akan diarsipkan',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $this->actingAs(adminUser())
        ->delete("/admin/notes/{$note->id}")
        ->assertRedirect(route('admin.notes.index'))
        ->assertSessionHas('success');

    expect(Note::count())->toBe(0)
        ->and(Note::withTrashed()->count())->toBe(1)
        ->and(Note::withTrashed()->first()->trashed())->toBeTrue();
});

it('menyematkan dan melepas sematan catatan', function () {
    $note = Note::create([
        'title' => 'Catatan',
        'content' => 'Isi.',
        'tags' => [],
        'is_pinned' => false,
    ]);

    $this->actingAs(adminUser())
        ->patch("/admin/notes/{$note->id}/pin")
        ->assertRedirect(route('admin.notes.index'));

    expect($note->fresh()->is_pinned)->toBeTrue();

    $this->actingAs(adminUser())
        ->patch("/admin/notes/{$note->id}/pin");

    expect($note->fresh()->is_pinned)->toBeFalse();
});

it('mengalihkan tamu dari halaman detail catatan', function () {
    $note = Note::create([
        'title' => 'Catatan privat',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $this->get("/admin/notes/{$note->id}")->assertRedirect(route('home'));
});

it('menampilkan detail catatan untuk admin', function () {
    $note = Note::create([
        'title' => 'Belajar Markdown',
        'content' => "## Heading\n\n**Tebal** dan `kode`.",
        'tags' => ['markdown', 'catatan'],
        'is_pinned' => true,
    ]);

    $this->actingAs(adminUser())
        ->get("/admin/notes/{$note->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/notes/show')
            ->where('note.id', $note->id)
            ->where('note.title', 'Belajar Markdown')
            ->where('note.content', "## Heading\n\n**Tebal** dan `kode`.")
            ->where('note.is_pinned', true)
            ->where('note.tags', ['markdown', 'catatan'])
        );
});

it('mengembalikan 404 saat catatan tidak ditemukan', function () {
    $this->actingAs(adminUser())
        ->get('/admin/notes/999')
        ->assertNotFound();
});

it('mencari catatan berdasarkan judul dan menyaring tag', function () {
    Note::create([
        'title' => 'Laravel Queue',
        'content' => 'Menjalankan job di background.',
        'tags' => ['laravel', 'php'],
    ]);

    Note::create([
        'title' => 'React Basics',
        'content' => 'Komponen dan state.',
        'tags' => ['react', 'javascript'],
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/notes?q=laravel')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('notes.data', 1)
            ->where('notes.data.0.title', 'Laravel Queue')
        );

    $this->actingAs(adminUser())
        ->get('/admin/notes?tag=react')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('notes.data', 1)
            ->where('notes.data.0.title', 'React Basics')
        );
});

it('menampilkan pekerjaan terkait di detail catatan', function () {
    $note = Note::create([
        'title' => 'Catatan dengan pekerjaan',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $workItem = WorkItem::create([
        'title' => 'Tindak lanjut catatan',
        'status' => 'todo',
        'priority' => 'high',
        'due_date' => '2026-12-01',
    ]);

    $note->workItems()->attach($workItem);

    $this->actingAs(adminUser())
        ->get("/admin/notes/{$note->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/notes/show')
            ->has('note.work_items', 1)
            ->where('note.work_items.0.id', $workItem->id)
            ->where('note.work_items.0.title', 'Tindak lanjut catatan')
            ->where('note.work_items.0.status', 'todo')
        );
});

it('melepas tautan pekerjaan dari catatan', function () {
    $note = Note::create([
        'title' => 'Catatan',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $workItem = WorkItem::create([
        'title' => 'Pekerjaan',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $note->workItems()->attach($workItem);

    $this->actingAs(adminUser())
        ->delete("/admin/notes/{$note->id}/work-items/{$workItem->id}")
        ->assertRedirect(route('admin.notes.show', $note));

    expect($note->workItems()->count())->toBe(0)
        ->and(WorkItem::count())->toBe(1)
        ->and(Note::count())->toBe(1);
});

it('mengalihkan tamu saat melepas tautan pekerjaan', function () {
    $note = Note::create([
        'title' => 'Catatan',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $workItem = WorkItem::create([
        'title' => 'Pekerjaan',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $note->workItems()->attach($workItem);

    $this->delete("/admin/notes/{$note->id}/work-items/{$workItem->id}")
        ->assertRedirect(route('home'));

    expect($note->workItems()->count())->toBe(1);
});

it('menyembunyikan tautan saat catatan diarsipkan lalu memulihkannya', function () {
    $note = Note::create([
        'title' => 'Catatan',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $workItem = WorkItem::create([
        'title' => 'Pekerjaan',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $note->workItems()->attach($workItem);
    $note->delete();

    expect(DB::table('note_work_item')->count())->toBe(1)
        ->and($workItem->notes()->count())->toBe(0)
        ->and(WorkItem::count())->toBe(1);

    $note->restore();

    expect($workItem->notes()->count())->toBe(1);
});

it('menampilkan arsip catatan secara terpisah', function () {
    Note::create([
        'title' => 'Catatan aktif',
        'content' => 'Isi aktif.',
        'tags' => [],
    ]);

    $archived = Note::create([
        'title' => 'Catatan arsip',
        'content' => 'Isi arsip.',
        'tags' => [],
    ]);

    $archived->delete();

    $this->actingAs(adminUser())
        ->get('/admin/notes')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/notes/index')
            ->has('notes.data', 1)
            ->where('notes.data.0.title', 'Catatan aktif')
            ->where('archivedCount', 1)
            ->where('filters.archived', false)
        );

    $this->actingAs(adminUser())
        ->get('/admin/notes?archived=1')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('notes.data', 1)
            ->where('notes.data.0.title', 'Catatan arsip')
            ->where('archivedCount', 1)
            ->where('filters.archived', true)
        );
});

it('mencari catatan di dalam arsip', function () {
    $first = Note::create([
        'title' => 'Arsip PostgreSQL',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $second = Note::create([
        'title' => 'Arsip Laravel',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $first->delete();
    $second->delete();

    $this->actingAs(adminUser())
        ->get('/admin/notes?archived=1&q=postgres')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.archived', true)
            ->where('filters.q', 'postgres')
            ->has('notes.data', 1)
            ->where('notes.data.0.title', 'Arsip PostgreSQL')
        );
});

it('memulihkan catatan dari arsip', function () {
    $note = Note::create([
        'title' => 'Bisa dipulihkan',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $note->delete();

    $this->actingAs(adminUser())
        ->patch("/admin/notes/{$note->id}/restore")
        ->assertRedirect(route('admin.notes.index', ['archived' => 1]))
        ->assertSessionHas('success');

    expect(Note::count())->toBe(1)
        ->and(Note::withTrashed()->first()->deleted_at)->toBeNull();
});

it('mengalihkan tamu dari pemulihan catatan', function () {
    $note = Note::create([
        'title' => 'Catatan',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $note->delete();

    $this->patch("/admin/notes/{$note->id}/restore")
        ->assertRedirect(route('home'));

    expect(Note::count())->toBe(0);
});

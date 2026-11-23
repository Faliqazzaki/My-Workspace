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

it('menghapus catatan', function () {
    $note = Note::create([
        'title' => 'Akan dihapus',
        'content' => 'Isi.',
        'tags' => [],
    ]);

    $this->actingAs(adminUser())
        ->delete("/admin/notes/{$note->id}")
        ->assertRedirect(route('admin.notes.index'));

    expect(Note::count())->toBe(0);
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

it('menghapus tautan saat catatan dihapus', function () {
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

    expect(DB::table('note_work_item')->count())->toBe(0)
        ->and(WorkItem::count())->toBe(1);
});

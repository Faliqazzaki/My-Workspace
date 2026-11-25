<?php

use App\Models\Note;
use App\Models\WorkItem;

it('mengalihkan tamu dari endpoint pencarian', function () {
    $this->getJson('/admin/search?q=laravel')->assertRedirect(route('home'));
});

it('mengembalikan hasil kosong untuk query kosong', function () {
    Note::create([
        'title' => 'Catatan Laravel',
        'content' => 'Isi catatan.',
    ]);

    $this->actingAs(adminUser())
        ->getJson('/admin/search?q=')
        ->assertOk()
        ->assertJson([
            'notes' => [],
            'workItems' => [],
        ]);
});

it('mencari catatan dan pekerjaan lintas model', function () {
    $note = Note::create([
        'title' => 'Belajar Laravel',
        'content' => 'Catatan tentang Eloquent.',
        'tags' => ['laravel'],
    ]);
    Note::create([
        'title' => 'Resep sarapan',
        'content' => 'Telur dan roti.',
    ]);

    $workItem = WorkItem::create([
        'title' => 'Riset Laravel',
        'description' => 'Membaca dokumentasi.',
        'status' => 'todo',
        'priority' => 'high',
    ]);
    WorkItem::create([
        'title' => 'Bersihkan gudang',
        'description' => 'Akhir pekan.',
        'status' => 'backlog',
        'priority' => 'low',
    ]);

    $this->actingAs(adminUser())
        ->getJson('/admin/search?q=laravel')
        ->assertOk()
        ->assertJsonCount(1, 'notes')
        ->assertJsonPath('notes.0.id', $note->id)
        ->assertJsonPath('notes.0.title', 'Belajar Laravel')
        ->assertJsonCount(1, 'workItems')
        ->assertJsonPath('workItems.0.id', $workItem->id)
        ->assertJsonPath('workItems.0.status', 'todo');
});

it('mencari di isi catatan dan deskripsi pekerjaan tanpa membedakan huruf besar', function () {
    $note = Note::create([
        'title' => 'Catatan harian',
        'content' => 'Hari ini belajar PostgreSQL.',
    ]);

    $workItem = WorkItem::create([
        'title' => 'Tugas mingguan',
        'description' => 'Optimasi query POSTGRESQL.',
        'status' => 'in_progress',
        'priority' => 'medium',
    ]);

    $this->actingAs(adminUser())
        ->getJson('/admin/search?q=postgresql')
        ->assertOk()
        ->assertJsonCount(1, 'notes')
        ->assertJsonPath('notes.0.id', $note->id)
        ->assertJsonCount(1, 'workItems')
        ->assertJsonPath('workItems.0.id', $workItem->id);
});

it('tidak menampilkan catatan yang sudah diarsipkan', function () {
    $note = Note::create([
        'title' => 'Catatan Laravel lama',
        'content' => 'Sudah tidak dipakai.',
    ]);
    $note->delete();

    $this->actingAs(adminUser())
        ->getJson('/admin/search?q=laravel')
        ->assertOk()
        ->assertJsonCount(0, 'notes');
});

it('membatasi jumlah hasil pencarian per model', function () {
    foreach (range(1, 7) as $index) {
        Note::create([
            'title' => "Catatan Laravel {$index}",
            'content' => 'Isi.',
        ]);

        WorkItem::create([
            'title' => "Pekerjaan Laravel {$index}",
            'status' => 'backlog',
            'priority' => 'medium',
        ]);
    }

    $this->actingAs(adminUser())
        ->getJson('/admin/search?q=laravel')
        ->assertOk()
        ->assertJsonCount(5, 'notes')
        ->assertJsonCount(5, 'workItems');
});

<?php

use App\Models\SavedView;
use Inertia\Testing\AssertableInertia as Assert;

it('mengalihkan tamu dari aksi tampilan tersimpan', function () {
    $savedView = SavedView::create([
        'name' => 'Mendesak',
        'filters' => ['priority' => 'urgent'],
    ]);

    $this->post('/admin/work-items/views', ['name' => 'Baru'])
        ->assertRedirect(route('home'));

    $this->delete("/admin/work-items/views/{$savedView->id}")
        ->assertRedirect(route('home'));

    expect(SavedView::count())->toBe(1);
});

it('menampilkan tampilan tersimpan pada halaman pekerjaan', function () {
    SavedView::create([
        'name' => 'Fokus papan',
        'filters' => ['priority' => 'high', 'view' => 'board'],
    ]);

    $this->actingAs(adminUser())
        ->get('/admin/work-items')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/work-items/index')
            ->has('savedViews', 1)
            ->where('savedViews.0.name', 'Fokus papan')
            ->where('savedViews.0.filters.priority', 'high')
            ->where('savedViews.0.filters.view', 'board')
        );
});

it('menyimpan tampilan dengan filter yang sudah dinormalisasi', function () {
    $this->actingAs(adminUser())
        ->from('/admin/work-items?priority=high&view=board')
        ->post('/admin/work-items/views', [
            'name' => '  Mendesak di papan  ',
            'filters' => [
                'q' => '',
                'status' => '',
                'priority' => 'high',
                'project' => 'none',
                'view' => 'board',
            ],
        ])
        ->assertRedirect('/admin/work-items?priority=high&view=board')
        ->assertSessionHas('success');

    $savedView = SavedView::firstOrFail();

    expect($savedView->name)->toBe('Mendesak di papan')
        ->and($savedView->filters)->toBe([
            'priority' => 'high',
            'project' => 'none',
            'view' => 'board',
        ]);
});

it('menyimpan tampilan daftar tanpa menyertakan view default', function () {
    $this->actingAs(adminUser())
        ->post('/admin/work-items/views', [
            'name' => 'Riset',
            'filters' => [
                'q' => 'riset',
                'view' => 'list',
            ],
        ]);

    expect(SavedView::firstOrFail()->filters)->toBe(['q' => 'riset']);
});

it('memvalidasi nama unik dan nilai filter', function () {
    SavedView::create([
        'name' => 'Sudah ada',
        'filters' => ['priority' => 'low'],
    ]);

    $this->actingAs(adminUser())
        ->post('/admin/work-items/views', [
            'name' => 'Sudah ada',
            'filters' => ['priority' => 'low'],
        ])
        ->assertSessionHasErrors('name');

    $this->actingAs(adminUser())
        ->post('/admin/work-items/views', [
            'name' => 'Filter salah',
            'filters' => [
                'status' => 'selesai',
                'priority' => 'tinggi',
                'project' => 'proyek-a',
                'view' => 'grid',
            ],
        ])
        ->assertSessionHasErrors([
            'filters.status',
            'filters.priority',
            'filters.project',
            'filters.view',
        ]);

    expect(SavedView::count())->toBe(1);
});

it('menghapus tampilan tersimpan', function () {
    $savedView = SavedView::create([
        'name' => 'Sementara',
        'filters' => ['status' => 'todo'],
    ]);

    $this->actingAs(adminUser())
        ->from('/admin/work-items?status=todo')
        ->delete("/admin/work-items/views/{$savedView->id}")
        ->assertRedirect('/admin/work-items?status=todo')
        ->assertSessionHas('success');

    expect(SavedView::count())->toBe(0);
});

<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

it('menampilkan halaman login admin', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/admin-login'));
});

it('menolak kredensial yang salah', function () {
    adminUser(['username' => 'my-workspace', 'password' => 'admin123']);

    $this->post('/masuk', [
        'username' => 'my-workspace',
        'password' => 'password-salah',
    ])->assertSessionHasErrors('username');

    $this->assertGuest();
    $this->get('/admin')->assertRedirect(route('home'));
});

it('mengizinkan admin masuk dengan kredensial yang benar', function () {
    $admin = adminUser(['username' => 'my-workspace', 'password' => 'admin123']);

    $this->post('/masuk', [
        'username' => 'my-workspace',
        'password' => 'admin123',
    ])->assertRedirect(route('admin.index'));

    $this->assertAuthenticatedAs($admin);

    $this->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/index')
            ->where('admin.username', 'my-workspace')
        );
});

it('menolak pengguna yang bukan admin', function () {
    User::factory()->create([
        'username' => 'pengguna-biasa',
        'password' => 'rahasia123',
    ]);

    $this->post('/masuk', [
        'username' => 'pengguna-biasa',
        'password' => 'rahasia123',
    ])->assertSessionHasErrors('username');

    $this->assertGuest();
});

it('mengeluarkan admin dan melindungi halaman admin', function () {
    $admin = adminUser(['username' => 'my-workspace', 'password' => 'admin123']);

    $this->actingAs($admin)
        ->post('/keluar')
        ->assertRedirect(route('home'));

    $this->assertGuest();
    $this->get('/admin')->assertRedirect(route('home'));
});

it('melindungi halaman ubah password', function () {
    $this->get('/admin/password')->assertRedirect(route('home'));
});

it('memperbarui password admin', function () {
    $admin = adminUser(['username' => 'my-workspace', 'password' => 'admin123']);

    $this->actingAs($admin)
        ->from('/admin/password')
        ->put('/admin/password', [
            'current_password' => 'admin123',
            'password' => 'password-baru-123',
            'password_confirmation' => 'password-baru-123',
        ])
        ->assertRedirect('/admin/password')
        ->assertSessionHas('success');

    expect(Hash::check('password-baru-123', $admin->fresh()->password))
        ->toBeTrue();
});

it('menolak password saat ini yang salah', function () {
    $admin = adminUser(['username' => 'my-workspace', 'password' => 'admin123']);

    $this->actingAs($admin)
        ->from('/admin/password')
        ->put('/admin/password', [
            'current_password' => 'password-salah',
            'password' => 'password-baru-123',
            'password_confirmation' => 'password-baru-123',
        ])
        ->assertSessionHasErrors('current_password');

    expect(Hash::check('admin123', $admin->fresh()->password))->toBeTrue();
});

it('menolak konfirmasi password yang tidak cocok', function () {
    $admin = adminUser(['username' => 'my-workspace', 'password' => 'admin123']);

    $this->actingAs($admin)
        ->from('/admin/password')
        ->put('/admin/password', [
            'current_password' => 'admin123',
            'password' => 'password-baru-123',
            'password_confirmation' => 'password-lain-123',
        ])
        ->assertSessionHasErrors('password');

    expect(Hash::check('admin123', $admin->fresh()->password))->toBeTrue();
});

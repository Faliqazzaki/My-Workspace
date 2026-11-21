<?php

use Inertia\Testing\AssertableInertia as Assert;

it('menampilkan halaman login admin', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/admin-login'));
});

it('menolak kredensial yang salah', function () {
    $this->post('/masuk', [
        'username' => 'my-workspace',
        'password' => 'password-salah',
    ])->assertSessionHasErrors('username');

    $this->get('/admin')->assertRedirect(route('home'));
});

it('mengizinkan admin masuk dengan kredensial yang benar', function () {
    $this->post('/masuk', [
        'username' => 'my-workspace',
        'password' => 'admin123',
    ])->assertRedirect(route('admin.index'));

    $this->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/index')
            ->where('admin.username', 'my-workspace')
        );
});

it('mengeluarkan admin dan melindungi halaman admin', function () {
    $this->withSession([
        'admin_authenticated' => true,
        'admin_username' => 'my-workspace',
    ]);

    $this->post('/keluar')->assertRedirect(route('home'));

    $this->get('/admin')->assertRedirect(route('home'));
});

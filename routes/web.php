<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [AdminAuthController::class, 'showLogin'])->name('home');

Route::post('/masuk', [AdminAuthController::class, 'login'])
    ->middleware('throttle:10,1')
    ->name('admin.login');

Route::post('/keluar', [AdminAuthController::class, 'logout'])
    ->name('admin.logout');

Route::get('/admin', [AdminController::class, 'index'])
    ->middleware('admin.auth')
    ->name('admin.index');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__.'/settings.php';

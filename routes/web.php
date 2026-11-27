<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminPasswordController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SavedViewController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\WorkItemController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [AdminAuthController::class, 'showLogin'])->name('home');

Route::post('/masuk', [AdminAuthController::class, 'login'])
    ->middleware('throttle:10,1')
    ->name('admin.login');

Route::post('/keluar', [AdminAuthController::class, 'logout'])
    ->name('admin.logout');

Route::prefix('admin')->name('admin.')->middleware('admin.auth')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('index');

    Route::get('/search', [SearchController::class, 'index'])->name('search');

    Route::get('/password', [AdminPasswordController::class, 'edit'])->name('password.edit');
    Route::put('/password', [AdminPasswordController::class, 'update'])->name('password.update');

    Route::get('/notes', [NoteController::class, 'index'])->name('notes.index');
    Route::get('/notes/{note}', [NoteController::class, 'show'])->name('notes.show');
    Route::post('/notes', [NoteController::class, 'store'])->name('notes.store');
    Route::put('/notes/{note}', [NoteController::class, 'update'])->name('notes.update');
    Route::patch('/notes/{note}/pin', [NoteController::class, 'togglePin'])->name('notes.pin');
    Route::patch('/notes/{note}/restore', [NoteController::class, 'restore'])->withTrashed()->name('notes.restore');
    Route::delete('/notes/{note}/work-items/{workItem}', [NoteController::class, 'detachWorkItem'])->name('notes.work-items.detach');
    Route::delete('/notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');

    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::put('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::patch('/projects/{project}/archive', [ProjectController::class, 'toggleArchive'])->name('projects.archive');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

    Route::get('/work-items', [WorkItemController::class, 'index'])->name('work-items.index');
    Route::post('/work-items/views', [SavedViewController::class, 'store'])->name('work-items.views.store');
    Route::delete('/work-items/views/{view}', [SavedViewController::class, 'destroy'])->name('work-items.views.destroy');
    Route::post('/work-items', [WorkItemController::class, 'store'])->name('work-items.store');
    Route::patch('/work-items/bulk-status', [WorkItemController::class, 'bulkStatus'])->name('work-items.bulk-status');
    Route::delete('/work-items/bulk', [WorkItemController::class, 'bulkDestroy'])->name('work-items.bulk-destroy');
    Route::put('/work-items/{workItem}', [WorkItemController::class, 'update'])->name('work-items.update');
    Route::patch('/work-items/{workItem}/status', [WorkItemController::class, 'updateStatus'])->name('work-items.status');
    Route::get('/work-items/{workItem}/activities', [WorkItemController::class, 'activities'])->name('work-items.activities');
    Route::delete('/work-items/{workItem}', [WorkItemController::class, 'destroy'])->name('work-items.destroy');
});

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__.'/settings.php';

<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\WorkItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(Request $request): Response
    {
        $statusCounts = WorkItem::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $activeWorkItems = WorkItem::query()
            ->whereIn('status', ['todo', 'in_progress'])
            ->orderByRaw('due_date IS NULL')
            ->orderBy('due_date')
            ->latest('created_at')
            ->limit(5)
            ->get();

        $recentNotes = Note::query()
            ->latest('updated_at')
            ->limit(4)
            ->get();

        return Inertia::render('admin/index', [
            'admin' => [
                'username' => $request->session()->get('admin_username', 'my-workspace'),
            ],
            'stats' => [
                'notes' => Note::count(),
                'workItems' => WorkItem::count(),
                'inProgress' => (int) ($statusCounts['in_progress'] ?? 0),
                'done' => (int) ($statusCounts['done'] ?? 0),
                'overdue' => WorkItem::query()
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<', today())
                    ->where('status', '!=', 'done')
                    ->count(),
            ],
            'statusCounts' => $statusCounts,
            'activeWorkItems' => $activeWorkItems,
            'recentNotes' => $recentNotes,
        ]);
    }
}

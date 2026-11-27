<?php

namespace App\Http\Controllers;

use App\Models\WorkItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class NotificationController extends Controller
{
    private const TIMEZONE = 'Asia/Jakarta';

    public function index(Request $request): JsonResponse
    {
        $now = Carbon::now(self::TIMEZONE);
        $today = $now->toDateString();
        $tomorrow = $now->copy()->addDay()->toDateString();

        $workItems = WorkItem::query()
            ->with('project:id,name,color')
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', $tomorrow)
            ->orderByRaw("CASE 
                WHEN due_date < '{$today}' THEN 1 
                WHEN due_date = '{$today}' THEN 2 
                ELSE 3 
            END")
            ->orderBy('due_date', 'asc')
            ->orderByRaw("CASE priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
                ELSE 5 
            END")
            ->orderBy('id', 'asc')
            ->limit(20)
            ->get();

        $notifications = $workItems->map(function (WorkItem $item) use ($today) {
            $dueDate = $item->due_date?->toDateString();
            $category = match (true) {
                $dueDate < $today => 'overdue',
                $dueDate === $today => 'today',
                default => 'tomorrow',
            };

            return [
                'id' => $item->id,
                'title' => $item->title,
                'status' => $item->status,
                'priority' => $item->priority,
                'due_date' => $dueDate,
                'category' => $category,
                'project' => $item->project ? [
                    'id' => $item->project->id,
                    'name' => $item->project->name,
                    'color' => $item->project->color,
                ] : null,
                'read_key' => $item->id.':'.$dueDate,
                'url' => '/admin/work-items?q='.urlencode($item->title),
            ];
        })->values();

        $groups = [
            'overdue' => $notifications->where('category', 'overdue')->values(),
            'today' => $notifications->where('category', 'today')->values(),
            'tomorrow' => $notifications->where('category', 'tomorrow')->values(),
        ];

        return response()->json([
            'items' => $notifications,
            'notifications' => $notifications,
            'data' => $notifications,
            'groups' => $groups,
            'counts' => [
                'total' => $notifications->count(),
                'overdue' => $groups['overdue']->count(),
                'today' => $groups['today']->count(),
                'tomorrow' => $groups['tomorrow']->count(),
            ],
            'meta' => [
                'timezone' => self::TIMEZONE,
                'today' => $today,
                'tomorrow' => $tomorrow,
            ],
        ]);
    }
}

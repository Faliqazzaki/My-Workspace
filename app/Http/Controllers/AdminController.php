<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\WorkItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    private const KNOWLEDGE_TIMEZONE = 'Asia/Jakarta';

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
            'knowledge' => $this->knowledgeHabit(),
        ]);
    }

    /**
     * Kebiasaan "1 Hari 1 Pengetahuan" dihitung dari tanggal catatan pada
     * zona waktu Asia/Jakarta. Satu hari tetap dihitung sekali walau ada
     * beberapa catatan, dan streak masih hidup jika catatan terakhir kemarin.
     *
     * @return array{has_note_today: bool, notes_today: int, streak: int, timezone: string}
     */
    private function knowledgeHabit(): array
    {
        $today = Date::now(self::KNOWLEDGE_TIMEZONE)->startOfDay();
        $todayDate = $today->toDateString();

        $noteDates = Note::query()
            ->pluck('created_at')
            ->map(fn ($createdAt) => $createdAt
                ->timezone(self::KNOWLEDGE_TIMEZONE)
                ->toDateString());

        $uniqueDates = $noteDates->unique();
        $hasNoteToday = $uniqueDates->contains($todayDate);

        $notesToday = $noteDates
            ->filter(fn (string $date) => $date === $todayDate)
            ->count();

        $cursor = $hasNoteToday ? $today : $today->subDay();
        $streak = 0;

        while ($uniqueDates->contains($cursor->toDateString())) {
            $streak++;
            $cursor = $cursor->subDay();
        }

        return [
            'has_note_today' => $hasNoteToday,
            'notes_today' => $notesToday,
            'streak' => $streak,
            'timezone' => self::KNOWLEDGE_TIMEZONE,
        ];
    }
}

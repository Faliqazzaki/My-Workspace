<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\WorkItem;
use Illuminate\Database\Eloquent\Collection;
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
            'knowledgeStats' => $this->knowledgeStats(),
            'activity' => $this->activitySeries(),
            'agenda' => $this->agendaSummary(),
        ]);
    }

    /**
     * Ringkasan agenda: pekerjaan belum selesai (status != 'done')
     * dengan tenggat hari ini dan minggu ini (Senin sampai Minggu),
     * dihitung dalam zona waktu Asia/Jakarta.
     *
     * @return array{
     *     today: Collection<int, WorkItem>,
     *     this_week: Collection<int, WorkItem>,
     *     today_date: string,
     *     start_of_week: string,
     *     end_of_week: string,
     *     timezone: string,
     * }
     */
    private function agendaSummary(): array
    {
        $now = Date::now(self::KNOWLEDGE_TIMEZONE);
        $todayDate = $now->toDateString();
        $startOfWeek = $now->copy()->startOfWeek()->toDateString();
        $endOfWeek = $now->copy()->endOfWeek()->toDateString();

        $todayItems = WorkItem::query()
            ->where('status', '!=', 'done')
            ->whereDate('due_date', $todayDate)
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
            ->latest('created_at')
            ->get();

        $thisWeekItems = WorkItem::query()
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '>=', $startOfWeek)
            ->whereDate('due_date', '<=', $endOfWeek)
            ->orderBy('due_date')
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
            ->latest('created_at')
            ->get();

        return [
            'today' => $todayItems,
            'this_week' => $thisWeekItems,
            'today_date' => $todayDate,
            'start_of_week' => $startOfWeek,
            'end_of_week' => $endOfWeek,
            'timezone' => self::KNOWLEDGE_TIMEZONE,
        ];
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

    /**
     * Aktivitas 30 hari terakhir (termasuk hari ini) dalam zona waktu
     * Asia/Jakarta: jumlah catatan dibuat dan pekerjaan diselesaikan per hari.
     * Hari tanpa aktivitas tetap dikirim dengan nilai nol agar grafik utuh.
     *
     * @return array{timezone: string, days: array<int, array{date: string, notes: int, completed: int}>}
     */
    private function activitySeries(): array
    {
        $today = Date::now(self::KNOWLEDGE_TIMEZONE)->startOfDay();
        $start = $today->subDays(29);
        $since = $start->utc()->toDateTimeString();

        $days = [];

        for ($offset = 0; $offset < 30; $offset++) {
            $date = $start->addDays($offset)->toDateString();
            $days[$date] = [
                'date' => $date,
                'notes' => 0,
                'completed' => 0,
            ];
        }

        Note::query()
            ->where('created_at', '>=', $since)
            ->pluck('created_at')
            ->each(function ($createdAt) use (&$days): void {
                $date = $createdAt
                    ->timezone(self::KNOWLEDGE_TIMEZONE)
                    ->toDateString();

                if (isset($days[$date])) {
                    $days[$date]['notes']++;
                }
            });

        WorkItem::query()
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $since)
            ->pluck('completed_at')
            ->each(function ($completedAt) use (&$days): void {
                $date = $completedAt
                    ->timezone(self::KNOWLEDGE_TIMEZONE)
                    ->toDateString();

                if (isset($days[$date])) {
                    $days[$date]['completed']++;
                }
            });

        return [
            'timezone' => self::KNOWLEDGE_TIMEZONE,
            'days' => array_values($days),
        ];
    }

    /**
     * Statistik pengetahuan: jumlah catatan aktif per minggu (8 minggu
     * terakhir, Senin–Minggu, zona Asia/Jakarta), tag teratas, total catatan
     * aktif, dan rata-rata catatan per minggu pada rentang yang sama.
     * Tag diagregasi di PHP dari kolom `tags` agar kompatibel PostgreSQL
     * dan SQLite tanpa memuat konten catatan.
     *
     * @return array{
     *     timezone: string,
     *     weeks: array<int, array{start: string, end: string, notes: int}>,
     *     top_tags: array<int, array{tag: string, count: int}>,
     *     total_notes: int,
     *     average_per_week: float,
     * }
     */
    private function knowledgeStats(): array
    {
        $timezone = self::KNOWLEDGE_TIMEZONE;
        $currentWeekStart = Date::now($timezone)->startOfDay()->startOfWeek();
        $firstWeekStart = $currentWeekStart->copy()->subWeeks(7);

        $weeks = [];

        for ($offset = 0; $offset < 8; $offset++) {
            $start = $firstWeekStart->copy()->addWeeks($offset);
            $weeks[$start->toDateString()] = [
                'start' => $start->toDateString(),
                'end' => $start->copy()->addWeek()->subDay()->toDateString(),
                'notes' => 0,
            ];
        }

        Note::query()
            ->where('created_at', '>=', $firstWeekStart->copy()->utc()->toDateTimeString())
            ->pluck('created_at')
            ->each(function ($createdAt) use (&$weeks, $timezone): void {
                $weekStart = $createdAt
                    ->copy()
                    ->timezone($timezone)
                    ->startOfWeek()
                    ->toDateString();

                if (isset($weeks[$weekStart])) {
                    $weeks[$weekStart]['notes']++;
                }
            });

        $tagCounts = [];

        Note::query()->pluck('tags')->each(function ($tags) use (&$tagCounts): void {
            foreach ((array) $tags as $tag) {
                $tag = trim((string) $tag);

                if ($tag !== '') {
                    $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
                }
            }
        });

        $topTags = collect($tagCounts)
            ->map(fn (int $count, string $tag) => ['tag' => $tag, 'count' => $count])
            ->sort(fn (array $a, array $b) => $b['count'] <=> $a['count'] ?: strcmp($a['tag'], $b['tag']))
            ->take(8)
            ->values()
            ->all();

        $weekTotal = array_sum(array_column($weeks, 'notes'));

        return [
            'timezone' => $timezone,
            'weeks' => array_values($weeks),
            'top_tags' => $topTags,
            'total_notes' => Note::count(),
            'average_per_week' => round($weekTotal / count($weeks), 1),
        ];
    }
}

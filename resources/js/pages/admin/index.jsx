import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Flame,
    NotebookPen,
    Plus,
    Tag,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate, formatLongDate, isOverdue } from '@/lib/date';
import { cn } from '@/lib/utils';
import { priorityMeta, statusMeta } from '@/lib/work-item-meta';

const statusOrder = ['backlog', 'todo', 'in_progress', 'done'];

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
});

const shortDate = (value) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    return shortDateFormatter.format(new Date(year, month - 1, day));
};

const activityBarHeight = (value, max) =>
    value === 0 ? 0 : Math.max((value / max) * 100, 5);

function StatCard({ label, value, hint, icon: Icon, tone }) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {value}
                    </p>
                </div>
                <span
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                        tone,
                    )}
                >
                    <Icon className="size-4" />
                </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
        </div>
    );
}

export default function Admin({
    admin,
    stats = {},
    statusCounts = {},
    activeWorkItems = [],
    recentNotes = [],
    knowledge = {},
    activity = {},
    agenda = {},
}) {
    const [activityRange, setActivityRange] = useState(7);
    const username = admin?.username ?? 'my-workspace';
    const hasNoteToday = Boolean(knowledge.has_note_today);
    const streak = Number(knowledge.streak ?? 0);
    const notesToday = Number(knowledge.notes_today ?? 0);
    const totalWorkItems = Number(stats.workItems ?? 0);
    const totalStatus = statusOrder.reduce(
        (total, status) => total + Number(statusCounts[status] ?? 0),
        0,
    );
    const agendaToday = agenda.today ?? [];
    const agendaThisWeek = agenda.this_week ?? [];

    const activityDays = activity.days ?? [];
    const visibleActivity = activityDays.slice(-activityRange);
    const activityMax = Math.max(
        1,
        ...visibleActivity.map((day) => Math.max(day.notes, day.completed)),
    );
    const rangeNotes = visibleActivity.reduce(
        (total, day) => total + day.notes,
        0,
    );
    const rangeCompleted = visibleActivity.reduce(
        (total, day) => total + day.completed,
        0,
    );

    return (
        <AdminLayout title="Beranda">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Halo, {username}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {formatLongDate()} · Ringkasan ruang kerjamu hari ini.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/notes">
                            <NotebookPen className="size-4" />
                            Catatan baru
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                    >
                        <Link href="/admin/work-items">
                            <Plus className="size-4" />
                            Pekerjaan baru
                        </Link>
                    </Button>
                </div>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Catatan"
                    value={stats.notes ?? 0}
                    hint="Tersimpan di ruang kerja"
                    icon={NotebookPen}
                    tone="bg-sky-500/10 text-sky-600 dark:text-sky-300"
                />
                <StatCard
                    label="Pekerjaan"
                    value={totalWorkItems}
                    hint={`${stats.done ?? 0} sudah selesai`}
                    icon={ClipboardList}
                    tone="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                />
                <StatCard
                    label="Dikerjakan"
                    value={stats.inProgress ?? 0}
                    hint="Sedang dalam proses"
                    icon={CheckCircle2}
                    tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                />
                <StatCard
                    label="Terlambat"
                    value={stats.overdue ?? 0}
                    hint="Lewat tenggat, belum selesai"
                    icon={AlertTriangle}
                    tone="bg-red-500/10 text-red-600 dark:text-red-300"
                />
            </section>

            <section
                className={cn(
                    'mt-6 rounded-xl border bg-card shadow-sm',
                    hasNoteToday
                        ? 'border-emerald-500/30'
                        : 'border-amber-500/30',
                )}
            >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-start gap-3">
                        <span
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                                hasNoteToday
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
                            )}
                        >
                            {hasNoteToday ? (
                                <CheckCircle2 className="size-5" />
                            ) : (
                                <Flame className="size-5" />
                            )}
                        </span>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-sm font-semibold">
                                    {hasNoteToday
                                        ? 'Hari ini sudah mencatat'
                                        : 'Hari ini belum mencatat'}
                                </h2>
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-300">
                                    <Flame className="size-3" />
                                    {streak > 0
                                        ? `${streak} hari beruntun`
                                        : 'Belum ada streak'}
                                </span>
                            </div>

                            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                                {hasNoteToday
                                    ? `Kamu sudah menulis ${notesToday} catatan hari ini. Pertahankan kebiasaan 1 Hari 1 Pengetahuan.`
                                    : streak > 0
                                      ? `Tulis satu catatan hari ini agar streak ${streak} hari tetap hidup.`
                                      : 'Mulai kebiasaan 1 Hari 1 Pengetahuan dengan satu catatan kecil hari ini.'}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground/80">
                                Dihitung per hari, zona waktu{' '}
                                {knowledge.timezone ?? 'Asia/Jakarta'}.
                            </p>
                        </div>
                    </div>

                    <Button
                        asChild
                        variant={hasNoteToday ? 'outline' : 'default'}
                        className={cn(
                            'shrink-0 gap-2',
                            !hasNoteToday &&
                                'bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100',
                        )}
                    >
                        <Link href="/admin/notes">
                            <NotebookPen className="size-4" />
                            {hasNoteToday
                                ? 'Tulis catatan lagi'
                                : 'Tulis catatan hari ini'}
                        </Link>
                    </Button>
                </div>
            </section>

            <section className="mt-4 rounded-xl border bg-card shadow-sm">
                <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                            <BarChart3 className="size-4 text-indigo-500" />
                            Grafik aktivitas
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {rangeNotes} catatan · {rangeCompleted} pekerjaan
                            selesai dalam {activityRange} hari terakhir
                        </p>
                    </div>

                    <div
                        className="inline-flex w-fit rounded-lg border bg-background p-0.5"
                        role="group"
                        aria-label="Rentang grafik aktivitas"
                    >
                        {[7, 30].map((value) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={activityRange === value}
                                onClick={() => setActivityRange(value)}
                                className={cn(
                                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                    activityRange === value
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                {value} hari
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-sky-500" />
                            Catatan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            Pekerjaan selesai
                        </span>
                        {rangeNotes + rangeCompleted === 0 && (
                            <span className="text-muted-foreground/80">
                                Belum ada aktivitas pada rentang ini.
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto pb-1">
                        <div
                            className={cn(
                                'flex min-w-full items-end gap-1 sm:gap-1.5',
                                activityRange === 30 && 'min-w-[560px]',
                            )}
                        >
                            {visibleActivity.map((day, index) => {
                                const showLabel =
                                    activityRange === 7 ||
                                    index % 5 === 0 ||
                                    index === visibleActivity.length - 1;
                                const label = `${formatDate(day.date)}: ${day.notes} catatan, ${day.completed} pekerjaan selesai`;

                                return (
                                    <div
                                        key={day.date}
                                        className="group flex min-w-0 flex-1 flex-col items-center gap-1"
                                        title={label}
                                        role="img"
                                        aria-label={label}
                                    >
                                        <div className="flex h-28 w-full items-end justify-center gap-[2px]">
                                            <span
                                                aria-hidden="true"
                                                className="w-1/2 max-w-1.5 rounded-t-sm bg-sky-500/80 transition-colors group-hover:bg-sky-500"
                                                style={{
                                                    height: `${activityBarHeight(day.notes, activityMax)}%`,
                                                }}
                                            />
                                            <span
                                                aria-hidden="true"
                                                className="w-1/2 max-w-1.5 rounded-t-sm bg-emerald-500/80 transition-colors group-hover:bg-emerald-500"
                                                style={{
                                                    height: `${activityBarHeight(day.completed, activityMax)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="h-4 text-center text-[9px] leading-4 text-muted-foreground tabular-nums">
                                            {showLabel
                                                ? shortDate(day.date)
                                                : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-4 rounded-xl border bg-card shadow-sm">
                <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                            <CalendarClock className="size-4 text-indigo-500" />
                            Ringkasan agenda
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Pekerjaan belum selesai dengan tenggat hari ini dan
                            minggu ini (Senin–Minggu)
                        </p>
                    </div>

                    <Link
                        href="/admin/work-items"
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        Lihat semua pekerjaan
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>

                <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                    <div className="p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                                    <CalendarClock className="size-4" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-semibold">
                                        Tenggat hari ini
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground">
                                        Jatuh tempo pada{' '}
                                        {formatDate(agenda.today_date)}
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                                {agendaToday.length}
                            </span>
                        </div>

                        {agendaToday.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <CalendarCheck className="size-4" />
                                </span>
                                <p className="mt-2 text-xs font-medium">
                                    Tidak ada tenggat hari ini
                                </p>
                                <p className="mt-0.5 max-w-xs text-[11px] text-muted-foreground">
                                    Semua pekerjaan hari ini bebas tenggat atau
                                    sudah selesai.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y rounded-lg border">
                                {agendaToday.map((item) => {
                                    const overdue = isOverdue(
                                        item.due_date,
                                        item.status,
                                    );

                                    return (
                                        <li
                                            key={item.id}
                                            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                                            statusMeta[
                                                                item.status
                                                            ]?.badge,
                                                        )}
                                                    >
                                                        {statusMeta[item.status]
                                                            ?.label ??
                                                            item.status}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                                            priorityMeta[
                                                                item.priority
                                                            ]?.badge,
                                                        )}
                                                    >
                                                        {priorityMeta[
                                                            item.priority
                                                        ]?.label ??
                                                            item.priority}
                                                    </span>
                                                </div>
                                                <Link
                                                    href="/admin/work-items"
                                                    className="mt-1 block truncate text-xs font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </Link>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'flex items-center gap-1 text-[11px]',
                                                        overdue
                                                            ? 'font-medium text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarDays className="size-3" />
                                                    {formatDate(item.due_date)}
                                                    {overdue && ' · terlambat'}
                                                </span>
                                                <Link
                                                    href="/admin/work-items"
                                                    className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    title="Buka daftar pekerjaan"
                                                    aria-label={`Buka daftar pekerjaan untuk ${item.title}`}
                                                >
                                                    <ArrowRight className="size-3.5" />
                                                </Link>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300">
                                    <CalendarDays className="size-4" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-semibold">
                                        Tenggat minggu ini
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground">
                                        Senin–Minggu (
                                        {formatDate(agenda.start_of_week)} –{' '}
                                        {formatDate(agenda.end_of_week)})
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-300">
                                {agendaThisWeek.length}
                            </span>
                        </div>

                        {agendaThisWeek.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                <span className="flex size-9 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    <CalendarDays className="size-4" />
                                </span>
                                <p className="mt-2 text-xs font-medium">
                                    Tidak ada tenggat minggu ini
                                </p>
                                <p className="mt-0.5 max-w-xs text-[11px] text-muted-foreground">
                                    Tidak ada pekerjaan belum selesai yang jatuh
                                    tempo minggu ini.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y rounded-lg border">
                                {agendaThisWeek.map((item) => {
                                    const overdue = isOverdue(
                                        item.due_date,
                                        item.status,
                                    );

                                    return (
                                        <li
                                            key={item.id}
                                            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                                            statusMeta[
                                                                item.status
                                                            ]?.badge,
                                                        )}
                                                    >
                                                        {statusMeta[item.status]
                                                            ?.label ??
                                                            item.status}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                                            priorityMeta[
                                                                item.priority
                                                            ]?.badge,
                                                        )}
                                                    >
                                                        {priorityMeta[
                                                            item.priority
                                                        ]?.label ??
                                                            item.priority}
                                                    </span>
                                                </div>
                                                <Link
                                                    href="/admin/work-items"
                                                    className="mt-1 block truncate text-xs font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </Link>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'flex items-center gap-1 text-[11px]',
                                                        overdue
                                                            ? 'font-medium text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarDays className="size-3" />
                                                    {formatDate(item.due_date)}
                                                    {overdue && ' · terlambat'}
                                                </span>
                                                <Link
                                                    href="/admin/work-items"
                                                    className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    title="Buka daftar pekerjaan"
                                                    aria-label={`Buka daftar pekerjaan untuk ${item.title}`}
                                                >
                                                    <ArrowRight className="size-3.5" />
                                                </Link>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </section>

            <div className="mt-6 grid gap-4 lg:grid-cols-5">
                <section className="rounded-xl border bg-card shadow-sm lg:col-span-3">
                    <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Pekerjaan aktif
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                To do dan yang sedang dikerjakan
                            </p>
                        </div>
                        <Link
                            href="/admin/work-items"
                            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                            Lihat semua
                            <ArrowRight className="size-3.5" />
                        </Link>
                    </div>

                    {activeWorkItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                            <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                <ClipboardList className="size-5" />
                            </span>
                            <p className="mt-4 text-sm font-medium">
                                Belum ada pekerjaan aktif
                            </p>
                            <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                                Tambahkan pekerjaan atau ubah statusnya menjadi
                                To do / Dikerjakan.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {activeWorkItems.map((workItem) => {
                                const overdue = isOverdue(
                                    workItem.due_date,
                                    workItem.status,
                                );

                                return (
                                    <li
                                        key={workItem.id}
                                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                                                        statusMeta[
                                                            workItem.status
                                                        ]?.badge,
                                                    )}
                                                >
                                                    {statusMeta[workItem.status]
                                                        ?.label ??
                                                        workItem.status}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                                                        priorityMeta[
                                                            workItem.priority
                                                        ]?.badge,
                                                    )}
                                                >
                                                    {priorityMeta[
                                                        workItem.priority
                                                    ]?.label ??
                                                        workItem.priority}
                                                </span>
                                            </div>
                                            <p className="mt-1.5 truncate text-sm font-medium">
                                                {workItem.title}
                                            </p>
                                        </div>

                                        {workItem.due_date && (
                                            <span
                                                className={cn(
                                                    'flex shrink-0 items-center gap-1 text-xs',
                                                    overdue
                                                        ? 'font-medium text-red-600 dark:text-red-400'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                <CalendarDays className="size-3.5" />
                                                {formatDate(workItem.due_date)}
                                                {overdue && ' · terlambat'}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border bg-card shadow-sm lg:col-span-2">
                    <div className="border-b px-4 py-3 sm:px-5">
                        <h2 className="text-sm font-semibold">
                            Distribusi status
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {totalStatus} pekerjaan tercatat
                        </p>
                    </div>

                    <div className="space-y-4 p-4 sm:p-5">
                        {statusOrder.map((status) => {
                            const count = Number(statusCounts[status] ?? 0);
                            const percent =
                                totalStatus > 0
                                    ? Math.round((count / totalStatus) * 100)
                                    : 0;

                            return (
                                <div key={status}>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium">
                                            {statusMeta[status].label}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {count} · {percent}%
                                        </span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all',
                                                statusMeta[status].bar,
                                            )}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            <section className="mt-4 rounded-xl border bg-card shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
                    <div>
                        <h2 className="text-sm font-semibold">
                            Catatan terbaru
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Terakhir diperbarui
                        </p>
                    </div>
                    <Link
                        href="/admin/notes"
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        Lihat semua
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>

                {recentNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                            <NotebookPen className="size-5" />
                        </span>
                        <p className="mt-4 text-sm font-medium">
                            Belum ada catatan
                        </p>
                        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                            Simpan ide, riset, atau hal penting pertamamu.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                        {recentNotes.map((note) => (
                            <article
                                key={note.id}
                                className="bg-card p-4 sm:p-5"
                            >
                                <h3 className="line-clamp-2 text-sm font-medium">
                                    {note.title}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                    {note.content}
                                </p>
                                {note.tags?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {note.tags.slice(0, 3).map((tag) => (
                                            <span
                                                key={tag}
                                                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                                            >
                                                <Tag className="size-3" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="mt-3 text-[11px] text-muted-foreground">
                                    {formatDate(note.updated_at)}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}

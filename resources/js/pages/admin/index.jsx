import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    NotebookPen,
    Plus,
    Tag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate, formatLongDate, isOverdue } from '@/lib/date';
import { cn } from '@/lib/utils';
import { priorityMeta, statusMeta } from '@/lib/work-item-meta';

const statusOrder = ['backlog', 'todo', 'in_progress', 'done'];

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
}) {
    const username = admin?.username ?? 'my-workspace';
    const totalWorkItems = Number(stats.workItems ?? 0);
    const totalStatus = statusOrder.reduce(
        (total, status) => total + Number(statusCounts[status] ?? 0),
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
                        className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
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

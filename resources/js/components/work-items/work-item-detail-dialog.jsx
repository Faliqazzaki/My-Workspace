import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Circle,
    NotebookPen,
    Pencil,
    Tag,
} from 'lucide-react';

import MarkdownContent from '@/components/markdown-content';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, isOverdue } from '@/lib/date';
import { cn } from '@/lib/utils';
import { priorityMeta, statusMeta } from '@/lib/work-item-meta';

export default function WorkItemDetailDialog({ workItem, onClose, onEdit }) {
    const status = workItem ? statusMeta[workItem.status] : null;
    const priority = workItem ? priorityMeta[workItem.priority] : null;
    const subtasks = workItem?.subtasks ?? [];
    const doneSubtasks = subtasks.filter((subtask) => subtask.is_done).length;
    const overdue = workItem
        ? isOverdue(workItem.due_date, workItem.status)
        : false;

    return (
        <Dialog
            open={Boolean(workItem)}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                {workItem && (
                    <>
                        <DialogHeader className="gap-3">
                            <div className="flex flex-wrap items-center gap-2 pr-8">
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                                        status?.badge,
                                    )}
                                >
                                    {status?.label ?? workItem.status}
                                </span>
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                                        priority?.badge,
                                    )}
                                >
                                    {priority?.label ?? workItem.priority}
                                </span>
                            </div>
                            <DialogTitle className="text-xl leading-snug">
                                {workItem.title}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Detail pekerjaan {workItem.title}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            {workItem.project && (
                                <span className="flex items-center gap-1.5">
                                    <span
                                        className="size-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                workItem.project.color ??
                                                '#6366f1',
                                        }}
                                    />
                                    {workItem.project.name}
                                </span>
                            )}

                            {workItem.due_date && (
                                <span
                                    className={cn(
                                        'flex items-center gap-1.5',
                                        overdue &&
                                            'font-medium text-red-600 dark:text-red-400',
                                    )}
                                >
                                    <CalendarDays className="size-3.5" />
                                    {formatDate(workItem.due_date)}
                                    {overdue && ' · terlambat'}
                                </span>
                            )}

                            {workItem.created_at && (
                                <span>
                                    Dibuat {formatDate(workItem.created_at)}
                                </span>
                            )}
                        </div>

                        <section>
                            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Deskripsi
                            </h3>
                            {workItem.description ? (
                                <MarkdownContent
                                    content={workItem.description}
                                    className="mt-2"
                                />
                            ) : (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Belum ada deskripsi.
                                </p>
                            )}
                        </section>

                        {subtasks.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Checklist
                                    </h3>
                                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                        {doneSubtasks}/{subtasks.length}
                                    </span>
                                </div>

                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            doneSubtasks === subtasks.length
                                                ? 'bg-emerald-500'
                                                : 'bg-indigo-500',
                                        )}
                                        style={{
                                            width: `${Math.round(
                                                (doneSubtasks /
                                                    subtasks.length) *
                                                    100,
                                            )}%`,
                                        }}
                                    />
                                </div>

                                <ul className="mt-3 space-y-1.5">
                                    {subtasks.map((subtask) => (
                                        <li
                                            key={subtask.id}
                                            className="flex items-start gap-2 text-sm"
                                        >
                                            {subtask.is_done ? (
                                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                                            ) : (
                                                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                                            )}
                                            <span
                                                className={cn(
                                                    subtask.is_done &&
                                                        'text-muted-foreground line-through',
                                                )}
                                            >
                                                {subtask.title}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {workItem.tags?.length > 0 && (
                            <section>
                                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Tag
                                </h3>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {workItem.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                                        >
                                            <Tag className="size-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {workItem.notes?.length > 0 && (
                            <section>
                                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Catatan terkait
                                </h3>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {workItem.notes.map((note) => (
                                        <Link
                                            key={note.id}
                                            href={`/admin/notes/${note.id}`}
                                            className="flex max-w-full items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 dark:text-indigo-400"
                                        >
                                            <NotebookPen className="size-3 shrink-0" />
                                            <span className="truncate">
                                                {note.title}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Tutup
                            </Button>
                            <Button
                                type="button"
                                onClick={onEdit}
                                className="gap-2 bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                            >
                                <Pencil className="size-4" />
                                Edit pekerjaan
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

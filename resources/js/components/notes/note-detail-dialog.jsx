import { Link } from '@inertiajs/react';
import {
    Archive,
    CalendarDays,
    ClipboardList,
    Clock,
    ExternalLink,
    NotebookPen,
    Pencil,
    Pin,
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
import { formatDate } from '@/lib/date';

export default function NoteDetailDialog({ note, onClose, onEdit }) {
    const archived = Boolean(note?.deleted_at);
    const createdAt = note ? formatDate(note.created_at) : '';
    const updatedAt = note ? formatDate(note.updated_at) : '';

    return (
        <Dialog
            open={Boolean(note)}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                {note && (
                    <>
                        <DialogHeader className="gap-3">
                            <div className="flex flex-wrap items-center gap-2 pr-8">
                                {archived ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-300">
                                        <Archive className="size-3" />
                                        Diarsipkan
                                    </span>
                                ) : note.is_pinned ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                        <Pin className="size-3 fill-current" />
                                        Disematkan
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                        <NotebookPen className="size-3" />
                                        Catatan
                                    </span>
                                )}
                            </div>
                            <DialogTitle className="text-xl leading-snug">
                                {note.title}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Detail catatan {note.title}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-3.5" />
                                Dibuat {createdAt}
                            </span>
                            {updatedAt !== createdAt && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="size-3.5" />
                                    Diperbarui {updatedAt}
                                </span>
                            )}
                            {note.work_items_count > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                    <ClipboardList className="size-3.5" />
                                    {note.work_items_count} pekerjaan terkait
                                </span>
                            )}
                        </div>

                        {note.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {note.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <section>
                            <div className="mb-3 flex items-center gap-2 border-b pb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <NotebookPen className="size-3.5 text-indigo-500" />
                                Catatan Markdown
                            </div>
                            <MarkdownContent content={note.content} />
                        </section>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Tutup
                            </Button>
                            {!archived && (
                                <>
                                    <Button variant="outline" asChild>
                                        <Link
                                            href={`/admin/notes/${note.id}`}
                                            className="gap-2"
                                        >
                                            <ExternalLink className="size-4" />
                                            Buka halaman
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={onEdit}
                                        className="gap-2 bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                                    >
                                        <Pencil className="size-4" />
                                        Edit catatan
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    NotebookPen,
    Pencil,
    Pin,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import MarkdownContent from '@/components/markdown-content';
import NoteEditorDialog from '@/components/notes/note-editor-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/date';

export default function NoteShow({ note }) {
    const [editorOpen, setEditorOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const confirmDelete = () => {
        router.delete(`/admin/notes/${note.id}`, {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    const createdAt = formatDate(note.created_at);
    const updatedAt = formatDate(note.updated_at);

    return (
        <AdminLayout title="Catatan">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <Link
                        href="/admin/notes"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke catatan
                    </Link>

                    <h1 className="mt-3 flex flex-wrap items-center gap-2.5 text-2xl font-bold tracking-tight break-words">
                        <span>{note.title}</span>
                        {note.is_pinned && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                <Pin className="size-3 fill-current" />
                                Disematkan
                            </span>
                        )}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
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
                    </div>

                    {note.tags?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {note.tags.map((tag) => (
                                <Link
                                    key={tag}
                                    href={`/admin/notes?tag=${encodeURIComponent(tag)}`}
                                    className="rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditorOpen(true)}
                        className="gap-2"
                    >
                        <Pencil className="size-4" />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeleteOpen(true)}
                        className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                        <Trash2 className="size-4" />
                        Hapus
                    </Button>
                </div>
            </div>

            <article className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
                <div className="mb-6 flex items-center gap-2 border-b pb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    <NotebookPen className="size-3.5 text-indigo-500" />
                    Catatan Markdown
                </div>
                <MarkdownContent content={note.content} />
            </article>

            {editorOpen && (
                <NoteEditorDialog
                    open
                    onOpenChange={setEditorOpen}
                    note={note}
                />
            )}

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus catatan?</DialogTitle>
                        <DialogDescription>
                            “{note.title}” akan dihapus permanen. Tindakan ini
                            tidak bisa dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            <Trash2 className="size-4" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

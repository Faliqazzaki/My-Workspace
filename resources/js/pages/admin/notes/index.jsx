import { Link, router } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    NotebookPen,
    Pencil,
    Pin,
    PinOff,
    Plus,
    RotateCcw,
    Search,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const formatDate = (value) => {
    return value ? dateFormatter.format(new Date(value)) : '';
};

const excerpt = (content = '') => {
    const clean = content.replace(/\s+/g, ' ').trim();

    return clean.length > 180 ? `${clean.slice(0, 180)}…` : clean;
};

export default function NotesIndex({
    notes,
    tags = [],
    archivedCount = 0,
    filters = {},
}) {
    const archived = Boolean(filters.archived);
    const queryParam = filters.q ?? '';
    const [search, setSearch] = useState(queryParam);
    const [syncedQuery, setSyncedQuery] = useState(queryParam);
    const [editor, setEditor] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const isFirstRender = useRef(true);

    if (queryParam !== syncedQuery) {
        setSyncedQuery(queryParam);
        setSearch(queryParam);
    }

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (search === queryParam) {
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/admin/notes',
                {
                    q: search || undefined,
                    tag: filters.tag || undefined,
                    archived: archived ? 1 : undefined,
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, queryParam, filters.tag, archived]);

    const openCreate = () => setEditor({ note: null });

    const openEdit = (note) => setEditor({ note });

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(`/admin/notes/${deleting.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const togglePin = (note) => {
        router.patch(
            `/admin/notes/${note.id}/pin`,
            {},
            { preserveScroll: true },
        );
    };

    const applySearch = (event) => {
        event.preventDefault();

        if (search === (filters.q ?? '')) {
            return;
        }

        router.get(
            '/admin/notes',
            {
                q: search || undefined,
                tag: filters.tag || undefined,
                archived: archived ? 1 : undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const handleClearSearch = () => {
        setSearch('');
        if (!filters.q) {
            return;
        }
        router.get(
            '/admin/notes',
            {
                tag: filters.tag || undefined,
                archived: archived ? 1 : undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const applyTag = (tag) => {
        router.get(
            '/admin/notes',
            {
                q: search || undefined,
                tag: filters.tag === tag ? undefined : tag,
                archived: archived ? 1 : undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        router.get(
            '/admin/notes',
            { archived: archived ? 1 : undefined },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const switchArchive = (nextArchived) => {
        if (nextArchived === archived) {
            return;
        }

        setSearch('');
        router.get('/admin/notes', nextArchived ? { archived: 1 } : {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const restoreNote = (note) => {
        router.patch(
            `/admin/notes/${note.id}/restore`,
            {},
            { preserveScroll: true },
        );
    };

    const hasFilters = Boolean(filters.q || filters.tag);

    return (
        <AdminLayout title="Catatan">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                        <span>{archived ? 'Arsip catatan' : 'Catatan'}</span>
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {notes.total ?? 0}
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {archived
                            ? 'Catatan yang diarsipkan tetap tersimpan dan bisa dipulihkan kapan saja.'
                            : 'Simpan pengetahuan, ide, dan kebutuhanmu di satu tempat yang mudah diakses.'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className="inline-flex rounded-lg border bg-card p-0.5"
                        role="group"
                        aria-label="Mode catatan"
                    >
                        <button
                            type="button"
                            aria-pressed={!archived}
                            onClick={() => switchArchive(false)}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                !archived
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <NotebookPen className="size-3.5" />
                            Aktif
                        </button>
                        <button
                            type="button"
                            aria-pressed={archived}
                            onClick={() => switchArchive(true)}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                archived
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Archive className="size-3.5" />
                            Arsip
                            {archivedCount > 0 && (
                                <span
                                    className={cn(
                                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                                        archived
                                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    {archivedCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {!archived && (
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="h-10 gap-2 bg-neutral-900 px-4 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                        >
                            <Plus className="size-4" />
                            <span>Catatan baru</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mb-6 rounded-2xl border bg-card/90 p-4 shadow-xs backdrop-blur-xs">
                <form
                    onSubmit={applySearch}
                    className="flex items-center gap-2"
                >
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="masukkan kata kunci pencarian..."
                            className="h-10 bg-background pr-9 pl-10 transition-colors"
                            aria-label="Cari catatan"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Hapus teks pencarian"
                                title="Hapus teks"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {hasFilters && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearFilters}
                            className="h-10 shrink-0 gap-1.5 border-dashed text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Reset filter dan pencarian"
                        >
                            <RotateCcw className="size-3.5 shrink-0" />
                            <span>Reset</span>
                        </Button>
                    )}
                </form>

                {tags.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t pt-3">
                        <span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Tag className="size-3.5 text-indigo-500" />
                            Filter Tag:
                        </span>
                        <button
                            type="button"
                            onClick={() => applyTag(undefined)}
                            className={cn(
                                'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                                !filters.tag
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            Semua
                        </button>
                        {tags.map((tag) => {
                            const active = filters.tag === tag;
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() =>
                                        applyTag(active ? undefined : tag)
                                    }
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                                        active
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'border border-border/70 bg-background text-muted-foreground hover:border-indigo-500/40 hover:bg-indigo-50/50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300',
                                    )}
                                >
                                    #{tag}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {notes.data.length === 0 ? (
                <div className="flex min-h-[44vh] flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 p-10 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        {archived ? (
                            <Archive className="size-7" />
                        ) : (
                            <NotebookPen className="size-7" />
                        )}
                    </span>
                    <h2 className="mt-5 text-lg font-semibold tracking-tight">
                        {hasFilters
                            ? archived
                                ? 'Tidak ada arsip yang cocok'
                                : 'Tidak ada catatan yang cocok'
                            : archived
                              ? 'Arsip kosong'
                              : 'Belum ada catatan'}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {hasFilters
                            ? 'Coba kata kunci atau tag lain, atau klik reset untuk melihat semua catatan.'
                            : archived
                              ? 'Catatan yang kamu arsipkan akan muncul di sini dan bisa dipulihkan kapan saja.'
                              : 'Mulai dari satu catatan kecil. Pengetahuan yang dicatat hari ini akan berguna nanti.'}
                    </p>
                    {hasFilters ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-5 gap-1.5 border-dashed"
                            onClick={clearFilters}
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Reset filter</span>
                        </Button>
                    ) : archived ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-5 gap-1.5"
                            onClick={() => switchArchive(false)}
                        >
                            <ArchiveRestore className="size-3.5" />
                            <span>Kembali ke catatan</span>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            className="mt-5 gap-2 bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                            onClick={openCreate}
                        >
                            <Plus className="size-4" />
                            <span>Buat catatan pertama</span>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {notes.data.map((note) => (
                        <article
                            key={note.id}
                            className={cn(
                                'group relative flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                                note.is_pinned
                                    ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-500/[0.03] to-card ring-1 ring-indigo-500/20'
                                    : 'hover:border-indigo-500/40',
                            )}
                        >
                            <div className="mb-2.5 flex items-center justify-between gap-2">
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

                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <CalendarDays className="size-3" />
                                    {formatDate(
                                        archived
                                            ? note.deleted_at
                                            : note.updated_at,
                                    )}
                                </span>
                            </div>

                            <h2 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {archived ? (
                                    note.title
                                ) : (
                                    <Link href={`/admin/notes/${note.id}`}>
                                        {note.title}
                                    </Link>
                                )}
                            </h2>

                            <p className="mt-2 line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                {excerpt(note.content)}
                            </p>

                            {note.tags?.length > 0 && (
                                <div className="mt-3.5 flex flex-wrap gap-1.5">
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

                            {note.work_items_count > 0 && (
                                <p className="mt-2.5 inline-flex w-fit items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                    <ClipboardList className="size-3" />
                                    {note.work_items_count} pekerjaan terkait
                                </p>
                            )}

                            <div className="mt-auto flex items-center justify-end gap-1 border-t border-border/50 pt-3">
                                {archived ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 px-2.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                                        aria-label="Pulihkan catatan"
                                        title="Pulihkan dari arsip"
                                        onClick={() => restoreNote(note)}
                                    >
                                        <ArchiveRestore className="size-3.5" />
                                        <span>Pulihkan</span>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                'h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors',
                                                note.is_pinned
                                                    ? 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                            aria-label={
                                                note.is_pinned
                                                    ? 'Lepas sematan'
                                                    : 'Sematkan catatan'
                                            }
                                            title={
                                                note.is_pinned
                                                    ? 'Lepas sematan'
                                                    : 'Sematkan catatan'
                                            }
                                            onClick={() => togglePin(note)}
                                        >
                                            {note.is_pinned ? (
                                                <>
                                                    <PinOff className="size-3.5" />
                                                    <span>Lepas</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Pin className="size-3.5" />
                                                    <span>Sematkan</span>
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50"
                                            aria-label="Edit catatan"
                                            title="Edit"
                                            onClick={() => openEdit(note)}
                                        >
                                            <Pencil className="size-3.5" />
                                            <span>Edit</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                            aria-label="Hapus catatan"
                                            title="Hapus"
                                            onClick={() => setDeleting(note)}
                                        >
                                            <Trash2 className="size-3.5" />
                                            <span>Hapus</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {notes.last_page > 1 && (
                <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border bg-card/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                        Menampilkan{' '}
                        <span className="font-medium text-foreground">
                            {notes.from}–{notes.to}
                        </span>{' '}
                        dari{' '}
                        <span className="font-medium text-foreground">
                            {notes.total}
                        </span>{' '}
                        catatan
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={!notes.prev_page_url}
                            onClick={() =>
                                notes.prev_page_url &&
                                router.get(
                                    notes.prev_page_url,
                                    {},
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                )
                            }
                        >
                            <ChevronLeft className="size-4" />
                            <span>Sebelumnya</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={!notes.next_page_url}
                            onClick={() =>
                                notes.next_page_url &&
                                router.get(
                                    notes.next_page_url,
                                    {},
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                )
                            }
                        >
                            <span>Berikutnya</span>
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            {editor && (
                <NoteEditorDialog
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditor(null);
                        }
                    }}
                    note={editor.note}
                />
            )}

            {/* Dialog konfirmasi hapus */}
            <Dialog
                open={Boolean(deleting)}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleting(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Arsipkan catatan?</DialogTitle>
                        <DialogDescription>
                            “{deleting?.title}” akan dipindahkan ke arsip. Kamu
                            bisa memulihkannya kapan saja dari tab Arsip.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleting(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            <Archive className="size-4" />
                            Arsipkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

import { router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    NotebookPen,
    Pencil,
    Pin,
    PinOff,
    Plus,
    RotateCcw,
    Save,
    Search,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
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
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
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

const parseTags = (value) => {
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
};

export default function NotesIndex({ notes, tags = [], filters = {} }) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [deleting, setDeleting] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            title: '',
            content: '',
            tags: [],
            is_pinned: false,
        });

    const openCreate = () => {
        setEditing(null);
        clearErrors();
        reset();
        setTagInput('');
        setEditorOpen(true);
    };

    const openEdit = (note) => {
        setEditing(note);
        clearErrors();
        setData({
            title: note.title,
            content: note.content,
            tags: note.tags ?? [],
            is_pinned: Boolean(note.is_pinned),
        });
        setTagInput((note.tags ?? []).join(', '));
        setEditorOpen(true);
    };

    const handleTagsChange = (value) => {
        setTagInput(value);
        setData('tags', parseTags(value));
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => setEditorOpen(false),
        };

        if (editing) {
            put(`/admin/notes/${editing.id}`, options);
        } else {
            post('/admin/notes', options);
        }
    };

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

        router.get(
            '/admin/notes',
            {
                q: search || undefined,
                tag: filters.tag || undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const applyTag = (tag) => {
        router.get(
            '/admin/notes',
            {
                q: filters.q || undefined,
                tag: filters.tag === tag ? undefined : tag,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        router.get(
            '/admin/notes',
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const hasFilters = Boolean(filters.q || filters.tag);

    return (
        <AdminLayout title="Catatan">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                        <span>Catatan</span>
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {notes.total ?? 0}
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Simpan pengetahuan, ide, dan kebutuhanmu di satu tempat yang mudah diakses.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={openCreate}
                    className="h-10 gap-2 bg-indigo-600 px-4 text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-[0.98]"
                >
                    <Plus className="size-4" />
                    <span>Catatan baru</span>
                </Button>
            </div>

            {/* Filter & Search Bar */}
            <div className="mb-6 rounded-2xl border bg-card/90 p-4 shadow-xs backdrop-blur-xs">
                <form onSubmit={applySearch} className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="masukkan kata kunci pencarian..."
                            className="h-10 bg-background pl-10 pr-9 transition-colors"
                            aria-label="Cari catatan"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Hapus teks pencarian"
                                title="Hapus teks"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Tombol Search khusus dengan warna & desain yang dibedakan */}
                        <Button
                            type="submit"
                            className="h-10 flex-1 sm:flex-initial gap-2 bg-blue-600 text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all font-medium px-4 shrink-0"
                        >
                            <Search className="size-4 shrink-0" />
                            <span>Cari</span>
                        </Button>

                        {hasFilters && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearFilters}
                                className="h-10 gap-1.5 border-dashed text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                                title="Reset filter dan pencarian"
                            >
                                <RotateCcw className="size-3.5 shrink-0" />
                                <span>Reset</span>
                            </Button>
                        )}
                    </div>
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
                        <NotebookPen className="size-7" />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold tracking-tight">
                        {hasFilters
                            ? 'Tidak ada catatan yang cocok'
                            : 'Belum ada catatan'}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {hasFilters
                            ? 'Coba kata kunci atau tag lain, atau klik reset untuk melihat semua catatan.'
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
                    ) : (
                        <Button
                            type="button"
                            className="mt-5 gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
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
                                {note.is_pinned ? (
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
                                    {formatDate(note.updated_at)}
                                </span>
                            </div>

                            <h2 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {note.title}
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

                            <div className="mt-auto flex items-center justify-end gap-1 border-t border-border/50 pt-3">
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
                                    className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 transition-colors"
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
                                    className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 transition-colors"
                                    aria-label="Hapus catatan"
                                    title="Hapus"
                                    onClick={() => setDeleting(note)}
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>Hapus</span>
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {notes.last_page > 1 && (
                <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border bg-card/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                        Menampilkan <span className="font-medium text-foreground">{notes.from}–{notes.to}</span> dari{' '}
                        <span className="font-medium text-foreground">{notes.total}</span> catatan
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

            {/* Dialog tambah/edit */}
            <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit catatan' : 'Catatan baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Perbarui isi catatanmu.'
                                : 'Tulis satu hal yang kamu pelajari atau butuhkan hari ini.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="note-title">Judul</Label>
                            <Input
                                id="note-title"
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                                placeholder="masukkan judul"
                                autoFocus
                                required
                                aria-invalid={Boolean(errors.title)}
                            />
                            <InputError message={errors.title} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="note-content">Isi catatan</Label>
                            <textarea
                                id="note-content"
                                value={data.content}
                                onChange={(event) =>
                                    setData('content', event.target.value)
                                }
                                placeholder="masukkan isi catatan"
                                rows={10}
                                required
                                aria-invalid={Boolean(errors.content)}
                                className="flex min-h-40 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <InputError message={errors.content} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="note-tags">Tag</Label>
                            <Input
                                id="note-tags"
                                value={tagInput}
                                onChange={(event) =>
                                    handleTagsChange(event.target.value)
                                }
                                placeholder="masukkan tag"
                            />
                            <p className="text-xs text-muted-foreground">
                                Pisahkan beberapa tag dengan koma. Maksimal 10
                                tag.
                            </p>
                            <InputError message={errors.tags} />
                        </div>

                        <label className="flex w-fit items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.is_pinned}
                                onChange={(event) =>
                                    setData('is_pinned', event.target.checked)
                                }
                                className="size-4 rounded border-input accent-indigo-500"
                            />
                            Sematkan catatan di atas
                        </label>

                        <DialogFooter className="mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditorOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                            >
                                {processing ? (
                                    <>
                                        <Spinner />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-4" />
                                        Simpan
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
                        <DialogTitle>Hapus catatan?</DialogTitle>
                        <DialogDescription>
                            “{deleting?.title}” akan dihapus permanen. Tindakan
                            ini tidak bisa dibatalkan.
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
                            <Trash2 className="size-4" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

import { router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    NotebookPen,
    Pencil,
    Pin,
    PinOff,
    Plus,
    Save,
    Search,
    Tag,
    Trash2,
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Catatan
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Simpan pengetahuan, ide, dan kebutuhanmu di satu tempat.{' '}
                        {notes.total ?? 0} catatan tersimpan.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={openCreate}
                    className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                >
                    <Plus className="size-4" />
                    Catatan baru
                </Button>
            </div>

            <div className="mb-4 flex flex-col gap-3">
                <form onSubmit={applySearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari judul atau isi catatan..."
                            className="h-10 pl-10"
                            aria-label="Cari catatan"
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        Cari
                    </Button>
                    {hasFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={clearFilters}
                        >
                            Reset
                        </Button>
                    )}
                </form>

                {tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Tag className="size-3.5" />
                            Tag:
                        </span>
                        {tags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => applyTag(tag)}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                    filters.tag === tag
                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {notes.data.length === 0 ? (
                <div className="flex min-h-[48vh] flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-10 text-center">
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
                            ? 'Coba kata kunci atau tag lain, atau reset filter.'
                            : 'Mulai dari satu catatan kecil. Pengetahuan yang dicatat hari ini akan berguna nanti.'}
                    </p>
                    {hasFilters ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-5"
                            onClick={clearFilters}
                        >
                            Reset filter
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            className="mt-5 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                            onClick={openCreate}
                        >
                            <Plus className="size-4" />
                            Buat catatan pertama
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {notes.data.map((note) => (
                        <article
                            key={note.id}
                            className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-indigo-500/40"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="line-clamp-2 font-medium">
                                    {note.title}
                                </h2>
                                {note.is_pinned && (
                                    <Pin className="size-4 shrink-0 fill-indigo-500 text-indigo-500" />
                                )}
                            </div>

                            <p className="mt-2 line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                {excerpt(note.content)}
                            </p>

                            {note.tags?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {note.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CalendarDays className="size-3.5" />
                                    {formatDate(note.updated_at)}
                                </span>

                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={
                                            note.is_pinned
                                                ? 'Lepas sematan'
                                                : 'Sematkan catatan'
                                        }
                                        title={
                                            note.is_pinned
                                                ? 'Lepas sematan'
                                                : 'Sematkan'
                                        }
                                        onClick={() => togglePin(note)}
                                    >
                                        {note.is_pinned ? (
                                            <PinOff className="size-4" />
                                        ) : (
                                            <Pin className="size-4" />
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Edit catatan"
                                        title="Edit"
                                        onClick={() => openEdit(note)}
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Hapus catatan"
                                        title="Hapus"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeleting(note)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {notes.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                        Menampilkan {notes.from}–{notes.to} dari {notes.total}{' '}
                        catatan
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
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
                            Sebelumnya
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
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
                            Berikutnya
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

import { useForm } from '@inertiajs/react';
import { Eye, PenLine, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import InputError from '@/components/input-error';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const parseTags = (value) => {
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
};

const DRAFT_PREFIX = 'my-workspace:note-draft';

const draftStorageKey = (note) =>
    `${DRAFT_PREFIX}:${note?.id != null ? note.id : 'new'}`;

const readDraft = (key) => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(key);

        if (!raw) {
            return null;
        }

        const draft = JSON.parse(raw);

        if (!draft || typeof draft !== 'object') {
            return null;
        }

        return {
            title: typeof draft.title === 'string' ? draft.title : '',
            content: typeof draft.content === 'string' ? draft.content : '',
            tags: typeof draft.tags === 'string' ? draft.tags : '',
        };
    } catch {
        return null;
    }
};

const writeDraft = (key, draft) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(draft));
    } catch {
        // localStorage bisa penuh atau diblokir; editor tetap harus berjalan.
    }
};

const removeDraft = (key) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.removeItem(key);
    } catch {
        // Abaikan kegagalan menghapus draft.
    }
};

const storeDraft = (key, values, baseline) => {
    const empty =
        values.title.trim() === '' &&
        values.content.trim() === '' &&
        values.tags.trim() === '';
    const unchanged =
        values.title === baseline.title &&
        values.content === baseline.content &&
        values.tags === baseline.tags;

    if (empty || unchanged) {
        removeDraft(key);
        return;
    }

    writeDraft(key, {
        ...values,
        savedAt: new Date().toISOString(),
    });
};

const modes = [
    { value: 'write', label: 'Tulis', icon: PenLine },
    { value: 'preview', label: 'Pratinjau', icon: Eye },
];

export default function NoteEditorDialog({ open, onOpenChange, note = null }) {
    const storageKey = draftStorageKey(note);
    const [initialDraft] = useState(() => {
        const draft = open ? readDraft(storageKey) : null;

        if (!draft) {
            return null;
        }

        const empty =
            draft.title.trim() === '' &&
            draft.content.trim() === '' &&
            draft.tags.trim() === '';

        return empty ? null : draft;
    });
    const baselineTitle = note?.title ?? '';
    const baselineContent = note?.content ?? '';
    const baselineTags = (note?.tags ?? []).join(', ');
    const [mode, setMode] = useState('write');
    const [tagInput, setTagInput] = useState(
        initialDraft ? initialDraft.tags : baselineTags,
    );
    const { data, setData, post, put, processing, errors } = useForm({
        title: initialDraft ? initialDraft.title : baselineTitle,
        content: initialDraft ? initialDraft.content : baselineContent,
        tags: initialDraft ? parseTags(initialDraft.tags) : (note?.tags ?? []),
        is_pinned: Boolean(note?.is_pinned),
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = setTimeout(() => {
            storeDraft(
                storageKey,
                {
                    title: data.title,
                    content: data.content,
                    tags: tagInput,
                },
                {
                    title: baselineTitle,
                    content: baselineContent,
                    tags: baselineTags,
                },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [
        open,
        storageKey,
        data.title,
        data.content,
        tagInput,
        baselineTitle,
        baselineContent,
        baselineTags,
    ]);

    const handleTagsChange = (value) => {
        setTagInput(value);
        setData('tags', parseTags(value));
    };

    const handleOpenChange = (next) => {
        if (!next) {
            storeDraft(
                storageKey,
                {
                    title: data.title,
                    content: data.content,
                    tags: tagInput,
                },
                {
                    title: baselineTitle,
                    content: baselineContent,
                    tags: baselineTags,
                },
            );
        }

        onOpenChange(next);
    };

    const cancel = () => {
        removeDraft(storageKey);
        onOpenChange(false);
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                removeDraft(storageKey);
                onOpenChange(false);
            },
        };

        if (note) {
            put(`/admin/notes/${note.id}`, options);
        } else {
            post('/admin/notes', options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {note ? 'Edit catatan' : 'Catatan baru'}
                    </DialogTitle>
                    <DialogDescription>
                        {note
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
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label htmlFor="note-content">Isi catatan</Label>
                            <div
                                className="inline-flex rounded-lg border bg-muted/50 p-0.5"
                                role="group"
                                aria-label="Mode editor catatan"
                            >
                                {modes.map((item) => {
                                    const Icon = item.icon;
                                    const active = mode === item.value;

                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setMode(item.value)}
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                                active
                                                    ? 'bg-background text-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            <Icon className="size-3.5" />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {mode === 'write' ? (
                            <textarea
                                id="note-content"
                                value={data.content}
                                onChange={(event) =>
                                    setData('content', event.target.value)
                                }
                                placeholder="Tulis dengan Markdown: judul, daftar, kode, tabel..."
                                rows={10}
                                required
                                aria-invalid={Boolean(errors.content)}
                                className="flex min-h-40 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        ) : (
                            <div className="max-h-80 min-h-40 overflow-y-auto rounded-md border bg-background px-4 py-3">
                                {data.content.trim() === '' ? (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada isi untuk dipratinjau.
                                    </p>
                                ) : (
                                    <MarkdownContent
                                        content={data.content}
                                        className="text-sm"
                                    />
                                )}
                            </div>
                        )}

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
                            Pisahkan beberapa tag dengan koma. Maksimal 10 tag.
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
                            onClick={cancel}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
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
    );
}

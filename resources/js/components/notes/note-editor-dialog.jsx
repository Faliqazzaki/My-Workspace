import { useForm } from '@inertiajs/react';
import { Eye, PenLine, Save } from 'lucide-react';
import { useState } from 'react';

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

const modes = [
    { value: 'write', label: 'Tulis', icon: PenLine },
    { value: 'preview', label: 'Pratinjau', icon: Eye },
];

export default function NoteEditorDialog({ open, onOpenChange, note = null }) {
    const [mode, setMode] = useState('write');
    const [tagInput, setTagInput] = useState((note?.tags ?? []).join(', '));
    const { data, setData, post, put, processing, errors } = useForm({
        title: note?.title ?? '',
        content: note?.content ?? '',
        tags: note?.tags ?? [],
        is_pinned: Boolean(note?.is_pinned),
    });

    const handleTagsChange = (value) => {
        setTagInput(value);
        setData('tags', parseTags(value));
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (note) {
            put(`/admin/notes/${note.id}`, options);
        } else {
            post('/admin/notes', options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            onClick={() => onOpenChange(false)}
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

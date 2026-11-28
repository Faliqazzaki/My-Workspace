import { router, useForm } from '@inertiajs/react';
import { Newspaper, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

function SourceDialog({ source, open, onOpenChange }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: source?.name ?? '',
        url: source?.url ?? '',
        type: 'rss',
        enabled: source?.enabled ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        };

        if (source) {
            put(`/admin/news/sources/${source.id}`, options);
        } else {
            post('/admin/news/sources', options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {source ? 'Edit sumber berita' : 'Sumber berita baru'}
                    </DialogTitle>
                    <DialogDescription>
                        Tambahkan feed RSS publik yang ingin dipantau.
                        Pengambilan artikel dilakukan terpisah.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="news-source-name">Nama sumber</Label>
                        <Input
                            id="news-source-name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            placeholder="mis. Berita Teknologi"
                            autoFocus
                            required
                            maxLength={100}
                            aria-invalid={Boolean(errors.name)}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="news-source-url">URL feed RSS</Label>
                        <Input
                            id="news-source-url"
                            type="url"
                            value={data.url}
                            onChange={(event) =>
                                setData('url', event.target.value)
                            }
                            placeholder="https://contoh.com/feed.xml"
                            required
                            maxLength={2048}
                            aria-invalid={Boolean(errors.url)}
                        />
                        <InputError message={errors.url} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Jenis sumber</Label>
                        <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                            RSS
                        </div>
                        <InputError message={errors.type} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="news-source-enabled"
                            checked={data.enabled}
                            onCheckedChange={(checked) =>
                                setData('enabled', Boolean(checked))
                            }
                        />
                        <Label
                            htmlFor="news-source-enabled"
                            className="cursor-pointer text-sm font-normal text-muted-foreground select-none"
                        >
                            Aktifkan sumber ini
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan…' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SourceCard({ source, onEdit, onDelete }) {
    return (
        <article
            className={cn(
                'flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200',
                source.enabled
                    ? 'hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md'
                    : 'opacity-70',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                        {source.name}
                    </h2>
                    <span
                        className={cn(
                            'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                            source.enabled
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {source.enabled ? 'Aktif' : 'Dinonaktifkan'}
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(source)}
                        aria-label={`Edit ${source.name}`}
                        title="Edit"
                        className="size-8 text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(source)}
                        aria-label={`Hapus ${source.name}`}
                        title="Hapus"
                        className="size-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed break-all text-muted-foreground">
                {source.url}
            </p>

            <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                <span className="text-[11px] text-muted-foreground">
                    {source.articles_count ?? 0} artikel tersimpan
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        router.patch(
                            `/admin/news/sources/${source.id}/toggle`,
                            {},
                            { preserveScroll: true },
                        )
                    }
                    className="h-7 gap-1.5 px-2 text-[11px]"
                >
                    <Power className="size-3" />
                    {source.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
            </div>
        </article>
    );
}

export default function NewsSources({ sources = [], maxSources = 20 }) {
    const [editor, setEditor] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const confirmDelete = () => {
        router.delete(`/admin/news/sources/${deleting?.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <AdminLayout title="Sumber berita">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                        <span>Sumber berita</span>
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {sources.length}/{maxSources}
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola feed RSS publik yang menjadi bahan berita
                        teknologi.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={() => setEditor({ source: null })}
                    disabled={sources.length >= maxSources}
                    className="h-10 gap-2 bg-neutral-900 px-4 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                >
                    <Plus className="size-4" />
                    <span>Sumber baru</span>
                </Button>
            </div>

            {sources.length === 0 ? (
                <div className="flex min-h-[44vh] flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 p-10 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <Newspaper className="size-7" />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold tracking-tight">
                        Belum ada sumber berita
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Klik <strong>Sumber baru</strong>, isi nama dan URL feed
                        RSS publik (http/https), lalu simpan. Pengambilan
                        artikel tersedia setelah sumber ditambahkan.
                    </p>
                    <Button
                        type="button"
                        className="mt-5 gap-2 bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                        onClick={() => setEditor({ source: null })}
                    >
                        <Plus className="size-4" />
                        <span>Tambah sumber pertama</span>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {sources.map((source) => (
                        <SourceCard
                            key={source.id}
                            source={source}
                            onEdit={(item) => setEditor({ source: item })}
                            onDelete={setDeleting}
                        />
                    ))}
                </div>
            )}

            {editor && (
                <SourceDialog
                    key={editor.source?.id ?? 'new'}
                    source={editor.source}
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditor(null);
                        }
                    }}
                />
            )}

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
                        <DialogTitle>Hapus sumber berita?</DialogTitle>
                        <DialogDescription>
                            Sumber “{deleting?.name}” dan seluruh artikel yang
                            diambil darinya akan dihapus. Tindakan ini tidak
                            bisa dibatalkan.
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
                            onClick={confirmDelete}
                            className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            Hapus sumber
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

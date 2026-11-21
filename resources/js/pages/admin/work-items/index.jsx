import { router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    ClipboardList,
    Pencil,
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

const statusMeta = {
    backlog: {
        label: 'Backlog',
        badge: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300',
    },
    todo: {
        label: 'To do',
        badge: 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300',
    },
    in_progress: {
        label: 'Dikerjakan',
        badge: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-300',
    },
    done: {
        label: 'Selesai',
        badge: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300',
    },
};

const priorityMeta = {
    low: {
        label: 'Rendah',
        badge: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300',
    },
    medium: {
        label: 'Sedang',
        badge: 'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-300',
    },
    high: {
        label: 'Tinggi',
        badge: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300',
    },
    urgent: {
        label: 'Urgent',
        badge: 'bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-300',
    },
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const toDateInput = (value) => (value ? value.slice(0, 10) : '');

const formatDate = (value) => {
    if (!value) {
        return '';
    }

    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    return dateFormatter.format(new Date(year, month - 1, day));
};

const todayIso = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
};

const isOverdue = (value, status) => {
    return (
        Boolean(value) && status !== 'done' && value.slice(0, 10) < todayIso()
    );
};

const parseTags = (value) => {
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
};

export default function WorkItemsIndex({
    workItems,
    counts = {},
    filters = {},
    statuses = [],
    priorities = [],
}) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [deleting, setDeleting] = useState(null);

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
    } = useForm({
        title: '',
        description: '',
        status: 'backlog',
        priority: 'medium',
        due_date: '',
        tags: [],
    });

    const totalCount = Object.values(counts).reduce(
        (total, value) => total + Number(value),
        0,
    );

    const statusTabs = [
        { value: '', label: 'Semua', count: totalCount },
        ...statuses.map((status) => ({
            value: status,
            label: statusMeta[status].label,
            count: Number(counts[status] ?? 0),
        })),
    ];

    const openCreate = () => {
        setEditing(null);
        clearErrors();
        reset();
        setTagInput('');
        setEditorOpen(true);
    };

    const openEdit = (workItem) => {
        setEditing(workItem);
        clearErrors();
        setData({
            title: workItem.title,
            description: workItem.description ?? '',
            status: workItem.status,
            priority: workItem.priority,
            due_date: toDateInput(workItem.due_date),
            tags: workItem.tags ?? [],
        });
        setTagInput((workItem.tags ?? []).join(', '));
        setEditorOpen(true);
    };

    const handleTagsChange = (value) => {
        setTagInput(value);
        setData('tags', parseTags(value));
    };

    const submit = (event) => {
        event.preventDefault();

        transform((current) => ({
            ...current,
            due_date: current.due_date || null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => setEditorOpen(false),
        };

        if (editing) {
            put(`/admin/work-items/${editing.id}`, options);
        } else {
            post('/admin/work-items', options);
        }
    };

    const changeStatus = (workItem, status) => {
        router.patch(
            `/admin/work-items/${workItem.id}/status`,
            { status },
            { preserveScroll: true, preserveState: true },
        );
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(`/admin/work-items/${deleting.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const applySearch = (event) => {
        event.preventDefault();

        router.get(
            '/admin/work-items',
            {
                q: search || undefined,
                status: filters.status || undefined,
                priority: filters.priority || undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const applyStatus = (status) => {
        router.get(
            '/admin/work-items',
            {
                q: filters.q || undefined,
                status: status || undefined,
                priority: filters.priority || undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const applyPriority = (priority) => {
        router.get(
            '/admin/work-items',
            {
                q: filters.q || undefined,
                status: filters.status || undefined,
                priority: priority || undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        router.get(
            '/admin/work-items',
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const hasFilters = Boolean(filters.q || filters.status || filters.priority);

    return (
        <AdminLayout title="Pekerjaan">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Pekerjaan
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Catat kebutuhan dan pekerjaan, lalu kelola progresnya.{' '}
                        {workItems.total ?? 0} pekerjaan ditemukan.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={openCreate}
                    className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                >
                    <Plus className="size-4" />
                    Pekerjaan baru
                </Button>
            </div>

            <div className="mb-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                    <form onSubmit={applySearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari judul atau deskripsi..."
                                className="h-10 pl-10"
                                aria-label="Cari pekerjaan"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Cari
                        </Button>
                    </form>

                    <select
                        value={filters.priority ?? ''}
                        onChange={(event) => applyPriority(event.target.value)}
                        aria-label="Filter prioritas"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <option value="">Semua prioritas</option>
                        {priorities.map((priority) => (
                            <option key={priority} value={priority}>
                                {priorityMeta[priority].label}
                            </option>
                        ))}
                    </select>

                    {hasFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={clearFilters}
                        >
                            Reset
                        </Button>
                    )}
                </div>

                <div className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
                    {statusTabs.map((tab) => {
                        const active = (filters.status ?? '') === tab.value;

                        return (
                            <button
                                key={tab.value || 'all'}
                                type="button"
                                onClick={() => applyStatus(tab.value)}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                                    active
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                {tab.label}
                                <span
                                    className={cn(
                                        'rounded-full px-1.5 text-[11px]',
                                        active ? 'bg-white/20' : 'bg-muted',
                                    )}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {workItems.data.length === 0 ? (
                <div className="flex min-h-[48vh] flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-10 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <ClipboardList className="size-7" />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold tracking-tight">
                        {hasFilters
                            ? 'Tidak ada pekerjaan yang cocok'
                            : 'Belum ada pekerjaan'}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {hasFilters
                            ? 'Coba kata kunci, status, atau prioritas lain.'
                            : 'Mulai catat kebutuhan atau pekerjaan pertamamu di sini.'}
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
                            Buat pekerjaan pertama
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {workItems.data.map((workItem) => (
                        <article
                            key={workItem.id}
                            className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-indigo-500/40 sm:p-5"
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                                                statusMeta[workItem.status]
                                                    .badge,
                                            )}
                                        >
                                            {statusMeta[workItem.status].label}
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                                                priorityMeta[workItem.priority]
                                                    .badge,
                                            )}
                                        >
                                            {
                                                priorityMeta[workItem.priority]
                                                    .label
                                            }
                                        </span>

                                        {workItem.due_date && (
                                            <span
                                                className={cn(
                                                    'flex items-center gap-1 text-xs',
                                                    isOverdue(
                                                        workItem.due_date,
                                                        workItem.status,
                                                    )
                                                        ? 'font-medium text-red-600 dark:text-red-400'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                <CalendarDays className="size-3.5" />
                                                {formatDate(workItem.due_date)}
                                                {isOverdue(
                                                    workItem.due_date,
                                                    workItem.status,
                                                ) && ' · terlambat'}
                                            </span>
                                        )}
                                    </div>

                                    <h2
                                        className={cn(
                                            'mt-2 font-medium',
                                            workItem.status === 'done' &&
                                                'text-muted-foreground line-through',
                                        )}
                                    >
                                        {workItem.title}
                                    </h2>

                                    {workItem.description && (
                                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                            {workItem.description}
                                        </p>
                                    )}

                                    {workItem.tags?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
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
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <select
                                        value={workItem.status}
                                        onChange={(event) =>
                                            changeStatus(
                                                workItem,
                                                event.target.value,
                                            )
                                        }
                                        aria-label={`Ubah status ${workItem.title}`}
                                        className="h-9 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>
                                                {statusMeta[status].label}
                                            </option>
                                        ))}
                                    </select>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Edit pekerjaan"
                                        title="Edit"
                                        onClick={() => openEdit(workItem)}
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Hapus pekerjaan"
                                        title="Hapus"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeleting(workItem)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {workItems.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                        Menampilkan {workItems.from}–{workItems.to} dari{' '}
                        {workItems.total} pekerjaan
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!workItems.prev_page_url}
                            onClick={() =>
                                workItems.prev_page_url &&
                                router.get(
                                    workItems.prev_page_url,
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
                            disabled={!workItems.next_page_url}
                            onClick={() =>
                                workItems.next_page_url &&
                                router.get(
                                    workItems.next_page_url,
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
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit pekerjaan' : 'Pekerjaan baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Perbarui detail dan progres pekerjaan ini.'
                                : 'Catat kebutuhan atau pekerjaan yang ingin kamu kerjakan.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="work-item-title">Judul</Label>
                            <Input
                                id="work-item-title"
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                                placeholder="Misalnya: Rancang skema multi-agent"
                                autoFocus
                                required
                                aria-invalid={Boolean(errors.title)}
                            />
                            <InputError message={errors.title} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="work-item-description">
                                Deskripsi
                            </Label>
                            <textarea
                                id="work-item-description"
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                placeholder="Detail kebutuhan, konteks, atau catatan tambahan..."
                                rows={4}
                                aria-invalid={Boolean(errors.description)}
                                className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="work-item-status">Status</Label>
                                <select
                                    id="work-item-status"
                                    value={data.status}
                                    onChange={(event) =>
                                        setData('status', event.target.value)
                                    }
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {statusMeta[status].label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.status} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="work-item-priority">
                                    Prioritas
                                </Label>
                                <select
                                    id="work-item-priority"
                                    value={data.priority}
                                    onChange={(event) =>
                                        setData('priority', event.target.value)
                                    }
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    {priorities.map((priority) => (
                                        <option key={priority} value={priority}>
                                            {priorityMeta[priority].label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.priority} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="work-item-due-date">Tenggat</Label>
                            <Input
                                id="work-item-due-date"
                                type="date"
                                value={data.due_date}
                                onChange={(event) =>
                                    setData('due_date', event.target.value)
                                }
                                className="[color-scheme:light] dark:[color-scheme:dark]"
                                aria-invalid={Boolean(errors.due_date)}
                            />
                            <InputError message={errors.due_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="work-item-tags">Tag</Label>
                            <Input
                                id="work-item-tags"
                                value={tagInput}
                                onChange={(event) =>
                                    handleTagsChange(event.target.value)
                                }
                                placeholder="ai, backend, riset"
                            />
                            <p className="text-xs text-muted-foreground">
                                Pisahkan beberapa tag dengan koma. Maksimal 10
                                tag.
                            </p>
                            <InputError message={errors.tags} />
                        </div>

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
                        <DialogTitle>Hapus pekerjaan?</DialogTitle>
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

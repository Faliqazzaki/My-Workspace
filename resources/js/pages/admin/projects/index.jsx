import { router, useForm } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    CheckCircle2,
    FolderKanban,
    Pencil,
    Plus,
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

function progressOf(project) {
    const total = Number(project.work_items_count ?? 0);
    const done = Number(project.done_work_items_count ?? 0);
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    return { total, done, percent };
}

function ProjectDialog({ project, colors, open, onOpenChange }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: project?.name ?? '',
        description: project?.description ?? '',
        color: project?.color ?? colors[0] ?? '#6366f1',
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

        if (project) {
            put(`/admin/projects/${project.id}`, options);
        } else {
            post('/admin/projects', options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {project ? 'Edit proyek' : 'Proyek baru'}
                    </DialogTitle>
                    <DialogDescription>
                        {project
                            ? 'Perbarui nama, deskripsi, atau warna proyek.'
                            : 'Kelompokkan pekerjaan berdasarkan area atau tujuan.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="project-name">Nama proyek</Label>
                        <Input
                            id="project-name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            placeholder="mis. My Workspace v1"
                            autoFocus
                            required
                            aria-invalid={Boolean(errors.name)}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="project-description">
                            Deskripsi (opsional)
                        </Label>
                        <textarea
                            id="project-description"
                            value={data.description}
                            onChange={(event) =>
                                setData('description', event.target.value)
                            }
                            placeholder="Apa cakupan proyek ini?"
                            rows={3}
                            aria-invalid={Boolean(errors.description)}
                            className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Warna</Label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => {
                                const active = data.color === color;

                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setData('color', color)}
                                        aria-label={`Pilih warna ${color}`}
                                        aria-pressed={active}
                                        className={cn(
                                            'size-8 rounded-full border-2 transition-transform hover:scale-105',
                                            active
                                                ? 'border-foreground ring-2 ring-foreground/20'
                                                : 'border-transparent',
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                );
                            })}
                        </div>
                        <InputError message={errors.color} />
                    </div>

                    <DialogFooter className="mt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="gap-2 bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                        >
                            {processing ? (
                                <Spinner className="size-4" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
                            {project ? 'Simpan perubahan' : 'Buat proyek'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ProjectCard({ project, onEdit, onDelete }) {
    const { total, done, percent } = progressOf(project);
    const archived = Boolean(project.archived_at);
    const color = project.color ?? '#6366f1';

    return (
        <article
            className={cn(
                'flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200',
                archived
                    ? 'opacity-70'
                    : 'hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span
                        className="mt-0.5 size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold">
                            {project.name}
                        </h2>
                        {archived && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                <Archive className="size-3" />
                                Arsip
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(project)}
                        aria-label={`Edit ${project.name}`}
                        title="Edit"
                        className="size-8 text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(project)}
                        aria-label={`Hapus ${project.name}`}
                        title="Hapus"
                        className="size-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>

            <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-relaxed text-muted-foreground">
                {project.description || 'Belum ada deskripsi.'}
            </p>

            <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>
                        {done} dari {total} pekerjaan selesai
                    </span>
                    <span className="tabular-nums">{percent}%</span>
                </div>
                <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progres ${project.name}`}
                >
                    <span
                        className="block h-full rounded-full transition-all"
                        style={{
                            width: `${percent}%`,
                            backgroundColor: color,
                        }}
                    />
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                <Button
                    asChild
                    variant="link"
                    className="h-auto p-0 text-xs font-medium text-indigo-600 dark:text-indigo-400"
                >
                    <a href={`/admin/work-items?project=${project.id}`}>
                        Lihat pekerjaan
                    </a>
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        router.patch(
                            `/admin/projects/${project.id}/archive`,
                            {},
                            { preserveScroll: true },
                        )
                    }
                    className="h-7 gap-1.5 px-2 text-[11px]"
                >
                    {archived ? (
                        <ArchiveRestore className="size-3" />
                    ) : (
                        <Archive className="size-3" />
                    )}
                    {archived ? 'Kembalikan' : 'Arsipkan'}
                </Button>
            </div>
        </article>
    );
}

export default function ProjectsIndex({ projects = [], colors = [] }) {
    const [editor, setEditor] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const activeProjects = projects.filter((project) => !project.archived_at);
    const archivedProjects = projects.filter((project) => project.archived_at);

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(`/admin/projects/${deleting.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <AdminLayout title="Proyek">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                        <span>Proyek</span>
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {activeProjects.length}
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelompokkan pekerjaan per area dan pantau progresnya.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={() => setEditor({ project: null })}
                    className="h-10 gap-2 bg-neutral-900 px-4 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                >
                    <Plus className="size-4" />
                    <span>Proyek baru</span>
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="flex min-h-[44vh] flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 p-10 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <FolderKanban className="size-7" />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold tracking-tight">
                        Belum ada proyek
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Buat proyek pertama untuk mengelompokkan pekerjaan dan
                        melihat progres per area.
                    </p>
                    <Button
                        type="button"
                        className="mt-5 gap-2 bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                        onClick={() => setEditor({ project: null })}
                    >
                        <Plus className="size-4" />
                        <span>Buat proyek pertama</span>
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {activeProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onEdit={(item) => setEditor({ project: item })}
                                onDelete={setDeleting}
                            />
                        ))}
                    </div>

                    {archivedProjects.length > 0 && (
                        <section>
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <Archive className="size-4" />
                                Diarsipkan ({archivedProjects.length})
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {archivedProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onEdit={(item) =>
                                            setEditor({ project: item })
                                        }
                                        onDelete={setDeleting}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {editor && (
                <ProjectDialog
                    key={editor.project?.id ?? 'new'}
                    project={editor.project}
                    colors={colors}
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
                        <DialogTitle>Hapus proyek?</DialogTitle>
                        <DialogDescription>
                            Proyek “{deleting?.name}” akan dihapus. Pekerjaan di
                            dalamnya tetap tersimpan, hanya kehilangan label
                            proyek.
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
                            className="gap-2 bg-red-600 text-white hover:bg-red-700"
                        >
                            <Trash2 className="size-4" />
                            Hapus proyek
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

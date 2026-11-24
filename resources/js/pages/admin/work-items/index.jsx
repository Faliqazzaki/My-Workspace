import { router, useForm } from '@inertiajs/react';
import {
    Bookmark,
    BookmarkPlus,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Columns3,
    LayoutList,
    ListChecks,
    NotebookPen,
    Pencil,
    Plus,
    RotateCcw,
    Save,
    Search,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
import KanbanBoard from '@/components/work-items/kanban-board';
import WorkCalendar from '@/components/work-items/work-calendar';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate, isOverdue, toDateInput } from '@/lib/date';
import { cn } from '@/lib/utils';
import { priorityMeta, statusMeta } from '@/lib/work-item-meta';

const parseTags = (value) => {
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
};

const boardSignature = (items) =>
    items.map((item) => `${item.id}:${item.status}`).join('|');

const normalizeFilterEntries = (filters) =>
    JSON.stringify(
        Object.entries(filters ?? {})
            .filter(([, value]) => value !== '' && value != null)
            .sort(([first], [second]) => first.localeCompare(second)),
    );

const subtaskProgress = (subtasks = []) => {
    const total = subtasks.length;
    const done = subtasks.filter((subtask) => subtask.is_done).length;

    return {
        total,
        done,
        percent: total === 0 ? 0 : Math.round((done / total) * 100),
    };
};

function SubtaskProgress({ subtasks, className }) {
    const { total, done, percent } = subtaskProgress(subtasks);

    if (total === 0) {
        return null;
    }

    return (
        <div className={cn('max-w-xs', className)}>
            <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <ListChecks className="size-3" />
                    {done}/{total} subtask
                </span>
                <span className="tabular-nums">{percent}%</span>
            </div>
            <div
                className="mt-1 h-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progres subtask"
            >
                <span
                    className={cn(
                        'block h-full rounded-full transition-all',
                        percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500',
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

export default function WorkItemsIndex({
    workItems,
    boardItems = [],
    calendarItems = [],
    counts = {},
    filters = {},
    statuses = [],
    priorities = [],
    projects = [],
    savedViews = [],
    notes = [],
}) {
    const queryParam = filters.q ?? '';
    const view = ['board', 'calendar'].includes(filters.view)
        ? filters.view
        : 'list';
    const [board, setBoard] = useState(boardItems);
    const [syncedBoard, setSyncedBoard] = useState(boardSignature(boardItems));
    const [search, setSearch] = useState(queryParam);
    const [syncedQuery, setSyncedQuery] = useState(queryParam);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [subtaskInput, setSubtaskInput] = useState('');
    const [noteSearch, setNoteSearch] = useState('');
    const [saveViewOpen, setSaveViewOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const isFirstRender = useRef(true);

    if (queryParam !== syncedQuery) {
        setSyncedQuery(queryParam);
        setSearch(queryParam);
    }

    const incomingBoardSignature = boardSignature(boardItems);
    if (incomingBoardSignature !== syncedBoard) {
        setSyncedBoard(incomingBoardSignature);
        setBoard(boardItems);
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
                '/admin/work-items',
                {
                    q: search || undefined,
                    status: filters.status || undefined,
                    priority: filters.priority || undefined,
                    project: filters.project || undefined,
                    view: ['board', 'calendar'].includes(filters.view)
                        ? filters.view
                        : undefined,
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [
        search,
        queryParam,
        filters.status,
        filters.priority,
        filters.project,
        filters.view,
    ]);

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
        project_id: '',
        tags: [],
        subtasks: [],
        notes: [],
    });

    const {
        data: viewFormData,
        setData: setViewFormData,
        post: postView,
        processing: savingView,
        errors: viewErrors,
        reset: resetViewForm,
        clearErrors: clearViewErrors,
        transform: transformView,
    } = useForm({
        name: '',
        filters: {},
    });

    const currentViewFilters = {
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.project ? { project: filters.project } : {}),
        ...(view !== 'list' ? { view } : {}),
    };

    const activeSavedView = savedViews.find(
        (savedView) =>
            normalizeFilterEntries(savedView.filters) ===
            normalizeFilterEntries(currentViewFilters),
    );

    const savedViewSummary =
        [
            currentViewFilters.q
                ? `kata kunci “${currentViewFilters.q}”`
                : null,
            currentViewFilters.status
                ? `status ${statusMeta[currentViewFilters.status]?.label ?? currentViewFilters.status}`
                : null,
            currentViewFilters.priority
                ? `prioritas ${priorityMeta[currentViewFilters.priority]?.label ?? currentViewFilters.priority}`
                : null,
            currentViewFilters.project
                ? currentViewFilters.project === 'none'
                    ? 'tanpa proyek'
                    : `proyek ${
                          projects.find(
                              (project) =>
                                  String(project.id) ===
                                  currentViewFilters.project,
                          )?.name ?? currentViewFilters.project
                      }`
                : null,
            currentViewFilters.view
                ? `tampilan ${currentViewFilters.view === 'board' ? 'papan' : 'kalender'}`
                : null,
        ]
            .filter(Boolean)
            .join(' · ') || 'Tampilan default';

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
        setSubtaskInput('');
        setNoteSearch('');
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
            project_id: workItem.project_id ?? '',
            tags: workItem.tags ?? [],
            subtasks: (workItem.subtasks ?? []).map((subtask) => ({
                id: subtask.id,
                title: subtask.title,
                is_done: Boolean(subtask.is_done),
            })),
            notes: (workItem.notes ?? []).map((note) => note.id),
        });
        setTagInput((workItem.tags ?? []).join(', '));
        setSubtaskInput('');
        setNoteSearch('');
        setEditorOpen(true);
    };

    const handleTagsChange = (value) => {
        setTagInput(value);
        setData('tags', parseTags(value));
    };

    const toggleNote = (noteId) => {
        setData(
            'notes',
            data.notes.includes(noteId)
                ? data.notes.filter((id) => id !== noteId)
                : [...data.notes, noteId],
        );
    };

    const addSubtask = () => {
        const title = subtaskInput.trim();

        if (title === '' || data.subtasks.length >= 50) {
            return;
        }

        setData('subtasks', [...data.subtasks, { title, is_done: false }]);
        setSubtaskInput('');
    };

    const updateSubtask = (index, changes) => {
        setData(
            'subtasks',
            data.subtasks.map((subtask, current) =>
                current === index ? { ...subtask, ...changes } : subtask,
            ),
        );
    };

    const removeSubtask = (index) => {
        setData(
            'subtasks',
            data.subtasks.filter((_, current) => current !== index),
        );
    };

    const submit = (event) => {
        event.preventDefault();

        transform((current) => ({
            ...current,
            due_date: current.due_date || null,
            project_id: current.project_id === '' ? null : current.project_id,
            subtasks: current.subtasks
                .filter((subtask) => subtask.title.trim() !== '')
                .map((subtask) => ({
                    id: subtask.id ?? null,
                    title: subtask.title.trim(),
                    is_done: Boolean(subtask.is_done),
                })),
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

    const moveStatus = (workItem, status) => {
        const previous = board;

        setBoard((current) =>
            current.map((item) =>
                item.id === workItem.id
                    ? {
                          ...item,
                          status,
                          completed_at:
                              status === 'done'
                                  ? new Date().toISOString()
                                  : null,
                      }
                    : item,
            ),
        );

        router.patch(
            `/admin/work-items/${workItem.id}/status`,
            { status },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => setBoard(previous),
            },
        );
    };

    const changeView = (nextView) => {
        if (nextView === view) {
            return;
        }

        router.get(
            '/admin/work-items',
            {
                q: search || undefined,
                status: filters.status || undefined,
                priority: filters.priority || undefined,
                project: filters.project || undefined,
                view: nextView === 'list' ? undefined : nextView,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const openSaveView = () => {
        clearViewErrors();
        resetViewForm();
        setSaveViewOpen(true);
    };

    const submitSaveView = (event) => {
        event.preventDefault();

        transformView((current) => ({
            ...current,
            filters: currentViewFilters,
        }));

        postView('/admin/work-items/views', {
            preserveScroll: true,
            onSuccess: () => {
                setSaveViewOpen(false);
                resetViewForm();
            },
        });
    };

    const applySavedView = (savedView) => {
        const params = Array.isArray(savedView.filters)
            ? {}
            : (savedView.filters ?? {});

        router.get('/admin/work-items', params, { preserveScroll: true });
    };

    const deleteSavedView = (savedView) => {
        router.delete(`/admin/work-items/views/${savedView.id}`, {
            preserveScroll: true,
            preserveState: true,
        });
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

        if (search === (filters.q ?? '')) {
            return;
        }

        router.get(
            '/admin/work-items',
            {
                q: search || undefined,
                status: filters.status || undefined,
                priority: filters.priority || undefined,
                project: filters.project || undefined,
                view: view === 'list' ? undefined : view,
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
            '/admin/work-items',
            {
                status: filters.status || undefined,
                priority: filters.priority || undefined,
                project: filters.project || undefined,
                view: view === 'list' ? undefined : view,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const applyStatus = (status) => {
        router.get(
            '/admin/work-items',
            {
                q: search || undefined,
                status: status || undefined,
                priority: filters.priority || undefined,
                project: filters.project || undefined,
                view: view === 'list' ? undefined : view,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const applyPriority = (priority) => {
        router.get(
            '/admin/work-items',
            {
                q: search || undefined,
                status: filters.status || undefined,
                priority: priority || undefined,
                project: filters.project || undefined,
                view: view === 'list' ? undefined : view,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const applyProject = (project) => {
        router.get(
            '/admin/work-items',
            {
                q: search || undefined,
                status: filters.status || undefined,
                priority: filters.priority || undefined,
                project: project || undefined,
                view: view === 'list' ? undefined : view,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        router.get(
            '/admin/work-items',
            {
                view: view === 'list' ? undefined : view,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const hasFilters = Boolean(
        filters.q || filters.status || filters.priority || filters.project,
    );

    const noteKeyword = noteSearch.trim().toLowerCase();
    const filteredNotes =
        noteKeyword === ''
            ? notes
            : notes.filter((note) =>
                  note.title.toLowerCase().includes(noteKeyword),
              );

    return (
        <AdminLayout title="Pekerjaan">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                        <span>Pekerjaan</span>
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {workItems.total ?? 0}
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Catat kebutuhan dan pekerjaan, lalu kelola alur
                        progresnya.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className="inline-flex rounded-lg border bg-card p-0.5"
                        role="group"
                        aria-label="Tampilan pekerjaan"
                    >
                        <button
                            type="button"
                            aria-pressed={view === 'list'}
                            onClick={() => changeView('list')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                view === 'list'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <LayoutList className="size-3.5" />
                            Daftar
                        </button>
                        <button
                            type="button"
                            aria-pressed={view === 'board'}
                            onClick={() => changeView('board')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                view === 'board'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Columns3 className="size-3.5" />
                            Papan
                        </button>
                        <button
                            type="button"
                            aria-pressed={view === 'calendar'}
                            onClick={() => changeView('calendar')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                view === 'calendar'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <CalendarDays className="size-3.5" />
                            Kalender
                        </button>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreate}
                        className="h-10 gap-2 bg-neutral-900 px-4 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                    >
                        <Plus className="size-4" />
                        <span>Pekerjaan baru</span>
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mb-6 space-y-3.5 rounded-2xl border bg-card/90 p-4 shadow-xs backdrop-blur-xs">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <form onSubmit={applySearch} className="flex-1">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="masukkan kata kunci pencarian..."
                                className="h-10 bg-background pr-9 pl-10 transition-colors"
                                aria-label="Cari pekerjaan"
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
                    </form>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-44">
                            <select
                                value={filters.priority ?? ''}
                                onChange={(event) =>
                                    applyPriority(event.target.value)
                                }
                                aria-label="Filter prioritas"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">Semua prioritas</option>
                                {priorities.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priorityMeta[priority].label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative flex-1 sm:w-44">
                            <select
                                value={filters.project ?? ''}
                                onChange={(event) =>
                                    applyProject(event.target.value)
                                }
                                aria-label="Filter proyek"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">Semua proyek</option>
                                <option value="none">Tanpa proyek</option>
                                {projects.map((project) => (
                                    <option
                                        key={project.id}
                                        value={String(project.id)}
                                    >
                                        {project.name}
                                        {project.archived_at ? ' (arsip)' : ''}
                                    </option>
                                ))}
                            </select>
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
                    </div>
                </div>

                {/* Status Tabs */}
                {view === 'list' && (
                    <div className="flex gap-1 overflow-x-auto rounded-xl border bg-background/80 p-1.5">
                        {statusTabs.map((tab) => {
                            const active = (filters.status ?? '') === tab.value;

                            return (
                                <button
                                    key={tab.value || 'all'}
                                    type="button"
                                    onClick={() => applyStatus(tab.value)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
                                        active
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                                            active
                                                ? 'bg-white/20 text-white'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
                    <span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Bookmark className="size-3.5 text-indigo-500" />
                        Tampilan:
                    </span>

                    {savedViews.length === 0 ? (
                        <span className="text-xs text-muted-foreground/80">
                            Belum ada tampilan tersimpan.
                        </span>
                    ) : (
                        savedViews.map((savedView) => {
                            const active = activeSavedView?.id === savedView.id;

                            return (
                                <span
                                    key={savedView.id}
                                    className={cn(
                                        'inline-flex items-center rounded-full border text-xs font-medium transition-colors',
                                        active
                                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                            : 'border-border/70 bg-background text-muted-foreground hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-300',
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            applySavedView(savedView)
                                        }
                                        className="py-1 pr-1.5 pl-2.5"
                                    >
                                        {savedView.name}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteSavedView(savedView)
                                        }
                                        aria-label={`Hapus tampilan ${savedView.name}`}
                                        title="Hapus tampilan"
                                        className={cn(
                                            'mr-1 ml-0.5 rounded-full p-0.5 transition-colors',
                                            active
                                                ? 'hover:bg-white/20'
                                                : 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50',
                                        )}
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            );
                        })
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openSaveView}
                        disabled={!hasFilters && view === 'list'}
                        className="ml-auto h-7 gap-1.5 border-dashed px-2 text-[11px]"
                        title="Simpan kombinasi filter saat ini"
                    >
                        <BookmarkPlus className="size-3.5" />
                        Simpan tampilan
                    </Button>
                </div>
            </div>

            {view === 'calendar' ? (
                <WorkCalendar items={calendarItems} onEdit={openEdit} />
            ) : view === 'board' ? (
                <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
                    <KanbanBoard
                        items={board}
                        statuses={statuses}
                        onStatusChange={moveStatus}
                    />
                </div>
            ) : workItems.data.length === 0 ? (
                <div className="flex min-h-[44vh] flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 p-10 text-center">
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
                            ? 'Coba kata kunci, status, prioritas, atau proyek lain, atau klik reset.'
                            : 'Mulai catat kebutuhan atau pekerjaan pertamamu di sini.'}
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
                            className="mt-5 gap-2 bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                            onClick={openCreate}
                        >
                            <Plus className="size-4" />
                            <span>Buat pekerjaan pertama</span>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {workItems.data.map((workItem) => (
                        <article
                            key={workItem.id}
                            className={cn(
                                'rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                                workItem.status === 'done'
                                    ? 'border-border/60 bg-muted/20 opacity-90'
                                    : 'hover:border-indigo-500/40',
                            )}
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

                                        {workItem.project && (
                                            <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                <span
                                                    className="size-2 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            workItem.project
                                                                .color ??
                                                            '#6366f1',
                                                    }}
                                                />
                                                {workItem.project.name}
                                            </span>
                                        )}

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

                                    {workItem.subtasks?.length > 0 && (
                                        <SubtaskProgress
                                            subtasks={workItem.subtasks}
                                            className="mt-2.5"
                                        />
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

                                    {workItem.notes?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {workItem.notes.map((note) => (
                                                <span
                                                    key={note.id}
                                                    className="flex max-w-full items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400"
                                                >
                                                    <NotebookPen className="size-3 shrink-0" />
                                                    <span className="truncate">
                                                        {note.title}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2 border-t pt-2 lg:border-t-0 lg:pt-0">
                                    <select
                                        value={workItem.status}
                                        onChange={(event) =>
                                            changeStatus(
                                                workItem,
                                                event.target.value,
                                            )
                                        }
                                        aria-label={`Ubah status ${workItem.title}`}
                                        className="h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                                        size="sm"
                                        className="h-8.5 gap-1.5 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50"
                                        aria-label="Edit pekerjaan"
                                        title="Edit"
                                        onClick={() => openEdit(workItem)}
                                    >
                                        <Pencil className="size-3.5" />
                                        <span>Edit</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8.5 gap-1.5 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                        aria-label="Hapus pekerjaan"
                                        title="Hapus"
                                        onClick={() => setDeleting(workItem)}
                                    >
                                        <Trash2 className="size-3.5" />
                                        <span>Hapus</span>
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {view === 'list' && workItems.last_page > 1 && (
                <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border bg-card/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                        Menampilkan{' '}
                        <span className="font-medium text-foreground">
                            {workItems.from}–{workItems.to}
                        </span>{' '}
                        dari{' '}
                        <span className="font-medium text-foreground">
                            {workItems.total}
                        </span>{' '}
                        pekerjaan
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
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
                            <ChevronLeft className="size-4" />
                            <span>Sebelumnya</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
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
                            <span>Berikutnya</span>
                            <ChevronRight className="size-4" />
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
                                placeholder="masukkan judul"
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
                                placeholder="masukkan deskripsi"
                                rows={4}
                                aria-invalid={Boolean(errors.description)}
                                className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="work-item-project">Proyek</Label>
                            <select
                                id="work-item-project"
                                value={data.project_id ?? ''}
                                onChange={(event) =>
                                    setData('project_id', event.target.value)
                                }
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">Tanpa proyek</option>
                                {projects.map((project) => (
                                    <option
                                        key={project.id}
                                        value={String(project.id)}
                                    >
                                        {project.name}
                                        {project.archived_at ? ' (arsip)' : ''}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.project_id} />
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
                                placeholder="masukkan tag"
                            />
                            <p className="text-xs text-muted-foreground">
                                Pisahkan beberapa tag dengan koma. Maksimal 10
                                tag.
                            </p>
                            <InputError message={errors.tags} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="work-item-subtask">
                                    Subtask
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {subtaskProgress(data.subtasks).done}/
                                    {data.subtasks.length} selesai
                                </span>
                            </div>

                            {data.subtasks.length > 0 && (
                                <ul className="divide-y overflow-hidden rounded-md border">
                                    {data.subtasks.map((subtask, index) => (
                                        <li
                                            key={subtask.id ?? `baru-${index}`}
                                            className="flex items-center gap-2 px-2.5 py-1.5"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={Boolean(
                                                    subtask.is_done,
                                                )}
                                                onChange={(event) =>
                                                    updateSubtask(index, {
                                                        is_done:
                                                            event.target
                                                                .checked,
                                                    })
                                                }
                                                aria-label={`Tandai ${subtask.title}`}
                                                className="size-4 shrink-0 rounded border-input accent-indigo-500"
                                            />
                                            <input
                                                value={subtask.title}
                                                onChange={(event) =>
                                                    updateSubtask(index, {
                                                        title: event.target
                                                            .value,
                                                    })
                                                }
                                                aria-label={`Judul subtask ${index + 1}`}
                                                className={cn(
                                                    'min-w-0 flex-1 bg-transparent text-sm outline-none',
                                                    subtask.is_done &&
                                                        'text-muted-foreground line-through',
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeSubtask(index)
                                                }
                                                aria-label={`Hapus ${subtask.title}`}
                                                title="Hapus subtask"
                                                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex items-center gap-2">
                                <Input
                                    id="work-item-subtask"
                                    value={subtaskInput}
                                    onChange={(event) =>
                                        setSubtaskInput(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            addSubtask();
                                        }
                                    }}
                                    placeholder="Tambah langkah kecil..."
                                    className="h-9"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addSubtask}
                                    disabled={subtaskInput.trim() === ''}
                                    className="h-9 shrink-0 gap-1.5"
                                >
                                    <Plus className="size-3.5" />
                                    Tambah
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Centang langkah yang sudah selesai. Perubahan
                                subtask disimpan bersama pekerjaan. Maksimal 50.
                            </p>
                            <InputError message={errors.subtasks} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="work-item-note-search">
                                    Catatan terkait
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {data.notes.length} dipilih
                                </span>
                            </div>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="work-item-note-search"
                                    value={noteSearch}
                                    onChange={(event) =>
                                        setNoteSearch(event.target.value)
                                    }
                                    placeholder="Cari catatan..."
                                    className="h-9 bg-background pl-9"
                                />
                            </div>
                            <div className="max-h-40 divide-y overflow-y-auto rounded-md border">
                                {filteredNotes.length === 0 ? (
                                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                                        {notes.length === 0
                                            ? 'Belum ada catatan. Buat catatan lebih dulu di menu Catatan.'
                                            : 'Tidak ada catatan yang cocok.'}
                                    </p>
                                ) : (
                                    filteredNotes.map((note) => (
                                        <label
                                            key={note.id}
                                            className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.notes.includes(
                                                    note.id,
                                                )}
                                                onChange={() =>
                                                    toggleNote(note.id)
                                                }
                                                className="size-4 rounded border-input accent-indigo-500"
                                            />
                                            <span className="line-clamp-1">
                                                {note.title}
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tautkan catatan pengetahuan yang mendukung
                                pekerjaan ini. Opsional.
                            </p>
                            <InputError message={errors.notes} />
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

            {/* Dialog simpan tampilan */}
            <Dialog open={saveViewOpen} onOpenChange={setSaveViewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Simpan tampilan</DialogTitle>
                        <DialogDescription>
                            Simpan kombinasi filter dan mode tampilan saat ini
                            agar bisa dibuka lagi dengan satu klik.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={submitSaveView}
                        className="flex flex-col gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="saved-view-name">
                                Nama tampilan
                            </Label>
                            <Input
                                id="saved-view-name"
                                value={viewFormData.name}
                                onChange={(event) =>
                                    setViewFormData('name', event.target.value)
                                }
                                placeholder="mis. Pekerjaan mendesak"
                                autoFocus
                                required
                                aria-invalid={Boolean(viewErrors.name)}
                            />
                            <InputError message={viewErrors.name} />
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-3">
                            <p className="text-xs font-medium">
                                Filter yang disimpan
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {savedViewSummary}
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSaveViewOpen(false)}
                                disabled={savingView}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={savingView}
                                className="gap-2 bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                            >
                                {savingView ? (
                                    <Spinner className="size-4" />
                                ) : (
                                    <BookmarkPlus className="size-4" />
                                )}
                                Simpan tampilan
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

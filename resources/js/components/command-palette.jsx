import { router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ClipboardList,
    CornerDownLeft,
    FolderKanban,
    Home,
    NotebookPen,
    Plus,
    Search,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { priorityMeta, statusMeta } from '@/lib/work-item-meta';

const commands = [
    {
        id: 'home',
        group: 'Navigasi',
        label: 'Beranda',
        hint: 'Dashboard',
        href: '/admin',
        icon: Home,
        keywords: 'dashboard ringkasan',
    },
    {
        id: 'notes',
        group: 'Navigasi',
        label: 'Catatan',
        hint: 'Daftar catatan',
        href: '/admin/notes',
        icon: NotebookPen,
        keywords: 'note catatan',
    },
    {
        id: 'work-items',
        group: 'Navigasi',
        label: 'Pekerjaan',
        hint: 'Daftar pekerjaan',
        href: '/admin/work-items',
        icon: ClipboardList,
        keywords: 'work item tugas',
    },
    {
        id: 'projects',
        group: 'Navigasi',
        label: 'Proyek',
        hint: 'Proyek dan area',
        href: '/admin/projects',
        icon: FolderKanban,
        keywords: 'project area',
    },
    {
        id: 'password',
        group: 'Navigasi',
        label: 'Keamanan',
        hint: 'Ubah password',
        href: '/admin/password',
        icon: ShieldCheck,
        keywords: 'password keamanan',
    },
    {
        id: 'new-note',
        group: 'Buat cepat',
        label: 'Catatan baru',
        hint: 'Buka editor catatan',
        href: '/admin/notes?new=1',
        icon: Plus,
        keywords: 'tambah catatan note',
    },
    {
        id: 'new-work-item',
        group: 'Buat cepat',
        label: 'Pekerjaan baru',
        hint: 'Buka form pekerjaan',
        href: '/admin/work-items?new=1',
        icon: Plus,
        keywords: 'tambah pekerjaan tugas work item',
    },
];

const emptyResults = { notes: [], workItems: [] };

const workItemHint = (item) => {
    const parts = [
        statusMeta[item.status]?.label,
        priorityMeta[item.priority]?.label,
        item.due_date ? `Tenggat ${formatDate(item.due_date)}` : null,
    ].filter(Boolean);

    return parts.join(' · ') || item.excerpt || 'Pekerjaan';
};

export default function CommandPalette({ open, onOpenChange }) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [results, setResults] = useState(emptyResults);
    const [searching, setSearching] = useState(false);

    const term = query.trim();
    const searchTerm = term.length >= 2 ? term : '';

    useEffect(() => {
        if (!searchTerm) {
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/admin/search?q=${encodeURIComponent(searchTerm)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error('Pencarian gagal.');
                }

                const data = await response.json();

                setResults({
                    notes: Array.isArray(data.notes) ? data.notes : [],
                    workItems: Array.isArray(data.workItems)
                        ? data.workItems
                        : [],
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setResults(emptyResults);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setSearching(false);
                }
            }
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm]);

    const items = useMemo(() => {
        const normalized = query.trim().toLowerCase();

        const commandItems = normalized
            ? commands.filter((command) =>
                  `${command.label} ${command.hint} ${command.keywords}`
                      .toLowerCase()
                      .includes(normalized),
              )
            : commands;

        const noteItems = searchTerm
            ? results.notes.map((note) => ({
                  id: `note-${note.id}`,
                  group: 'Catatan',
                  label: note.title,
                  hint: note.excerpt || 'Catatan',
                  href: `/admin/notes/${note.id}`,
                  icon: NotebookPen,
              }))
            : [];

        const workItemResults = searchTerm
            ? results.workItems.map((item) => ({
                  id: `work-item-${item.id}`,
                  group: 'Pekerjaan',
                  label: item.title,
                  hint: workItemHint(item),
                  href: `/admin/work-items?q=${encodeURIComponent(item.title)}`,
                  icon: ClipboardList,
              }))
            : [];

        return [...commandItems, ...noteItems, ...workItemResults];
    }, [query, results, searchTerm]);

    const safeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));

    const reset = () => {
        setQuery('');
        setActiveIndex(0);
        setResults(emptyResults);
        setSearching(false);
    };

    const handleOpenChange = (next) => {
        if (!next) {
            reset();
        }

        onOpenChange(next);
    };

    const runCommand = (command) => {
        handleOpenChange(false);
        router.visit(command.href);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) =>
                items.length ? (index + 1) % items.length : 0,
            );

            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) =>
                items.length ? (index - 1 + items.length) % items.length : 0,
            );

            return;
        }

        if (event.key === 'Enter' && items[safeIndex]) {
            event.preventDefault();
            runCommand(items[safeIndex]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogTitle className="sr-only">Command palette</DialogTitle>
                <DialogDescription className="sr-only">
                    Cari halaman, catatan, atau pekerjaan.
                </DialogDescription>

                <div className="flex items-center gap-2 border-b px-4">
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                    <input
                        type="text"
                        role="combobox"
                        aria-label="Cari halaman, catatan, atau pekerjaan"
                        aria-autocomplete="list"
                        aria-expanded="true"
                        aria-controls="command-palette-list"
                        aria-activedescendant={
                            items[safeIndex]
                                ? `command-${items[safeIndex].id}`
                                : undefined
                        }
                        value={query}
                        onChange={(event) => {
                            const value = event.target.value;
                            const nextTerm = value.trim();

                            setQuery(value);
                            setActiveIndex(0);
                            setSearching(nextTerm.length >= 2);

                            if (nextTerm.length < 2) {
                                setResults(emptyResults);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Cari halaman, catatan, atau pekerjaan..."
                        className="h-12 w-full bg-transparent pr-10 text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>

                <div
                    id="command-palette-list"
                    role="listbox"
                    aria-label="Daftar hasil"
                    className="max-h-[340px] overflow-y-auto p-2"
                >
                    {searching && (
                        <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                            Mencari...
                        </p>
                    )}

                    {items.length === 0 && !searching ? (
                        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                            {searchTerm
                                ? `Tidak ada hasil untuk “${searchTerm}”.`
                                : 'Tidak ada perintah yang cocok.'}
                        </p>
                    ) : (
                        items.map((item, index) => {
                            const Icon = item.icon;
                            const showGroup =
                                index === 0 ||
                                items[index - 1].group !== item.group;

                            return (
                                <div key={item.id}>
                                    {showGroup && (
                                        <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                                            {item.group}
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        id={`command-${item.id}`}
                                        role="option"
                                        aria-selected={index === safeIndex}
                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }
                                        onClick={() => runCommand(item)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                            index === safeIndex
                                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                : 'text-foreground hover:bg-muted',
                                        )}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        <span className="flex-1">
                                            <span className="block truncate font-medium">
                                                {item.label}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.hint}
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <ArrowUp className="size-3" />
                        <ArrowDown className="size-3" />
                        navigasi
                    </span>
                    <span className="flex items-center gap-1">
                        <CornerDownLeft className="size-3" />
                        pilih
                    </span>
                    <span>Esc tutup</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}

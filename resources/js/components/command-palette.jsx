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
import { useMemo, useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

export default function CommandPalette({ open, onOpenChange }) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (!term) {
            return commands;
        }

        return commands.filter((command) =>
            `${command.label} ${command.hint} ${command.keywords}`
                .toLowerCase()
                .includes(term),
        );
    }, [query]);

    const safeIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

    const reset = () => {
        setQuery('');
        setActiveIndex(0);
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
                filtered.length ? (index + 1) % filtered.length : 0,
            );

            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) =>
                filtered.length
                    ? (index - 1 + filtered.length) % filtered.length
                    : 0,
            );

            return;
        }

        if (event.key === 'Enter' && filtered[safeIndex]) {
            event.preventDefault();
            runCommand(filtered[safeIndex]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogTitle className="sr-only">Command palette</DialogTitle>
                <DialogDescription className="sr-only">
                    Cari halaman atau jalankan aksi cepat.
                </DialogDescription>

                <div className="flex items-center gap-2 border-b px-4">
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                    <input
                        type="text"
                        role="combobox"
                        aria-label="Cari perintah"
                        aria-autocomplete="list"
                        aria-expanded="true"
                        aria-controls="command-palette-list"
                        aria-activedescendant={
                            filtered[safeIndex]
                                ? `command-${filtered[safeIndex].id}`
                                : undefined
                        }
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActiveIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Cari halaman atau perintah..."
                        className="h-12 w-full bg-transparent pr-10 text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>

                <div
                    id="command-palette-list"
                    role="listbox"
                    aria-label="Daftar perintah"
                    className="max-h-[340px] overflow-y-auto p-2"
                >
                    {filtered.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                            Tidak ada perintah yang cocok.
                        </p>
                    ) : (
                        filtered.map((command, index) => {
                            const Icon = command.icon;
                            const showGroup =
                                index === 0 ||
                                filtered[index - 1].group !== command.group;

                            return (
                                <div key={command.id}>
                                    {showGroup && (
                                        <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                                            {command.group}
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        id={`command-${command.id}`}
                                        role="option"
                                        aria-selected={index === safeIndex}
                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }
                                        onClick={() => runCommand(command)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                            index === safeIndex
                                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                : 'text-foreground hover:bg-muted',
                                        )}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        <span className="flex-1">
                                            <span className="block font-medium">
                                                {command.label}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {command.hint}
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

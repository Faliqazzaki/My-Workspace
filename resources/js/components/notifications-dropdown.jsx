import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    BellOff,
    Calendar,
    CheckCheck,
    Clock,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { priorityMeta } from '@/lib/work-item-meta';

const STORAGE_KEY = 'my_workspace_read_notifications';

const getStoredReadKeys = () => {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return [];
        }
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveStoredReadKeys = (keys) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const trimmed = keys.slice(-500);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        // Abaikan error kuota/privasi
    }
};

const categoryMeta = {
    overdue: {
        label: 'Terlambat',
        badge: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
        icon: AlertCircle,
        dot: 'bg-red-500',
    },
    today: {
        label: 'Hari Ini',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
        icon: Clock,
        dot: 'bg-amber-500',
    },
    tomorrow: {
        label: 'Besok',
        badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20',
        icon: Calendar,
        dot: 'bg-sky-500',
    },
};

export default function NotificationsDropdown() {
    const [items, setItems] = useState([]);
    const [readKeys, setReadKeys] = useState(getStoredReadKeys);
    const [open, setOpen] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            const response = await fetch('/admin/notifications', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            const list = Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.notifications)
                  ? data.notifications
                  : Array.isArray(data.data)
                    ? data.data
                    : [];

            setItems(list);
        } catch {
            // Abaikan kesalahan jaringan sementara
        }
    }, []);

    useEffect(() => {
        let ignore = false;
        const timer = setTimeout(async () => {
            try {
                const response = await fetch('/admin/notifications', {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                if (!ignore) {
                    const list = Array.isArray(data.items)
                        ? data.items
                        : Array.isArray(data.notifications)
                          ? data.notifications
                          : Array.isArray(data.data)
                            ? data.data
                            : [];

                    setItems(list);
                }
            } catch {
                // Abaikan kesalahan jaringan sementara
            }
        }, 0);

        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, []);

    const handleOpenChange = (nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
            loadNotifications();
        }
    };

    const markAsRead = (key) => {
        if (!readKeys.includes(key)) {
            const next = [...readKeys, key];
            setReadKeys(next);
            saveStoredReadKeys(next);
        }
    };

    const markAllAsRead = () => {
        const itemKeys = items.map((item) => item.read_key).filter(Boolean);
        const next = Array.from(new Set([...readKeys, ...itemKeys]));
        setReadKeys(next);
        saveStoredReadKeys(next);
    };

    const unreadCount = items.filter(
        (item) => !readKeys.includes(item.read_key),
    ).length;

    const overdueItems = items.filter((item) => item.category === 'overdue');
    const todayItems = items.filter((item) => item.category === 'today');
    const tomorrowItems = items.filter((item) => item.category === 'tomorrow');

    const sections = [
        { key: 'overdue', label: 'Terlambat', items: overdueItems },
        { key: 'today', label: 'Jatuh Tempo Hari Ini', items: todayItems },
        { key: 'tomorrow', label: 'Jatuh Tempo Besok', items: tomorrowItems },
    ].filter((s) => s.items.length > 0);

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={
                        unreadCount > 0
                            ? `Notifikasi (${unreadCount} belum dibaca)`
                            : 'Notifikasi'
                    }
                    title={
                        unreadCount > 0
                            ? `${unreadCount} tenggat mendekati atau terlambat`
                            : 'Notifikasi'
                    }
                >
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="max-h-[28rem] w-80 overflow-y-auto p-0 sm:w-96"
            >
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                            Notifikasi Tenggat
                        </span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <CheckCheck className="size-3.5" />
                            Tandai dibaca
                        </button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted/60">
                            <BellOff className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            Tidak ada tenggat mendesak
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Semua pekerjaan selesai atau belum mendekati batas
                            waktu.
                        </p>
                    </div>
                ) : (
                    <div className="py-1">
                        {sections.map((section, idx) => (
                            <div key={section.key}>
                                {idx > 0 && <DropdownMenuSeparator />}
                                <DropdownMenuLabel className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    <span>{section.label}</span>
                                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                        {section.items.length}
                                    </span>
                                </DropdownMenuLabel>

                                {section.items.map((item) => {
                                    const isRead = readKeys.includes(
                                        item.read_key,
                                    );
                                    const priority =
                                        priorityMeta[item.priority] ??
                                        priorityMeta.medium;
                                    const catMeta =
                                        categoryMeta[item.category] ??
                                        categoryMeta.today;
                                    const CatIcon = catMeta.icon;

                                    return (
                                        <DropdownMenuItem
                                            key={`${item.id}-${item.due_date}`}
                                            asChild
                                            className="cursor-pointer px-3 py-2.5 focus:bg-muted/70"
                                            onSelect={() =>
                                                markAsRead(item.read_key)
                                            }
                                        >
                                            <Link
                                                href={item.url}
                                                className="flex w-full flex-col items-start gap-1"
                                                onClick={() => {
                                                    markAsRead(item.read_key);
                                                    setOpen(false);
                                                }}
                                            >
                                                <div className="flex w-full items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'size-2 shrink-0 rounded-full',
                                                            !isRead
                                                                ? 'bg-indigo-600 ring-2 ring-indigo-500/30 dark:bg-indigo-400'
                                                                : 'bg-transparent',
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    <span
                                                        className={cn(
                                                            'flex-1 truncate text-sm font-medium',
                                                            !isRead
                                                                ? 'font-semibold text-foreground'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {item.title}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                                            priority.badge,
                                                        )}
                                                    >
                                                        {priority.label}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 pl-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <CatIcon className="size-3" />
                                                        {formatDate(
                                                            item.due_date,
                                                        )}
                                                    </span>

                                                    {item.project && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="max-w-[120px] truncate">
                                                                {
                                                                    item.project
                                                                        .name
                                                                }
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

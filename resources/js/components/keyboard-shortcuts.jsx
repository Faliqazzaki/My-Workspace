import { router } from '@inertiajs/react';
import { Keyboard } from 'lucide-react';
import { Fragment, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const navigationShortcuts = {
    h: '/admin',
    n: '/admin/notes',
    w: '/admin/work-items',
    p: '/admin/projects',
};

const shortcutGroups = [
    {
        title: 'Global',
        items: [
            {
                keys: ['Ctrl/Cmd', 'K'],
                label: 'Buka pencarian & command palette',
            },
            { keys: ['/'], label: 'Buka pencarian' },
            { keys: ['?'], label: 'Buka bantuan shortcut' },
        ],
    },
    {
        title: 'Navigasi',
        items: [
            { keys: ['g', 'h'], label: 'Beranda' },
            { keys: ['g', 'n'], label: 'Catatan' },
            { keys: ['g', 'w'], label: 'Pekerjaan' },
            { keys: ['g', 'p'], label: 'Proyek' },
        ],
    },
    {
        title: 'Aksi cepat',
        items: [
            { keys: ['n'], label: 'Catatan baru' },
            { keys: ['w'], label: 'Pekerjaan baru' },
        ],
    },
];

const isTypingTarget = (target) => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable
    );
};

const hasOpenOverlay = () =>
    Boolean(
        document.querySelector(
            '[role="dialog"][data-state="open"], [role="listbox"][data-state="open"], [role="menu"][data-state="open"]',
        ),
    );

export default function KeyboardShortcuts({
    open,
    onOpenChange,
    onOpenPalette,
}) {
    const pendingG = useRef(false);
    const gTimer = useRef(null);

    useEffect(() => {
        const clearPending = () => {
            pendingG.current = false;

            if (gTimer.current) {
                clearTimeout(gTimer.current);
                gTimer.current = null;
            }
        };

        const handleKeyDown = (event) => {
            if (
                event.repeat ||
                event.isComposing ||
                isTypingTarget(event.target) ||
                hasOpenOverlay()
            ) {
                clearPending();

                return;
            }

            if (event.metaKey || event.ctrlKey || event.altKey) {
                clearPending();

                return;
            }

            const key = event.key.toLowerCase();

            if (pendingG.current) {
                clearPending();

                const route = navigationShortcuts[key];

                if (route) {
                    event.preventDefault();
                    router.visit(route);
                }

                return;
            }

            if (key === 'g') {
                event.preventDefault();
                pendingG.current = true;
                gTimer.current = setTimeout(() => {
                    pendingG.current = false;
                    gTimer.current = null;
                }, 1000);

                return;
            }

            if (key === '/') {
                event.preventDefault();
                onOpenPalette();

                return;
            }

            if (event.key === '?') {
                event.preventDefault();
                onOpenChange(true);

                return;
            }

            if (key === 'n') {
                event.preventDefault();
                router.visit('/admin/notes?new=1');

                return;
            }

            if (key === 'w') {
                event.preventDefault();
                router.visit('/admin/work-items?new=1');
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearPending();
        };
    }, [onOpenChange, onOpenPalette]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="size-5" />
                        Shortcut keyboard
                    </DialogTitle>
                    <DialogDescription>
                        Akses cepat tanpa meninggalkan keyboard. Shortcut tidak
                        aktif saat mengetik di kolom input atau saat dialog/menu
                        terbuka.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {shortcutGroups.map((group) => (
                        <section key={group.title}>
                            <h3 className="mb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                                {group.title}
                            </h3>
                            <ul className="space-y-1.5">
                                {group.items.map((item) => (
                                    <li
                                        key={item.label}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <span className="text-muted-foreground">
                                            {item.label}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-1">
                                            {item.keys.map((key, index) => (
                                                <Fragment key={key}>
                                                    {index > 0 && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            lalu
                                                        </span>
                                                    )}
                                                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                                                        {key}
                                                    </kbd>
                                                </Fragment>
                                            ))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

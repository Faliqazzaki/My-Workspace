import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ClipboardList,
    Home,
    LogOut,
    Menu,
    NotebookPen,
    ShieldCheck,
    X,
} from 'lucide-react';
import { useState } from 'react';

import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import WorkspaceLogo from '@/components/workspace-logo';
import { cn } from '@/lib/utils';

const navigation = [
    { label: 'Beranda', href: '/admin', icon: Home },
    { label: 'Catatan', href: '/admin/notes', icon: NotebookPen },
    { label: 'Pekerjaan', href: '/admin/work-items', icon: ClipboardList },
    { label: 'Keamanan', href: '/admin/password', icon: ShieldCheck },
];

export default function AdminLayout({ title = 'Beranda', children }) {
    const { url, props } = usePage();
    const { admin, flash } = props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const username = admin?.username ?? 'my-workspace';

    const logout = () => {
        router.post('/keluar');
    };

    const isActive = (href) => {
        if (href === '/admin') {
            return url === '/admin' || url.startsWith('/admin?');
        }

        return url.startsWith(href);
    };

    return (
        <>
            <Head title={title} />

            <div className="flex h-dvh overflow-hidden bg-muted/30 text-foreground">
                {sidebarOpen && (
                    <button
                        type="button"
                        aria-label="Tutup sidebar"
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    />
                )}

                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card transition-transform duration-200 ease-out lg:static lg:translate-x-0',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                    )}
                >
                    <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
                        <WorkspaceLogo />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            aria-label="Tutup sidebar"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                        <p className="px-3 pb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Menu
                        </p>

                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <Icon className="size-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t p-4">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">
                                MW
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Administrator
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Keluar"
                                title="Keluar"
                                onClick={logout}
                            >
                                <LogOut className="size-4" />
                            </Button>
                        </div>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                aria-label="Buka sidebar"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="size-4" />
                            </Button>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Admin
                                </p>
                                <p className="text-sm font-medium">{title}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={logout}
                                className="hidden sm:inline-flex"
                            >
                                <LogOut className="size-4" />
                                Keluar
                            </Button>
                        </div>
                    </header>

                    {flash?.success && (
                        <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 sm:px-6 dark:text-emerald-300">
                            {flash.success}
                        </div>
                    )}

                    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}

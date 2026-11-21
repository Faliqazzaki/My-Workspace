import { Head, router } from '@inertiajs/react';
import { Construction, Home, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import WorkspaceLogo from '@/components/workspace-logo';
import { cn } from '@/lib/utils';

export default function Admin({ admin }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const username = admin?.username ?? 'my-workspace';

    const logout = () => {
        router.post('/keluar');
    };

    return (
        <>
            <Head title="Admin" />

            <div className="flex h-dvh overflow-hidden bg-muted/30 text-foreground">
                {/* Latar gelap saat sidebar terbuka di mobile */}
                {sidebarOpen && (
                    <button
                        type="button"
                        aria-label="Tutup sidebar"
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    />
                )}

                {/* Sidebar */}
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

                        <span className="flex items-center gap-3 rounded-lg bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            <Home className="size-4" />
                            Beranda
                        </span>

                        <div className="mt-4 rounded-xl border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
                            Menu lain akan ditambahkan pada tahap berikutnya.
                        </div>
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

                {/* Area utama */}
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
                                <p className="text-sm font-medium">Beranda</p>
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

                    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                        <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-10 text-center">
                            <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                                <Construction className="size-7" />
                            </span>
                            <h1 className="mt-5 text-lg font-semibold tracking-tight">
                                Halaman admin masih kosong
                            </h1>
                            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                Sidebar dan area konten sudah siap. Isi halaman
                                akan dibahas dan ditambahkan pada fitur
                                berikutnya.
                            </p>
                            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                Tahap berikutnya
                            </span>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

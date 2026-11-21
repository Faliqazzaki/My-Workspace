import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    Code2,
    Database,
    Layers,
    Moon,
    Palette,
    Route,
    ShieldCheck,
    Sparkles,
    Sun,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, login, register } from '@/routes';

const features = [
    {
        icon: Route,
        title: 'Inertia.js v2',
        description:
            'Navigasi halaman tanpa reload, dengan controller Laravel sebagai sumber datanya.',
    },
    {
        icon: Palette,
        title: 'Tailwind CSS v4',
        description:
            'Utility-first styling yang cepat, konsisten, dan mendukung mode gelap.',
    },
    {
        icon: Boxes,
        title: 'Komponen shadcn/ui',
        description:
            'Kumpulan komponen aksesibel berbasis Radix yang siap dipakai ulang.',
    },
    {
        icon: ShieldCheck,
        title: 'Autentikasi Fortify',
        description:
            'Login, registrasi, reset password, hingga two-factor sudah tersedia.',
    },
    {
        icon: Code2,
        title: 'TypeScript & Wayfinder',
        description:
            'Route helper bertipe otomatis, jadi tautan antar halaman lebih aman.',
    },
    {
        icon: Database,
        title: 'SQLite siap pakai',
        description:
            'Database bawaan sudah terhubung, cukup jalankan migrasi dan mulai.',
    },
];

const stats = [
    { label: 'Framework', value: 'Laravel 12' },
    { label: 'Frontend', value: 'React 19' },
    { label: 'Jembatan', value: 'Inertia v2' },
];

export default function Welcome({ canRegister = true }) {
    const { auth } = usePage().props;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <>
            <Head title="Beranda">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
                {/* Dekorasi latar */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10"
                >
                    <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/10" />
                    <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/15 blur-3xl dark:bg-fuchsia-500/10" />
                    <div className="absolute bottom-0 -left-32 h-[24rem] w-[24rem] rounded-full bg-sky-500/15 blur-3xl dark:bg-sky-500/10" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] bg-[size:4rem_4rem] opacity-30" />
                </div>

                <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6">
                    <header className="flex items-center justify-between py-6">
                        <Link
                            href="/"
                            className="flex items-center gap-3 font-semibold tracking-tight"
                        >
                            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/25">
                                <Layers className="size-5" />
                            </span>
                            <span>my-workspace</span>
                        </Link>

                        <nav className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={
                                    isDark
                                        ? 'Aktifkan mode terang'
                                        : 'Aktifkan mode gelap'
                                }
                                onClick={() =>
                                    updateAppearance(isDark ? 'light' : 'dark')
                                }
                            >
                                {isDark ? (
                                    <Sun className="size-4" />
                                ) : (
                                    <Moon className="size-4" />
                                )}
                            </Button>

                            {auth.user ? (
                                <Button asChild>
                                    <Link href={dashboard()}>
                                        Dashboard
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild>
                                        <Link href={login()}>Masuk</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild>
                                            <Link href={register()}>
                                                Daftar
                                            </Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </nav>
                    </header>

                    <main className="flex flex-1 flex-col">
                        {/* Hero */}
                        <section className="flex flex-col items-center py-16 text-center sm:py-24">
                            <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                                <Sparkles className="size-3.5 text-indigo-500" />
                                Laravel 12 · React 19 · Inertia v2
                            </span>

                            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                                Ruang kerja sederhana untuk{' '}
                                <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent">
                                    membangun ide
                                </span>
                            </h1>

                            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                                my-workspace adalah fondasi aplikasi web modern
                                dengan backend Laravel dan antarmuka React.
                                Autentikasi, komponen UI, dan routing sudah
                                disiapkan agar kamu bisa langsung berkarya.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                {auth.user ? (
                                    <Button size="lg" asChild>
                                        <Link href={dashboard()}>
                                            Buka Dashboard
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button size="lg" asChild>
                                            <Link href={register()}>
                                                Mulai sekarang
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href={login()}>
                                                Sudah punya akun? Masuk
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>

                            <dl className="mt-14 grid w-full max-w-2xl grid-cols-3 divide-x rounded-2xl border bg-background/60 py-5 backdrop-blur">
                                {stats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="flex flex-col items-center gap-1 px-2"
                                    >
                                        <dt className="text-xs text-muted-foreground">
                                            {stat.label}
                                        </dt>
                                        <dd className="text-sm font-semibold sm:text-base">
                                            {stat.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        {/* Fitur */}
                        <section className="pb-20">
                            <div className="mb-8 flex flex-col gap-2 text-center">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Yang sudah termasuk
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Semua pondasi yang kamu butuhkan, tanpa
                                    konfigurasi berlebihan.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {features.map((feature) => {
                                    const Icon = feature.icon;

                                    return (
                                        <Card
                                            key={feature.title}
                                            className="group bg-background/60 backdrop-blur transition-colors hover:border-indigo-500/40"
                                        >
                                            <CardHeader>
                                                <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                                                    <Icon className="size-5" />
                                                </span>
                                                <CardTitle>
                                                    {feature.title}
                                                </CardTitle>
                                                <CardDescription>
                                                    {feature.description}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    );
                                })}
                            </div>
                        </section>
                    </main>

                    <footer className="flex flex-col items-center justify-between gap-3 border-t py-6 text-xs text-muted-foreground sm:flex-row">
                        <p>
                            © {new Date().getFullYear()} my-workspace. Dibangun
                            dengan Laravel & React.
                        </p>
                        <p className="flex items-center gap-1.5">
                            <ShieldCheck className="size-3.5" />
                            Autentikasi aman dengan Laravel Fortify
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}

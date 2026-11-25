import { Head, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Eye,
    EyeOff,
    KeyRound,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import WorkspaceLogo from '@/components/workspace-logo';

const highlights = [
    {
        icon: ShieldCheck,
        text: 'Akses khusus untuk satu akun admin',
    },
    {
        icon: KeyRound,
        text: 'Sesi login aman dan terlindungi',
    },
    {
        icon: Sparkles,
        text: 'Siap dikembangkan dengan fitur berikutnya',
    },
];

export default function AdminLogin() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();
        post('/masuk');
    };

    return (
        <>
            <Head title="Masuk" />

            <div className="relative flex min-h-screen bg-background text-foreground">
                {/* Panel branding */}
                <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-sky-500 p-12 text-white lg:flex">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                    >
                        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute right-0 bottom-0 size-96 translate-x-1/3 translate-y-1/3 rounded-full bg-sky-300/20 blur-3xl" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] bg-[size:3.5rem_3.5rem]" />
                    </div>

                    <WorkspaceLogo tone="inverse" className="relative" />

                    <div className="relative max-w-md">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 ring-1 ring-white/20 backdrop-blur">
                            <span className="size-1.5 rounded-full bg-emerald-300" />
                            Panel Admin
                        </span>

                        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance">
                            Satu tempat untuk mengelola my-workspace.
                        </h1>

                        <p className="mt-4 text-sm leading-relaxed text-white/80">
                            Masuk dengan akun admin untuk melanjutkan. Halaman
                            ini masih tahap awal dan akan berkembang seiring
                            bertambahnya fitur.
                        </p>

                        <ul className="mt-8 flex flex-col gap-3">
                            {highlights.map((highlight) => {
                                const Icon = highlight.icon;

                                return (
                                    <li
                                        key={highlight.text}
                                        className="flex items-center gap-3 text-sm text-white/85"
                                    >
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                                            <Icon className="size-4" />
                                        </span>
                                        {highlight.text}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <p className="relative text-xs text-white/60">
                        © {new Date().getFullYear()} my-workspace
                    </p>
                </aside>

                {/* Panel form */}
                <main className="relative flex w-full flex-col lg:w-1/2">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:hidden"
                    >
                        <div className="absolute -top-24 right-0 size-72 rounded-full bg-indigo-500/15 blur-3xl" />
                        <div className="absolute bottom-0 -left-24 size-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
                    </div>

                    <div className="flex items-center justify-between p-6">
                        <WorkspaceLogo className="lg:hidden" />
                        <ThemeToggle className="ml-auto" />
                    </div>

                    <div className="flex flex-1 items-center justify-center px-6 pb-12">
                        <div className="w-full max-w-sm">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Selamat datang kembali
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Masuk ke panel admin menggunakan akun yang
                                    sudah disediakan.
                                </p>
                            </div>

                            <form
                                onSubmit={submit}
                                className="flex flex-col gap-5"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <div className="relative">
                                        <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            type="text"
                                            name="username"
                                            value={data.username}
                                            onChange={(event) =>
                                                setData(
                                                    'username',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 pl-10"
                                            placeholder="masukkan username"
                                            autoComplete="username"
                                            autoFocus
                                            required
                                            aria-invalid={Boolean(
                                                errors.username,
                                            )}
                                        />
                                    </div>
                                    <InputError message={errors.username} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            name="password"
                                            value={data.password}
                                            onChange={(event) =>
                                                setData(
                                                    'password',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 pr-11 pl-10"
                                            placeholder="masukkan password"
                                            autoComplete="current-password"
                                            required
                                            aria-invalid={Boolean(
                                                errors.password,
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (visible) => !visible,
                                                )
                                            }
                                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                                            aria-label={
                                                showPassword
                                                    ? 'Sembunyikan password'
                                                    : 'Tampilkan password'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) =>
                                            setData('remember', Boolean(checked))
                                        }
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer text-sm font-normal text-muted-foreground select-none hover:text-foreground"
                                    >
                                        Ingat saya
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={processing}
                                    className="mt-1 h-11 w-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                                >
                                    {processing ? (
                                        <>
                                            <Spinner />
                                            Memeriksa...
                                        </>
                                    ) : (
                                        <>
                                            Masuk
                                            <ArrowRight className="size-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                                Hanya tersedia satu akun admin. Akun ini
                                dikelola langsung di database workspace.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

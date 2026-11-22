import { useForm } from '@inertiajs/react';
import { KeyRound, Save, ShieldCheck } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AdminLayout from '@/layouts/admin-layout';

export default function AdminPassword() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();

        put('/admin/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AdminLayout title="Keamanan">
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">
                    Keamanan akun
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Perbarui password admin secara berkala.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6 lg:col-span-3">
                    <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                            <KeyRound className="size-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold">
                                Ubah password
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Masukkan password saat ini untuk konfirmasi.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                        className="mt-6 flex flex-col gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">
                                Password saat ini
                            </Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={data.current_password}
                                onChange={(event) =>
                                    setData(
                                        'current_password',
                                        event.target.value,
                                    )
                                }
                                autoComplete="current-password"
                                required
                                aria-invalid={Boolean(errors.current_password)}
                            />
                            <InputError message={errors.current_password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password baru</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(event) =>
                                    setData('password', event.target.value)
                                }
                                autoComplete="new-password"
                                required
                                aria-invalid={Boolean(errors.password)}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Konfirmasi password baru
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(event) =>
                                    setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                autoComplete="new-password"
                                required
                                aria-invalid={Boolean(
                                    errors.password_confirmation,
                                )}
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <div className="mt-2 flex justify-end">
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
                                        Simpan password
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </section>

                <aside className="rounded-xl border bg-card p-4 shadow-sm sm:p-6 lg:col-span-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                        <ShieldCheck className="size-4" />
                    </span>
                    <h2 className="mt-3 text-sm font-semibold">
                        Tips keamanan
                    </h2>
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                        <li>Gunakan minimal 8 karakter.</li>
                        <li>
                            Kombinasikan huruf besar, huruf kecil, angka, dan
                            simbol.
                        </li>
                        <li>
                            Jangan gunakan password yang sama dengan layanan
                            lain.
                        </li>
                        <li>
                            Ganti password jika perangkat pernah dipakai orang
                            lain.
                        </li>
                    </ul>
                </aside>
            </div>
        </AdminLayout>
    );
}

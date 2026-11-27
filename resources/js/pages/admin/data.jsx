import {
    CheckCircle2,
    Database,
    Download,
    Eye,
    FileArchive,
    FileJson,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { useToast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AdminLayout from '@/layouts/admin-layout';

const summaryLabels = {
    projects: 'Proyek',
    notes: 'Catatan',
    work_items: 'Pekerjaan',
    subtasks: 'Subtask',
};

const csrfToken = () =>
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') ?? '';

function SummaryGrid({ summary, verb }) {
    return (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(summaryLabels).map(([key, label]) => {
                const item = summary[key] ?? { total: 0, new: 0, skipped: 0 };

                return (
                    <div
                        key={key}
                        className="rounded-md bg-background/70 p-2 ring-1 ring-border/60 ring-inset"
                    >
                        <dt className="text-[11px] text-muted-foreground">
                            {label}
                        </dt>
                        <dd className="text-sm font-medium">
                            {item.new} {verb}
                        </dd>
                        <dd className="text-[11px] text-muted-foreground">
                            {item.skipped} dilewati
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
}

export default function AdminData({ counts = {}, maxUploadKb = 2048 }) {
    const toast = useToast();
    const [inputKey, setInputKey] = useState(0);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(null);

    const resetImport = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
        setInputKey((current) => current + 1);
    };

    const selectFile = (event) => {
        const selected = event.target.files?.[0] ?? null;

        setPreview(null);
        setResult(null);
        setError(null);

        if (!selected) {
            setFile(null);

            return;
        }

        if (!selected.name.toLowerCase().endsWith('.json')) {
            setFile(null);
            setError('File harus berekstensi .json.');
            event.target.value = '';

            return;
        }

        if (selected.size > maxUploadKb * 1024) {
            setFile(null);
            setError(`Ukuran file maksimal ${maxUploadKb / 1024} MB.`);
            event.target.value = '';

            return;
        }

        setFile(selected);
    };

    const submitFile = async (endpoint) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data?.errors?.file?.[0] ??
                    data?.message ??
                    'Permintaan gagal diproses.',
            );
        }

        return data;
    };

    const handlePreview = async () => {
        if (!file || busy) {
            return;
        }

        setBusy('preview');
        setError(null);
        setResult(null);
        setPreview(null);

        try {
            const data = await submitFile('/admin/data/import/preview');
            setPreview(data.summary);
        } catch (caught) {
            setError(caught.message);
        } finally {
            setBusy(null);
        }
    };

    const handleImport = async () => {
        if (!file || busy) {
            return;
        }

        setBusy('import');
        setError(null);

        try {
            const data = await submitFile('/admin/data/import');
            setResult(data.summary);
            setPreview(null);
            setFile(null);
            setInputKey((current) => current + 1);

            toast.success('Import selesai.');
        } catch (caught) {
            setError(caught.message);
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminLayout title="Data">
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">
                    Data & cadangan
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Unduh salinan data workspace atau pulihkan dari file export.
                    File tidak pernah berisi kredensial atau data pengguna.
                </p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border bg-card p-3 shadow-sm">
                    <p className="text-[11px] text-muted-foreground">Catatan</p>
                    <p className="text-lg font-semibold tabular-nums">
                        {counts.notes ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {counts.archivedNotes ?? 0} di arsip
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-3 shadow-sm">
                    <p className="text-[11px] text-muted-foreground">
                        Pekerjaan
                    </p>
                    <p className="text-lg font-semibold tabular-nums">
                        {counts.workItems ?? 0}
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-3 shadow-sm">
                    <p className="text-[11px] text-muted-foreground">Proyek</p>
                    <p className="text-lg font-semibold tabular-nums">
                        {counts.projects ?? 0}
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-3 shadow-sm">
                    <p className="text-[11px] text-muted-foreground">
                        Format file
                    </p>
                    <p className="text-sm font-semibold">JSON v1</p>
                    <p className="text-[11px] text-muted-foreground">
                        maks {maxUploadKb / 1024} MB
                    </p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
                    <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                            <Download className="size-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold">
                                Export data
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Simpan cadangan sebelum melakukan perubahan
                                besar.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="flex items-start gap-2">
                                <FileJson className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                                <div>
                                    <h3 className="text-sm font-medium">
                                        JSON lengkap
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Catatan, tag, pin, pekerjaan, subtask,
                                        tenggat, dan proyek.
                                    </p>
                                </div>
                            </div>

                            <form
                                method="get"
                                action="/admin/data/export/json"
                                className="mt-3 flex flex-wrap items-center justify-between gap-3"
                            >
                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        name="archived"
                                        value="1"
                                        className="size-4 rounded border-input accent-indigo-600"
                                    />
                                    Sertakan catatan terarsip
                                </label>
                                <Button type="submit" size="sm">
                                    <Download className="size-4" />
                                    Unduh JSON
                                </Button>
                            </form>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="flex items-start gap-2">
                                <FileArchive className="mt-0.5 size-4 shrink-0 text-sky-500" />
                                <div>
                                    <h3 className="text-sm font-medium">
                                        Markdown (.zip)
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Satu file Markdown per catatan aktif,
                                        dibungkus dalam ZIP.
                                    </p>
                                </div>
                            </div>

                            <form
                                method="get"
                                action="/admin/data/export/markdown"
                                className="mt-3 flex justify-end"
                            >
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="outline"
                                >
                                    <FileArchive className="size-4" />
                                    Unduh Markdown
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
                    <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                            <Upload className="size-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold">
                                Import data
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Unggah JSON hasil export. Data yang ada tidak
                                akan ditimpa.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="grid gap-2">
                            <Label htmlFor="import-file">
                                File JSON hasil export
                            </Label>
                            <Input
                                key={inputKey}
                                id="import-file"
                                type="file"
                                accept=".json,application/json"
                                onChange={selectFile}
                                disabled={busy !== null}
                            />
                            <p className="text-xs text-muted-foreground">
                                Maksimal {maxUploadKb / 1024} MB. Item dengan
                                judul dan isi yang sama akan dilewati.
                            </p>
                            <InputError message={error} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                onClick={handlePreview}
                                disabled={!file || busy !== null}
                            >
                                {busy === 'preview' ? (
                                    <>
                                        <Spinner />
                                        Memeriksa...
                                    </>
                                ) : (
                                    <>
                                        <Eye className="size-4" />
                                        Pratinjau import
                                    </>
                                )}
                            </Button>
                            {file && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetImport}
                                    disabled={busy !== null}
                                >
                                    Batal
                                </Button>
                            )}
                        </div>

                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                            Tidak ada password, email, atau data pengguna di
                            dalam file export.
                        </p>

                        {preview && (
                            <div
                                aria-live="polite"
                                className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3"
                            >
                                <h3 className="flex items-center gap-2 text-sm font-medium">
                                    <Database className="size-4 text-indigo-500" />
                                    Ringkasan sebelum menyimpan
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Belum ada data yang disimpan. Periksa
                                    ringkasan berikut lalu konfirmasi.
                                </p>
                                <SummaryGrid summary={preview} verb="baru" />
                                <div className="mt-3 flex flex-wrap justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetImport}
                                        disabled={busy !== null}
                                    >
                                        Batalkan
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleImport}
                                        disabled={busy !== null}
                                    >
                                        {busy === 'import' ? (
                                            <>
                                                <Spinner />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="size-4" />
                                                Simpan sekarang
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div
                                aria-live="polite"
                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"
                            >
                                <h3 className="flex items-center gap-2 text-sm font-medium">
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                    Import selesai
                                </h3>
                                <SummaryGrid summary={result} verb="dibuat" />
                                <div className="mt-3 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetImport}
                                    >
                                        Import file lain
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

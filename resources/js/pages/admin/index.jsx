import { Construction } from 'lucide-react';

import AdminLayout from '@/layouts/admin-layout';

export default function Admin() {
    return (
        <AdminLayout title="Beranda">
            <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-10 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <Construction className="size-7" />
                </span>
                <h1 className="mt-5 text-lg font-semibold tracking-tight">
                    Halaman admin masih kosong
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Sidebar dan area konten sudah siap. Isi halaman akan
                    ditambahkan pada fitur berikutnya.
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Tahap berikutnya
                </span>
            </div>
        </AdminLayout>
    );
}

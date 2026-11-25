import { usePage } from '@inertiajs/react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const variantStyles = {
    success: {
        container: 'border-emerald-500/30',
        icon: CheckCircle2,
        iconClass: 'text-emerald-500',
    },
    error: {
        container: 'border-red-500/30',
        icon: XCircle,
        iconClass: 'text-red-500',
    },
    info: {
        container: 'border-indigo-500/30',
        icon: Info,
        iconClass: 'text-indigo-500',
    },
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((item) => item.id !== id));
    }, []);

    const push = useCallback((toast) => {
        idRef.current += 1;

        setToasts((current) => [
            ...current.slice(-3),
            {
                id: idRef.current,
                variant: 'info',
                duration: 5000,
                ...toast,
            },
        ]);
    }, []);

    const toast = useMemo(
        () => ({
            show: push,
            success: (title, description) =>
                push({ title, description, variant: 'success' }),
            error: (title, description) =>
                push({ title, description, variant: 'error' }),
            info: (title, description) =>
                push({ title, description, variant: 'info' }),
        }),
        [push],
    );

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast harus dipakai di dalam ToastProvider.');
    }

    return context.toast;
}

export function FlashToasts() {
    const { flash } = usePage().props;
    const { toast } = useContext(ToastContext);
    const lastFlash = useRef(null);

    useEffect(() => {
        if (!flash || flash === lastFlash.current) {
            return;
        }

        lastFlash.current = flash;

        if (flash.success) {
            toast.success(flash.success);
        }

        if (flash.error) {
            toast.error(flash.error);
        }

        if (flash.info) {
            toast.info(flash.info);
        }
    }, [flash, toast]);

    return null;
}

function ToastViewport({ toasts, onDismiss }) {
    return (
        <div
            aria-live="polite"
            aria-atomic="false"
            className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }) {
    const meta = variantStyles[toast.variant] ?? variantStyles.info;
    const Icon = meta.icon;

    useEffect(() => {
        if (!toast.duration) {
            return;
        }

        const timer = setTimeout(() => onDismiss(toast.id), toast.duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onDismiss]);

    return (
        <div
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className={cn(
                'pointer-events-auto flex w-full animate-in items-start gap-3 rounded-xl border bg-background/95 p-3 text-foreground shadow-lg backdrop-blur fade-in slide-in-from-bottom-2',
                meta.container,
            )}
        >
            <Icon className={cn('mt-0.5 size-4 shrink-0', meta.iconClass)} />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {toast.description}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="rounded-md p-0.5 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}

import { Layers } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function WorkspaceLogo({
    tone = 'default',
    showName = true,
    className,
}) {
    const isInverse = tone === 'inverse';

    return (
        <span className={cn('flex items-center gap-3', className)}>
            <span
                className={cn(
                    'flex size-9 items-center justify-center rounded-xl',
                    isInverse
                        ? 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur'
                        : 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/25',
                )}
            >
                <Layers className="size-5" />
            </span>

            {showName && (
                <span
                    className={cn(
                        'font-semibold tracking-tight',
                        isInverse && 'text-white',
                    )}
                >
                    my-workspace
                </span>
            )}
        </span>
    );
}

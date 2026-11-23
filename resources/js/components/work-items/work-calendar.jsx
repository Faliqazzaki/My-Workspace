import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { isOverdue } from '@/lib/date';
import { cn } from '@/lib/utils';
import { statusMeta } from '@/lib/work-item-meta';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const pad = (value) => String(value).padStart(2, '0');

const dateKey = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dueKey = (value) => (value ? value.slice(0, 10) : '');

export default function WorkCalendar({ items = [], onEdit }) {
    const now = new Date();
    const [cursor, setCursor] = useState(
        () => new Date(now.getFullYear(), now.getMonth(), 1),
    );

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthKey = `${year}-${pad(month + 1)}`;
    const todayKey = dateKey(now);

    const firstOfMonth = new Date(year, month, 1);
    const offset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - offset);

    const days = Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);

        return date;
    });

    const itemsByDate = new Map();

    items.forEach((item) => {
        const key = dueKey(item.due_date);

        if (key === '') {
            return;
        }

        const bucket = itemsByDate.get(key) ?? [];
        bucket.push(item);
        itemsByDate.set(key, bucket);
    });

    const monthItems = items.filter(
        (item) => dueKey(item.due_date).slice(0, 7) === monthKey,
    );

    const goToMonth = (delta) => {
        setCursor(new Date(year, month + delta, 1));
    };

    const goToToday = () => {
        setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    };

    return (
        <div className="rounded-2xl border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight">
                        {MONTHS[month]} {year}
                    </h2>
                    <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                        {monthItems.length} tenggat
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => goToMonth(-1)}
                        aria-label="Bulan sebelumnya"
                        title="Bulan sebelumnya"
                        className="size-8"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="h-8 gap-1.5 px-2.5 text-xs"
                    >
                        <CalendarDays className="size-3.5" />
                        Hari ini
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => goToMonth(1)}
                        aria-label="Bulan berikutnya"
                        title="Bulan berikutnya"
                        className="size-8"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto p-3 sm:p-4">
                <div className="min-w-[44rem]">
                    <div className="grid grid-cols-7 border-b">
                        {WEEKDAYS.map((label, index) => (
                            <div
                                key={label}
                                className={cn(
                                    'px-2 pb-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase',
                                    index >= 5 && 'text-muted-foreground/70',
                                )}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 overflow-hidden rounded-b-lg border-x border-b">
                        {days.map((date) => {
                            const key = dateKey(date);
                            const inMonth = date.getMonth() === month;
                            const isToday = key === todayKey;
                            const dayItems = itemsByDate.get(key) ?? [];
                            const hidden = Math.max(0, dayItems.length - 3);

                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        'min-h-28 border-r border-b p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0',
                                        !inMonth && 'bg-muted/20',
                                        isToday && 'bg-indigo-500/[0.04]',
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={cn(
                                                'flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                                                !inMonth &&
                                                    'text-muted-foreground/60',
                                                isToday &&
                                                    'bg-indigo-600 text-white shadow-xs',
                                            )}
                                        >
                                            {date.getDate()}
                                        </span>
                                        {dayItems.length > 0 && (
                                            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                                                {dayItems.length}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1 space-y-1">
                                        {dayItems.slice(0, 3).map((item) => {
                                            const overdue = isOverdue(
                                                item.due_date,
                                                item.status,
                                            );

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => onEdit(item)}
                                                    title={item.title}
                                                    className={cn(
                                                        'flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] leading-snug transition-colors hover:bg-muted',
                                                        item.status ===
                                                            'done' &&
                                                            'text-muted-foreground line-through',
                                                        overdue &&
                                                            'text-red-600 dark:text-red-400',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'mt-1 size-1.5 shrink-0 rounded-full',
                                                            statusMeta[
                                                                item.status
                                                            ]?.bar,
                                                        )}
                                                    />
                                                    <span className="line-clamp-2">
                                                        {item.title}
                                                    </span>
                                                </button>
                                            );
                                        })}

                                        {hidden > 0 && (
                                            <p className="px-1.5 text-[10px] text-muted-foreground">
                                                +{hidden} lagi
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-4 py-3">
                {Object.entries(statusMeta).map(([status, meta]) => (
                    <span
                        key={status}
                        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                    >
                        <span className={cn('size-2 rounded-full', meta.bar)} />
                        {meta.label}
                    </span>
                ))}
                <span className="ml-auto text-[11px] text-muted-foreground">
                    Klik item untuk mengedit.
                </span>
            </div>
        </div>
    );
}

import {
    closestCorners,
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    CalendarDays,
    GripVertical,
    ListChecks,
    NotebookPen,
} from 'lucide-react';
import { useState } from 'react';

import { formatDate, isOverdue } from '@/lib/date';
import { cn } from '@/lib/utils';
import { priorityMeta, statusMeta } from '@/lib/work-item-meta';

function BoardCard({
    workItem,
    statuses,
    onStatusChange,
    handleProps,
    interactive = true,
}) {
    const overdue = isOverdue(workItem.due_date, workItem.status);
    const priority = priorityMeta[workItem.priority];
    const subtasks = workItem.subtasks ?? [];
    const doneSubtasks = subtasks.filter((subtask) => subtask.is_done).length;

    return (
        <article className="rounded-xl border bg-card p-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
                <span
                    className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                        priority?.badge,
                    )}
                >
                    {priority?.label ?? workItem.priority}
                </span>

                {interactive && (
                    <button
                        type="button"
                        {...handleProps}
                        aria-label={`Geser ${workItem.title}`}
                        title="Geser"
                        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                    >
                        <GripVertical className="size-3.5" />
                    </button>
                )}
            </div>

            <h3
                className={cn(
                    'mt-2 text-sm leading-snug font-medium break-words',
                    workItem.status === 'done' &&
                        'text-muted-foreground line-through',
                )}
            >
                {workItem.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {workItem.project && (
                    <span className="inline-flex items-center gap-1">
                        <span
                            className="size-2 rounded-full"
                            style={{
                                backgroundColor:
                                    workItem.project.color ?? '#6366f1',
                            }}
                        />
                        {workItem.project.name}
                    </span>
                )}

                {workItem.due_date && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1',
                            overdue &&
                                'font-medium text-red-600 dark:text-red-400',
                        )}
                    >
                        <CalendarDays className="size-3" />
                        {formatDate(workItem.due_date)}
                        {overdue && ' · terlambat'}
                    </span>
                )}

                {subtasks.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                        <ListChecks className="size-3" />
                        {doneSubtasks}/{subtasks.length}
                    </span>
                )}

                {workItem.notes?.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                        <NotebookPen className="size-3" />
                        {workItem.notes.length}
                    </span>
                )}
            </div>

            {workItem.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {workItem.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                            #{tag}
                        </span>
                    ))}
                    {workItem.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                            +{workItem.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {interactive && (
                <select
                    value={workItem.status}
                    onChange={(event) =>
                        onStatusChange(workItem, event.target.value)
                    }
                    aria-label={`Ubah status ${workItem.title}`}
                    className="mt-2.5 h-7 w-full rounded-md border border-input bg-background px-2 text-[11px] font-medium shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    {statuses.map((status) => (
                        <option key={status} value={status}>
                            {statusMeta[status]?.label ?? status}
                        </option>
                    ))}
                </select>
            )}
        </article>
    );
}

function DraggableCard({ workItem, statuses, onStatusChange }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: workItem.id,
        data: { status: workItem.status },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn('transition-opacity', isDragging && 'opacity-30')}
        >
            <BoardCard
                workItem={workItem}
                statuses={statuses}
                onStatusChange={onStatusChange}
                handleProps={{ ...listeners, ...attributes }}
            />
        </div>
    );
}

function KanbanColumn({ status, items, statuses, onStatusChange }) {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
        <section
            ref={setNodeRef}
            className={cn(
                'flex w-[82vw] shrink-0 flex-col rounded-2xl border bg-muted/40 transition-colors sm:w-72',
                isOver &&
                    'border-indigo-500/60 bg-indigo-500/5 ring-2 ring-indigo-500/25',
            )}
        >
            <header className="flex items-center justify-between gap-2 border-b px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'size-2 rounded-full',
                            statusMeta[status]?.bar,
                        )}
                    />
                    <h2 className="text-sm font-semibold">
                        {statusMeta[status]?.label ?? status}
                    </h2>
                </div>
                <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {items.length}
                </span>
            </header>

            <div className="flex min-h-28 flex-1 flex-col gap-2 p-2.5">
                {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-3 py-8 text-center text-[11px] text-muted-foreground">
                        Tarik pekerjaan ke sini
                    </p>
                ) : (
                    items.map((workItem) => (
                        <DraggableCard
                            key={workItem.id}
                            workItem={workItem}
                            statuses={statuses}
                            onStatusChange={onStatusChange}
                        />
                    ))
                )}
            </div>
        </section>
    );
}

export default function KanbanBoard({ items, statuses, onStatusChange }) {
    const [activeId, setActiveId] = useState(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 6 },
        }),
    );

    const activeItem = items.find((item) => item.id === activeId) ?? null;

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);

        if (!over) {
            return;
        }

        const workItem = items.find((item) => item.id === active.id);
        const targetStatus = String(over.id);

        if (
            !workItem ||
            !statuses.includes(targetStatus) ||
            workItem.status === targetStatus
        ) {
            return;
        }

        onStatusChange(workItem, targetStatus);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={({ active }) => setActiveId(active.id)}
            onDragCancel={() => setActiveId(null)}
            onDragEnd={handleDragEnd}
        >
            <div className="flex min-w-max items-start gap-3">
                {statuses.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        statuses={statuses}
                        items={items.filter((item) => item.status === status)}
                        onStatusChange={onStatusChange}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={null}>
                {activeItem ? (
                    <div className="w-72 rotate-2">
                        <BoardCard
                            workItem={activeItem}
                            statuses={statuses}
                            interactive={false}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

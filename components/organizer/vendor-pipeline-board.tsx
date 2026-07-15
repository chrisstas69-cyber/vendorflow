'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Clock, GripVertical, Shield, Star } from 'lucide-react';
import type { VendorSubmission } from '@/lib/platform-data';

type ColumnId = 'pending' | 'approved' | 'rejected';

const COLUMNS: { id: ColumnId; label: string; accent: string }[] = [
  { id: 'pending', label: 'Pending review', accent: 'text-amber-600' },
  { id: 'approved', label: 'Approved', accent: 'text-emerald-600' },
  { id: 'rejected', label: 'Rejected', accent: 'text-rose-600' },
];

const LOGO_COLORS = ['#c2410c', '#6366f1', '#059669', '#db2777', '#0891b2', '#ca8a04'];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * 17) % LOGO_COLORS.length;
  return LOGO_COLORS[h];
}

interface Props {
  submissions: VendorSubmission[];
  onStatusChange: (id: string, status: 'approved' | 'rejected') => Promise<void> | void;
  onOpen: (sub: VendorSubmission) => void;
}

export function VendorPipelineBoard({ submissions, onStatusChange, onOpen }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const byColumn = useMemo(() => {
    const map: Record<ColumnId, VendorSubmission[]> = {
      pending: [],
      approved: [],
      rejected: [],
    };
    for (const s of submissions) {
      map[s.status]?.push(s);
    }
    return map;
  }, [submissions]);

  const active = submissions.find(s => s.id === activeId) ?? null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active: dragActive, over } = e;
    if (!over) return;
    const id = String(dragActive.id);
    const overId = String(over.id) as ColumnId | string;
    const targetCol = (COLUMNS.some(c => c.id === overId)
      ? overId
      : submissions.find(s => s.id === overId)?.status) as ColumnId | undefined;
    if (!targetCol || targetCol === 'pending') return;
    const sub = submissions.find(s => s.id === id);
    if (!sub || sub.status === targetCol) return;
    await onStatusChange(id, targetCol);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-scrollbar overflow-x-auto">
        {COLUMNS.map(col => (
          <PipelineColumn
            key={col.id}
            column={col}
            items={byColumn[col.id]}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {active ? <VendorCard sub={active} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function PipelineColumn({
  column,
  items,
  onOpen,
}: {
  column: (typeof COLUMNS)[number];
  items: VendorSubmission[];
  onOpen: (sub: VendorSubmission) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border vf-border min-h-[280px] flex flex-col transition-colors ${
        isOver ? 'vf-surface-2 border-orange-500/40' : 'vf-bg-subtle'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b vf-border">
        <div className="flex items-center gap-2">
          {column.id === 'pending' ? (
            <Clock size={14} className={column.accent} />
          ) : (
            <CheckCircle2 size={14} className={column.accent} />
          )}
          <h3 className={`text-sm font-semibold ${column.accent}`}>{column.label}</h3>
        </div>
        <span className="text-[11px] font-medium tabular-nums vf-text-subtle vf-surface border vf-border rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {items.length === 0 ? (
          <p className="text-xs vf-text-subtle text-center py-8">Drop vendors here</p>
        ) : (
          items.map(sub => (
            <DraggableVendorCard key={sub.id} sub={sub} onOpen={onOpen} />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableVendorCard({
  sub,
  onOpen,
}: {
  sub: VendorSubmission;
  onOpen: (sub: VendorSubmission) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sub.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <VendorCard sub={sub} onOpen={() => onOpen(sub)} />
    </div>
  );
}

function VendorCard({
  sub,
  onOpen,
  dragging,
}: {
  sub: VendorSubmission;
  onOpen?: () => void;
  dragging?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left rounded-xl border vf-border vf-surface p-3 transition-all hover:border-orange-500/40 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing ${
        dragging ? 'shadow-xl ring-2 ring-orange-500/30' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
          style={{ background: colorFor(sub.vendorName) }}
        >
          {sub.vendorName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold vf-text truncate">{sub.vendorName}</p>
            {sub.shortlisted && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
          </div>
          <p className="text-[11px] vf-text-muted truncate mt-0.5">{sub.category}</p>
        </div>
        <GripVertical size={14} className="vf-text-subtle shrink-0 mt-1" />
      </div>
      <p className="text-[11px] vf-text-subtle mt-2 line-clamp-2 leading-relaxed">{sub.message}</p>
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            sub.hasInsurance
              ? 'bg-emerald-500/10 text-emerald-700'
              : 'bg-amber-500/10 text-amber-700'
          }`}
        >
          <Shield size={10} />
          {sub.hasInsurance ? 'Insured' : 'No COI'}
        </span>
        {sub.boothId && (
          <span className="text-[10px] font-medium vf-bg-subtle vf-text-muted px-1.5 py-0.5 rounded-full">
            Booth {sub.boothId}
          </span>
        )}
        {sub.paymentStatus === 'paid' && (
          <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded-full">
            Paid
          </span>
        )}
      </div>
    </button>
  );
}

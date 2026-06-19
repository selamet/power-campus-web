import { DndContext, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { minutesOf } from '../timeUtils';
import { SessionBlock, type GridItem } from './SessionBlock';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const SLOT_MIN = 30; // grid row granularity

interface WeekGridProps {
  items: GridItem[];
  dayStart: string;
  dayEnd: string;
  workingDays: number[];
  onSelectSession?: (item: GridItem) => void;
  onEmptyClick?: (weekday: number, startHm: string) => void;
  onDropSession?: (item: GridItem, weekday: number, startHm: string) => void;
}

/** A weekly recurring timetable: working-day columns × half-hour rows. */
export function WeekGrid({
  items,
  dayStart,
  dayEnd,
  workingDays,
  onSelectSession,
  onEmptyClick,
  onDropSession,
}: WeekGridProps) {
  const start = minutesOf(dayStart);
  const end = minutesOf(dayEnd);
  const rows = Math.max(1, Math.ceil((end - start) / SLOT_MIN));
  const days = [...workingDays].sort((a, b) => a - b);

  const rowLabel = (i: number): string => {
    const m = start + i * SLOT_MIN;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onDropSession || !event.over) return;
    const overId = String(event.over.id); // cell:<weekday>:<HH:MM>
    if (!overId.startsWith('cell:')) return;
    // overId is "cell:2:09:30" → split gives [cell,2,09,30]; rejoin the time
    const parts = overId.split(':');
    const weekday = Number(parts[1]);
    const hm = `${parts[2]}:${parts[3]}`;
    const item = items.find((it) => it.key === String(event.active.id));
    if (item) onDropSession(item, weekday, hm);
  };

  const grid = (
    <div className="overflow-x-auto rounded-xl border border-line">
      <div
        className="grid gap-px bg-line text-[11px]"
        style={{
          gridTemplateColumns: `56px repeat(${days.length}, minmax(96px, 1fr))`,
          minWidth: `${56 + days.length * 96}px`,
        }}
      >
        {/* header row */}
        <div className="sticky top-0 z-10 bg-surface-2 p-2" />
        {days.map((d) => (
          <div
            key={`h-${d}`}
            className="sticky top-0 z-10 bg-surface-2 p-2 text-center text-[11.5px] font-semibold tracking-[0.02em] text-ink-2 uppercase"
          >
            {DAY_LABELS[d]}
          </div>
        ))}

        {/* time rows */}
        {Array.from({ length: rows }, (_, r) => (
          <DayRow
            key={`r-${r}`}
            label={rowLabel(r)}
            rowStartMin={start + r * SLOT_MIN}
            days={days}
            items={items}
            onSelectSession={onSelectSession}
            onEmptyClick={onEmptyClick}
            draggable={!!onDropSession}
          />
        ))}
      </div>
    </div>
  );

  if (!onDropSession) return grid;

  return <DndContext onDragEnd={handleDragEnd}>{grid}</DndContext>;
}

interface DayRowProps {
  label: string;
  rowStartMin: number;
  days: number[];
  items: GridItem[];
  onSelectSession?: (item: GridItem) => void;
  onEmptyClick?: (weekday: number, startHm: string) => void;
  draggable: boolean;
}

function DayRow({
  label,
  rowStartMin,
  days,
  items,
  onSelectSession,
  onEmptyClick,
  draggable,
}: DayRowProps) {
  return (
    <>
      <div className="bg-surface p-1 text-right font-mono text-[10.5px] text-ink-3">{label}</div>
      {days.map((d) => {
        const hit = items.find(
          (it) => it.weekday === d && minutesOf(it.startTime) === rowStartMin,
        );
        return (
          <DropCell
            key={`c-${d}-${rowStartMin}`}
            weekday={d}
            rowStartMin={rowStartMin}
            hit={hit}
            onSelectSession={onSelectSession}
            onEmptyClick={onEmptyClick}
            draggable={draggable}
          />
        );
      })}
    </>
  );
}

function DropCell({
  weekday,
  rowStartMin,
  hit,
  onSelectSession,
  onEmptyClick,
  draggable,
}: {
  weekday: number;
  rowStartMin: number;
  hit?: GridItem;
  onSelectSession?: (item: GridItem) => void;
  onEmptyClick?: (weekday: number, startHm: string) => void;
  draggable: boolean;
}) {
  const startHm = `${String(Math.floor(rowStartMin / 60)).padStart(2, '0')}:${String(rowStartMin % 60).padStart(2, '0')}`;
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${weekday}:${startHm}` });
  const clickable = !hit && !!onEmptyClick;
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[34px] bg-surface p-0.5 transition-colors ${
        isOver ? 'outline outline-2 outline-accent' : ''
      } ${clickable ? 'cursor-pointer hover:bg-surface-2' : ''}`}
      onClick={hit ? undefined : () => onEmptyClick?.(weekday, startHm)}
    >
      {hit && (
        <SessionBlock
          item={hit}
          onClick={onSelectSession}
          draggableId={draggable ? hit.key : undefined}
        />
      )}
    </div>
  );
}

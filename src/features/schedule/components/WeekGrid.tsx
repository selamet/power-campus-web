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
}

/** A weekly recurring timetable: working-day columns × half-hour rows. */
export function WeekGrid({
  items,
  dayStart,
  dayEnd,
  workingDays,
  onSelectSession,
  onEmptyClick,
}: WeekGridProps) {
  const start = minutesOf(dayStart);
  const end = minutesOf(dayEnd);
  const rows = Math.max(1, Math.ceil((end - start) / SLOT_MIN));
  const days = [...workingDays].sort((a, b) => a - b);

  const rowLabel = (i: number): string => {
    const m = start + i * SLOT_MIN;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  return (
    <div
      className="grid gap-px overflow-x-auto rounded-xl bg-line text-[11px]"
      style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(96px, 1fr))` }}
    >
      {/* header row */}
      <div className="bg-surface p-2" />
      {days.map((d) => (
        <div key={`h-${d}`} className="bg-surface p-2 text-center font-semibold">
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
        />
      ))}
    </div>
  );
}

interface DayRowProps {
  label: string;
  rowStartMin: number;
  days: number[];
  items: GridItem[];
  onSelectSession?: (item: GridItem) => void;
  onEmptyClick?: (weekday: number, startHm: string) => void;
}

function DayRow({ label, rowStartMin, days, items, onSelectSession, onEmptyClick }: DayRowProps) {
  return (
    <>
      <div className="bg-surface p-1 text-right font-mono text-ink-3">{label}</div>
      {days.map((d) => {
        const hit = items.find(
          (it) => it.weekday === d && minutesOf(it.startTime) === rowStartMin,
        );
        const startHm = `${String(Math.floor(rowStartMin / 60)).padStart(2, '0')}:${String(rowStartMin % 60).padStart(2, '0')}`;
        return (
          <div
            key={`c-${d}-${rowStartMin}`}
            className="min-h-[34px] bg-surface p-0.5"
            onClick={hit ? undefined : () => onEmptyClick?.(d, startHm)}
          >
            {hit && <SessionBlock item={hit} onClick={onSelectSession} />}
          </div>
        );
      })}
    </>
  );
}

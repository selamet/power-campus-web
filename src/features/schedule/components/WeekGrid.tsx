import { DndContext, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { minutesOf } from '../timeUtils';
import { SessionBlock, type GridItem } from './SessionBlock';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HOUR_PX = 84; // vertical pixels per hour — the whole axis is proportional to time
const PX_PER_MIN = HOUR_PX / 60;
const SNAP_MIN = 15; // drag-drop / empty-click granularity

const hm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

interface WeekGridProps {
  items: GridItem[];
  dayStart: string;
  dayEnd: string;
  workingDays: number[];
  /** Per-weekday window overrides ("HH:MM:SS"); days absent use dayStart/dayEnd. */
  dayWindows?: Record<number, { start: string; end: string }>;
  onSelectSession?: (item: GridItem) => void;
  onEmptyClick?: (weekday: number, startHm: string) => void;
  onDropSession?: (item: GridItem, weekday: number, startHm: string) => void;
}

/** A weekly recurring timetable. The vertical axis is proportional to time, so a
 *  session block's height and position always line up with the hour gutter on the left. */
export function WeekGrid({
  items,
  dayStart,
  dayEnd,
  workingDays,
  dayWindows = {},
  onSelectSession,
  onEmptyClick,
  onDropSession,
}: WeekGridProps) {
  const windowFor = (d: number): [number, number] => {
    const w = dayWindows[d];
    return w ? [minutesOf(w.start), minutesOf(w.end)] : [minutesOf(dayStart), minutesOf(dayEnd)];
  };
  const days = [...workingDays].sort((a, b) => a - b);
  const wins = days.map(windowFor);
  const rawStart = Math.min(minutesOf(dayStart), ...wins.map((w) => w[0]));
  const rawEnd = Math.max(minutesOf(dayEnd), ...wins.map((w) => w[1]));
  const axisStart = Math.floor(rawStart / 60) * 60; // snap axis to whole hours
  const axisEnd = Math.ceil(rawEnd / 60) * 60;
  const totalMin = Math.max(60, axisEnd - axisStart);
  const bodyH = totalMin * PX_PER_MIN;
  const interactive = !!onEmptyClick || !!onDropSession;

  const hours: number[] = [];
  for (let h = axisStart; h <= axisEnd; h += 60) hours.push(h);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onDropSession || !event.over) return;
    const overId = String(event.over.id); // cell:<weekday>:<HH:MM>
    if (!overId.startsWith('cell:')) return;
    const parts = overId.split(':');
    const weekday = Number(parts[1]);
    const startHm = `${parts[2]}:${parts[3]}`;
    const item = items.find((it) => it.key === String(event.active.id));
    if (item) onDropSession(item, weekday, startHm);
  };

  const grid = (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <div
        className="grid gap-px bg-line"
        style={{
          gridTemplateColumns: `60px repeat(${days.length}, minmax(120px, 1fr))`,
          minWidth: `${60 + days.length * 120}px`,
        }}
      >
        {/* header row */}
        <div className="bg-surface-2 px-2 py-2.5" />
        {days.map((d) => (
          <div
            key={`h-${d}`}
            className="bg-surface-2 px-2 py-2.5 text-center text-[11.5px] font-semibold tracking-[0.04em] text-ink-2 uppercase"
          >
            {DAY_LABELS[d]}
          </div>
        ))}

        {/* hour gutter */}
        <div className="relative bg-surface" style={{ height: bodyH }}>
          {hours.map((h) => (
            <div
              key={`g-${h}`}
              className="absolute right-2 font-mono text-[10.5px] tabular-nums text-ink-3"
              style={{ top: (h - axisStart) * PX_PER_MIN + 2 }}
            >
              {hm(h)}
            </div>
          ))}
        </div>

        {/* day columns */}
        {days.map((d, i) => (
          <DayColumn
            key={`col-${d}`}
            weekday={d}
            bodyH={bodyH}
            axisStart={axisStart}
            totalMin={totalMin}
            win={wins[i]}
            items={items.filter((it) => it.weekday === d)}
            interactive={interactive}
            draggable={!!onDropSession}
            onSelectSession={onSelectSession}
            onEmptyClick={onEmptyClick}
          />
        ))}
      </div>
    </div>
  );

  if (!onDropSession) return grid;
  return <DndContext onDragEnd={handleDragEnd}>{grid}</DndContext>;
}

interface Placed {
  item: GridItem;
  startMin: number;
  endMin: number;
  lane: number;
}

/** Greedy lane packing so simultaneous sessions (e.g. all-classes view) sit side by side. */
function packLanes(items: GridItem[]): { placed: Placed[]; lanes: number } {
  const sorted = items
    .map((item) => ({ item, startMin: minutesOf(item.startTime), endMin: minutesOf(item.endTime) }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const laneEnds: number[] = [];
  const placed: Placed[] = sorted.map((s) => {
    let lane = laneEnds.findIndex((end) => end <= s.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(s.endMin);
    } else {
      laneEnds[lane] = s.endMin;
    }
    return { item: s.item, startMin: s.startMin, endMin: s.endMin, lane };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
}

interface DayColumnProps {
  weekday: number;
  bodyH: number;
  axisStart: number;
  totalMin: number;
  win: [number, number];
  items: GridItem[];
  interactive: boolean;
  draggable: boolean;
  onSelectSession?: (item: GridItem) => void;
  onEmptyClick?: (weekday: number, startHm: string) => void;
}

function DayColumn({
  weekday,
  bodyH,
  axisStart,
  totalMin,
  win: [ws, we],
  items,
  interactive,
  draggable,
  onSelectSession,
  onEmptyClick,
}: DayColumnProps) {
  const { placed, lanes } = packLanes(items);
  const slots: number[] = [];
  if (interactive) for (let t = ws; t + SNAP_MIN <= we; t += SNAP_MIN) slots.push(t);
  const top = (min: number) => (min - axisStart) * PX_PER_MIN;

  return (
    <div className="relative bg-surface" style={{ height: bodyH }}>
      {/* half-hour gridlines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0, var(--line) 1px, transparent 1px, transparent ${30 * PX_PER_MIN}px)`,
        }}
      />
      {/* greyed area before the day's window */}
      {ws > axisStart && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bg-surface-2/60"
          style={{ height: (ws - axisStart) * PX_PER_MIN }}
          aria-hidden
        />
      )}
      {/* greyed area after the day's window */}
      {we < axisStart + totalMin && (
        <div
          className="pointer-events-none absolute inset-x-0 bg-surface-2/60"
          style={{ top: top(we), bottom: 0 }}
          aria-hidden
        />
      )}
      {/* drop / empty-click slots */}
      {slots.map((t) => (
        <DropSlot
          key={`s-${t}`}
          weekday={weekday}
          startHm={hm(t)}
          top={top(t)}
          height={SNAP_MIN * PX_PER_MIN}
          onEmptyClick={onEmptyClick}
        />
      ))}
      {/* session blocks, positioned + sized proportionally to time */}
      {placed.map((p) => {
        const width = 100 / lanes;
        return (
          <div
            key={p.item.key}
            className="absolute z-10 px-0.5"
            style={{
              top: top(p.startMin),
              height: Math.max(SNAP_MIN, p.endMin - p.startMin) * PX_PER_MIN,
              left: `${p.lane * width}%`,
              width: `${width}%`,
            }}
          >
            <SessionBlock
              item={p.item}
              onClick={onSelectSession}
              draggableId={draggable ? p.item.key : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}

function DropSlot({
  weekday,
  startHm,
  top,
  height,
  onEmptyClick,
}: {
  weekday: number;
  startHm: string;
  top: number;
  height: number;
  onEmptyClick?: (weekday: number, startHm: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${weekday}:${startHm}` });
  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-x-0 transition-colors ${
        isOver ? 'bg-accent-soft outline outline-1 outline-accent' : ''
      } ${onEmptyClick ? 'cursor-pointer hover:bg-surface-2' : ''}`}
      style={{ top, height }}
      onClick={onEmptyClick ? () => onEmptyClick(weekday, startHm) : undefined}
    />
  );
}

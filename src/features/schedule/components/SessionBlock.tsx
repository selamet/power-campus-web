import { useDraggable } from '@dnd-kit/core';
import type { LessonType } from '@/types/domain';
import { Icon } from '@/components/ui';
import { hmFromApi } from '../timeUtils';

export interface GridItem {
  key: string;
  sessionId?: number;
  classLessonId: number;
  classId?: number;
  weekday: number;
  startTime: string;
  endTime: string;
  lessonType: LessonType;
  teacherName: string | null;
  locked?: boolean;
}

const LESSON_COLOR: Record<LessonType, string> = {
  speaking: 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300',
  reading: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  writing: 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300',
  speaking_club: 'bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300',
};

const LESSON_LABEL: Record<LessonType, string> = {
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  speaking_club: 'Speaking Club',
};

interface SessionBlockProps {
  item: GridItem;
  onClick?: (item: GridItem) => void;
  draggableId?: string;
  onToggleLock?: (item: GridItem) => void;
}

export function SessionBlock({ item, onClick, draggableId, onToggleLock }: SessionBlockProps) {
  const drag = useDraggable({ id: draggableId ?? item.key, disabled: !draggableId });
  const style = drag.transform
    ? { transform: `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`, zIndex: 50 }
    : undefined;
  return (
    <button
      ref={drag.setNodeRef}
      style={style}
      {...drag.listeners}
      {...drag.attributes}
      type="button"
      onClick={() => onClick?.(item)}
      className={`relative flex h-full w-full flex-col items-start gap-px overflow-hidden rounded-lg border px-2 py-1 text-left text-[11px] leading-[1.25] shadow-sm transition-shadow hover:shadow-md ${draggableId ? 'cursor-grab active:cursor-grabbing' : ''} ${item.locked ? 'ring-1 ring-accent ' : ''}${LESSON_COLOR[item.lessonType]}`}
    >
      {(onToggleLock || item.locked) && (
        <span
          role="button"
          tabIndex={onToggleLock ? 0 : -1}
          aria-label={item.locked ? 'Kilidi aç' : 'Kilitle'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock?.(item);
          }}
          className={`absolute right-1 top-1 rounded p-0.5 ${
            item.locked ? 'text-accent' : 'text-ink-3 opacity-60'
          } ${onToggleLock ? 'cursor-pointer hover:opacity-100' : 'cursor-default'}`}
        >
          <Icon name="lock" size={12} />
        </span>
      )}
      <span className="w-full truncate font-semibold">{LESSON_LABEL[item.lessonType]}</span>
      <span className="font-mono text-[10px] tabular-nums opacity-80">
        {hmFromApi(item.startTime)}–{hmFromApi(item.endTime)}
      </span>
      {item.teacherName && <span className="w-full truncate opacity-70">{item.teacherName}</span>}
    </button>
  );
}

import { useDraggable } from '@dnd-kit/core';
import type { LessonType } from '@/types/domain';
import { Icon } from '@/components/ui';
import { hmFromApi } from '../timeUtils';
import { LESSON_COLOR, LESSON_LABEL } from './lessonMeta';

export type { LessonType };
export { LESSON_COLOR, LESSON_LABEL };

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

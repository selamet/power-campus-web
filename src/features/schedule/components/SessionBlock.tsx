import type { LessonType } from '@/types/domain';
import { hmFromApi } from '../timeUtils';

export interface GridItem {
  key: string;
  sessionId?: number;
  classLessonId: number;
  weekday: number;
  startTime: string;
  endTime: string;
  lessonType: LessonType;
  teacherName: string | null;
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
}

export function SessionBlock({ item, onClick }: SessionBlockProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className={`flex h-full w-full flex-col items-start rounded-lg border px-2 py-1 text-left text-[11px] leading-tight ${LESSON_COLOR[item.lessonType]}`}
    >
      <span className="font-semibold">{LESSON_LABEL[item.lessonType]}</span>
      <span className="opacity-80">
        {hmFromApi(item.startTime)}–{hmFromApi(item.endTime)}
      </span>
      {item.teacherName && <span className="truncate opacity-70">{item.teacherName}</span>}
    </button>
  );
}

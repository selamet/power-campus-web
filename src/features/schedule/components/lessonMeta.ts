import type { LessonType } from '@/types/domain';

export const LESSON_COLOR: Record<LessonType, string> = {
  speaking: 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300',
  reading: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  writing: 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300',
  speaking_club: 'bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300',
};

export const LESSON_LABEL: Record<LessonType, string> = {
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  speaking_club: 'Speaking Club',
};

import type { LessonType } from '@/types/domain';
import type { LessonRule, ScheduleRules } from './scheduleApi';

export const EMPTY_RULES: ScheduleRules = { lessons: [], closedWeekdays: [] };

/**
 * Guarantee a rules object carries the array fields the UI relies on. The
 * backend returns an empty `{}` for a class without a saved config, so
 * `lessons`/`closedWeekdays` can be missing at runtime despite the type.
 */
export function normalizeRules(rules: Partial<ScheduleRules> | null | undefined): ScheduleRules {
  return {
    ...(rules ?? {}),
    lessons: rules?.lessons ?? [],
    closedWeekdays: rules?.closedWeekdays ?? [],
  };
}

export function ruleFor(rules: ScheduleRules, lessonType: LessonType): LessonRule | undefined {
  return (rules.lessons ?? []).find((l) => l.lessonType === lessonType);
}

export function withLessonRule(rules: ScheduleRules, rule: LessonRule): ScheduleRules {
  const list = rules.lessons ?? [];
  const exists = list.some((l) => l.lessonType === rule.lessonType);
  const lessons = exists
    ? list.map((l) => (l.lessonType === rule.lessonType ? rule : l))
    : [...list, rule];
  return { ...rules, lessons };
}

export function removeLessonRule(rules: ScheduleRules, lessonType: LessonType): ScheduleRules {
  return { ...rules, lessons: (rules.lessons ?? []).filter((l) => l.lessonType !== lessonType) };
}

export function toggleClosedWeekday(rules: ScheduleRules, weekday: number): ScheduleRules {
  const current = rules.closedWeekdays ?? [];
  const closedWeekdays = current.includes(weekday)
    ? current.filter((d) => d !== weekday)
    : [...current, weekday];
  return { ...rules, closedWeekdays };
}

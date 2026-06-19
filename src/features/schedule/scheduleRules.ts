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

export function setPinnedWeekday(
  rules: ScheduleRules,
  lessonType: LessonType,
  weekday: number | null,
): ScheduleRules {
  const existing = ruleFor(rules, lessonType) ?? {
    lessonType,
    durationMin: 45,
    sessionsPerWeek: 1,
  };
  return withLessonRule(rules, { ...existing, pinnedWeekday: weekday ?? undefined });
}

export function toggleConsecutive(rules: ScheduleRules, lessonType: LessonType): ScheduleRules {
  const existing = ruleFor(rules, lessonType) ?? {
    lessonType,
    durationMin: 45,
    sessionsPerWeek: 1,
  };
  return withLessonRule(rules, { ...existing, consecutive: !existing.consecutive });
}

/** Order-independent key for a lesson-type pair. */
export function separationKey(a: LessonType, b: LessonType): string {
  return [a, b].sort().join('|');
}

export function hasSeparation(rules: ScheduleRules, a: LessonType, b: LessonType): boolean {
  const key = separationKey(a, b);
  return (rules.separations ?? []).some(
    (pair) => separationKey(pair[0] as LessonType, pair[1] as LessonType) === key,
  );
}

export function toggleSeparation(rules: ScheduleRules, a: LessonType, b: LessonType): ScheduleRules {
  const key = separationKey(a, b);
  const current = rules.separations ?? [];
  const exists = current.some(
    (pair) => separationKey(pair[0] as LessonType, pair[1] as LessonType) === key,
  );
  const separations = exists
    ? current.filter((pair) => separationKey(pair[0] as LessonType, pair[1] as LessonType) !== key)
    : [...current, [a, b]];
  return { ...rules, separations };
}

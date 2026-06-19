import type { LessonType } from '@/types/domain';
import type { LessonRule, ScheduleRules } from './scheduleApi';

export const EMPTY_RULES: ScheduleRules = { lessons: [], closedWeekdays: [] };

export function ruleFor(rules: ScheduleRules, lessonType: LessonType): LessonRule | undefined {
  return rules.lessons.find((l) => l.lessonType === lessonType);
}

export function withLessonRule(rules: ScheduleRules, rule: LessonRule): ScheduleRules {
  const exists = rules.lessons.some((l) => l.lessonType === rule.lessonType);
  const lessons = exists
    ? rules.lessons.map((l) => (l.lessonType === rule.lessonType ? rule : l))
    : [...rules.lessons, rule];
  return { ...rules, lessons };
}

export function removeLessonRule(rules: ScheduleRules, lessonType: LessonType): ScheduleRules {
  return { ...rules, lessons: rules.lessons.filter((l) => l.lessonType !== lessonType) };
}

export function toggleClosedWeekday(rules: ScheduleRules, weekday: number): ScheduleRules {
  const current = rules.closedWeekdays ?? [];
  const closedWeekdays = current.includes(weekday)
    ? current.filter((d) => d !== weekday)
    : [...current, weekday];
  return { ...rules, closedWeekdays };
}

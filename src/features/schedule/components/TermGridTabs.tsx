import { useState } from 'react';
import type { ScheduleSession, SchedulePreviewSession } from '@/types/domain';
import type { TermScheduleSettings } from '@/types/domain';
import type { GridItem } from './SessionBlock';
import { WeekGrid } from './WeekGrid';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface ClassInfo {
  id: number;
  name: string;
}

interface TermGridTabsProps {
  settings: TermScheduleSettings;
  classes: ClassInfo[];
  /** Applied/persisted sessions (carry id + className). */
  sessions: ScheduleSession[];
  /** Optional preview (no id/className) — when set, shown instead of `sessions`. */
  preview?: SchedulePreviewSession[] | null;
}

export function TermGridTabs({ settings, classes, sessions, preview }: TermGridTabsProps) {
  const [mode, setMode] = useState<'class' | 'day'>('class');
  const [classId, setClassId] = useState<number | null>(classes[0]?.id ?? null);
  const [weekday, setWeekday] = useState<number>(settings.workingDays[0] ?? 0);

  const nameFor = (cid: number) => classes.find((c) => c.id === cid)?.name ?? '';

  const allItems: GridItem[] = preview
    ? preview.map((s, i) => ({
        key: `p-${s.classId}-${s.weekday}-${s.startTime}-${i}`,
        classLessonId: s.classLessonId,
        classId: s.classId,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        lessonType: s.lessonType,
        teacherName: nameFor(s.classId),
      }))
    : sessions.map((s) => ({
        key: `s-${s.id}`,
        sessionId: s.id,
        classLessonId: s.classLessonId,
        classId: s.classId,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        lessonType: s.lessonType,
        teacherName: s.className,
      }));

  // class mode filters to one class; day mode filters to one weekday.
  const items =
    mode === 'class'
      ? allItems.filter((it) => it.classId === classId)
      : allItems.filter((it) => it.weekday === weekday);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('class')}
            className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${mode === 'class' ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-3'}`}
          >
            Sınıf
          </button>
          <button
            type="button"
            onClick={() => setMode('day')}
            className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${mode === 'day' ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-3'}`}
          >
            Gün
          </button>
        </div>
        {mode === 'class' ? (
          <div className="flex flex-wrap gap-1">
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setClassId(c.id)}
                className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${classId === c.id ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-3'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {settings.workingDays.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setWeekday(d)}
                className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${weekday === d ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-3'}`}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
        )}
      </div>
      <WeekGrid
        items={items}
        dayStart={settings.dayStart}
        dayEnd={settings.dayEnd}
        workingDays={mode === 'day' ? [weekday] : settings.workingDays}
      />
    </div>
  );
}

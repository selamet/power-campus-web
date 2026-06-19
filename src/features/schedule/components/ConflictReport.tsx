import type { ScheduleReportItem } from '@/types/domain';

const LESSON_LABEL: Record<string, string> = {
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  speaking_club: 'Speaking Club',
};

interface ConflictReportProps {
  items: ScheduleReportItem[];
}

export function ConflictReport({ items }: ConflictReportProps) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
      <p className="mb-1.5 text-[13px] font-semibold text-amber-700 dark:text-amber-300">
        Yerleştirilemeyen dersler
      </p>
      <ul className="flex flex-col gap-1 text-[12.5px] text-ink-2">
        {items.map((it, i) => (
          <li key={`${it.classId}-${it.lessonType}-${i}`}>
            {LESSON_LABEL[it.lessonType] ?? it.lessonType}: {it.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

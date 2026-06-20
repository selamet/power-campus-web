import { useMemo } from 'react';
import type { ScheduleSession } from '@/types/domain';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface TeacherRule {
  maxPerDay?: number;
  maxPerWeek?: number;
}

interface TeacherLoadTableProps {
  sessions: ScheduleSession[];
  teacherRules: Record<string, TeacherRule>;
  workingDays: number[];
}

interface LoadRow {
  teacherId: number;
  teacherName: string;
  weekly: number;
  perDay: Record<number, number>;
}

/** Read-only per-teacher weekly load for the term's applied schedule. */
export function TeacherLoadTable({ sessions, teacherRules, workingDays }: TeacherLoadTableProps) {
  const days = [...workingDays].sort((a, b) => a - b);

  const rows = useMemo<LoadRow[]>(() => {
    const byTeacher = new Map<number, LoadRow>();
    for (const s of sessions) {
      if (s.teacherId == null) continue;
      let row = byTeacher.get(s.teacherId);
      if (!row) {
        row = { teacherId: s.teacherId, teacherName: s.teacherName ?? '—', weekly: 0, perDay: {} };
        byTeacher.set(s.teacherId, row);
      }
      row.weekly += 1;
      row.perDay[s.weekday] = (row.perDay[s.weekday] ?? 0) + 1;
    }
    return [...byTeacher.values()].sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }, [sessions]);

  if (rows.length === 0) {
    return <p className="text-[13px] text-ink-3">Atanmış ders yok.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-surface-2 text-left text-[11.5px] font-semibold tracking-[0.04em] text-ink-2 uppercase">
            <th className="p-2.5">Öğretmen</th>
            <th className="p-2.5 text-center">Haftalık</th>
            {days.map((d) => (
              <th key={d} className="p-2.5 text-center">
                {DAY_LABELS[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rule = teacherRules[String(row.teacherId)] ?? {};
            const weeklyOver = rule.maxPerWeek != null && row.weekly > rule.maxPerWeek;
            return (
              <tr key={row.teacherId} className="border-t border-line">
                <td className="p-2.5 font-medium">{row.teacherName}</td>
                <td
                  className={`p-2.5 text-center font-mono tabular-nums ${
                    weeklyOver ? 'font-bold text-red-600' : ''
                  }`}
                >
                  {rule.maxPerWeek != null ? `${row.weekly} / ${rule.maxPerWeek}` : row.weekly}
                </td>
                {days.map((d) => {
                  const n = row.perDay[d] ?? 0;
                  const dayOver = rule.maxPerDay != null && n > rule.maxPerDay;
                  return (
                    <td
                      key={d}
                      className={`p-2.5 text-center font-mono tabular-nums ${
                        dayOver ? 'font-bold text-red-600' : n === 0 ? 'text-ink-3' : ''
                      }`}
                    >
                      {rule.maxPerDay != null ? `${n} / ${rule.maxPerDay}` : n}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

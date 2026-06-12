import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import type { Student } from '@/types/domain';

const TOP_LANGUAGES = 5;

/** Student distribution by language as compact horizontal bars. */
export function LanguageMix({ students }: { students: Student[] }) {
  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const student of students) {
      counts.set(student.lang, (counts.get(student.lang) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_LANGUAGES);
  }, [students]);
  const max = Math.max(1, ...rows.map(([, count]) => count));

  return (
    <div className="card flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Icon name="globe" size={19} className="text-accent" />
        <h3 className="m-0 text-[16.5px] font-bold">Dil Dağılımı</h3>
      </div>
      {rows.length === 0 ? (
        <span className="py-4 text-center text-[13px] text-ink-3">Henüz öğrenci yok.</span>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(([lang, count]) => (
            <div key={lang} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-ink-2">{lang}</span>
                <span className="font-mono font-bold tabular-nums">{count}</span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-bg-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-[hsl(8_80%_55%)]"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

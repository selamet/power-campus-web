import { Input, Select } from '@/components/ui';
import { digitsOnly } from '@/utils/format';
import type { LessonType, Teacher } from '@/types/domain';

export interface LessonDraft {
  lessonType: LessonType;
  enabled: boolean;
  sessionDurationMin: number;
  sessionsPerWeek: number;
  teacherId: number | null;
}

interface LessonRowProps {
  label: string;
  draft: LessonDraft;
  teachers: Teacher[];
  onChange: (next: LessonDraft) => void;
}

const toCount = (raw: string): number => {
  const n = Number(digitsOnly(raw).slice(0, 3));
  return n > 0 ? n : 1;
};

/** One lesson's editable controls: enable toggle, sessions/week, duration, teacher. */
export function LessonRow({ label, draft, teachers, onChange }: LessonRowProps) {
  const set = (patch: Partial<LessonDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <label className="flex items-center gap-2.5 text-[13.5px] font-semibold">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => set({ enabled: e.target.checked })}
        />
        {label}
      </label>
      {draft.enabled && (
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <label className="flex flex-col gap-1 text-[11.5px] text-ink-3">
            Haftalık oturum
            <Input
              value={String(draft.sessionsPerWeek)}
              onChange={(e) => set({ sessionsPerWeek: toCount(e.target.value) })}
              inputMode="numeric"
              className="font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11.5px] text-ink-3">
            Süre (dk)
            <Input
              value={String(draft.sessionDurationMin)}
              onChange={(e) => set({ sessionDurationMin: toCount(e.target.value) })}
              inputMode="numeric"
              className="font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11.5px] text-ink-3">
            Öğretmen
            <Select
              value={draft.teacherId ? String(draft.teacherId) : ''}
              onChange={(e) => set({ teacherId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Atanmadı</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      )}
    </div>
  );
}

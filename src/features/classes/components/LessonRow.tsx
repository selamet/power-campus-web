import { Select } from '@/components/ui';
import type { LessonType, Teacher } from '@/types/domain';

export interface LessonDraft {
  lessonType: LessonType;
  enabled: boolean;
  teacherId: number | null;
}

interface LessonRowProps {
  label: string;
  draft: LessonDraft;
  teachers: Teacher[];
  onChange: (next: LessonDraft) => void;
}

/** One lesson's editable controls: enable toggle and teacher. */
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
        <div className="mt-3">
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

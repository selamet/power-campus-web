import type { LessonType } from '@/types/domain';
import { LESSON_COLOR, LESSON_LABEL } from './lessonMeta';

// Derived from the label map so a new lesson type can't silently miss its chip.
const TYPES = Object.keys(LESSON_LABEL) as LessonType[];

interface ScheduleLegendProps {
  hiddenTypes: Set<LessonType>;
  onToggle: (type: LessonType) => void;
}

/** Clickable color key: each chip toggles a lesson type's visibility (dimmed when hidden). */
export function ScheduleLegend({ hiddenTypes, onToggle }: ScheduleLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TYPES.map((t) => {
        const hidden = hiddenTypes.has(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={!hidden}
            onClick={() => onToggle(t)}
            className={`flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[12px] font-medium transition-opacity ${
              hidden ? 'text-ink-3 line-through opacity-50' : 'text-ink-2'
            }`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-[3px] border ${LESSON_COLOR[t]}`}
              aria-hidden
            />
            {LESSON_LABEL[t]}
          </button>
        );
      })}
    </div>
  );
}

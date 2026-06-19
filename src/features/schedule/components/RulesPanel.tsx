import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon, Input, Select, useToast } from '@/components/ui';
import { classesApi } from '@/features/classes/classesApi';
import { digitsOnly } from '@/utils/format';
import type { ClassLesson, LessonType } from '@/types/domain';
import { saveConfig, selectRules, selectSettings } from '../scheduleSlice';
import {
  EMPTY_RULES,
  hasSeparation,
  ruleFor,
  setPinnedWeekday,
  toggleClosedWeekday,
  toggleConsecutive,
  toggleSeparation,
  withLessonRule,
} from '../scheduleRules';
import { TermSettingsModal } from './TermSettingsModal';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface RulesPanelProps {
  classId: number;
  termId: number;
  canWrite: boolean;
  generating: boolean;
  applying: boolean;
  onGenerate: () => void;
  onApply: () => void;
}

export function RulesPanel({
  classId,
  termId,
  canWrite,
  generating,
  applying,
  onGenerate,
  onApply,
}: RulesPanelProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const rules = useAppSelector(selectRules) ?? EMPTY_RULES;
  const settings = useAppSelector(selectSettings);
  const [lessons, setLessons] = useState<ClassLesson[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<
    Record<string, { durationMin: string; sessionsPerWeek: string }>
  >({});

  useEffect(() => {
    let active = true;
    void classesApi.lessons(classId).then((rows) => active && setLessons(rows));
    return () => {
      active = false;
    };
  }, [classId]);

  const draftFor = (lessonType: LessonType) => {
    const rule = ruleFor(rules, lessonType);
    return (
      draft[lessonType] ?? {
        durationMin: String(rule?.durationMin ?? settings?.defaultDuration ?? 45),
        sessionsPerWeek: String(rule?.sessionsPerWeek ?? 1),
      }
    );
  };

  const persist = async (next: typeof rules) => {
    const result = await dispatch(saveConfig({ classId, rules: next }));
    if (!saveConfig.fulfilled.match(result)) toast('Kural kaydedilemedi', 'xCircle');
  };

  const setLessonField = (
    lessonType: LessonType,
    field: 'durationMin' | 'sessionsPerWeek',
    raw: string,
  ) => {
    setDraft((prev) => ({
      ...prev,
      [lessonType]: { ...draftFor(lessonType), [field]: digitsOnly(raw) },
    }));
  };

  const commitLessonField = (lessonType: LessonType) => {
    const current = draftFor(lessonType);
    const existing = ruleFor(rules, lessonType) ?? {
      lessonType,
      durationMin: settings?.defaultDuration ?? 45,
      sessionsPerWeek: 1,
    };
    const durationMin = Math.max(1, Number(current.durationMin) || 1);
    const sessionsPerWeek = Math.max(1, Number(current.sessionsPerWeek) || 1);
    if (durationMin === existing.durationMin && sessionsPerWeek === existing.sessionsPerWeek) {
      return;
    }
    void persist(withLessonRule(rules, { ...existing, durationMin, sessionsPerWeek }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="m-0 text-[14.5px] font-bold">Kurallar</h4>
        {canWrite && (
          <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
            <Icon name="edit" size={16} />
            Dönem
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[12.5px] font-semibold text-ink-2">Dersler (süre × haftalık)</span>
        {lessons.map((lesson) => {
          const values = draftFor(lesson.lessonType);
          const rule = ruleFor(rules, lesson.lessonType);
          return (
            <div
              key={lesson.id}
              className="rounded-xl border border-line bg-surface-2 p-2.5"
            >
              <span className="text-[13px] font-semibold">{lesson.lessonTypeLabel}</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-[11px] text-ink-3">
                  Süre (dk)
                  <Input
                    value={values.durationMin}
                    onChange={(e) => setLessonField(lesson.lessonType, 'durationMin', e.target.value)}
                    onBlur={() => commitLessonField(lesson.lessonType)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitLessonField(lesson.lessonType);
                    }}
                    inputMode="numeric"
                    className="font-mono"
                    disabled={!canWrite}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-ink-3">
                  Haftalık
                  <Input
                    value={values.sessionsPerWeek}
                    onChange={(e) =>
                      setLessonField(lesson.lessonType, 'sessionsPerWeek', e.target.value)
                    }
                    onBlur={() => commitLessonField(lesson.lessonType)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitLessonField(lesson.lessonType);
                    }}
                    inputMode="numeric"
                    className="font-mono"
                    disabled={!canWrite}
                  />
                </label>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex flex-1 flex-col gap-1 text-[11px] text-ink-3">
                  Güne sabitle
                  <Select
                    value={rule?.pinnedWeekday != null ? String(rule.pinnedWeekday) : ''}
                    onChange={(e) =>
                      void persist(
                        setPinnedWeekday(
                          rules,
                          lesson.lessonType,
                          e.target.value === '' ? null : Number(e.target.value),
                        ),
                      )
                    }
                    disabled={!canWrite}
                  >
                    <option value="">—</option>
                    {DAY_LABELS.map((label, d) => (
                      <option key={d} value={d}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                  <input
                    type="checkbox"
                    checked={!!rule?.consecutive}
                    disabled={!canWrite}
                    onChange={() => void persist(toggleConsecutive(rules, lesson.lessonType))}
                  />
                  Ardışık
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12.5px] font-semibold text-ink-2">Sınıf kapalı günleri</span>
        <div className="flex flex-wrap gap-1.5">
          {DAY_LABELS.map((label, d) => {
            const closed = (rules.closedWeekdays ?? []).includes(d);
            return (
              <button
                key={d}
                type="button"
                disabled={!canWrite}
                onClick={() => void persist(toggleClosedWeekday(rules, d))}
                className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${
                  closed ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-3'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12.5px] font-semibold text-ink-2">Aynı gün olmasın</span>
        <div className="flex flex-col gap-1.5">
          {lessons.flatMap((a, i) =>
            lessons.slice(i + 1).map((b) => {
              const on = hasSeparation(rules, a.lessonType, b.lessonType);
              return (
                <button
                  key={`${a.id}-${b.id}`}
                  type="button"
                  disabled={!canWrite}
                  onClick={() => void persist(toggleSeparation(rules, a.lessonType, b.lessonType))}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[12px] ${
                    on ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-3'
                  }`}
                >
                  <span>
                    {a.lessonTypeLabel} ↔ {b.lessonTypeLabel}
                  </span>
                  <span>{on ? 'Ayrı' : '—'}</span>
                </button>
              );
            }),
          )}
        </div>
      </div>

      {canWrite && (
        <div className="flex gap-2.5">
          <Button variant="ghost" onClick={onGenerate} disabled={generating}>
            <Icon name="sparkle" size={16} />
            {generating ? 'Üretiliyor…' : 'Üret'}
          </Button>
          <Button variant="primary" onClick={onApply} disabled={applying}>
            <Icon name="check" size={16} />
            {applying ? 'Uygulanıyor…' : 'Uygula'}
          </Button>
        </div>
      )}

      <TermSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        termId={termId}
        canWrite={canWrite}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon, Input, Select, useToast } from '@/components/ui';
import { classesApi } from '@/features/classes/classesApi';
import { digitsOnly } from '@/utils/format';
import type { ClassLesson, LessonType, SchoolClass } from '@/types/domain';
import { createTemplate, deleteTemplate, fetchTemplates, saveConfig, selectRules, selectSettings, selectTemplates } from '../scheduleSlice';
import { scheduleApi } from '../scheduleApi';
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
  const templates = useAppSelector(selectTemplates);
  const [templateId, setTemplateId] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [lessons, setLessons] = useState<ClassLesson[]>([]);
  const [otherClasses, setOtherClasses] = useState<SchoolClass[]>([]);
  const [copySourceId, setCopySourceId] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<
    Record<string, { durationMin: string; sessionsPerWeek: string }>
  >({});

  useEffect(() => {
    void dispatch(fetchTemplates());
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    void classesApi.lessons(classId).then((rows) => active && setLessons(rows));
    return () => {
      active = false;
    };
  }, [classId]);

  useEffect(() => {
    let active = true;
    void classesApi.list(termId).then((rows) => {
      if (active) setOtherClasses(rows.filter((c) => c.id !== classId));
    });
    return () => {
      active = false;
    };
  }, [termId, classId]);

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

  const handleCopyFrom = async (sourceId: number) => {
    try {
      const src = await scheduleApi.getConfig(sourceId);
      await persist(src.rules);
      toast('Kurallar kopyalandı', 'checkCircle');
    } catch {
      toast('Kopyalanamadı', 'xCircle');
    }
  };

  const handleApplyTemplate = async (id: number) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    await persist(tpl.rules);
    toast('Şablon uygulandı', 'checkCircle');
  };
  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    if (!name) return;
    const r = await dispatch(createTemplate({ name, rules }));
    if (createTemplate.fulfilled.match(r)) {
      setTemplateName('');
      toast('Şablon kaydedildi', 'checkCircle');
    } else {
      toast((r.payload as string) || 'Şablon kaydedilemedi', 'xCircle');
    }
  };
  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('Şablon silinsin mi?')) return;
    const r = await dispatch(deleteTemplate(id));
    if (deleteTemplate.fulfilled.match(r)) {
      if (String(id) === templateId) setTemplateId('');
      toast('Şablon silindi', 'checkCircle');
    } else {
      toast('Silinemedi', 'xCircle');
    }
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

      {canWrite && otherClasses.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            value={copySourceId}
            onChange={(e) => setCopySourceId(e.target.value)}
            className="flex-1"
          >
            <option value="">Kuralları kopyala…</option>
            {otherClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button
            variant="ghost"
            disabled={!copySourceId}
            onClick={() => void handleCopyFrom(Number(copySourceId))}
          >
            <Icon name="copy" size={16} />
            Kopyala
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <span className="text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase">
          Dersler (süre × haftalık)
        </span>
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
        <span className="text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase">
          Sınıf kapalı günleri
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DAY_LABELS.map((label, d) => {
            const closed = (rules.closedWeekdays ?? []).includes(d);
            return (
              <button
                key={d}
                type="button"
                disabled={!canWrite}
                onClick={() => void persist(toggleClosedWeekday(rules, d))}
                className={`rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
                  closed
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase">
          Aynı gün olmasın
        </span>
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
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                    on
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-ink-2 hover:bg-surface-2'
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
        <div className="flex flex-col gap-2">
          <span className="text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase">
            Şablonlar
          </span>
          <div className="flex items-center gap-2">
            <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="flex-1">
              <option value="">Şablon seç…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              disabled={!templateId}
              onClick={() => void handleApplyTemplate(Number(templateId))}
            >
              <Icon name="check" size={16} />
              Uygula
            </Button>
            <Button
              variant="ghost"
              disabled={!templateId}
              onClick={() => void handleDeleteTemplate(Number(templateId))}
            >
              <Icon name="x" size={16} />
              Sil
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Yeni şablon adı"
              className="flex-1"
            />
            <Button variant="ghost" disabled={!templateName.trim()} onClick={() => void handleSaveTemplate()}>
              <Icon name="plus" size={16} />
              Şablon olarak kaydet
            </Button>
          </div>
        </div>
      )}

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

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Field, Icon, Input, Modal, useToast } from '@/components/ui';
import { teachersApi } from '@/features/teachers/teachersApi';
import type { Teacher } from '@/types/domain';
import { digitsOnly } from '@/utils/format';
import { hmFromApi, toApiTime } from '../timeUtils';
import { saveSettings, selectSettings } from '../scheduleSlice';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface TermSettingsModalProps {
  open: boolean;
  onClose: () => void;
  termId: number;
  canWrite: boolean;
}

export function TermSettingsModal({ open, onClose, termId, canWrite }: TermSettingsModalProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const settings = useAppSelector(selectSettings);
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [dayStart, setDayStart] = useState('09:00');
  const [dayEnd, setDayEnd] = useState('18:00');
  const [perDay, setPerDay] = useState('3');
  const [dayWindows, setDayWindows] = useState<Record<number, { start: string; end: string }>>({});
  const [busy, setBusy] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherRules, setTeacherRules] = useState<
    Record<string, { unavailableWeekdays: number[]; maxPerDay: string; maxPerWeek: string }>
  >({});

  useEffect(() => {
    if (!open || !settings) return;
    setWorkingDays(settings.workingDays);
    setDayStart(hmFromApi(settings.dayStart));
    setDayEnd(hmFromApi(settings.dayEnd));
    setPerDay(String(settings.defaultPerDay));
    const seeded: Record<number, { start: string; end: string }> = {};
    for (const [k, w] of Object.entries(settings.dayWindows ?? {})) {
      seeded[Number(k)] = { start: hmFromApi(w.start), end: hmFromApi(w.end) };
    }
    setDayWindows(seeded);
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void teachersApi.list('active').then((rows) => active && setTeachers(rows));
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const raw = (settings?.teacherRules ?? {}) as Record<
      string,
      { unavailableWeekdays?: number[]; maxPerDay?: number; maxPerWeek?: number }
    >;
    const seeded: Record<
      string,
      { unavailableWeekdays: number[]; maxPerDay: string; maxPerWeek: string }
    > = {};
    for (const [id, v] of Object.entries(raw)) {
      seeded[id] = {
        unavailableWeekdays: v.unavailableWeekdays ?? [],
        maxPerDay: v.maxPerDay != null ? String(v.maxPerDay) : '',
        maxPerWeek: v.maxPerWeek != null ? String(v.maxPerWeek) : '',
      };
    }
    setTeacherRules(seeded);
  }, [open, settings]);

  const toggleDay = (d: number) =>
    setWorkingDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const ruleFor = (teacherId: number) =>
    teacherRules[String(teacherId)] ?? { unavailableWeekdays: [], maxPerDay: '', maxPerWeek: '' };

  const updateRule = (
    teacherId: number,
    patch: Partial<{ unavailableWeekdays: number[]; maxPerDay: string; maxPerWeek: string }>,
  ) =>
    setTeacherRules((prev) => ({
      ...prev,
      [String(teacherId)]: { ...ruleFor(teacherId), ...patch },
    }));

  const toggleTeacherDay = (teacherId: number, d: number) => {
    const current = ruleFor(teacherId).unavailableWeekdays;
    updateRule(teacherId, {
      unavailableWeekdays: current.includes(d) ? current.filter((x) => x !== d) : [...current, d],
    });
  };

  const handleSave = async () => {
    if (!canWrite) return;
    setBusy(true);
    const result = await dispatch(
      saveSettings({
        termId,
        payload: {
          workingDays: [...workingDays].sort((a, b) => a - b),
          dayStart: toApiTime(dayStart),
          dayEnd: toApiTime(dayEnd),
          defaultDuration: settings?.defaultDuration ?? 45,
          defaultPerDay: Math.max(1, Number(digitsOnly(perDay)) || 1),
          breakMin: settings?.breakMin ?? 0,
          dayWindows: Object.fromEntries(
            Object.entries(dayWindows)
              .filter(([, w]) => w.start && w.end)
              .map(([d, w]) => [d, { start: toApiTime(w.start), end: toApiTime(w.end) }]),
          ),
          teacherRules: Object.fromEntries(
            Object.entries(teacherRules)
              .map(([id, v]) => {
                const entry: { unavailableWeekdays?: number[]; maxPerDay?: number; maxPerWeek?: number } =
                  {};
                if (v.unavailableWeekdays.length) entry.unavailableWeekdays = v.unavailableWeekdays;
                if (v.maxPerDay) entry.maxPerDay = Number(v.maxPerDay);
                if (v.maxPerWeek) entry.maxPerWeek = Number(v.maxPerWeek);
                return [id, entry] as const;
              })
              .filter(([, entry]) => Object.keys(entry).length > 0),
          ),
        },
      }),
    );
    setBusy(false);
    if (saveSettings.fulfilled.match(result)) {
      toast('Dönem ayarları kaydedildi', 'checkCircle');
      onClose();
    } else {
      toast((result.payload as string) || 'Kaydedilemedi', 'xCircle');
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={440}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-[19px] font-bold tracking-[-0.01em]">Dönem Ayarları</h2>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>
      <div className="flex flex-col gap-3.5">
        <Field label="Çalışma günleri">
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, d) => (
              <button
                key={d}
                type="button"
                disabled={!canWrite}
                onClick={() => toggleDay(d)}
                className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${
                  workingDays.includes(d)
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-ink-3'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Gün başlangıcı">
            <Input
              type="time"
              value={dayStart}
              onChange={(e) => setDayStart(e.target.value)}
              disabled={!canWrite}
            />
          </Field>
          <Field label="Gün bitişi">
            <Input
              type="time"
              value={dayEnd}
              onChange={(e) => setDayEnd(e.target.value)}
              disabled={!canWrite}
            />
          </Field>
        </div>
        <Field label="Günlük ders üst sınırı">
          <Input
            value={perDay}
            onChange={(e) => setPerDay(digitsOnly(e.target.value).slice(0, 2))}
            inputMode="numeric"
            className="font-mono"
            disabled={!canWrite}
          />
        </Field>
        {workingDays.length > 0 && (
          <Field label="Günlere göre saat">
            <div className="flex max-h-[30vh] flex-col gap-2 overflow-y-auto pr-1">
              {workingDays
                .slice()
                .sort((a, b) => a - b)
                .map((d) => {
                  const win = dayWindows[d] ?? { start: '', end: '' };
                  return (
                    <div key={d} className="grid grid-cols-[4rem_1fr_1fr] items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-ink-2">{DAY_LABELS[d]}</span>
                      <Input
                        type="time"
                        value={win.start}
                        onChange={(e) =>
                          setDayWindows((prev) => ({
                            ...prev,
                            [d]: { start: e.target.value, end: (prev[d] ?? { start: '', end: '' }).end },
                          }))
                        }
                        disabled={!canWrite}
                      />
                      <Input
                        type="time"
                        value={win.end}
                        onChange={(e) =>
                          setDayWindows((prev) => ({
                            ...prev,
                            [d]: { start: (prev[d] ?? { start: '', end: '' }).start, end: e.target.value },
                          }))
                        }
                        disabled={!canWrite}
                      />
                    </div>
                  );
                })}
            </div>
          </Field>
        )}
        {teachers.length > 0 && (
          <Field label="Öğretmen uygunluğu">
            <div className="flex max-h-[40vh] flex-col gap-2.5 overflow-y-auto pr-1">
              {teachers.map((teacher) => {
                const rule = ruleFor(teacher.id);
                return (
                  <div key={teacher.id} className="rounded-lg border border-line p-2.5">
                    <div className="mb-1.5 text-[12.5px] font-semibold text-ink-2">{teacher.name}</div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {DAY_LABELS.map((label, d) => (
                        <button
                          key={d}
                          type="button"
                          disabled={!canWrite}
                          onClick={() => toggleTeacherDay(teacher.id, d)}
                          className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${
                            rule.unavailableWeekdays.includes(d)
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-line text-ink-3'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Field label="Günlük üst sınır">
                        <Input
                          value={rule.maxPerDay}
                          onChange={(e) =>
                            updateRule(teacher.id, { maxPerDay: digitsOnly(e.target.value).slice(0, 2) })
                          }
                          inputMode="numeric"
                          className="font-mono"
                          disabled={!canWrite}
                        />
                      </Field>
                      <Field label="Haftalık üst sınır">
                        <Input
                          value={rule.maxPerWeek}
                          onChange={(e) =>
                            updateRule(teacher.id, { maxPerWeek: digitsOnly(e.target.value).slice(0, 2) })
                          }
                          inputMode="numeric"
                          className="font-mono"
                          disabled={!canWrite}
                        />
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>
          </Field>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        {canWrite && (
          <Button variant="primary" onClick={handleSave} disabled={busy}>
            <Icon name="check" size={17} />
            {busy ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        )}
      </div>
    </Modal>
  );
}

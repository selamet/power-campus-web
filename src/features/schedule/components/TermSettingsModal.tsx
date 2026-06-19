import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Field, Icon, Input, Modal, useToast } from '@/components/ui';
import { digitsOnly } from '@/utils/format';
import { hmFromApi, toApiTime } from '../timeUtils';
import { saveSettings, selectSettings } from '../scheduleSlice';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface TermSettingsModalProps {
  open: boolean;
  onClose: () => void;
  termId: number;
}

export function TermSettingsModal({ open, onClose, termId }: TermSettingsModalProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const settings = useAppSelector(selectSettings);
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [dayStart, setDayStart] = useState('09:00');
  const [dayEnd, setDayEnd] = useState('18:00');
  const [perDay, setPerDay] = useState('3');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !settings) return;
    setWorkingDays(settings.workingDays);
    setDayStart(hmFromApi(settings.dayStart));
    setDayEnd(hmFromApi(settings.dayEnd));
    setPerDay(String(settings.defaultPerDay));
  }, [open, settings]);

  const toggleDay = (d: number) =>
    setWorkingDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const handleSave = async () => {
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
          teacherRules: settings?.teacherRules ?? {},
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
            <Input type="time" value={dayStart} onChange={(e) => setDayStart(e.target.value)} />
          </Field>
          <Field label="Gün bitişi">
            <Input type="time" value={dayEnd} onChange={(e) => setDayEnd(e.target.value)} />
          </Field>
        </div>
        <Field label="Günlük ders üst sınırı">
          <Input
            value={perDay}
            onChange={(e) => setPerDay(digitsOnly(e.target.value).slice(0, 2))}
            inputMode="numeric"
            className="font-mono"
          />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={busy}>
          <Icon name="check" size={17} />
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>
    </Modal>
  );
}

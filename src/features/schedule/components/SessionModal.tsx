import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { Button, Field, Icon, Input, Modal, Select } from '@/components/ui';
import { classesApi } from '@/features/classes/classesApi';
import type { ClassLesson } from '@/types/domain';
import { hmFromApi, toApiTime } from '../timeUtils';
import { addSession, deleteSession, moveSession } from '../scheduleSlice';
import type { GridItem } from './SessionBlock';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export interface SessionModalState {
  mode: 'add' | 'edit';
  item?: GridItem;
  weekday: number;
  startHm: string;
}

interface SessionModalProps {
  open: boolean;
  classId: number;
  state: SessionModalState | null;
  onClose: () => void;
}

export function SessionModal({ open, classId, state, onClose }: SessionModalProps) {
  const dispatch = useAppDispatch();
  const [lessons, setLessons] = useState<ClassLesson[]>([]);
  const [classLessonId, setClassLessonId] = useState<number | null>(null);
  const [weekday, setWeekday] = useState(0);
  const [startHm, setStartHm] = useState('09:00');
  const [endHm, setEndHm] = useState('09:45');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void classesApi.lessons(classId).then((rows) => active && setLessons(rows));
    return () => {
      active = false;
    };
  }, [open, classId]);

  useEffect(() => {
    if (!open || !state) return;
    setError(null);
    setWeekday(state.weekday);
    setStartHm(state.startHm);
    if (state.mode === 'edit' && state.item) {
      setClassLessonId(state.item.classLessonId);
      setStartHm(hmFromApi(state.item.startTime));
      setEndHm(hmFromApi(state.item.endTime));
    } else {
      const [h, m] = state.startHm.split(':').map(Number);
      const endM = h * 60 + m + 45;
      setEndHm(`${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`);
    }
  }, [open, state]);

  const isEdit = state?.mode === 'edit';

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    if (isEdit && state?.item?.sessionId) {
      const result = await dispatch(
        moveSession({
          id: state.item.sessionId,
          input: { weekday, startTime: toApiTime(startHm), endTime: toApiTime(endHm) },
        }),
      );
      setBusy(false);
      if (moveSession.fulfilled.match(result)) onClose();
      else setError((result.payload as string) || 'Çakışma var.');
      return;
    }
    if (classLessonId == null) {
      setBusy(false);
      setError('Ders seçin.');
      return;
    }
    const result = await dispatch(
      addSession({
        classLessonId,
        weekday,
        startTime: toApiTime(startHm),
        endTime: toApiTime(endHm),
      }),
    );
    setBusy(false);
    if (addSession.fulfilled.match(result)) onClose();
    else setError((result.payload as string) || 'Çakışma var.');
  };

  const handleDelete = async () => {
    if (!state?.item?.sessionId) return;
    setBusy(true);
    const result = await dispatch(deleteSession(state.item.sessionId));
    setBusy(false);
    if (deleteSession.fulfilled.match(result)) onClose();
    else setError((result.payload as string) || 'Silinemedi.');
  };

  return (
    <Modal open={open} onClose={onClose} width={420}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-[19px] font-bold tracking-[-0.01em]">
          {isEdit ? 'Oturumu Düzenle' : 'Oturum Ekle'}
        </h2>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>
      <div className="flex flex-col gap-3.5">
        {!isEdit && (
          <Field label="Ders">
            <Select
              value={classLessonId != null ? String(classLessonId) : ''}
              onChange={(e) => setClassLessonId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Seçin</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lessonTypeLabel}
                  {l.teacherName ? ` — ${l.teacherName}` : ''}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Gün">
          <Select value={String(weekday)} onChange={(e) => setWeekday(Number(e.target.value))}>
            {DAY_LABELS.map((label, d) => (
              <option key={d} value={d}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Başlangıç">
            <Input type="time" value={startHm} onChange={(e) => setStartHm(e.target.value)} />
          </Field>
          <Field label="Bitiş">
            <Input type="time" value={endHm} onChange={(e) => setEndHm(e.target.value)} />
          </Field>
        </div>
      </div>
      {error && <p className="mt-4 text-[12.5px] font-medium text-accent">{error}</p>}
      <div className="mt-5 flex justify-between gap-2.5">
        {isEdit ? (
          <Button variant="quiet" onClick={handleDelete} disabled={busy} className="text-accent">
            <Icon name="x" size={16} />
            Sil
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={busy}>
            <Icon name="check" size={16} />
            {busy ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

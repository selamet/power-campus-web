import { useEffect, useState } from 'react';
import { Button, Field, Icon, Modal, Select, useToast } from '@/components/ui';
import { teachersApi } from '@/features/teachers/teachersApi';
import type { ClassLesson, LessonType, LessonTypeCatalog, Teacher } from '@/types/domain';
import { classesApi } from '../classesApi';

interface AddLessonModalProps {
  open: boolean;
  onClose: () => void;
  classId: number;
  onAdded: (lesson: ClassLesson) => void;
}

export function AddLessonModal({ open, onClose, classId, onAdded }: AddLessonModalProps) {
  const toast = useToast();
  const [catalog, setCatalog] = useState<LessonTypeCatalog[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lessonType, setLessonType] = useState<LessonType>('speaking');
  const [teacherId, setTeacherId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void classesApi.lessonTypes().then((rows) => active && setCatalog(rows));
    void teachersApi.list('active').then((rows) => active && setTeachers(rows));
    return () => {
      active = false;
    };
  }, [open]);

  const handleAdd = async () => {
    setBusy(true);
    try {
      const lesson = await classesApi.addLesson(classId, {
        lessonType,
        teacherId: teacherId ? Number(teacherId) : null,
      });
      onAdded(lesson);
      toast('Ders eklendi', 'checkCircle');
      onClose();
    } catch {
      toast('Ders eklenemedi', 'xCircle');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-[19px] font-bold tracking-[-0.01em]">Ders Ekle</h2>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>
      <div className="flex flex-col gap-3.5">
        <Field label="Ders">
          <Select value={lessonType} onChange={(e) => setLessonType(e.target.value as LessonType)}>
            {catalog.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Öğretmen">
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Atanmadı</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={busy}>
          <Icon name="plus" size={17} />
          {busy ? 'Ekleniyor…' : 'Ekle'}
        </Button>
      </div>
    </Modal>
  );
}

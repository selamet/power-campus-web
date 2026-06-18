import { useEffect, useState } from 'react';
import { Button, Icon, useToast } from '@/components/ui';
import { teachersApi } from '@/features/teachers/teachersApi';
import type { ClassLesson, Teacher } from '@/types/domain';
import { classesApi } from '../classesApi';
import { AddLessonModal } from './AddLessonModal';

interface LessonsPanelProps {
  classId: number;
  canWrite: boolean;
}

export function LessonsPanel({ classId, canWrite }: LessonsPanelProps) {
  const toast = useToast();
  const [lessons, setLessons] = useState<ClassLesson[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void classesApi.lessons(classId).then((rows) => active && setLessons(rows));
    void teachersApi.list('active').then((rows) => active && setTeachers(rows));
    return () => {
      active = false;
    };
  }, [classId]);

  const assignTeacher = async (lesson: ClassLesson, teacherId: number | null) => {
    try {
      const updated = await classesApi.updateLesson(classId, lesson.id, { teacherId });
      setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch {
      toast('Öğretmen ataması başarısız oldu', 'xCircle');
    }
  };

  const remove = async (lesson: ClassLesson) => {
    try {
      await classesApi.deleteLesson(classId, lesson.id);
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    } catch {
      toast('Ders silinemedi', 'xCircle');
    }
  };

  return (
    <div className="card p-[18px]">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="m-0 text-[14.5px] font-bold">Dersler</h4>
        {canWrite && (
          <Button variant="ghost" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={17} />
            Ders Ekle
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {lessons.length === 0 && <p className="text-[13px] text-ink-3">Henüz ders yok.</p>}
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 p-3"
          >
            <span className="text-[13.5px] font-semibold">{lesson.lessonTypeLabel}</span>
            <span className="text-[12.5px] text-ink-3">
              {lesson.sessionsPerWeek} oturum × {lesson.sessionDurationMin} dk ={' '}
              {lesson.weeklyTotalMin} dk/hafta
            </span>
            <div className="ml-auto flex items-center gap-2">
              {canWrite ? (
                <select
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-[12.5px]"
                  value={lesson.teacherId ? String(lesson.teacherId) : ''}
                  onChange={(e) =>
                    assignTeacher(lesson, e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Öğretmen atanmadı</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[12.5px] text-ink-3">
                  {lesson.teacherName ?? 'Öğretmen atanmadı'}
                </span>
              )}
              {canWrite && (
                <Button
                  variant="quiet"
                  onClick={() => remove(lesson)}
                  className="p-1.5 text-accent"
                  aria-label="Dersi sil"
                >
                  <Icon name="x" size={16} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <AddLessonModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        classId={classId}
        onAdded={(lesson) => setLessons((prev) => [...prev, lesson])}
      />
    </div>
  );
}

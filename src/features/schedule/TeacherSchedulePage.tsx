import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon } from '@/components/ui';
import { fetchTeacher, selectTeacherById } from '@/features/teachers/teachersSlice';
import { teacherLink } from '@/routes/paths';
import type { GridItem } from './components/SessionBlock';
import { WeekGrid } from './components/WeekGrid';
import { fetchTeacherSchedule, resetSchedule, selectTeacherSessions } from './scheduleSlice';

export function TeacherSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const teacherId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const teacher = useAppSelector((s) => selectTeacherById(s, teacherId));
  const sessions = useAppSelector(selectTeacherSessions);

  useEffect(() => {
    if (!teacherId) return;
    void dispatch(fetchTeacher(teacherId));
    void dispatch(fetchTeacherSchedule(teacherId));
    return () => {
      dispatch(resetSchedule());
    };
  }, [dispatch, teacherId]);

  const items = useMemo<GridItem[]>(
    () =>
      sessions.map((s) => ({
        key: `s-${s.id}`,
        sessionId: s.id,
        classLessonId: s.classLessonId,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        lessonType: s.lessonType,
        teacherName: s.className, // show the class on the block in the teacher lens
      })),
    [sessions],
  );

  return (
    <div className="anim-fade-up mx-auto flex w-full max-w-[1100px] flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="quiet"
          onClick={() => navigate(teacherLink(teacherId))}
          className="px-2 py-1.5 text-[13px] text-ink-3"
          aria-label="Öğretmene dön"
        >
          <Icon name="chevL" size={18} />
          Öğretmen
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="m-0 truncate text-[20px] font-bold tracking-[-0.01em]">
            Öğretmen Programı{teacher ? ` — ${teacher.name}` : ''}
          </h1>
          <span className="text-[12px] text-ink-3">Haftalık ders programını görüntüle.</span>
        </div>
      </div>
      <section className="card p-[18px]">
        {sessions.length === 0 ? (
          <p className="text-[13px] text-ink-3">Bu öğretmenin atanmış oturumu yok.</p>
        ) : (
          <WeekGrid
            items={items}
            dayStart="08:00:00"
            dayEnd="20:00:00"
            workingDays={[0, 1, 2, 3, 4, 5]}
          />
        )}
      </section>
    </div>
  );
}

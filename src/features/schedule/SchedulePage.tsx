import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { fetchClasses, selectClasses } from '@/features/classes/classesSlice';
import { classLink } from '@/routes/paths';
import { ClassScheduleBuilder } from './ClassScheduleBuilder';
import { fetchSettings, resetSchedule } from './scheduleSlice';

export function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const classId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.scheduleWrite);
  const schoolClass = useAppSelector(selectClasses).find((c) => c.id === classId);

  useEffect(() => {
    void dispatch(fetchClasses(undefined));
    return () => {
      dispatch(resetSchedule());
    };
  }, [dispatch]);

  useEffect(() => {
    if (schoolClass) void dispatch(fetchSettings(schoolClass.termId));
  }, [dispatch, schoolClass]);

  return (
    <div className="anim-fade-up mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="quiet"
          onClick={() => navigate(classLink(classId))}
          className="px-2 py-1.5 text-[13px] text-ink-3"
          aria-label="Sınıfa dön"
        >
          <Icon name="chevL" size={18} />
          Sınıf
        </Button>
        <h1 className="m-0 truncate text-[20px] font-bold tracking-[-0.01em]">
          Ders Programı{schoolClass ? ` — ${schoolClass.level}/${schoolClass.section}` : ''}
        </h1>
      </div>
      {schoolClass && (
        <ClassScheduleBuilder classId={classId} termId={schoolClass.termId} canWrite={canWrite} />
      )}
    </div>
  );
}

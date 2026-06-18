import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { selectClasses } from '@/features/classes/classesSlice';
import { fetchClasses } from '@/features/classes/classesSlice';
import {
  fetchClassSchedule,
  fetchConfig,
  fetchSettings,
  resetSchedule,
} from './scheduleSlice';

export function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const classId = Number(id);
  const dispatch = useAppDispatch();
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.scheduleWrite);
  const schoolClass = useAppSelector(selectClasses).find((c) => c.id === classId);

  useEffect(() => {
    if (!classId) return;
    void dispatch(fetchClasses(undefined));
    void dispatch(fetchClassSchedule(classId));
    void dispatch(fetchConfig(classId));
    return () => {
      dispatch(resetSchedule());
    };
  }, [dispatch, classId]);

  useEffect(() => {
    if (schoolClass) void dispatch(fetchSettings(schoolClass.termId));
  }, [dispatch, schoolClass]);

  return (
    <div className="mx-auto w-full max-w-[1200px] p-4">
      <h1 className="mb-4 text-[22px] font-bold tracking-[-0.01em]">
        Ders Programı{schoolClass ? ` — ${schoolClass.level}/${schoolClass.section}` : ''}
      </h1>
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="card p-[18px]" data-testid="rules-panel-slot">
          {/* RulesPanel mounts here in Task 6 */}
          <p className="text-[13px] text-ink-3">Kurallar paneli (yakında).</p>
        </aside>
        <section className="card p-[18px]" data-testid="calendar-slot">
          {/* WeekGrid mounts here in Task 5/7 */}
          <p className="text-[13px] text-ink-3">Takvim (yakında).</p>
        </section>
      </div>
      {!canWrite && (
        <p className="mt-3 text-[12.5px] text-ink-3">Görüntüleme modundasınız.</p>
      )}
    </div>
  );
}

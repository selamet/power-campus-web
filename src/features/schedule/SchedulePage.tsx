import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { fetchClasses, selectClasses } from '@/features/classes/classesSlice';
import { useToast } from '@/components/ui';
import type { GridItem } from './components/SessionBlock';
import { WeekGrid } from './components/WeekGrid';
import { RulesPanel } from './components/RulesPanel';
import { ConflictReport } from './components/ConflictReport';
import {
  applyClass,
  fetchClassSchedule,
  fetchConfig,
  fetchSettings,
  generateClass,
  resetSchedule,
  selectPreview,
  selectReport,
  selectSavedSessions,
  selectScheduleStatus,
  selectSettings,
} from './scheduleSlice';

export function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const classId = Number(id);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.scheduleWrite);

  const schoolClass = useAppSelector(selectClasses).find((c) => c.id === classId);
  const settings = useAppSelector(selectSettings);
  const saved = useAppSelector(selectSavedSessions);
  const preview = useAppSelector(selectPreview);
  const report = useAppSelector(selectReport);
  const status = useAppSelector(selectScheduleStatus);

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

  // Preview takes precedence over the persisted schedule until applied.
  const items = useMemo<GridItem[]>(() => {
    if (preview) {
      return preview.map((s, i) => ({
        key: `p-${s.classLessonId}-${s.weekday}-${s.startTime}-${i}`,
        classLessonId: s.classLessonId,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        lessonType: s.lessonType,
        teacherName: s.teacherName,
      }));
    }
    return saved.map((s) => ({
      key: `s-${s.id}`,
      sessionId: s.id,
      classLessonId: s.classLessonId,
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
      lessonType: s.lessonType,
      teacherName: s.teacherName,
    }));
  }, [preview, saved]);

  const handleGenerate = () => void dispatch(generateClass(classId));

  const handleApply = async () => {
    const result = await dispatch(applyClass(classId));
    if (applyClass.fulfilled.match(result)) {
      toast(`Program uygulandı (${result.payload.applied} oturum)`, 'checkCircle');
    } else {
      toast((result.payload as string) || 'Uygulanamadı', 'xCircle');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] p-4">
      <h1 className="mb-4 text-[22px] font-bold tracking-[-0.01em]">
        Ders Programı{schoolClass ? ` — ${schoolClass.level}/${schoolClass.section}` : ''}
      </h1>
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="card p-[18px]">
          {schoolClass && (
            <RulesPanel
              classId={classId}
              termId={schoolClass.termId}
              canWrite={canWrite}
              generating={status === 'loading'}
              applying={false}
              onGenerate={handleGenerate}
              onApply={handleApply}
            />
          )}
        </aside>
        <section className="card p-[18px]">
          {preview && (
            <p className="mb-2 text-[12.5px] font-medium text-accent">
              Önizleme — uygulanana dek kaydedilmedi.
            </p>
          )}
          {settings ? (
            <WeekGrid
              items={items}
              dayStart={settings.dayStart}
              dayEnd={settings.dayEnd}
              workingDays={settings.workingDays}
            />
          ) : (
            <p className="text-[13px] text-ink-3">Dönem ayarları yükleniyor…</p>
          )}
          <ConflictReport items={report} />
        </section>
      </div>
    </div>
  );
}

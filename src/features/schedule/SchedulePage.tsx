import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon, useToast } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { fetchClasses, selectClasses } from '@/features/classes/classesSlice';
import { classLink } from '@/routes/paths';
import type { GridItem } from './components/SessionBlock';
import { WeekGrid } from './components/WeekGrid';
import { RulesPanel } from './components/RulesPanel';
import { ConflictReport } from './components/ConflictReport';
import { SessionModal, type SessionModalState } from './components/SessionModal';
import { minutesOf, toApiTime } from './timeUtils';
import {
  applyClass,
  fetchClassSchedule,
  fetchConfig,
  fetchSettings,
  generateClass,
  moveSession,
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
  const navigate = useNavigate();
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

  const [modal, setModal] = useState<SessionModalState | null>(null);
  const editable = canWrite && !preview; // manual edits operate on the persisted schedule

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
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="m-0 truncate text-[20px] font-bold tracking-[-0.01em]">
            Ders Programı{schoolClass ? ` — ${schoolClass.level}/${schoolClass.section}` : ''}
          </h1>
          <span className="text-[12px] text-ink-3">
            Kuralları düzenle, üret, önizle ve uygula.
          </span>
        </div>
      </div>
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
              Önizleme — uygulanana dek kaydedilmedi. Elle düzenleme uyguladıktan sonra açılır.
            </p>
          )}
          {settings ? (
            <WeekGrid
              items={items}
              dayStart={settings.dayStart}
              dayEnd={settings.dayEnd}
              workingDays={settings.workingDays}
              onSelectSession={
                editable
                  ? (it) => setModal({ mode: 'edit', item: it, weekday: it.weekday, startHm: it.startTime.slice(0, 5) })
                  : undefined
              }
              onEmptyClick={
                editable ? (weekday, startHm) => setModal({ mode: 'add', weekday, startHm }) : undefined
              }
              onDropSession={
                editable
                  ? (item, weekday, startHm) => {
                      if (!item.sessionId) return;
                      const startApi = toApiTime(startHm);
                      // preserve the session's duration
                      const durMin = minutesOf(item.endTime) - minutesOf(item.startTime);
                      const endMin = minutesOf(startApi) + durMin;
                      const endApi = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00`;
                      void dispatch(
                        moveSession({ id: item.sessionId, input: { weekday, startTime: startApi, endTime: endApi } }),
                      ).then((r) => {
                        if (!moveSession.fulfilled.match(r)) toast((r.payload as string) || 'Çakışma var.', 'xCircle');
                      });
                    }
                  : undefined
              }
            />
          ) : (
            <p className="text-[13px] text-ink-3">Dönem ayarları yükleniyor…</p>
          )}
          <ConflictReport items={report} />
        </section>
      </div>
      <SessionModal
        open={modal !== null}
        classId={classId}
        state={modal}
        onClose={() => setModal(null)}
      />
    </div>
  );
}

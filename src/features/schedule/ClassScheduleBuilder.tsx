import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useToast } from '@/components/ui';
import type { SchedulePreviewSession } from '@/types/domain';
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
  generateClass,
  moveSession,
  selectPreview,
  selectReport,
  selectSavedSessions,
  selectScheduleStatus,
  selectSettings,
} from './scheduleSlice';

interface ClassScheduleBuilderProps {
  classId: number;
  termId: number;
  canWrite: boolean;
  /** Term-bulk preview filtered to this class; when set it is shown instead of
   *  the class's own preview / applied schedule. */
  termPreview?: SchedulePreviewSession[] | null;
}

export function ClassScheduleBuilder({
  classId,
  termId,
  canWrite,
  termPreview,
}: ClassScheduleBuilderProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const settings = useAppSelector(selectSettings);
  const saved = useAppSelector(selectSavedSessions);
  const preview = useAppSelector(selectPreview);
  const report = useAppSelector(selectReport);
  const status = useAppSelector(selectScheduleStatus);
  const [modal, setModal] = useState<SessionModalState | null>(null);

  const effectivePreview = termPreview ?? preview;
  const editable = canWrite && !effectivePreview; // edits operate on the applied schedule

  useEffect(() => {
    if (!classId) return;
    void dispatch(fetchClassSchedule(classId));
    void dispatch(fetchConfig(classId));
  }, [dispatch, classId]);

  const items = useMemo<GridItem[]>(() => {
    if (effectivePreview) {
      return effectivePreview.map((s, i) => ({
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
  }, [effectivePreview, saved]);

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
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <aside className="card p-[18px]">
        <RulesPanel
          classId={classId}
          termId={termId}
          canWrite={canWrite}
          generating={status === 'loading'}
          applying={false}
          onGenerate={handleGenerate}
          onApply={handleApply}
        />
      </aside>
      <section className="card p-[18px]">
        {effectivePreview && (
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
                ? (it) =>
                    setModal({ mode: 'edit', item: it, weekday: it.weekday, startHm: it.startTime.slice(0, 5) })
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
                    const durMin = minutesOf(item.endTime) - minutesOf(item.startTime);
                    const endMin = minutesOf(startApi) + durMin;
                    const endApi = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00`;
                    void dispatch(
                      moveSession({ id: item.sessionId, input: { weekday, startTime: startApi, endTime: endApi } }),
                    ).then((r) => {
                      if (!moveSession.fulfilled.match(r))
                        toast((r.payload as string) || 'Çakışma var.', 'xCircle');
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
      <SessionModal open={modal !== null} classId={classId} state={modal} onClose={() => setModal(null)} />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon, useToast } from '@/components/ui';
import type { LessonType, SchedulePreviewSession } from '@/types/domain';
import type { GridItem } from './components/SessionBlock';
import { WeekGrid } from './components/WeekGrid';
import { ScheduleLegend } from './components/ScheduleLegend';
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
  toggleLock,
} from './scheduleSlice';

interface ClassScheduleBuilderProps {
  classId: number;
  termId: number;
  canWrite: boolean;
  termPreview?: SchedulePreviewSession[] | null;
  hiddenTypes?: Set<LessonType>;
  onToggleType?: (t: LessonType) => void;
}

export function ClassScheduleBuilder({ classId, termId, canWrite, termPreview, hiddenTypes, onToggleType }: ClassScheduleBuilderProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const settings = useAppSelector(selectSettings);
  const saved = useAppSelector(selectSavedSessions);
  const preview = useAppSelector(selectPreview);
  const report = useAppSelector(selectReport);
  const status = useAppSelector(selectScheduleStatus);
  const [modal, setModal] = useState<SessionModalState | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const effectivePreview = termPreview ?? preview;
  const editable = canWrite && !effectivePreview;

  useEffect(() => {
    if (!classId) return;
    void dispatch(fetchClassSchedule(classId));
    void dispatch(fetchConfig(classId));
  }, [dispatch, classId]);

  const items = useMemo<GridItem[]>(() => {
    const base: GridItem[] = effectivePreview
      ? effectivePreview.map((s, i) => ({
          key: `p-${s.classLessonId}-${s.weekday}-${s.startTime}-${i}`,
          classLessonId: s.classLessonId,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          lessonType: s.lessonType,
          teacherName: s.teacherName,
          locked: s.locked,
        }))
      : saved.map((s) => ({
          key: `s-${s.id}`,
          sessionId: s.id,
          classLessonId: s.classLessonId,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          lessonType: s.lessonType,
          teacherName: s.teacherName,
          locked: s.locked,
        }));
    return hiddenTypes ? base.filter((it) => !hiddenTypes.has(it.lessonType)) : base;
  }, [effectivePreview, saved, hiddenTypes]);

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="ghost" onClick={() => setRulesOpen((v) => !v)}>
          <Icon name="layers" size={16} />
          {rulesOpen ? 'Kuralları gizle' : 'Kurallar'}
        </Button>
        {canWrite && (
          <>
            <Button variant="ghost" onClick={handleGenerate} disabled={status === 'loading'}>
              <Icon name="sparkle" size={16} />
              {status === 'loading' ? 'Üretiliyor…' : 'Üret'}
            </Button>
            <Button variant="primary" onClick={handleApply}>
              <Icon name="check" size={16} />
              Uygula
            </Button>
          </>
        )}
      </div>
      {rulesOpen && (
        <div className="card p-[18px]">
          <RulesPanel
            classId={classId}
            termId={termId}
            canWrite={canWrite}
            generating={status === 'loading'}
            applying={false}
            onGenerate={handleGenerate}
            onApply={handleApply}
          />
        </div>
      )}
      <section className="card p-[18px]">
        {effectivePreview && (
          <p className="mb-2 text-[12.5px] font-medium text-accent">
            Önizleme — uygulanana dek kaydedilmedi. Elle düzenleme uyguladıktan sonra açılır.
          </p>
        )}
        {onToggleType && hiddenTypes && (
          <div className="mb-3">
            <ScheduleLegend hiddenTypes={hiddenTypes} onToggle={onToggleType} />
          </div>
        )}
        {settings ? (
          <WeekGrid
            items={items}
            dayStart={settings.dayStart}
            dayEnd={settings.dayEnd}
            workingDays={settings.workingDays}
            dayWindows={Object.fromEntries(
              Object.entries(settings.dayWindows ?? {}).map(([k, w]) => [Number(k), w]),
            )}
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
            onToggleLock={
              editable
                ? (it) => {
                    if (!it.sessionId) return;
                    void dispatch(toggleLock({ id: it.sessionId, locked: !it.locked })).then((r) => {
                      if (!toggleLock.fulfilled.match(r)) toast((r.payload as string) || 'Kilit güncellenemedi', 'xCircle');
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

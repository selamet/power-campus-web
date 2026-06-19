import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon, Select, useToast } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { fetchClasses, selectClasses } from '@/features/classes/classesSlice';
import { fetchTerms, selectCurrentTerm, selectTerms } from '@/features/terms/termsSlice';
import { teachersApi } from '@/features/teachers/teachersApi';
import type { LessonType, Teacher } from '@/types/domain';
import { ClassScheduleBuilder } from './ClassScheduleBuilder';
import { WeekGrid } from './components/WeekGrid';
import { ScheduleLegend } from './components/ScheduleLegend';
import { TeacherLoadTable } from './components/TeacherLoadTable';
import type { GridItem } from './components/SessionBlock';
import {
  applyTermThunk,
  fetchClassSchedule,
  fetchSettings,
  fetchTeacherSchedule,
  fetchTermSchedule,
  generateTermThunk,
  resetSchedule,
  selectScheduleStatus,
  selectSettings,
  selectTeacherSessions,
  selectTermPreview,
  selectTermSessions,
} from './scheduleSlice';

type Mode = 'class' | 'teacher' | 'all' | 'load';
const MODES: { value: Mode; label: string }[] = [
  { value: 'class', label: 'Sınıf' },
  { value: 'teacher', label: 'Öğretmen' },
  { value: 'all', label: 'Tüm Sınıflar' },
  { value: 'load', label: 'Yük' },
];

export function ScheduleHubPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.scheduleWrite);

  const terms = useAppSelector(selectTerms);
  const currentTerm = useAppSelector(selectCurrentTerm);
  const classes = useAppSelector(selectClasses);
  const settings = useAppSelector(selectSettings);
  const termPreview = useAppSelector(selectTermPreview);
  const termSessions = useAppSelector(selectTermSessions);
  const teacherSessions = useAppSelector(selectTeacherSessions);
  const status = useAppSelector(selectScheduleStatus);

  const [mode, setMode] = useState<Mode>('class');
  const [termId, setTermId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [hiddenTypes, setHiddenTypes] = useState<Set<LessonType>>(new Set());
  const [hiddenClassIds, setHiddenClassIds] = useState<Set<number>>(new Set());

  const toggleType = (t: LessonType) =>
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  const toggleClass = (id: number) =>
    setHiddenClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    void dispatch(fetchTerms());
    void teachersApi.list('active').then(setTeachers).catch(() => setTeachers([]));
    return () => {
      dispatch(resetSchedule());
    };
  }, [dispatch]);

  useEffect(() => {
    if (termId == null && terms.length) setTermId(currentTerm?.id ?? terms[0].id);
  }, [terms, currentTerm, termId]);

  useEffect(() => {
    if (termId == null) return;
    dispatch(resetSchedule());
    void dispatch(fetchClasses(termId));
    void dispatch(fetchSettings(termId));
    void dispatch(fetchTermSchedule({ termId }));
  }, [dispatch, termId]);

  const termClasses = useMemo(
    () => classes.filter((c) => c.termId === termId).sort((a, b) => a.name.localeCompare(b.name)),
    [classes, termId],
  );

  useEffect(() => {
    if (termClasses.length && !termClasses.some((c) => c.id === classId)) setClassId(termClasses[0].id);
    else if (!termClasses.length) setClassId(null);
  }, [termClasses, classId]);

  useEffect(() => {
    if (mode === 'teacher' && teacherId != null) void dispatch(fetchTeacherSchedule(teacherId));
  }, [dispatch, mode, teacherId]);

  useEffect(() => {
    setHiddenTypes(new Set());
    setHiddenClassIds(new Set());
  }, [termId, mode]);

  const dayWindows = useMemo(
    () =>
      Object.fromEntries(Object.entries(settings?.dayWindows ?? {}).map(([k, w]) => [Number(k), w])),
    [settings],
  );

  const nameForClass = (cid: number) => termClasses.find((c) => c.id === cid)?.name ?? '';

  const printSubtitle = (() => {
    const termName = terms.find((t) => t.id === termId)?.name ?? '';
    const modeLabel = MODES.find((m) => m.value === mode)?.label ?? '';
    const contextName =
      mode === 'class'
        ? classId != null
          ? nameForClass(classId)
          : ''
        : mode === 'teacher'
          ? (teachers.find((t) => t.id === teacherId)?.name ?? '')
          : '';
    const ctx = contextName ? `${modeLabel}: ${contextName}` : modeLabel;
    return [termName, ctx, new Date().toLocaleDateString('tr-TR')].filter(Boolean).join(' · ');
  })();

  const readonlyItems = useMemo<GridItem[]>(() => {
    let base: GridItem[];
    if (mode === 'teacher') {
      base = teacherSessions.map((s) => ({
        key: `t-${s.id}`,
        classLessonId: s.classLessonId,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        lessonType: s.lessonType,
        teacherName: s.className,
      }));
    } else if (termPreview) {
      base = termPreview.map((s, i) => ({
        key: `tp-${s.classId}-${s.weekday}-${s.startTime}-${i}`,
        classId: s.classId,
        classLessonId: s.classLessonId,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        lessonType: s.lessonType,
        teacherName: nameForClass(s.classId),
      }));
    } else {
      base = termSessions.map((s) => ({
        key: `ts-${s.id}`,
        classId: s.classId,
        classLessonId: s.classLessonId,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        lessonType: s.lessonType,
        teacherName: s.className,
      }));
    }
    return base.filter(
      (it) =>
        !hiddenTypes.has(it.lessonType) &&
        !(mode === 'all' && it.classId != null && hiddenClassIds.has(it.classId)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, teacherSessions, termSessions, termPreview, termClasses, hiddenTypes, hiddenClassIds]);

  const handleGenerateAll = () => {
    if (termId != null) void dispatch(generateTermThunk(termId));
  };
  const handleApplyAll = async () => {
    if (termId == null) return;
    const r = await dispatch(applyTermThunk(termId));
    if (applyTermThunk.fulfilled.match(r)) {
      toast(`Uygulandı (${r.payload.applied} oturum)`, 'checkCircle');
      if (classId != null) void dispatch(fetchClassSchedule(classId));
    } else {
      toast((r.payload as string) || 'Uygulanamadı', 'xCircle');
    }
  };

  return (
    <div className="anim-fade-up mx-auto flex w-full max-w-[1280px] flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="m-0 text-[20px] font-bold tracking-[-0.01em]">Ders Programı</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex gap-1">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  mode === m.value
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Select
            value={termId != null ? String(termId) : ''}
            onChange={(e) => setTermId(Number(e.target.value))}
            className="min-w-[150px]"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          {mode === 'class' && (
            <Select
              value={classId != null ? String(classId) : ''}
              onChange={(e) => setClassId(Number(e.target.value))}
              className="min-w-[120px]"
            >
              {termClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
          {mode === 'teacher' && (
            <Select
              value={teacherId != null ? String(teacherId) : ''}
              onChange={(e) => setTeacherId(Number(e.target.value))}
              className="min-w-[150px]"
            >
              <option value="">Öğretmen seç</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
          {canWrite && mode !== 'load' && (
            <>
              <Button variant="ghost" onClick={handleGenerateAll} disabled={status === 'loading'}>
                <Icon name="sparkle" size={16} />
                {status === 'loading' ? 'Üretiliyor…' : 'Tüm sınıfları üret'}
              </Button>
              <Button variant="primary" onClick={handleApplyAll}>
                <Icon name="check" size={16} />
                Hepsini uygula
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => window.print()}>
            <Icon name="download" size={16} />
            Yazdır
          </Button>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="m-0 text-[18px] font-bold tracking-[-0.01em]">
          Power Campus · Ders Programı
        </h1>
        <p className="mt-1 text-[13px] text-ink-2">{printSubtitle}</p>
      </div>

      {mode === 'class' &&
        (termClasses.length === 0 ? (
          <p className="card p-[18px] text-[13px] text-ink-3">Bu dönemde sınıf yok.</p>
        ) : (
          classId != null && (
            <ClassScheduleBuilder
              key={classId}
              classId={classId}
              termId={termId!}
              canWrite={canWrite}
              hiddenTypes={hiddenTypes}
              onToggleType={toggleType}
              termPreview={
                termPreview && classId != null
                  ? termPreview.filter((s) => s.classId === classId)
                  : null
              }
            />
          )
        ))}

      {(mode === 'teacher' || mode === 'all') && (
        <section className="card p-[18px]">
          {mode === 'teacher' && teacherId == null ? (
            <p className="text-[13px] text-ink-3">Bir öğretmen seçin.</p>
          ) : settings ? (
            <div className="flex flex-col gap-3">
              <ScheduleLegend hiddenTypes={hiddenTypes} onToggle={toggleType} />
              {mode === 'all' && termClasses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {termClasses.map((c) => {
                    const hidden = hiddenClassIds.has(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClass(c.id)}
                        className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-opacity ${
                          hidden
                            ? 'border-line text-ink-3 opacity-50'
                            : 'border-accent bg-accent-soft text-accent'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <WeekGrid
                items={readonlyItems}
                dayStart={settings.dayStart}
                dayEnd={settings.dayEnd}
                workingDays={settings.workingDays}
                dayWindows={dayWindows}
              />
            </div>
          ) : (
            <p className="text-[13px] text-ink-3">Dönem ayarları yükleniyor…</p>
          )}
        </section>
      )}

      {mode === 'load' && (
        <section className="card p-[18px]">
          {settings ? (
            <TeacherLoadTable
              sessions={termSessions}
              teacherRules={
                (settings.teacherRules ?? {}) as Record<
                  string,
                  { maxPerDay?: number; maxPerWeek?: number }
                >
              }
              workingDays={settings.workingDays}
            />
          ) : (
            <p className="text-[13px] text-ink-3">Dönem ayarları yükleniyor…</p>
          )}
        </section>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon, Select, useToast } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { fetchClasses, selectClasses } from '@/features/classes/classesSlice';
import { fetchTerms, selectCurrentTerm, selectTerms } from '@/features/terms/termsSlice';
import { ClassScheduleBuilder } from './ClassScheduleBuilder';
import { ConflictReport } from './components/ConflictReport';
import {
  applyTermThunk,
  fetchClassSchedule,
  fetchSettings,
  fetchTermSchedule,
  generateTermThunk,
  resetSchedule,
  selectScheduleStatus,
  selectTermPreview,
  selectTermReport,
} from './scheduleSlice';

export function ScheduleHubPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.scheduleWrite);

  const terms = useAppSelector(selectTerms);
  const currentTerm = useAppSelector(selectCurrentTerm);
  const classes = useAppSelector(selectClasses);
  const termPreview = useAppSelector(selectTermPreview);
  const termReport = useAppSelector(selectTermReport);
  const status = useAppSelector(selectScheduleStatus);

  const [termId, setTermId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);

  useEffect(() => {
    void dispatch(fetchTerms());
    return () => {
      dispatch(resetSchedule());
    };
  }, [dispatch]);

  // Default to the current term (or first) once terms have loaded.
  useEffect(() => {
    if (termId == null && terms.length) setTermId(currentTerm?.id ?? terms[0].id);
  }, [terms, currentTerm, termId]);

  // On term change: clear stale preview, load classes + settings + applied schedule.
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

  // Keep a valid class selected as the class list changes.
  useEffect(() => {
    if (termClasses.length && !termClasses.some((c) => c.id === classId)) {
      setClassId(termClasses[0].id);
    } else if (!termClasses.length) {
      setClassId(null);
    }
  }, [termClasses, classId]);

  const selectedClass = termClasses.find((c) => c.id === classId) ?? null;
  const classTermPreview = useMemo(
    () => (termPreview && classId != null ? termPreview.filter((s) => s.classId === classId) : null),
    [termPreview, classId],
  );

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
    <div className="anim-fade-up mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 text-[20px] font-bold tracking-[-0.01em]">Ders Programı</h1>
          <span className="text-[12px] text-ink-3">
            Dönem ve sınıf seç, kuralları düzenle, üret ve uygula.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={termId != null ? String(termId) : ''}
            onChange={(e) => setTermId(Number(e.target.value))}
            className="min-w-[160px]"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          {canWrite && (
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
        </div>
      </div>

      {termClasses.length === 0 ? (
        <p className="card p-[18px] text-[13px] text-ink-3">Bu dönemde sınıf yok.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {termClasses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setClassId(c.id)}
                className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  classId === c.id
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {termPreview && (
            <p className="text-[12.5px] font-medium text-accent">
              Toplu önizleme — "Hepsini uygula" ile kalıcılaşır.
            </p>
          )}
          {selectedClass && (
            <ClassScheduleBuilder
              key={selectedClass.id}
              classId={selectedClass.id}
              termId={selectedClass.termId}
              canWrite={canWrite}
              termPreview={classTermPreview}
            />
          )}
          {termPreview && <ConflictReport items={termReport} />}
        </>
      )}
    </div>
  );
}

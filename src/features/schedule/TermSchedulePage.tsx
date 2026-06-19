import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon, useToast } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { fetchClasses, selectClasses } from '@/features/classes/classesSlice';
import { termLink } from '@/routes/paths';
import { ConflictReport } from './components/ConflictReport';
import { TermGridTabs } from './components/TermGridTabs';
import {
  applyTermThunk,
  fetchSettings,
  fetchTermSchedule,
  generateTermThunk,
  resetSchedule,
  selectScheduleStatus,
  selectSettings,
  selectTermPreview,
  selectTermReport,
  selectTermSessions,
} from './scheduleSlice';

export function TermSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const termId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.scheduleWrite);

  const allClasses = useAppSelector(selectClasses);
  const settings = useAppSelector(selectSettings);
  const sessions = useAppSelector(selectTermSessions);
  const preview = useAppSelector(selectTermPreview);
  const report = useAppSelector(selectTermReport);
  const status = useAppSelector(selectScheduleStatus);

  useEffect(() => {
    if (!termId) return;
    void dispatch(fetchClasses(termId));
    void dispatch(fetchSettings(termId));
    void dispatch(fetchTermSchedule({ termId }));
    return () => {
      dispatch(resetSchedule());
    };
  }, [dispatch, termId]);

  const classes = useMemo(
    () =>
      allClasses.filter((c) => c.termId === termId).map((c) => ({ id: c.id, name: c.name })),
    [allClasses, termId],
  );

  const handleGenerate = () => void dispatch(generateTermThunk(termId));
  const handleApply = async () => {
    const r = await dispatch(applyTermThunk(termId));
    if (applyTermThunk.fulfilled.match(r)) toast(`Uygulandı (${r.payload.applied} oturum)`, 'checkCircle');
    else toast((r.payload as string) || 'Uygulanamadı', 'xCircle');
  };

  return (
    <div className="anim-fade-up mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="quiet"
          onClick={() => navigate(termLink(termId))}
          className="px-2 py-1.5 text-[13px] text-ink-3"
          aria-label="Döneme dön"
        >
          <Icon name="chevL" size={18} />
          Dönem
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="m-0 truncate text-[20px] font-bold tracking-[-0.01em]">Dönem Programı</h1>
          <span className="text-[12px] text-ink-3">
            Dönemdeki tüm sınıfların programını üret, önizle ve uygula.
          </span>
        </div>
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={handleGenerate} disabled={status === 'loading'}>
              <Icon name="sparkle" size={16} />
              {status === 'loading' ? 'Üretiliyor…' : 'Tüm sınıfları üret'}
            </Button>
            <Button variant="primary" onClick={handleApply}>
              <Icon name="check" size={16} />
              Hepsini uygula
            </Button>
          </div>
        )}
      </div>
      {preview && (
        <p className="-mt-2 text-[12.5px] font-medium text-accent">
          Önizleme — uygulanana dek kaydedilmedi.
        </p>
      )}
      <section className="card p-[18px]">
        {settings && classes.length > 0 ? (
          <TermGridTabs settings={settings} classes={classes} sessions={sessions} preview={preview} />
        ) : (
          <p className="text-[13px] text-ink-3">Yükleniyor…</p>
        )}
        <ConflictReport items={report} />
      </section>
    </div>
  );
}

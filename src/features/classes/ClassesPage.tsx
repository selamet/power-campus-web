import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Badge, Button, Icon, Select } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { fetchTerms, selectTerms } from '@/features/terms/termsSlice';
import { classLink } from '@/routes/paths';
import { ClassFormModal } from './components/ClassFormModal';
import { fetchClasses, selectClasses, selectClassesStatus } from './classesSlice';

export function ClassesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const classes = useAppSelector(selectClasses);
  const status = useAppSelector(selectClassesStatus);
  const terms = useAppSelector(selectTerms);
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.classesWrite);

  const [createOpen, setCreateOpen] = useState(false);
  const [termFilter, setTermFilter] = useState<string>('all');

  useEffect(() => {
    void dispatch(fetchClasses(undefined));
    void dispatch(fetchTerms());
  }, [dispatch]);

  const visible = useMemo(
    () =>
      termFilter === 'all'
        ? classes
        : classes.filter((item) => item.termId === Number(termFilter)),
    [classes, termFilter],
  );

  const currentTermId = terms.find((term) => term.current)?.id;

  return (
    <div className="anim-fade-up mx-auto flex max-w-[900px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">Sınıflar</h2>
          <p className="text-[13px] text-ink-3">
            Dönem ve seviyeye göre şubeleri (A1/1, A1/2 …) yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {terms.length > 0 && (
            <Select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="py-2 text-[13px]"
            >
              <option value="all">Tüm dönemler</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </Select>
          )}
          {canWrite && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Icon name="plus" size={18} />
              Yeni Sınıf
            </Button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="hidden items-center gap-4 border-b border-line px-5 py-3 text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase md:flex">
          <span className="flex-1">Sınıf</span>
          <span className="w-[200px]">Dönem</span>
          <span className="w-[110px]">Öğrenci</span>
        </div>

        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(classLink(item.id))}
            className="flex w-full flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-2"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft font-mono text-[12.5px] font-bold text-accent">
                {item.name}
              </div>
              <span className="truncate text-sm font-semibold">{item.level}</span>
            </div>
            <div className="flex w-[200px] items-center gap-2 text-[13px] text-ink-2">
              {item.termName}
              {item.current && (
                <Badge kind="ok" dot>
                  Güncel
                </Badge>
              )}
            </div>
            <div className="flex w-[110px] items-center justify-between gap-2">
              <span className="font-mono text-[13px] tabular-nums text-ink-2">
                {item.studentCount}
              </span>
              <Icon name="chevR" size={18} className="text-ink-3" />
            </div>
          </button>
        ))}

        {status === 'loading' && classes.length === 0 && (
          <div className="p-12 text-center text-ink-3">Yükleniyor…</div>
        )}
        {status === 'succeeded' && visible.length === 0 && (
          <div className="p-12 text-center text-ink-3">Henüz sınıf oluşturulmamış.</div>
        )}
      </div>

      {createOpen && (
        <ClassFormModal
          open={createOpen}
          schoolClass={null}
          defaultTermId={currentTermId}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

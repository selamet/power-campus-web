import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Avatar, Badge, Button, Icon } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { STATUS } from '@/constants/status';
import { usePermission } from '@/features/auth/usePermission';
import { paths, studentLink } from '@/routes/paths';
import { formatDate, formatMoney } from '@/utils/format';
import { AddStudentsModal } from './components/AddStudentsModal';
import { TermFormModal } from './components/TermFormModal';
import { termsApi, type TermStudent } from './termsApi';
import { fetchTerms, selectTerms } from './termsSlice';

export function TermDetailPage() {
  const { id } = useParams<{ id: string }>();
  const termId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const term = useAppSelector(selectTerms).find((item) => item.id === termId);
  const { has } = usePermission();
  const canEditTerm = has(PERMISSIONS.termsWrite);
  const canEnroll = has(PERMISSIONS.studentsWrite);

  const [roster, setRoster] = useState<TermStudent[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchTerms());
  }, [dispatch]);

  useEffect(() => {
    if (!termId) return;
    let active = true;
    termsApi
      .students(termId)
      .then((list) => active && setRoster(list))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [termId]);

  const enrolledCodes = useMemo(
    () => new Set(roster.map((row) => row.studentId)),
    [roster],
  );

  return (
    <div className="anim-fade-up mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="quiet"
          onClick={() => navigate(paths.terms)}
          className="px-2 py-1.5 text-[13px] text-ink-3"
          aria-label="Dönemlere dön"
        >
          <Icon name="chevL" size={18} />
          Dönemler
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 truncate text-[20px] font-bold tracking-[-0.01em]">
              {term?.name ?? 'Dönem'}
            </h1>
            {term?.current && (
              <Badge kind="ok" dot>
                Güncel
              </Badge>
            )}
          </div>
          {term && (
            <span className="font-mono text-[12px] text-ink-3">
              {formatDate(term.start)} – {formatDate(term.end)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEditTerm && term && (
            <Button variant="ghost" onClick={() => setEditOpen(true)}>
              <Icon name="edit" size={17} />
              Düzenle
            </Button>
          )}
          {canEnroll && (
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={18} />
              Öğrenci Ekle
            </Button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="hidden items-center gap-4 border-b border-line px-5 py-3 text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase md:flex">
          <span className="flex-1">Öğrenci</span>
          <span className="w-[180px]">Dil / Kur</span>
          <span className="w-[90px]">Durum</span>
          <span className="w-[140px]">Ödeme</span>
        </div>

        {roster.map((row) => {
          const badge = STATUS[row.status];
          return (
            <button
              key={row.studentId}
              type="button"
              onClick={() => navigate(studentLink({ id: row.studentId }))}
              className="flex w-full flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={row.name} size={38} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{row.name}</span>
                  <span className="font-mono text-[11px] text-ink-3">{row.studentId}</span>
                </div>
              </div>
              <div className="w-[180px] text-[13px] text-ink-2">
                {[row.lang, row.course].filter(Boolean).join(' · ') || '—'}
              </div>
              <div className="w-[90px]">
                <Badge kind={badge.kind} dot>
                  {badge.label}
                </Badge>
              </div>
              <div className="w-[140px] font-mono text-[12.5px] tabular-nums">
                {formatMoney(row.paid)} / {formatMoney(row.fee)}
              </div>
            </button>
          );
        })}

        {roster.length === 0 && (
          <div className="p-12 text-center text-ink-3">Bu dönemde henüz öğrenci yok.</div>
        )}
      </div>

      {editOpen && term && (
        <TermFormModal open={editOpen} term={term} onClose={() => setEditOpen(false)} />
      )}
      {addOpen && term && (
        <AddStudentsModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          termId={termId}
          enrolledCodes={enrolledCodes}
          onEnrolled={setRoster}
        />
      )}
    </div>
  );
}

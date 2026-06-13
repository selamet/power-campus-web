import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Badge, Button, Icon } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import type { Term } from '@/types/domain';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';
import { TermFormModal } from './components/TermFormModal';
import { fetchTerms, selectTerms, selectTermsStatus } from './termsSlice';

export function TermsPage() {
  const dispatch = useAppDispatch();
  const terms = useAppSelector(selectTerms);
  const status = useAppSelector(selectTermsStatus);
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.termsWrite);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Term | null>(null);

  useEffect(() => {
    void dispatch(fetchTerms());
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (term: Term) => {
    if (!canWrite) return;
    setEditing(term);
    setModalOpen(true);
  };

  return (
    <div className="anim-fade-up mx-auto flex max-w-[900px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">Dönemler</h2>
          <p className="text-[13px] text-ink-3">
            Kursların yürüdüğü dönemleri (sömestr) yönetin.
          </p>
        </div>
        {canWrite && (
          <Button variant="primary" onClick={openCreate}>
            <Icon name="plus" size={18} />
            Yeni Dönem
          </Button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="hidden items-center gap-4 border-b border-line px-5 py-3 text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase md:flex">
          <span className="flex-1">Dönem</span>
          <span className="w-[260px]">Tarih Aralığı</span>
          <span className="w-[90px]">Durum</span>
        </div>

        {terms.map((term) => (
          <button
            key={term.id}
            type="button"
            onClick={() => openEdit(term)}
            disabled={!canWrite}
            className={cn(
              'flex w-full flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 text-left transition-colors last:border-b-0',
              canWrite ? 'cursor-pointer hover:bg-surface-2' : 'cursor-default',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon name="calendar" size={18} />
              </div>
              <span className="truncate text-sm font-semibold">{term.name}</span>
            </div>
            <div className="w-[260px] font-mono text-[12.5px] text-ink-2">
              {formatDate(term.start)} – {formatDate(term.end)}
            </div>
            <div className="w-[90px]">
              {term.current ? (
                <Badge kind="ok" dot>
                  Güncel
                </Badge>
              ) : (
                <Badge kind="neutral">Arşiv</Badge>
              )}
            </div>
          </button>
        ))}

        {status === 'loading' && terms.length === 0 && (
          <div className="p-12 text-center text-ink-3">Yükleniyor…</div>
        )}
        {status === 'succeeded' && terms.length === 0 && (
          <div className="p-12 text-center text-ink-3">Henüz dönem oluşturulmamış.</div>
        )}
      </div>

      {modalOpen && (
        <TermFormModal
          key={editing?.id ?? 'new'}
          open={modalOpen}
          term={editing}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

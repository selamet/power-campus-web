import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Badge, Button, Icon } from '@/components/ui';
import { TEACHER_STATUS } from '@/constants/teacherStatus';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { teacherLink } from '@/routes/paths';
import type { TeacherStatus } from '@/types/domain';
import { cn } from '@/utils/cn';
import { levelCode } from '@/utils/format';
import { fetchTeachers, selectTeachers, selectTeachersStatus } from './teachersSlice';
import { TeacherFormModal } from './TeacherFormModal';

type FilterValue = 'all' | TeacherStatus;

export function TeachersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const teachers = useAppSelector(selectTeachers);
  const status = useAppSelector(selectTeachersStatus);
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.teachersWrite);

  const [filter, setFilter] = useState<FilterValue>('all');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchTeachers());
    }
  }, [dispatch, status]);

  const visible = useMemo(() => {
    let list = teachers;
    if (filter !== 'all') list = list.filter((t) => t.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [teachers, filter, query]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 flex-1 text-[22px] font-bold">Öğretmenler</h1>
        {canWrite && (
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Icon name="plus" size={17} />
            Öğretmen Ekle
          </Button>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-2">
        <input
          className="field-focus flex-1 rounded-token-sm border-[1.5px] border-line-strong bg-surface px-[13px] py-[9px] text-[14px] outline-none placeholder:text-ink-3"
          placeholder="İsim veya e-posta ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-token-sm border px-3 py-[9px] text-[13.5px] font-semibold transition-colors',
              filter === f
                ? 'border-accent bg-accent-soft text-accent-strong'
                : 'border-line text-ink-2 hover:bg-surface-2',
            )}
          >
            {f === 'all' ? 'Tümü' : TEACHER_STATUS[f].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card divide-y divide-line overflow-hidden p-0">
        {status === 'loading' ? (
          <p className="py-10 text-center text-[14px] text-ink-3">Yükleniyor…</p>
        ) : (
          visible.map((t) => {
            const badge = TEACHER_STATUS[t.status];
            return (
              <button
                key={t.id}
                onClick={() => navigate(teacherLink(t.id))}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon name="user" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold">{t.name}</div>
                  <div className="truncate text-[12.5px] text-ink-3">
                    {t.levels.length ? t.levels.map(levelCode).join(' · ') : 'Seviye atanmadı'}
                  </div>
                </div>
                <span className="text-[12.5px] text-ink-3">{t.classCount} sınıf</span>
                <Badge kind={badge.kind} dot>
                  {badge.label}
                </Badge>
              </button>
            );
          })
        )}
        {status !== 'loading' && visible.length === 0 && (
          <p className="py-10 text-center text-[14px] text-ink-3">Öğretmen bulunamadı.</p>
        )}
      </div>

      {adding && <TeacherFormModal onClose={() => setAdding(false)} />}
    </div>
  );
}

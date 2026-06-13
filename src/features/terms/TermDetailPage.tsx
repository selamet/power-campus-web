import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Avatar, Badge, Button, Icon, Input, Select } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { STATUS } from '@/constants/status';
import type { StudentStatus } from '@/types/domain';
import { usePermission } from '@/features/auth/usePermission';
import { paths, studentLink } from '@/routes/paths';
import { cn } from '@/utils/cn';
import { formatDate, levelCode } from '@/utils/format';
import { AddStudentsModal } from './components/AddStudentsModal';
import { TermFormModal } from './components/TermFormModal';
import { termsApi, type TermStudent } from './termsApi';
import { fetchTerms, selectTerms } from './termsSlice';

const NO_LEVEL = '—';
const STATUS_ORDER = Object.keys(STATUS) as StudentStatus[];
const SORT_INDEX: Record<StudentStatus, number> = { active: 0, pending: 1, inactive: 2 };

type SortKey = 'name' | 'level' | 'status';

/** A clean accent ramp (light → full) so higher levels read as "deeper". */
function levelColor(index: number, total: number, code: string): string {
  if (code === NO_LEVEL) return 'var(--ink-3)';
  const pct = 42 + Math.round((index / Math.max(total - 1, 1)) * 58);
  return `color-mix(in srgb, var(--accent) ${pct}%, var(--surface))`;
}

const STATUS_DOT: Record<string, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  neutral: 'bg-ink-3',
};

/** A pill that doubles as a count display and a toggle filter. */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line text-ink-2 hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}

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
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StudentStatus | null>(null);
  const [sort, setSort] = useState<SortKey>('name');

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

  // How many students sit at each level, ordered by level code (A1, A2, …).
  const levelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of roster) {
      const code = levelCode(row.level) || NO_LEVEL;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, 'tr'));
  }, [roster]);

  const statusCounts = useMemo(() => {
    const counts = new Map<StudentStatus, number>();
    for (const row of roster) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    return counts;
  }, [roster]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    const result = roster.filter((row) => {
      if (levelFilter && (levelCode(row.level) || NO_LEVEL) !== levelFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (text && !`${row.name}${row.studentId}`.toLowerCase().includes(text)) return false;
      return true;
    });
    const byName = (a: TermStudent, b: TermStudent) => a.name.localeCompare(b.name, 'tr');
    if (sort === 'level') {
      result.sort(
        (a, b) =>
          (levelCode(a.level) || '~').localeCompare(levelCode(b.level) || '~', 'tr') ||
          byName(a, b),
      );
    } else if (sort === 'status') {
      result.sort((a, b) => SORT_INDEX[a.status] - SORT_INDEX[b.status] || byName(a, b));
    } else {
      result.sort(byName);
    }
    return result;
  }, [roster, query, levelFilter, statusFilter, sort]);

  const hasFilters = Boolean(query.trim() || levelFilter || statusFilter);
  const clearFilters = () => {
    setQuery('');
    setLevelFilter(null);
    setStatusFilter(null);
  };

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

      {roster.length > 0 && (
        <div className="card flex flex-col gap-4 p-5">
          {/* Count + search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-bold leading-none tracking-[-0.02em]">
                {roster.length}
              </span>
              <span className="text-[13px] text-ink-3">
                öğrenci
                {hasFilters && (
                  <>
                    {' · '}
                    <span className="font-semibold text-ink-2">{visible.length}</span> eşleşme
                  </>
                )}
              </span>
            </div>
            <div className="relative w-[240px] max-w-full">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="İsim veya kod ara…"
                className="py-1.5 pl-9 text-[13px]"
              />
            </div>
          </div>

          {/* Level distribution bar + legend */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase">
                Seviye Dağılımı
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-[12px] font-medium text-ink-3 transition-colors hover:text-accent"
                >
                  <Icon name="x" size={13} />
                  Filtreleri temizle
                </button>
              )}
            </div>
            <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-bg-2">
              {levelCounts.map(([code, count], index) => {
                const dim = levelFilter !== null && levelFilter !== code;
                return (
                  <button
                    key={code}
                    type="button"
                    title={`${code} · ${count} öğrenci`}
                    aria-label={`${code}: ${count} öğrenci`}
                    onClick={() => setLevelFilter((prev) => (prev === code ? null : code))}
                    className={cn('h-full transition-opacity hover:opacity-80', dim && 'opacity-25')}
                    style={{
                      width: `${(count / roster.length) * 100}%`,
                      backgroundColor: levelColor(index, levelCounts.length, code),
                    }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {levelCounts.map(([code, count], index) => {
                const active = levelFilter === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLevelFilter((prev) => (prev === code ? null : code))}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] transition-colors',
                      active
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line text-ink-2 hover:bg-surface-2',
                    )}
                  >
                    <span
                      className="size-2.5 rounded-[3px]"
                      style={{ backgroundColor: levelColor(index, levelCounts.length, code) }}
                    />
                    <span className="font-semibold">{code}</span>
                    <span className="tabular-nums text-ink-3">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status filters + sort */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
            {STATUS_ORDER.map((status) => {
              const count = statusCounts.get(status) ?? 0;
              if (count === 0) return null;
              return (
                <FilterChip
                  key={status}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter((prev) => (prev === status ? null : status))}
                >
                  <span className={cn('size-1.5 rounded-full', STATUS_DOT[STATUS[status].kind])} />
                  {STATUS[status].label}
                  <span className="tabular-nums text-ink-3">{count}</span>
                </FilterChip>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <Icon name="filter" size={15} className="text-ink-3" />
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="py-1.5 text-[12.5px]"
              >
                <option value="name">Ada göre (A–Z)</option>
                <option value="level">Seviyeye göre</option>
                <option value="status">Duruma göre</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="hidden items-center gap-4 border-b border-line px-5 py-3 text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase md:flex">
          <span className="flex-1">Öğrenci</span>
          <span className="w-[180px] shrink-0">Seviye</span>
          <span className="w-[150px] shrink-0">Durum</span>
        </div>

        {visible.map((row) => {
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
              <div className="w-[180px] shrink-0 text-[13px] text-ink-2">
                {levelCode(row.level) || NO_LEVEL}
              </div>
              <div className="w-[150px] shrink-0">
                <Badge kind={badge.kind} dot>
                  {badge.label}
                </Badge>
              </div>
            </button>
          );
        })}

        {roster.length === 0 && (
          <div className="p-12 text-center text-ink-3">Bu dönemde henüz öğrenci yok.</div>
        )}
        {roster.length > 0 && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-ink-3">
            <span>Eşleşen öğrenci yok.</span>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Filtreleri temizle
              </Button>
            )}
          </div>
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

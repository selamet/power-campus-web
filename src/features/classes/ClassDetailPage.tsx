import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Avatar, Badge, Button, Icon, Input, useToast } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { STATUS } from '@/constants/status';
import type { StudentStatus, ClassStudent, Teacher } from '@/types/domain';
import { usePermission } from '@/features/auth/usePermission';
import { fetchTerms } from '@/features/terms/termsSlice';
import { teachersApi } from '@/features/teachers/teachersApi';
import { paths, studentLink, teacherLink } from '@/routes/paths';
import { cn } from '@/utils/cn';
import { levelCode } from '@/utils/format';
import { AddStudentsToClassModal } from './components/AddStudentsToClassModal';
import { AutoAssignModal } from './components/AutoAssignModal';
import { ClassFormModal } from './components/ClassFormModal';
import { classesApi } from './classesApi';
import { deleteClass, fetchClasses, selectClasses } from './classesSlice';

const STATUS_ORDER = Object.keys(STATUS) as StudentStatus[];

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const classId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const schoolClass = useAppSelector(selectClasses).find((item) => item.id === classId);
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.classesWrite);

  const [roster, setRoster] = useState<ClassStudent[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    void dispatch(fetchClasses(undefined));
    void dispatch(fetchTerms());
  }, [dispatch]);

  useEffect(() => {
    if (!classId) return;
    let active = true;
    classesApi
      .students(classId)
      .then((list) => active && setRoster(list))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [classId]);

  useEffect(() => {
    let active = true;
    teachersApi
      .list('active')
      .then((rows) => active && setTeachers(rows))
      .catch(() => active && setTeachers([]));
    return () => {
      active = false;
    };
  }, []);

  const enrolledCodes = useMemo(
    () => new Set(roster.map((row) => row.studentId)),
    [roster],
  );

  const statusCounts = useMemo(() => {
    const counts = new Map<StudentStatus, number>();
    for (const row of roster) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    return counts;
  }, [roster]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return roster.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (text && !`${row.name}${row.studentId}`.toLowerCase().includes(text)) return false;
      return true;
    });
  }, [roster, query, statusFilter]);

  const assignTeacher = async (teacherId: number | null) => {
    if (!schoolClass) return;
    setAssigning(true);
    try {
      await classesApi.update(schoolClass.id, { teacherId });
      void dispatch(fetchClasses(undefined));
    } catch {
      toast('Öğretmen ataması başarısız oldu', 'xCircle');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (code: string) => {
    try {
      await classesApi.unassign(classId, code);
      setRoster((prev) => prev.filter((row) => row.studentId !== code));
      void dispatch(fetchClasses(undefined));
    } catch {
      toast('Çıkarma başarısız oldu', 'xCircle');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteClass(classId));
    if (deleteClass.fulfilled.match(result)) {
      toast('Sınıf silindi', 'check');
      navigate(paths.classes);
    } else {
      toast((result.payload as string) || 'Silme başarısız oldu', 'xCircle');
    }
  };

  return (
    <div className="anim-fade-up mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="quiet"
          onClick={() => navigate(paths.classes)}
          className="px-2 py-1.5 text-[13px] text-ink-3"
          aria-label="Sınıflara dön"
        >
          <Icon name="chevL" size={18} />
          Sınıflar
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 truncate text-[20px] font-bold tracking-[-0.01em]">
              {schoolClass?.name ?? 'Sınıf'}
            </h1>
            {schoolClass?.current && (
              <Badge kind="ok" dot>
                Güncel
              </Badge>
            )}
          </div>
          {schoolClass && (
            <span className="text-[12px] text-ink-3">
              {schoolClass.level} · {schoolClass.termName}
            </span>
          )}
        </div>
        {canWrite && schoolClass && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setAutoOpen(true)}>
              <Icon name="sparkle" size={17} />
              Otomatik Ata
            </Button>
            <Button variant="ghost" onClick={() => setEditOpen(true)}>
              <Icon name="edit" size={17} />
              Düzenle
            </Button>
            <Button variant="ghost" onClick={handleDelete} className="text-accent">
              <Icon name="x" size={17} />
              Sil
            </Button>
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={18} />
              Öğrenci Ekle
            </Button>
          </div>
        )}
      </div>

      {schoolClass && (
        <div className="card p-[18px]">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="m-0 text-[14.5px] font-bold">Öğretmen</h4>
          </div>
          {schoolClass.teacherId ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(teacherLink(schoolClass.teacherId!))}
                className="font-semibold hover:text-accent"
              >
                {schoolClass.teacherName}
              </button>
              {canWrite && (
                <button
                  onClick={() => assignTeacher(null)}
                  disabled={assigning}
                  className="text-[12.5px] text-ink-3 hover:text-accent"
                >
                  Kaldır
                </button>
              )}
            </div>
          ) : (
            <span className="text-[13px] text-ink-3">Atanmadı</span>
          )}
          {canWrite && (
            <select
              value={schoolClass.teacherId ?? ''}
              onChange={(e) => assignTeacher(e.target.value ? Number(e.target.value) : null)}
              disabled={assigning}
              className="mt-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-[14px]"
            >
              <option value="">— Öğretmen seç —</option>
              {[...teachers]
                .sort((a, b) => {
                  const am = a.levels.map(levelCode).includes(levelCode(schoolClass.level)) ? 0 : 1;
                  const bm = b.levels.map(levelCode).includes(levelCode(schoolClass.level)) ? 0 : 1;
                  return am - bm || a.name.localeCompare(b.name, 'tr');
                })
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.levels.map(levelCode).includes(levelCode(schoolClass.level)) ? ' ✓' : ''}
                  </option>
                ))}
            </select>
          )}
        </div>
      )}

      {roster.length > 0 && (
        <div className="card flex flex-wrap items-center gap-2 p-4">
          <span className="text-[13px] text-ink-3">
            <span className="text-[18px] font-bold text-ink">{roster.length}</span> öğrenci
          </span>
          <div className="ml-2 flex flex-wrap gap-2">
            {STATUS_ORDER.map((status) => {
              const count = statusCounts.get(status) ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter((prev) => (prev === status ? null : status))}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
                    statusFilter === status
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-ink-2 hover:bg-surface-2',
                  )}
                >
                  {STATUS[status].label}
                  <span className="tabular-nums text-ink-3">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="ml-auto w-[200px]">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim veya kod ara…"
              className="py-1.5 text-[13px]"
            />
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="hidden items-center gap-4 border-b border-line px-5 py-3 text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase md:flex">
          <span className="flex-1">Öğrenci</span>
          <span className="w-[120px] shrink-0">Seviye</span>
          <span className="w-[150px] shrink-0">Durum</span>
          {canWrite && <span className="w-[40px] shrink-0" />}
        </div>

        {visible.map((row) => {
          const badge = STATUS[row.status];
          return (
            <div
              key={row.studentId}
              className="flex w-full flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
            >
              <button
                type="button"
                onClick={() => navigate(studentLink({ id: row.studentId }))}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <Avatar name={row.name} size={38} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{row.name}</span>
                  <span className="font-mono text-[11px] text-ink-3">{row.studentId}</span>
                </div>
              </button>
              <div className="w-[120px] shrink-0 text-[13px] text-ink-2">
                {levelCode(row.level) || '—'}
              </div>
              <div className="w-[150px] shrink-0">
                <Badge kind={badge.kind} dot>
                  {badge.label}
                </Badge>
              </div>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => handleUnassign(row.studentId)}
                  className="flex w-[40px] shrink-0 justify-center text-ink-3 transition-colors hover:text-accent"
                  aria-label="Sınıftan çıkar"
                  title="Sınıftan çıkar"
                >
                  <Icon name="x" size={17} />
                </button>
              )}
            </div>
          );
        })}

        {roster.length === 0 && (
          <div className="p-12 text-center text-ink-3">Bu sınıfta henüz öğrenci yok.</div>
        )}
        {roster.length > 0 && visible.length === 0 && (
          <div className="p-12 text-center text-ink-3">Eşleşen öğrenci yok.</div>
        )}
      </div>

      {editOpen && schoolClass && (
        <ClassFormModal
          open={editOpen}
          schoolClass={schoolClass}
          onClose={() => setEditOpen(false)}
        />
      )}
      {addOpen && schoolClass && (
        <AddStudentsToClassModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          classId={classId}
          termId={schoolClass.termId}
          enrolledCodes={enrolledCodes}
          onAssigned={(updated) => {
            setRoster(updated);
            void dispatch(fetchClasses(undefined));
          }}
        />
      )}

      <AutoAssignModal
        open={autoOpen}
        onClose={() => setAutoOpen(false)}
        classId={classId}
        onAssigned={(updated) => {
          setRoster(updated);
          void dispatch(fetchClasses(undefined));
        }}
      />
    </div>
  );
}

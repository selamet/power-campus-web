import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Badge, Button, Icon } from '@/components/ui';
import { TEACHER_STATUS } from '@/constants/teacherStatus';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
import { classLink, teacherScheduleLink } from '@/routes/paths';
import type { SchoolClass } from '@/types/domain';
import { levelCode } from '@/utils/format';
import { teachersApi } from './teachersApi';
import { fetchTeacher, selectTeacherById, selectTeachersStatus } from './teachersSlice';
import { TeacherFormModal } from './TeacherFormModal';

export function TeacherDetailPage() {
  const { id } = useParams();
  const teacherId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const teacher = useAppSelector((state) => selectTeacherById(state, teacherId));
  const teachersStatus = useAppSelector(selectTeachersStatus);
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.teachersWrite);
  const canViewSchedule = has(PERMISSIONS.scheduleRead);

  const [editing, setEditing] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  useEffect(() => {
    if (Number.isNaN(teacherId)) return;
    void dispatch(fetchTeacher(teacherId));
  }, [dispatch, teacherId]);

  useEffect(() => {
    if (Number.isNaN(teacherId)) return;
    let active = true;
    teachersApi
      .classes(teacherId)
      .then((rows) => { if (active) setClasses(rows); })
      .catch(() => { if (active) setClasses([]); });
    return () => { active = false; };
  }, [teacherId]);

  if (!teacher) {
    const loading = teachersStatus === 'idle' || teachersStatus === 'loading';
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-ink-3">
          {loading ? 'Yükleniyor…' : 'Öğretmen bulunamadı.'}
        </p>
      </div>
    );
  }

  const badge = TEACHER_STATUS[teacher.status];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink"
      >
        <Icon name="arrowL" size={15} />
        Geri
      </button>

      {/* Header card */}
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="user" size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="m-0 truncate text-[20px] font-bold">{teacher.name}</h1>
            <Badge kind={badge.kind} dot>
              {badge.label}
            </Badge>
          </div>
          <div className="mt-0.5 text-[13px] text-ink-3">
            {teacher.email ?? '—'} · {teacher.phone ?? '—'}
          </div>
        </div>
        {canViewSchedule && (
          <Button variant="ghost" onClick={() => navigate(teacherScheduleLink(teacherId))}>
            <Icon name="calendar" size={17} />
            Ders Programı
          </Button>
        )}
        {canWrite && (
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} /> Düzenle
          </Button>
        )}
      </div>

      {/* Teaching profile card */}
      <div className="card p-[18px]">
        <h4 className="m-0 mb-2 text-[14.5px] font-bold">Öğretim Profili</h4>
        <div className="mb-1 text-[13px] text-ink-3">
          Diller: {teacher.languages.join(', ') || '—'}
        </div>
        <div className="flex flex-wrap gap-2">
          {teacher.levels.length ? (
            teacher.levels.map((l) => (
              <span
                key={l}
                className="rounded-full bg-surface-2 px-3 py-1 text-[12.5px] font-semibold"
              >
                {levelCode(l)}
              </span>
            ))
          ) : (
            <span className="text-[13px] text-ink-3">Seviye atanmadı</span>
          )}
        </div>
        {teacher.note && <p className="mt-3 mb-0 text-[13px] text-ink-2">{teacher.note}</p>}
      </div>

      {/* Classes card */}
      <div className="card p-[18px]">
        <h4 className="m-0 mb-2 text-[14.5px] font-bold">Verdiği Dersler</h4>
        {classes.length === 0 ? (
          <p className="m-0 text-[13px] text-ink-3">Atanmış sınıf yok.</p>
        ) : (
          classes.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(classLink(c.id))}
              className="flex w-full items-center gap-3 border-b border-line py-2.5 text-left last:border-0 hover:text-accent"
            >
              <span className="font-semibold">{c.name}</span>
              <span className="text-[12.5px] text-ink-3">{c.termName}</span>
              <span className="ml-auto text-[12.5px] text-ink-3">{c.studentCount} öğrenci</span>
            </button>
          ))
        )}
      </div>

      {editing && <TeacherFormModal teacher={teacher} onClose={() => setEditing(false)} />}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { Avatar, Badge, Button, Icon } from '@/components/ui';
import { STATUS } from '@/constants/status';
import { selectStudents } from '@/features/students/studentsSlice';
import { useStudentActions } from '@/features/students/useStudentActions';
import { StudentModal } from '@/features/students/components/StudentModal';
import { useShellContext } from '@/layout/shellContext';
import type { Student, StudentStatus } from '@/types/domain';
import { cn } from '@/utils/cn';
import { formatMoney, paidPercent } from '@/utils/format';

type FilterValue = 'all' | StudentStatus;

export function StudentsPage() {
  const { search, openAddFlow } = useShellContext();
  const students = useAppSelector(selectStudents);
  const { approve, reject, update, pay } = useStudentActions();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [selected, setSelected] = useState<Student | null>(null);

  const rows = useMemo(() => {
    let result = students;
    if (filter !== 'all') result = result.filter((s) => s.status === filter);
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((s) =>
        `${s.name}${s.id}${s.phone}${s.lang}`.toLowerCase().includes(query),
      );
    }
    return result;
  }, [students, filter, search]);

  const tabs: Array<{ value: FilterValue; label: string; count: number }> = [
    { value: 'all', label: 'Tümü', count: students.length },
    { value: 'active', label: 'Aktif', count: students.filter((s) => s.status === 'active').length },
    {
      value: 'pending',
      label: 'Onay Bekleyen',
      count: students.filter((s) => s.status === 'pending').length,
    },
    {
      value: 'inactive',
      label: 'Pasif',
      count: students.filter((s) => s.status === 'inactive').length,
    },
  ];

  return (
    <div className="anim-fade-up mx-auto flex max-w-[1240px] flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'flex items-center gap-[7px] rounded-[10px] border px-[15px] py-[9px] text-[13.5px] font-semibold transition-all duration-150',
                filter === tab.value
                  ? 'border-transparent bg-ink text-bg'
                  : 'border-line-strong bg-surface text-ink-2',
              )}
            >
              {tab.label}
              <span className="font-mono text-[11px] opacity-70">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">
            <Icon name="download" size={17} />
            Dışa Aktar
          </Button>
          <Button variant="primary" onClick={openAddFlow}>
            <Icon name="plus" size={18} />
            Öğrenci Ekle
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="students-table">
          <div className="strow shead">
            <div>Öğrenci</div>
            <div>Dil / Seviye</div>
            <div>Kur</div>
            <div>Durum</div>
            <div>Ödeme</div>
            <div />
          </div>

          {rows.map((student, index) => {
            const status = STATUS[student.status];
            const pct = paidPercent(student.paid, student.fee);
            const [levelCode, levelName] = student.level.split(' — ');
            return (
              <div
                key={student.id}
                className="strow sbody"
                onClick={() => setSelected(student)}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={student.name} size={40} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold">{student.name}</span>
                    <span className="font-mono text-[11px] text-ink-3">{student.id}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-medium">{student.lang}</span>
                  <span className="text-xs text-ink-3">
                    {levelCode} · {levelName}
                  </span>
                </div>
                <div className="st-course text-[13.5px] text-ink-2">{student.course}</div>
                <div>
                  <Badge kind={status.kind} dot>
                    {status.label}
                  </Badge>
                </div>
                <div className="flex min-w-0 flex-col gap-[5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12.5px] font-bold tabular-nums">
                      {formatMoney(student.paid)}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-3">{pct}%</span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-[3px] bg-bg-2">
                    <div
                      className={cn(
                        'h-full rounded-[3px] transition-[width] duration-500',
                        pct === 100 ? 'bg-ok' : 'bg-accent',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  {student.status === 'pending' ? (
                    <Button
                      variant="soft"
                      onClick={(event) => {
                        event.stopPropagation();
                        approve(student.id);
                      }}
                      className="px-3 py-2 text-[12.5px]"
                    >
                      <Icon name="check" size={15} />
                      Onayla
                    </Button>
                  ) : (
                    <Button
                      variant="quiet"
                      onClick={(event) => event.stopPropagation()}
                      className="p-2"
                      aria-label="Detay"
                    >
                      <Icon name="chevR" size={18} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="p-12 text-center text-ink-3">Sonuç bulunamadı.</div>
          )}
        </div>
      </div>

      {selected && (
        <StudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onApprove={approve}
          onReject={reject}
          onUpdate={update}
          onPay={pay}
        />
      )}
    </div>
  );
}

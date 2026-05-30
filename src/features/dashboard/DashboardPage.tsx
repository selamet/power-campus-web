import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Avatar, Badge, Button, Icon } from '@/components/ui';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { selectStudents } from '@/features/students/studentsSlice';
import { useStudentActions } from '@/features/students/useStudentActions';
import { StudentDrawer } from '@/features/students/components/StudentDrawer';
import { useShellContext } from '@/layout/shellContext';
import { MOCK_ACTIVITY } from '@/mocks/data';
import { paths } from '@/routes/paths';
import type { Student } from '@/types/domain';
import { cn } from '@/utils/cn';
import { formatDate, formatMoney } from '@/utils/format';
import { MetricCard } from './components/MetricCard';

const TODAY_LABEL = new Date('2026-05-30').toLocaleDateString('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function DashboardPage() {
  const navigate = useNavigate();
  const { openAddFlow } = useShellContext();
  const user = useAppSelector(selectCurrentUser);
  const students = useAppSelector(selectStudents);
  const { approve, reject } = useStudentActions();
  const [selected, setSelected] = useState<Student | null>(null);

  const pending = useMemo(() => students.filter((s) => s.status === 'pending'), [students]);
  const active = useMemo(() => students.filter((s) => s.status === 'active'), [students]);
  const upcoming = useMemo(
    () =>
      students
        .filter((s) => s.next)
        .sort((a, b) => (a.next ?? '').localeCompare(b.next ?? ''))
        .slice(0, 4),
    [students],
  );

  return (
    <div className="stagger mx-auto flex max-w-[1240px] flex-col gap-6">
      {/* Hero greeting */}
      <div className="card relative overflow-hidden p-0">
        <div
          className="relative overflow-hidden px-7 py-[26px] text-white"
          style={{ background: 'linear-gradient(120deg, hsl(4 74% 50%), hsl(8 70% 56%))' }}
        >
          <div
            className="absolute -top-[140px] -right-[60px] size-[300px] rounded-full"
            style={{ border: '44px solid hsl(0 0% 100% / .08)' }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-xs tracking-[0.1em] opacity-85">
                {(user?.branch ?? 'POWER AKADEMİ').toUpperCase()} · {TODAY_LABEL.toUpperCase()}
              </span>
              <h2 className="m-0 text-[26px] font-bold tracking-[-0.02em]">
                Merhaba {(user?.name ?? 'Power').split(' ')[0]} 👋
              </h2>
              <p className="m-0 text-[14.5px] opacity-90">
                {pending.length > 0 ? (
                  <>
                    <strong>{pending.length} kayıt</strong> onayını bekliyor.
                  </>
                ) : (
                  'Bekleyen onay yok, harika!'
                )}
              </p>
            </div>
            <Button
              onClick={openAddFlow}
              className="self-center bg-white font-semibold text-accent-strong"
            >
              <Icon name="plus" size={18} />
              Yeni Öğrenci
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <MetricCard icon="users" label="Toplam Öğrenci" value="1.248" delta="+12%" accent />
        <MetricCard icon="graduation" label="Aktif Kayıt" value={active.length * 124} delta="+8%" />
        <MetricCard
          icon="clock"
          label="Bekleyen Onay"
          value={pending.length}
          delta={pending.length ? 'yeni' : '0'}
          deltaKind="warn"
        />
        <MetricCard icon="wallet" label="Bu Ay Tahsilat" value="₺412K" delta="+23%" />
      </div>

      {/* Two columns */}
      <div className="dash-cols grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Pending approvals */}
        <div className="card p-[22px]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="clipboard" size={19} className="text-accent" />
              <h3 className="m-0 text-[16.5px] font-bold">Onay Bekleyenler</h3>
              <Badge kind="warn">{pending.length}</Badge>
            </div>
            <Button
              variant="quiet"
              onClick={() => navigate(paths.students)}
              className="text-[13px]"
            >
              Tümü
              <Icon name="arrowR" size={15} />
            </Button>
          </div>

          {pending.length === 0 && <EmptyState message="Bekleyen onay yok." />}

          <div className="flex flex-col gap-3">
            {pending.map((student) => (
              <div
                key={student.id}
                className="approve-row flex items-center gap-3.5 rounded-xl border border-line bg-surface-2 p-3.5 transition-all duration-200"
              >
                <Avatar name={student.name} size={42} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[14.5px] font-semibold">{student.name}</span>
                    {student.source === 'davet' && (
                      <Badge kind="accent">
                        <Icon name="link" size={11} />
                        davet
                      </Badge>
                    )}
                  </div>
                  <span className="text-[12.5px] text-ink-3">
                    {student.lang} · {student.level.split(' — ')[0]} · {student.course}
                  </span>
                </div>
                <div className="approve-actions flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setSelected(student)}
                    className="px-3 py-[9px] text-[13px]"
                  >
                    İncele
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => approve(student.id)}
                    className="px-3.5 py-[9px] text-[13px]"
                  >
                    <Icon name="check" size={16} />
                    Onayla
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <div className="card p-[22px]">
            <h3 className="mb-4 text-[16.5px] font-bold">Son Hareketler</h3>
            <div className="flex flex-col">
              {MOCK_ACTIVITY.map((activity, index) => (
                <div
                  key={`${activity.who}-${index}`}
                  className={cn(
                    'flex items-start gap-3 py-[11px]',
                    index < MOCK_ACTIVITY.length - 1 && 'border-b border-line',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-[9px]',
                      activity.kind === 'ok' && 'bg-ok-soft text-ok',
                      activity.kind === 'accent' && 'bg-accent-soft text-accent',
                      activity.kind === 'neutral' && 'bg-bg-2 text-ink-2',
                    )}
                  >
                    <Icon name={activity.icon} size={16} />
                  </div>
                  <div className="flex flex-1 flex-col gap-px">
                    <span className="text-[13.5px] leading-[1.4]">
                      <strong className="font-semibold">{activity.who}</strong> {activity.what}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-3">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-[22px]">
            <h3 className="mb-3.5 text-[16.5px] font-bold">Yaklaşan Ödemeler</h3>
            <div className="flex flex-col gap-2">
              {upcoming.map((student) => (
                <div key={student.id} className="flex items-center gap-3 py-2">
                  <Avatar name={student.name} size={32} />
                  <div className="flex flex-1 flex-col">
                    <span className="text-[13.5px] font-semibold">{student.name}</span>
                    <span className="font-mono text-[11px] text-ink-3">
                      {formatDate(student.next)}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {formatMoney(student.fee - student.paid)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <StudentDrawer
          student={selected}
          onClose={() => setSelected(null)}
          onApprove={approve}
          onReject={reject}
        />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-8 text-ink-3">
      <div className="flex size-12 items-center justify-center rounded-[14px] bg-ok-soft text-ok">
        <Icon name="checkCircle" size={26} />
      </div>
      <span className="text-sm">{message}</span>
    </div>
  );
}

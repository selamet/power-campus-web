import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Avatar, Badge, Button, Icon } from '@/components/ui';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { selectStudents } from '@/features/students/studentsSlice';
import { useStudentActions } from '@/features/students/useStudentActions';
import { useShellContext } from '@/layout/shellContext';
import { paths, studentLink } from '@/routes/paths';
import type { ActivityItem } from '@/types/domain';
import { cn } from '@/utils/cn';
import { formatDate, formatMoney, levelCode } from '@/utils/format';
import {
  dashboardApi,
  type DashboardStats,
  type MonthlyPoint,
  type OverdueItem,
} from './dashboardApi';
import { CourseMix } from './components/CourseMix';
import { FinancePulse } from './components/FinancePulse';
import { MetricCard } from './components/MetricCard';
import { MonthlyChart } from './components/MonthlyChart';
import { OverdueCard } from './components/OverdueCard';

const TODAY = new Date();
const TODAY_LABEL = TODAY.toLocaleDateString('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const THIS_MONTH = TODAY.toISOString().slice(0, 7);

export function DashboardPage() {
  const navigate = useNavigate();
  const { openAddFlow } = useShellContext();
  const user = useAppSelector(selectCurrentUser);
  const students = useAppSelector(selectStudents);
  const { approve } = useStudentActions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [overdue, setOverdue] = useState<OverdueItem[]>([]);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);

  useEffect(() => {
    dashboardApi.stats().then(setStats).catch(() => {});
    dashboardApi.activity().then(setActivity).catch(() => {});
    dashboardApi.overdue().then(setOverdue).catch(() => {});
    dashboardApi.monthly().then(setMonthly).catch(() => {});
  }, []);

  const pending = useMemo(() => students.filter((s) => s.status === 'pending'), [students]);
  const upcoming = useMemo(
    () =>
      students
        .filter((s) => s.next)
        .sort((a, b) => (a.next ?? '').localeCompare(b.next ?? ''))
        .slice(0, 4),
    [students],
  );
  const joinedThisMonth = useMemo(
    () => students.filter((s) => s.joined?.startsWith(THIS_MONTH)).length,
    [students],
  );

  // One-line agenda for the hero: approvals, today's dues, overdue payments.
  const agenda: { count: number; label: string }[] = [];
  if (pending.length > 0) agenda.push({ count: pending.length, label: 'kayıt onay bekliyor' });
  if (stats && stats.dueToday > 0)
    agenda.push({ count: stats.dueToday, label: 'taksit vadesi bugün' });
  if (stats && stats.overdueCount > 0)
    agenda.push({ count: stats.overdueCount, label: 'ödeme gecikmiş durumda' });

  const collectOverdue = (studentId: string) => {
    const student = students.find((item) => item.id === studentId);
    navigate(studentLink(student ?? { id: studentId }));
  };

  const inviteTotal = (stats?.invitesPending ?? 0) + (stats?.invitesCompleted ?? 0);
  const inviteRate = inviteTotal > 0 ? Math.round(((stats?.invitesCompleted ?? 0) / inviteTotal) * 100) : 0;

  return (
    <div className="stagger mx-auto flex max-w-[1240px] flex-col gap-5">
      {/* Hero greeting */}
      <div className="card relative overflow-hidden p-0">
        <div className="grain mesh-hero relative overflow-hidden px-7 py-[26px] text-white">
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
                Merhaba{' '}
                <span className="font-script text-[38px] font-semibold leading-none">
                  {(user?.name ?? 'Power').split(' ')[0]}
                </span>{' '}
                👋
              </h2>
              <p className="m-0 text-[14.5px] opacity-90">
                {agenda.length > 0
                  ? agenda.map((item, index) => (
                      <span key={item.label}>
                        {index > 0 && ' · '}
                        <strong>{item.count}</strong> {item.label}
                      </span>
                    ))
                  : 'Her şey yolunda, bekleyen işin yok. Harika!'}
              </p>
            </div>
            <Button
              onClick={openAddFlow}
              className="self-center bg-accent font-semibold text-accent-contrast"
            >
              <Icon name="plus" size={18} />
              Yeni Öğrenci
            </Button>
          </div>
        </div>
      </div>

      {/* Bento: finance pulse + KPI tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2 xl:row-span-2">
          <FinancePulse stats={stats} />
        </div>
        <MetricCard
          icon="users"
          label="Toplam Öğrenci"
          value={stats?.totalStudents ?? '—'}
          delta={joinedThisMonth > 0 ? `+${joinedThisMonth} bu ay` : undefined}
          accent
        />
        <MetricCard icon="graduation" label="Aktif Kayıt" value={stats?.activeStudents ?? '—'} />
        <MetricCard
          icon="clock"
          label="Bekleyen Onay"
          value={stats?.pendingApprovals ?? pending.length}
          delta={(stats?.pendingApprovals ?? pending.length) > 0 ? 'yeni' : undefined}
          deltaKind="warn"
        />
        <MetricCard
          icon="wallet"
          label="Gecikmiş Ödeme"
          value={stats?.overdueCount ?? '—'}
          delta={stats && stats.overdueTotal > 0 ? formatMoney(stats.overdueTotal) : undefined}
          deltaKind="warn"
        />
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyChart data={monthly} />
        </div>
        <CourseMix students={students} />
      </div>

      {/* Work queues */}
      <div className="dash-cols grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
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
                      {student.lang} · {levelCode(student.level)} · {student.course}
                    </span>
                  </div>
                  <div className="approve-actions flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => navigate(studentLink(student))}
                      className="px-3 py-[9px] text-[13px]"
                    >
                      İncele
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() =>
                        student.fee > 0 ? approve(student.id) : navigate(studentLink(student))
                      }
                      className="px-3.5 py-[9px] text-[13px]"
                    >
                      <Icon name="check" size={16} />
                      {student.fee > 0 ? 'Onayla' : 'Planı Belirle'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <OverdueCard items={overdue} onCollect={collectOverdue} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <div className="card p-[22px]">
            <h3 className="mb-3.5 text-[16.5px] font-bold">Yaklaşan Ödemeler</h3>
            <div className="flex flex-col gap-2">
              {upcoming.length === 0 && (
                <span className="py-2 text-[13px] text-ink-3">Yaklaşan ödeme yok.</span>
              )}
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

          {/* Invite funnel */}
          <div className="card p-[22px]">
            <div className="mb-3.5 flex items-center gap-2">
              <Icon name="link" size={19} className="text-accent" />
              <h3 className="m-0 text-[16.5px] font-bold">Davetler</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <FunnelStat value={stats?.invitesPending ?? '—'} label="Bekleyen" />
              <FunnelStat value={stats?.invitesCompleted ?? '—'} label="Tamamlanan" />
              <FunnelStat value={stats ? `%${inviteRate}` : '—'} label="Dönüşüm" accent />
            </div>
          </div>

          {/* Activity timeline */}
          <div className="card p-[22px]">
            <h3 className="mb-4 text-[16.5px] font-bold">Son Hareketler</h3>
            <div className="relative flex flex-col">
              {activity.length === 0 && (
                <span className="py-2 text-[13px] text-ink-3">Henüz hareket yok.</span>
              )}
              {activity.length > 1 && (
                <div className="absolute bottom-5 left-4 top-5 w-px bg-line" aria-hidden />
              )}
              {activity.map((item, index) => (
                <div key={`${item.who}-${index}`} className="flex items-start gap-3 py-[11px]">
                  <div
                    className={cn(
                      'relative flex size-8 shrink-0 items-center justify-center rounded-[9px]',
                      item.kind === 'ok' && 'bg-ok-soft text-ok',
                      item.kind === 'accent' && 'bg-accent-soft text-accent',
                      item.kind === 'neutral' && 'bg-bg-2 text-ink-2',
                    )}
                  >
                    <Icon name={item.icon} size={16} />
                  </div>
                  <div className="flex flex-1 flex-col gap-px">
                    <span className="text-[13.5px] leading-[1.4]">
                      <strong className="font-semibold">{item.who}</strong> {item.what}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-3">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelStat({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-surface-2 p-3">
      <span
        className={cn('font-mono text-[18px] font-bold tabular-nums', accent && 'text-accent')}
      >
        {value}
      </span>
      <span className="text-[11.5px] text-ink-3">{label}</span>
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

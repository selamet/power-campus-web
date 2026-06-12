import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatMoney } from '@/utils/format';
import type { DashboardStats } from '../dashboardApi';
import { useCountUp } from './useCountUp';

/** Wide finance card: collection progress plus outstanding/overdue figures. */
export function FinancePulse({ stats }: { stats: DashboardStats | null }) {
  const collected = useCountUp(stats?.totalCollected ?? 0);
  const billed = (stats?.totalCollected ?? 0) + (stats?.outstanding ?? 0);
  const ratio = billed > 0 ? (stats?.totalCollected ?? 0) / billed : 0;

  return (
    <div className="card mesh-aurora relative flex h-full flex-col gap-5 overflow-hidden p-6">
      <div className="flex items-center gap-2">
        <Icon name="wallet" size={19} className="text-accent" />
        <h3 className="m-0 text-[16.5px] font-bold">Finans Nabzı</h3>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[34px] font-bold leading-none tracking-[-0.02em] tabular-nums">
              {formatMoney(collected)}
            </span>
            <span className="text-[13px] font-medium text-ink-2">Toplam Tahsilat</span>
          </div>
          <span className="font-mono text-[13px] font-bold text-accent tabular-nums">
            %{Math.round(ratio * 100)}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-bg-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-[hsl(8_80%_55%)] transition-[width] duration-700"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
        <span className="text-[11.5px] text-ink-3">
          Beklenen toplam {formatMoney(billed)} üzerinden
        </span>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-3">
        <PulseStat
          label="Bekleyen Alacak"
          value={stats ? formatMoney(stats.outstanding) : '—'}
        />
        <PulseStat
          label="Gecikmiş Tutar"
          value={stats ? formatMoney(stats.overdueTotal) : '—'}
          tone={stats && stats.overdueTotal > 0 ? 'accent' : undefined}
        />
        <PulseStat
          label="Bugün Vadesi Gelen"
          value={stats ? `${stats.dueToday} taksit` : '—'}
          tone={stats && stats.dueToday > 0 ? 'warn' : undefined}
        />
      </div>
    </div>
  );
}

function PulseStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'accent' | 'warn';
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-surface-2 p-3">
      <span
        className={cn(
          'font-mono text-[15px] font-bold tabular-nums',
          tone === 'accent' && 'text-accent',
          tone === 'warn' && 'text-warn-ink',
        )}
      >
        {value}
      </span>
      <span className="text-[11.5px] leading-tight text-ink-3">{label}</span>
    </div>
  );
}

import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  delta?: string;
  deltaKind?: 'ok' | 'warn';
  accent?: boolean;
}

/** Single KPI tile shown in the dashboard metrics grid. */
export function MetricCard({
  icon,
  label,
  value,
  delta,
  deltaKind = 'ok',
  accent,
}: MetricCardProps) {
  return (
    <div className="card relative flex flex-col gap-3.5 overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex size-[42px] items-center justify-center rounded-xl',
            accent ? 'bg-accent-soft text-accent' : 'bg-bg-2 text-ink-2',
          )}
        >
          <Icon name={icon} size={21} />
        </div>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-[9px] py-1 font-mono text-[11px] font-bold',
              deltaKind === 'ok' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn-ink',
            )}
          >
            <Icon name="trend" size={12} />
            {delta}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-[3px]">
        <span className="font-mono text-[30px] font-bold tracking-[-0.02em] tabular-nums">
          {value}
        </span>
        <span className="text-[13.5px] font-medium text-ink-2">{label}</span>
      </div>
    </div>
  );
}

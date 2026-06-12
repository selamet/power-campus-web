import { Icon } from '@/components/ui';
import { formatMoney } from '@/utils/format';
import type { MonthlyPoint } from '../dashboardApi';

/** Last six months of expected vs collected totals as grouped bars. */
export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  const max = Math.max(1, ...data.flatMap((point) => [point.expected, point.collected]));
  const height = (value: number) => (value > 0 ? `${Math.max(4, (value / max) * 100)}%` : '0');

  return (
    <div className="card flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="trend" size={19} className="text-accent" />
          <h3 className="m-0 text-[16.5px] font-bold">Aylık Tahsilat</h3>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-[3px] bg-line" />
            Beklenen
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-[3px] bg-accent" />
            Tahsil edilen
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <span className="py-6 text-center text-[13px] text-ink-3">Henüz veri yok.</span>
      ) : (
        <div className="flex h-[140px] items-stretch gap-2 sm:gap-3">
          {data.map((point) => (
            <div key={point.month} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="flex w-full flex-1 items-end justify-center gap-1"
                title={`${point.label} · Beklenen ${formatMoney(point.expected)} · Tahsil ${formatMoney(point.collected)}`}
              >
                <div
                  className="w-[38%] max-w-[18px] rounded-t-[5px] bg-line"
                  style={{ height: height(point.expected) }}
                />
                <div
                  className="w-[38%] max-w-[18px] rounded-t-[5px] bg-gradient-to-t from-accent-strong to-accent"
                  style={{ height: height(point.collected) }}
                />
              </div>
              <span className="font-mono text-[10.5px] text-ink-3">{point.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

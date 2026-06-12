import { Avatar, Badge, Button, Icon } from '@/components/ui';
import { formatDate, formatMoney } from '@/utils/format';
import type { OverdueItem } from '../dashboardApi';

interface OverdueCardProps {
  items: OverdueItem[];
  /** Opens the payment flow for the given public student code. */
  onCollect: (studentId: string) => void;
}

/** Unpaid installments past their due date, with one-click collection. */
export function OverdueCard({ items, onCollect }: OverdueCardProps) {
  return (
    <div className="card p-[22px]">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="clock" size={19} className="text-accent" />
        <h3 className="m-0 text-[16.5px] font-bold">Gecikmiş Ödemeler</h3>
        {items.length > 0 && <Badge kind="accent">{items.length}</Badge>}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 py-6 text-ink-3">
          <div className="flex size-12 items-center justify-center rounded-[14px] bg-ok-soft text-ok">
            <Icon name="checkCircle" size={26} />
          </div>
          <span className="text-sm">Gecikmiş ödeme yok.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div
              key={`${item.studentId}-${item.sequence}`}
              className="flex items-center gap-3 rounded-xl border border-accent-soft-border bg-accent-soft/50 p-3"
            >
              <Avatar name={item.name} size={36} />
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-[13.5px] font-semibold">{item.name}</span>
                <span className="font-mono text-[11px] text-accent">
                  {item.sequence}. taksit · {formatDate(item.dueDate)}
                </span>
              </div>
              <span className="font-mono text-sm font-bold tabular-nums">
                {formatMoney(item.amount)}
              </span>
              <Button
                variant="primary"
                onClick={() => onCollect(item.studentId)}
                className="px-3 py-[8px] text-[12.5px]"
              >
                Ödeme Al
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

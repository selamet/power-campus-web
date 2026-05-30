import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';
import { Icon } from './Icon';
import { inputBase } from './inputs';

interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseIso = (iso: string): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
/** Monday-first weekday index (0 = Mon ... 6 = Sun). */
const mondayIndex = (jsDay: number) => (jsDay + 6) % 7;

/** Token-styled date field with a custom calendar popover; no native date input. */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Tarih seç',
  min,
  max,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const today = new Date();
  const [view, setView] = useState(() => selected ?? today);
  const ref = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // Keep the visible month in sync when an external value arrives.
  useEffect(() => {
    if (selected) setView(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = mondayIndex(new Date(year, month, 1).getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minDate = parseIso(min ?? '');
  const maxDate = parseIso(max ?? '');

  const isDisabled = (d: Date) =>
    (minDate && d < minDate) || (maxDate && d > maxDate) || false;
  const sameDay = (a: Date | null, b: Date) =>
    !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const moveMonth = (delta: number) => setView(new Date(year, month + delta, 1));

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          inputBase,
          'flex cursor-pointer items-center justify-between text-left',
          !selected && 'text-ink-3',
          open && 'border-accent shadow-[0_0_0_4px_hsl(var(--accent-h)_var(--accent-s)_50%/0.14)]',
        )}
      >
        <span>{selected ? formatDate(value) : placeholder}</span>
        <Icon name="calendar" size={17} className="shrink-0 text-ink-3" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={labelId}
          className="anim-scale-in card absolute z-50 mt-2 w-[296px] origin-top p-3 shadow-float"
        >
          {/* header */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="flex size-8 items-center justify-center rounded-token-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Önceki ay"
            >
              <Icon name="chevL" size={18} />
            </button>
            <span className="text-sm font-semibold text-ink">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="flex size-8 items-center justify-center rounded-token-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Sonraki ay"
            >
              <Icon name="chevR" size={18} />
            </button>
          </div>

          {/* weekday header */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className="flex h-7 items-center justify-center font-mono text-[10.5px] font-bold uppercase tracking-[0.04em] text-ink-3"
              >
                {w}
              </span>
            ))}
          </div>

          {/* day grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} />;
              const date = new Date(year, month, day);
              const disabled = isDisabled(date);
              const isSelected = sameDay(selected, date);
              const isToday = sameDay(today, date);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(toIso(year, month, day));
                    setOpen(false);
                  }}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-token-sm text-[13.5px] font-medium tabular-nums transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-30',
                    isSelected
                      ? 'bg-accent font-semibold text-accent-contrast'
                      : 'text-ink hover:bg-surface-2',
                    !isSelected && isToday && 'font-bold text-accent ring-1 ring-accent-soft-border',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* footer */}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                onChange(toIso(t.getFullYear(), t.getMonth(), t.getDate()));
                setOpen(false);
              }}
              className="rounded-token-sm px-2.5 py-1.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft"
            >
              Bugün
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="rounded-token-sm px-2.5 py-1.5 text-[12.5px] font-medium text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

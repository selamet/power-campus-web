import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type BadgeKind = 'ok' | 'warn' | 'accent' | 'info' | 'neutral';

interface BadgeProps {
  kind?: BadgeKind;
  dot?: boolean;
  children: ReactNode;
}

const KIND_CLASSES: Record<BadgeKind, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn-ink',
  accent: 'bg-accent-soft text-accent-strong dark:text-[hsl(var(--accent-h)_80%_75%)]',
  info: 'bg-accent-2-soft text-accent-2-strong dark:text-[hsl(var(--accent-2-h)_80%_78%)]',
  neutral: 'bg-bg-2 text-ink-2 border-line',
};

/** Pill-shaped status label, optionally prefixed with a colored dot. */
export function Badge({ kind = 'neutral', dot, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] rounded-full border border-transparent px-[9px] py-1 font-mono text-[11px] font-bold tracking-[0.03em] whitespace-nowrap',
        KIND_CLASSES[kind],
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'ghost' | 'soft' | 'quiet';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children?: ReactNode;
}

const BASE =
  'group/btn relative inline-flex select-none cursor-pointer items-center justify-center gap-[9px] overflow-hidden whitespace-nowrap font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.2,0.8,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-accent/55 focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none [&_svg]:size-[17px] [&_svg]:relative [&_svg]:transition-transform [&_svg]:duration-200';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-accent to-accent-strong text-accent-contrast shadow-accent ring-1 ring-inset ring-white/15 hover:-translate-y-px hover:shadow-[0_12px_28px_-8px_hsl(var(--accent-h)_74%_50%/0.6)] before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/25 before:to-transparent before:opacity-70 before:pointer-events-none',
  ghost:
    'border border-line-strong bg-surface/60 text-ink-2 backdrop-blur-sm hover:-translate-y-px hover:border-ink-3 hover:bg-surface-2 hover:text-ink hover:shadow-card',
  soft: 'border border-accent-soft-border bg-accent-soft text-accent-strong hover:-translate-y-px hover:shadow-card dark:text-[hsl(var(--accent-h)_80%_75%)]',
  quiet: 'bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'rounded-token-sm px-[18px] py-[11px] text-sm',
  lg: 'rounded-token px-6 py-[14px] text-[15px]',
};

/** Primary action button with brand variants, sizes and a premium sheen. */
export function Button({
  variant = 'ghost',
  size = 'md',
  block = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const sizing = variant === 'quiet' ? 'rounded-token-sm px-3 py-[9px] text-sm' : SIZES[size];
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], sizing, block && 'w-full', className)}
      {...rest}
    >
      <span className="relative z-[1] inline-flex items-center gap-[9px]">{children}</span>
    </button>
  );
}

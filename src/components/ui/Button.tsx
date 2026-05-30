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
  'inline-flex select-none cursor-pointer items-center justify-center gap-[9px] whitespace-nowrap font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-200 active:translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none [&_svg]:size-[17px]';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-contrast shadow-accent hover:bg-accent-strong hover:-translate-y-px',
  ghost:
    'border border-line-strong bg-transparent text-ink-2 hover:border-ink-3 hover:bg-surface-2 hover:text-ink',
  soft: 'border border-accent-soft-border bg-accent-soft text-accent-strong hover:-translate-y-px hover:shadow-card dark:text-[hsl(var(--accent-h)_80%_75%)]',
  quiet: 'bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'rounded-token-sm px-[18px] py-[11px] text-sm',
  lg: 'rounded-token px-6 py-[14px] text-[15px]',
};

/** Primary action button with brand variants and sizes. */
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
      {children}
    </button>
  );
}

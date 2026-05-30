import { Fragment } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface StepsProps {
  steps: readonly string[];
  current: number;
}

/** Horizontal numbered progress indicator with completed/active states. */
export function Steps({ steps, current }: StepsProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <Fragment key={step}>
            <div className="flex shrink-0 flex-col items-center gap-[7px]">
              <div
                className={cn(
                  'flex size-[34px] items-center justify-center rounded-full font-mono text-sm font-bold transition-all duration-300',
                  done && 'bg-accent text-accent-contrast',
                  active && 'border-2 border-accent bg-accent-soft text-accent-strong',
                  !done && !active && 'border-2 border-transparent bg-bg-2 text-ink-3',
                )}
              >
                {done ? <Icon name="check" size={17} /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-[11.5px] font-semibold whitespace-nowrap',
                  active || done ? 'text-ink' : 'text-ink-3',
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mb-[22px] h-0.5 min-w-4 flex-1 mx-1.5 transition-colors duration-300',
                  done ? 'bg-accent' : 'bg-line-strong',
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

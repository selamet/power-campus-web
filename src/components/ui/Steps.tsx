import { Fragment } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface StepsProps {
  steps: readonly string[];
  current: number;
  /**
   * Fractional completion (0–1) of the current step, used to partially fill
   * the connector after the active node. Omit to keep the connector empty
   * until the step is completed.
   */
  progress?: number;
  /** Give each step its own hue (red → indigo → green) instead of uniform accent. */
  colorful?: boolean;
}

const STEP_HUES = ['var(--accent)', 'var(--accent-2)', 'var(--ok)'];

/** Horizontal numbered progress indicator with completed/active states. */
export function Steps({ steps, current, progress = 0, colorful = false }: StepsProps) {
  const hue = (index: number) => STEP_HUES[index % STEP_HUES.length];
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
                  done && !colorful && 'bg-accent text-accent-contrast',
                  active && !colorful && 'border-2 border-accent bg-accent-soft text-accent-strong',
                  done && colorful && 'text-accent-contrast',
                  active && colorful && 'border-2',
                  !done && !active && 'border-2 border-transparent bg-bg-2 text-ink-3',
                )}
                style={
                  colorful && done
                    ? { background: hue(index) }
                    : colorful && active
                      ? {
                          borderColor: hue(index),
                          color: hue(index),
                          background: `color-mix(in srgb, ${hue(index)} 12%, transparent)`,
                        }
                      : undefined
                }
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
              <div className="relative mx-1.5 mb-[22px] h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-line-strong">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500 ease-out', !colorful && 'bg-accent')}
                  style={{
                    width: `${index < current ? 100 : active ? Math.min(100, Math.max(0, progress * 100)) : 0}%`,
                    ...(colorful ? { background: `linear-gradient(90deg, ${hue(index)}, ${hue(index + 1)})` } : undefined),
                  }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

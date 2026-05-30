import { cn } from '@/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Accessible on/off switch. */
export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full border-none p-[3px] transition-colors duration-200',
        checked ? 'justify-end bg-accent' : 'justify-start bg-line-strong',
      )}
    >
      <span className="size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-200" />
    </button>
  );
}

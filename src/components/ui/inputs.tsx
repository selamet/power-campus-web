import {
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

/** Shared styling for text inputs, selects and textareas. */
export const inputBase =
  'field-focus w-full rounded-token-sm border-[1.5px] border-line-strong bg-surface px-[13px] py-[11px] font-sans text-[14.5px] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-ink-3 disabled:bg-bg-2 disabled:text-ink-3';

interface FieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  icon?: string;
  full?: boolean;
  children: ReactNode;
}

/** Labeled form field wrapper with optional icon, required marker and hint. */
export function Field({ label, required, hint, icon, full, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-[7px]', full && 'col-span-full')}>
      {label && (
        <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2">
          {icon && <Icon name={icon} size={14} />}
          {label}
          {required && <span className="text-accent">*</span>}
        </label>
      )}
      {children}
      {hint && <span className="text-[11.5px] text-ink-3">{hint}</span>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, 'select-chevron cursor-pointer', className)} {...props}>
      {children}
    </select>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className={cn(inputBase, 'pr-[42px]', className)}
        type={show ? 'text' : 'password'}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        aria-label="Şifreyi göster"
        className="absolute top-1/2 right-1.5 flex -translate-y-1/2 cursor-pointer border-none bg-none p-2 text-ink-3"
      >
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';
import { useAnchoredPosition } from './useAnchoredPosition';

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

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Read the `<option>` children so call sites keep their native-select markup. */
function readOptions(children: ReactNode): SelectOption[] {
  const items: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    const label = typeof props.children === 'string' ? props.children : String(props.children ?? '');
    items.push({
      value: props.value !== undefined ? String(props.value) : label,
      label,
      disabled: props.disabled,
    });
  });
  return items;
}

const trLower = (s: string) => s.toLocaleLowerCase('tr');

/**
 * Token-styled combobox with a custom, portaled dropdown — the native option
 * list can't be styled, so we render our own. The field is typeable: it filters
 * the options and also accepts a free-text value not in the list. Keeps the
 * `value`/`onChange`/`<option>` API of a native select (onChange receives a
 * synthetic `{ target: { value } }`).
 */
export function Select({
  className,
  children,
  value,
  onChange,
  disabled,
  id,
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const options = readOptions(children);
  const current = value != null ? String(value) : '';
  const placeholderOption = options.find((option) => option.value === '');
  const selectable = options.filter((option) => option.value !== '');
  const selected = options.find((option) => option.value === current);
  // Custom (typed) values aren't in the option list; fall back to the raw value.
  const selectedLabel = selected ? (selected.value === '' ? '' : selected.label) : current;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? selectable.filter((option) => trLower(option.label).includes(trLower(query)))
    : selectable;
  const pos = useAnchoredPosition(open, inputRef, Math.min(filtered.length * 40 + 12, 288));

  const commit = (val: string) => {
    onChange?.({ target: { value: val } } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    setQuery('');
  };
  const choose = (option: SelectOption) => {
    if (!option.disabled) commit(option.value);
  };
  // On blur / outside click: keep a typed value (free text) or an exact match.
  const commitTyped = () => {
    const typed = query.trim();
    if (!typed) return setOpen(false);
    const exact = selectable.find((option) => trLower(option.label) === trLower(typed));
    commit(exact ? exact.value : typed);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!inputRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        commitTyped();
      }
    };
    // Close when the page reflows under the panel — but scrolling the option
    // list itself must not dismiss it.
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return setOpen(false);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (filtered.length ? (i + dir + filtered.length) % filtered.length : 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && filtered[active]) choose(filtered[active]);
      else commitTyped();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          disabled={disabled}
          value={open ? query : selectedLabel}
          placeholder={placeholderOption?.label ?? ''}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(inputBase, 'cursor-text pr-[38px]', className)}
        />
        <Icon
          name="chevDown"
          size={17}
          className={cn(
            'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </div>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{ position: 'fixed', left: pos.left, top: pos.top, width: pos.width }}
            className={cn(
              'anim-scale-in card z-[100] max-h-[280px] overflow-y-auto p-1.5 shadow-float',
              pos.openUp ? '-translate-y-full origin-bottom' : 'origin-top',
            )}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[13px] text-ink-3">
                {query.trim() ? `“${query.trim()}” kullanılacak` : 'Seçenek yok'}
              </div>
            ) : (
              filtered.map((option, i) => {
                const isSelected = option.value === current;
                return (
                  <button
                    key={`${option.value}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(option)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-token-sm px-3 py-2 text-left text-[14px] transition-colors',
                      'disabled:cursor-not-allowed disabled:opacity-40',
                      isSelected
                        ? 'bg-accent font-semibold text-accent-contrast'
                        : i === active
                          ? 'bg-surface-2 text-ink'
                          : 'text-ink',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Icon name="check" size={15} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </div>
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

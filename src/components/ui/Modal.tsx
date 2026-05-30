import { useEffect, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  pad?: boolean;
}

/** Centered modal dialog with backdrop, Escape-to-close and click-outside. */
export function Modal({ open, onClose, children, width = 520, pad = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onMouseDown={onClose}
      className="anim-fade-in fixed inset-0 z-[150] flex items-center justify-center bg-[hsl(20_30%_8%/0.5)] p-5 backdrop-blur-[4px]"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'anim-scale-in card max-h-[92vh] w-full overflow-auto shadow-float',
          pad && 'p-[26px]',
        )}
        style={{ maxWidth: width }}
      >
        {children}
      </div>
    </div>
  );
}

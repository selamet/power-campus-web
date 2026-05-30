import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { ToastContext, type ShowToast } from './ToastContext';

interface ToastItem {
  id: number;
  message: string;
  icon: string;
}

/** Provides the toast trigger and renders the toast stack. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback<ShowToast>((message, icon = 'check') => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { id, message, icon }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-wrap">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id}>
            <Icon name={toast.icon} size={18} style={{ color: 'var(--accent)' }} />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

import { createContext } from 'react';

export type ShowToast = (message: string, icon?: string) => void;

/** Imperative toast trigger shared via context. */
export const ToastContext = createContext<ShowToast>(() => {});

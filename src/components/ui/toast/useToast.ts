import { useContext } from 'react';
import { ToastContext } from './ToastContext';

/** Returns the imperative `showToast(message, icon?)` function. */
export const useToast = () => useContext(ToastContext);

import { clsx, type ClassValue } from 'clsx';

/** Conditionally joins Tailwind class names. */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

import { useEffect, useState, type ChangeEvent } from 'react';
import { RELATIONS } from '@/constants/options';

export const FORM_GRID = 'stagger form-grid grid grid-cols-1 gap-3.5 sm:grid-cols-2';

export type FieldUpdater<T> = (
  key: keyof T,
) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;

/** Fields common to both registration forms. */
export interface PersonCoreForm {
  name: string;
  tckn: string;
  birth: string;
  gender: string;
  city: string;
  addr: string;
  email: string;
  phone: string;
  cName: string;
  cRelation: string;
  cPhone: string;
}

export const PERSON_FORM_DEFAULTS: PersonCoreForm = {
  name: '',
  tckn: '',
  birth: '',
  gender: '',
  city: 'İstanbul',
  addr: '',
  email: '',
  phone: '',
  cName: '',
  cRelation: RELATIONS[0],
  cPhone: '',
};

/** Step navigation + form state shared by every multi-step student form. */
export function useStepForm<T>(initial: T, stepCount: number) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<T>(initial);

  // Each step starts at the top instead of inheriting the previous scroll.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const update: FieldUpdater<T> = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const patch = (partial: Partial<T>) => setForm((prev) => ({ ...prev, ...partial }));
  const next = () => setStep((s) => Math.min(s + 1, stepCount - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return { step, form, setForm, update, patch, next, back, isLast: step === stepCount - 1 };
}

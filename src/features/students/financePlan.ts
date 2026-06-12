import { CUSTOM_PLAN, PER_TERM_PLAN } from '@/constants/options';

/**
 * Finance math shared by the manual registration form and the approval modal:
 * totals are derived from terms × per-term price, then discount and the
 * opening payment are applied. Mirrors the backend schedule builder.
 */

export type DiscountType = 'percent' | 'amount';

export interface FinanceInput {
  terms: number;
  termFee: number;
  discount: number;
  discountType: DiscountType;
  paidNow: number;
}

export function computeFinance({ terms, termFee, discount, discountType, paidNow }: FinanceInput) {
  const fee = terms * termFee;
  const discountValue =
    discountType === 'percent'
      ? Math.round((fee * Math.min(discount, 100)) / 100)
      : Math.min(discount, fee);
  const net = Math.max(0, fee - discountValue);
  const paid = Math.min(paidNow, net);
  return { fee, discountValue, net, paidNow: paid, remaining: net - paid };
}

/** ISO date `months` months after `iso`, day clamped like the backend does. */
export function addMonthsIso(iso: string, months: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const index = month - 1 + months;
  const targetYear = year + Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  const clampedDay = Math.min(day, new Date(targetYear, targetMonth, 0).getDate());
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

/**
 * Equal installments over the remaining balance, mirroring the backend's
 * schedule builder (rounding remainder goes to the first installment).
 */
export function previewInstallments(amount: number, count: number, startIso: string) {
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, index) => ({
    sequence: index + 1,
    amount: base + (index === 0 ? remainder : 0),
    due: startIso ? addMonthsIso(startIso, index) : null,
  }));
}

/** Scheduled installment count implied by a plan label (0 = no schedule rows). */
export function planInstallmentCount(plan: string, terms: number): number {
  if (plan === PER_TERM_PLAN) return terms;
  if (plan === CUSTOM_PLAN || plan === 'Peşin') return 0;
  const count = parseInt(plan, 10);
  return Number.isNaN(count) ? 0 : count;
}

/** Plan label sent to the backend — "Kur Başına" resolves to one installment per term. */
export function resolvePlan(plan: string, terms: number): string {
  return plan === PER_TERM_PLAN ? `${terms} Taksit` : plan;
}

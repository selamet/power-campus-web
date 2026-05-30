/** Formatting helpers for currency and dates, localized for tr-TR. */

const MONTHS_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

/** Formats a number as Turkish Lira, e.g. 18500 -> "₺18.500". */
export const formatMoney = (amount: number): string => `₺${amount.toLocaleString('tr-TR')}`;

/** Formats an ISO date (YYYY-MM-DD) as "3 Şub 2026". Returns an em dash for empty input. */
export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  return `${+day} ${MONTHS_SHORT[+month - 1]} ${year}`;
};

/** Percentage of fee paid, clamped to a whole number. */
export const paidPercent = (paid: number, fee: number): number =>
  fee > 0 ? Math.round((paid / fee) * 100) : 0;

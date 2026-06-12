/** Input validation shared by the registration forms, approval and invite flows. */

import { digitsOnly } from './format';

/** Loose e-mail shape check — enough for form gating. */
export const isValidEmail = (value: string): boolean => /.+@.+\..+/.test(value);

/** A usable phone number needs at least 10 digits. */
export const isValidPhone = (value: string): boolean => digitsOnly(value).length >= 10;

/** Validates a Turkish national ID number using the official checksum. */
export function isValidTckn(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const digits = value.split('').map(Number);
  const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const even = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = (((odd * 7 - even) % 10) + 10) % 10;
  const eleventh = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;
  return digits[9] === tenth && digits[10] === eleventh;
}

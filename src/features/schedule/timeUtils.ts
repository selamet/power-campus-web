/** API times are "HH:MM:SS"; the UI shows and edits "HH:MM". */

/** "10:00:00" -> "10:00". Tolerates an already-short value. */
export function hmFromApi(t: string): string {
  return t.slice(0, 5);
}

/** "10:00" -> "10:00:00" for sending to the API. */
export function toApiTime(hm: string): string {
  return hm.length === 5 ? `${hm}:00` : hm;
}

/** Minutes since midnight for an "HH:MM" or "HH:MM:SS" value. */
export function minutesOf(t: string): number {
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m);
}

/**
 * Centralized, typed access to environment variables.
 * Import `env` instead of reading `import.meta.env` directly so that
 * parsing and defaults live in a single place.
 */

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.powerakademi.com',
  apiTimeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 15000),
  isProduction: import.meta.env.PROD,
} as const;

/**
 * Centralized, typed access to environment variables.
 * Import `env` instead of reading `import.meta.env` directly so that
 * parsing and defaults live in a single place.
 */

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.powerakademi.com',
  apiTimeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 15000),
  useMocks: parseBoolean(import.meta.env.VITE_USE_MOCKS, true),
  isProduction: import.meta.env.PROD,
} as const;

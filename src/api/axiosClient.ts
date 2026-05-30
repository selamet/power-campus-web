import axios, { AxiosError, type AxiosInstance } from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from './tokenStorage';

/**
 * Shared axios instance. All feature services should import this client so that
 * base URL, timeout, auth headers and error normalization stay consistent.
 */
export const axiosClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the bearer token (when present) to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalized error shape surfaced to slices/UI. */
export interface ApiError {
  status: number;
  message: string;
}

const toApiError = (error: AxiosError<{ message?: string }>): ApiError => ({
  status: error.response?.status ?? 0,
  message:
    error.response?.data?.message ??
    error.message ??
    'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
});

// Convert axios errors into a predictable ApiError and handle 401 globally.
axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
    }
    return Promise.reject(toApiError(error));
  },
);

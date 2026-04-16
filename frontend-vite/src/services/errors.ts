/**
 * Утиліти для безпечної обробки `unknown` помилок з TypeScript strict-режиму.
 */
import type { ApiErrorBody } from '../types/models';

/** Витягує message з axios-style error без падіння у TS strict. */
export const getErrorMessage = (error: unknown, fallback = 'Сталася помилка'): string => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  const err = error as {
    response?: { data?: ApiErrorBody | string };
    message?: string;
    name?: string;
  };
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === 'string') return data;
    if (data.detail) return String(data.detail);
    if (data.message) return String(data.message);
    if (Array.isArray(data.non_field_errors)) return String(data.non_field_errors[0]);
  }
  if (err.message) return err.message;
  return fallback;
};

/** Витягує HTTP-статус з axios-style error. */
export const getErrorStatus = (error: unknown): number | undefined => {
  return (error as { response?: { status?: number } })?.response?.status;
};

/** Витягує response.data як untyped object (для polje-specific обробки). */
export const getErrorData = (error: unknown): Record<string, unknown> | undefined => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') return data as Record<string, unknown>;
  return undefined;
};

/** Перевіряє чи є помилка abort/cancel (від AbortController). */
export const isAbortError = (error: unknown): boolean => {
  const err = error as { name?: string; code?: string };
  return err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED';
};

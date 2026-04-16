import { useEffect } from 'react';
import {
  useForm,
  type FieldValues,
  type DefaultValues,
  type Path,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import logger from '../services/logger';

export interface UseFormModalOptions<TValues extends FieldValues, TEntity extends { id: number | string }> {
  schema: ZodType<TValues>;
  defaults: TValues;
  entity?: TEntity | null;
  endpoint: (values: TValues) => string;
  editEndpoint?: string;
  isOpen: boolean;
  onSuccess?: (data: unknown) => void;
  onClose?: () => void;
  successMessage?: string;
  errorMessage?: string;
  transform?: (values: TValues) => Record<string, unknown>;
}

/**
 * Хук для модальних форм. Обгортає react-hook-form + zod + api POST/PUT.
 */
export function useFormModal<
  TValues extends FieldValues,
  TEntity extends { id: number | string } = { id: number },
>({
  schema,
  defaults,
  entity,
  endpoint,
  editEndpoint,
  isOpen,
  onSuccess,
  onClose,
  successMessage,
  errorMessage = 'Помилка збереження',
  transform,
}: UseFormModalOptions<TValues, TEntity>) {
  const form = useForm<TValues>({
    // @ts-expect-error — типи zodResolver не повністю узгоджені з generic FieldValues
    resolver: zodResolver(schema),
    defaultValues: defaults as DefaultValues<TValues>,
  });

  const {
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    if (!isOpen) return;
    if (entity) {
      reset({ ...defaults, ...(entity as unknown as TValues) });
    } else {
      reset(defaults as DefaultValues<TValues>);
    }
  }, [isOpen, entity]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = handleSubmit(async (values) => {
    const payload = transform ? transform(values) : values;
    const baseUrl = endpoint(values);
    const url = entity
      ? editEndpoint || `${baseUrl.replace(/\/$/, '')}/${entity.id}/`
      : baseUrl;
    const method = entity ? 'put' : 'post';

    try {
      const response = await api[method](url, payload);
      if (successMessage) toast.success(successMessage);
      onSuccess?.(response.data);
      onClose?.();
    } catch (error: unknown) {
      logger.error('Form submit error:', error);
      const responseData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (responseData && typeof responseData === 'object') {
        Object.keys(responseData).forEach((key) => {
          const raw = responseData[key];
          const message = Array.isArray(raw) ? raw[0] : raw;
          setError(key as Path<TValues>, { type: 'server', message: String(message) });
        });
      } else {
        toast.error(errorMessage);
      }
    }
  });

  return {
    ...form,
    submit,
    isSubmitting,
  };
}

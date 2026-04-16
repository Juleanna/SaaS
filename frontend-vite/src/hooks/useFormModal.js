import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import logger from '../services/logger';

/**
 * Хук для модальних форм. Обгортає react-hook-form + zod + api POST/PUT.
 *
 * @param {object} opts
 * @param {import('zod').ZodSchema} opts.schema - zod-схема валідації
 * @param {object} opts.defaults - значення при створенні
 * @param {object|null} opts.entity - якщо передано — режим редагування; поля змердяться з defaults
 * @param {(values: object) => string} opts.endpoint - ендпоінт API (функція від values)
 * @param {string} [opts.editEndpoint] - окремий URL для редагування (за замовчуванням `${endpoint}/${entity.id}/`)
 * @param {boolean} opts.isOpen - чи модалка відкрита (для reset)
 * @param {(data: any) => void} [opts.onSuccess] - викликається з response.data при успіху
 * @param {() => void} [opts.onClose] - закриття модалки
 * @param {string} [opts.successMessage]
 * @param {string} [opts.errorMessage]
 * @param {(values: object) => object} [opts.transform] - трансформація даних перед надсиланням
 */
export function useFormModal({
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
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const {
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = form;

  // При відкритті: підставляємо значення редагованої сутності або дефолти
  useEffect(() => {
    if (!isOpen) return;
    if (entity) {
      reset({ ...defaults, ...entity });
    } else {
      reset(defaults);
    }
  }, [isOpen, entity]);

  const submit = handleSubmit(async (values) => {
    const payload = transform ? transform(values) : values;
    const url = entity
      ? (editEndpoint || `${endpoint(values).replace(/\/$/, '')}/${entity.id}/`)
      : endpoint(values);
    const method = entity ? 'put' : 'post';

    try {
      const response = await api[method](url, payload);
      if (successMessage) {
        toast.success(successMessage);
      }
      onSuccess && onSuccess(response.data);
      onClose && onClose();
    } catch (error) {
      logger.error('Form submit error:', error);
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        Object.keys(data).forEach((key) => {
          const message = Array.isArray(data[key]) ? data[key][0] : data[key];
          setError(key, { type: 'server', message: String(message) });
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

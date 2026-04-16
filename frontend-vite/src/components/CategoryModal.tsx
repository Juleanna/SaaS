import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFormModal } from '../hooks/useFormModal';
import { categorySchema, type CategoryFormValues } from '../schemas';
import type { Category } from '../types/models';

const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ye',
    'ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l',
    'м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
    'ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'',
    'ю':'yu','я':'ya','ъ':'','ы':'y','э':'e','ё':'yo',
  };
  return text.split('').map((ch) => map[ch] ?? ch).join('');
};

const slugify = (text: string): string =>
  transliterate(text.toLowerCase())
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  storeId: number | string;
  onSuccess?: (data: Category, isEditing: boolean) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category = null, storeId, onSuccess }) => {
  const isEdit = !!category;

  const {
    register,
    submit,
    setValue,
    watch,
    formState: { errors },
    isSubmitting,
  } = useFormModal<CategoryFormValues, Category>({
    schema: categorySchema,
    defaults: {
      name: '',
      description: '',
      slug: '',
      meta_title: '',
      meta_description: '',
      is_active: true,
    },
    entity: category,
    isOpen,
    endpoint: () => `/products/stores/${storeId}/categories/`,
    successMessage: isEdit ? 'Категорію оновлено' : 'Категорію створено',
    errorMessage: 'Помилка збереження категорії',
    onSuccess: (data) => onSuccess && onSuccess(data as Category, isEdit),
    onClose,
  });

  const nameValue = watch('name');

  // Auto-slug при створенні
  React.useEffect(() => {
    if (!isEdit && nameValue) {
      setValue('slug', slugify(nameValue), { shouldValidate: false });
    }
  }, [nameValue, isEdit, setValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
          <form onSubmit={submit}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEdit ? 'Редагувати категорію' : 'Додати категорію'}
                </h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Назва *" error={errors.name?.message}>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введіть назву категорії"
                    autoFocus
                  />
                </Field>

                <Field label="Опис" error={errors.description?.message}>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Опис категорії (необов'язково)"
                  />
                </Field>

                <Field label="URL (slug)" error={errors.slug?.message}>
                  <input
                    type="text"
                    {...register('slug')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="url-kategoriyi"
                  />
                </Field>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Активна категорія</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
                Скасувати
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Збереження...' : isEdit ? 'Оновити' : 'Створити'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default CategoryModal;

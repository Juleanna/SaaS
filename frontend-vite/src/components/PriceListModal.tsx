import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import logger from '../services/logger';

interface PriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceList?: { id?: string | number; [key: string]: unknown } | null;
  onSave?: (data: unknown) => void;
}

const PriceListModal: React.FC<PriceListModalProps> = ({
  isOpen,
  onClose,
  priceList = null,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricing_strategy: 'cost_plus_markup',
    default_markup_percentage: 20.00,
    default_markup_amount: 0.00,
    is_active: true,
    is_default: false,
    auto_update_from_cost: false,
    update_frequency: 'manual',
    valid_from: '',
    valid_until: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pricingStrategyOptions = [
    { value: 'manual', label: 'Ручне встановлення цін' },
    { value: 'cost_plus_markup', label: 'Собівартість + націнка' },
    { value: 'competitor_based', label: 'На основі цін конкурентів' },
    { value: 'value_based', label: 'Цінова стратегія на основі цінності' },
    { value: 'dynamic', label: 'Динамічне ціноутворення' },
  ];

  const updateFrequencyOptions = [
    { value: 'manual', label: 'Вручну' },
    { value: 'daily', label: 'Щодня' },
    { value: 'weekly', label: 'Щотижня' },
    { value: 'monthly', label: 'Щомісяця' },
    { value: 'on_cost_change', label: 'При зміні собівартості' },
    { value: 'on_supply', label: 'При постачанні' },
  ];

  useEffect(() => {
    if (priceList) {
      setFormData({
        name: priceList.name || '',
        description: priceList.description || '',
        pricing_strategy: priceList.pricing_strategy || 'cost_plus_markup',
        default_markup_percentage: parseFloat(priceList.default_markup_percentage) || 20.00,
        default_markup_amount: parseFloat(priceList.default_markup_amount) || 0.00,
        is_active: priceList.is_active !== undefined ? priceList.is_active : true,
        is_default: priceList.is_default !== undefined ? priceList.is_default : false,
        auto_update_from_cost: priceList.auto_update_from_cost !== undefined ? priceList.auto_update_from_cost : false,
        update_frequency: priceList.update_frequency || 'manual',
        valid_from: priceList.valid_from ? new Date(priceList.valid_from).toISOString().slice(0, 16) : '',
        valid_until: priceList.valid_until ? new Date(priceList.valid_until).toISOString().slice(0, 16) : '',
      });
    } else {
      // Reset form for new price list
      setFormData({
        name: '',
        description: '',
        pricing_strategy: 'cost_plus_markup',
        default_markup_percentage: 20.00,
        default_markup_amount: 0.00,
        is_active: true,
        is_default: false,
        auto_update_from_cost: false,
        update_frequency: 'manual',
        valid_from: '',
        valid_until: '',
      });
    }
    setErrors({});
  }, [priceList, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) || 0 : 
              value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Назва прайс-листа обов\'язкова';
    }
    
    if (formData.default_markup_percentage < 0 || formData.default_markup_percentage > 999.99) {
      newErrors.default_markup_percentage = 'Націнка повинна бути від 0% до 999.99%';
    }
    
    if (formData.default_markup_amount < 0) {
      newErrors.default_markup_amount = 'Фіксована націнка не може бути негативною';
    }
    
    if (formData.valid_from && formData.valid_until) {
      const fromDate = new Date(formData.valid_from);
      const untilDate = new Date(formData.valid_until);
      if (fromDate >= untilDate) {
        newErrors.valid_until = 'Дата закінчення повинна бути пізніше дати початку';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
      };
      
      await onSave(submitData);
    } catch (error) {
      logger.error('Error saving price list:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {priceList ? 'Редагувати прайс-лист' : 'Створити прайс-лист'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="form-label">
                      Назва прайс-листа *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`input mt-1 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Введіть назву прайс-листа"
                    />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="form-label">
                      Опис
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="input mt-1"
                      placeholder="Опис прайс-листа"
                    />
                  </div>

                  <div>
                    <label htmlFor="pricing_strategy" className="form-label">
                      Стратегія ціноутворення
                    </label>
                    <select
                      id="pricing_strategy"
                      name="pricing_strategy"
                      value={formData.pricing_strategy}
                      onChange={handleChange}
                      className="input mt-1"
                    >
                      {pricingStrategyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="update_frequency" className="form-label">
                      Частота оновлення
                    </label>
                    <select
                      id="update_frequency"
                      name="update_frequency"
                      value={formData.update_frequency}
                      onChange={handleChange}
                      className="input mt-1"
                    >
                      {updateFrequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Markup Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Налаштування націнки</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="default_markup_percentage" className="form-label">
                        Націнка за замовчуванням (%)
                      </label>
                      <input
                        type="number"
                        id="default_markup_percentage"
                        name="default_markup_percentage"
                        min="0"
                        max="999.99"
                        step="0.01"
                        value={formData.default_markup_percentage}
                        onChange={handleChange}
                        className={`input mt-1 ${
                          errors.default_markup_percentage ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.default_markup_percentage && (
                        <p className="form-error">{errors.default_markup_percentage}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="default_markup_amount" className="form-label">
                        Фіксована націнка (₴)
                      </label>
                      <input
                        type="number"
                        id="default_markup_amount"
                        name="default_markup_amount"
                        min="0"
                        step="0.01"
                        value={formData.default_markup_amount}
                        onChange={handleChange}
                        className={`input mt-1 ${
                          errors.default_markup_amount ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.default_markup_amount && (
                        <p className="form-error">{errors.default_markup_amount}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Validity Period */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Період дії</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="valid_from" className="form-label">
                        Діє з
                      </label>
                      <input
                        type="datetime-local"
                        id="valid_from"
                        name="valid_from"
                        value={formData.valid_from}
                        onChange={handleChange}
                        className="input mt-1"
                      />
                    </div>

                    <div>
                      <label htmlFor="valid_until" className="form-label">
                        Діє до
                      </label>
                      <input
                        type="datetime-local"
                        id="valid_until"
                        name="valid_until"
                        value={formData.valid_until}
                        onChange={handleChange}
                        className={`input mt-1 ${
                          errors.valid_until ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.valid_until && (
                        <p className="form-error">{errors.valid_until}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Налаштування</h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                        Активний прайс-лист
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="is_default"
                        name="is_default"
                        type="checkbox"
                        checked={formData.is_default}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                        Прайс-лист за замовчуванням
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="auto_update_from_cost"
                        name="auto_update_from_cost"
                        type="checkbox"
                        checked={formData.auto_update_from_cost}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="auto_update_from_cost" className="ml-2 block text-sm text-gray-700">
                        Автоматично оновлювати з собівартості
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary sm:ml-3 sm:w-auto disabled:opacity-50"
              >
                {loading ? 'Збереження...' : (priceList ? 'Оновити' : 'Створити')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline sm:mt-0 sm:ml-3 sm:w-auto"
              >
                Скасувати
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PriceListModal;
import React, { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  product = null, 
  storeId, 
  categories = [], 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    sale_price: '',
    currency: 'UAH',
    category: '',
    is_active: true,
    is_featured: false,
    weight: '',
    dimensions: '',
    sku: '',
    minimum_order_quantity: '1',
    maximum_order_quantity: '',
    order_increment: '1',
  });
  
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price || '',
        sale_price: product.sale_price || '',
        currency: product.currency || 'UAH',
        category: product.category?.id || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        sku: product.sku || '',
        minimum_order_quantity: product.minimum_order_quantity || '1',
        maximum_order_quantity: product.maximum_order_quantity || '',
        order_increment: product.order_increment || '1',
      });
      setImages(product.images || []);
      setVariants(product.variants || []);
    } else {
      setFormData({
        name: '',
        description: '',
        short_description: '',
        price: '',
        sale_price: '',
        currency: 'UAH',
        category: '',
        is_active: true,
        is_featured: false,
        weight: '',
        dimensions: '',
        sku: '',
        minimum_order_quantity: '1',
        maximum_order_quantity: '',
        order_increment: '1',
      });
      setImages([]);
      setVariants([]);
    }
    setErrors({});
  }, [product, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await api.post(
          `/products/stores/${storeId}/products/${product?.id || 'temp'}/images/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        return response.data;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Помилка завантаження зображень');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async (imageId) => {
    try {
      if (product?.id) {
        await api.delete(`/products/stores/${storeId}/products/${product.id}/images/${imageId}/`);
      }
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Помилка видалення зображення');
    }
  };

  const addVariant = () => {
    setVariants(prev => [...prev, {
      id: `temp-${Date.now()}`,
      name: '',
      price: '',
      stock_quantity: '',
      sku: '',
      attributes: {}
    }]);
  };

  const removeVariant = (variantId) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
  };

  const updateVariant = (variantId, field, value) => {
    setVariants(prev => prev.map(v => 
      v.id === variantId ? { ...v, [field]: value } : v
    ));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Назва товару обов\'язкова';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Ціна повинна бути більше 0';
    }
    
    if (!formData.category) {
      newErrors.category = 'Виберіть категорію';
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
      let response;
      
      if (product) {
        response = await api.put(
          `/products/stores/${storeId}/products/${product.id}/`,
          formData
        );
      } else {
        response = await api.post(
          `/products/stores/${storeId}/products/`,
          formData
        );
      }

      // Save variants if any
      if (variants.length > 0 && response.data.id) {
        for (const variant of variants) {
          if (variant.id.startsWith('temp-')) {
            await api.post(
              `/products/stores/${storeId}/products/${response.data.id}/variants/`,
              {
                ...variant,
                id: undefined
              }
            );
          } else {
            await api.put(
              `/products/stores/${storeId}/products/${response.data.id}/variants/${variant.id}/`,
              variant
            );
          }
        }
      }

      onSave && onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response?.data) {
        const serverErrors = {};
        Object.keys(error.response.data).forEach(key => {
          serverErrors[key] = Array.isArray(error.response.data[key]) 
            ? error.response.data[key][0] 
            : error.response.data[key];
        });
        setErrors(serverErrors);
      } else {
        alert('Помилка збереження товару');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', name: 'Основна інформація' },
    { id: 'pricing', name: 'Ціноутворення' },
    { id: 'logistics', name: 'Логістика' },
    { id: 'images', name: 'Зображення' },
    { id: 'variants', name: 'Варіанти' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-slate-900/80 transition-all duration-300 backdrop-blur-sm" 
          onClick={onClose}
        ></div>

        {/* Invisible element to center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal */}
        <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all duration-300 sm:my-8 sm:align-middle w-full max-w-4xl border border-gray-200/50 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {product ? 'Редагувати товар' : 'Додати товар'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {product ? 'Оновіть інформацію про товар' : 'Створіть новий товар для вашого магазину'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200/60 mb-8">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 px-4 border-b-2 font-semibold text-sm rounded-t-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Назва товару *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 ${
                          errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                        }`}
                        placeholder="Введіть назву товару"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Короткий опис
                    </label>
                    <input
                      type="text"
                      name="short_description"
                      value={formData.short_description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
                      placeholder="Короткий опис товару"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
                        placeholder="Артикул товару"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Опис
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 resize-none"
                      placeholder="Детальний опис товару"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Категорія *
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 appearance-none cursor-pointer ${
                          errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                        }`}
                      >
                        <option value="">Виберіть категорію</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.category && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Активний товар
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_featured"
                          checked={formData.is_featured}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Рекомендований товар
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Валюта
                    </label>
                    <div className="relative">
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 appearance-none cursor-pointer"
                      >
                        <option value="UAH">Гривня (₴)</option>
                        <option value="USD">Долар ($)</option>
                        <option value="EUR">Євро (€)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ціна *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 ${
                          errors.price ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                        }`}
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 font-medium">₴</span>
                      </div>
                    </div>
                    {errors.price && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Акційна ціна
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="sale_price"
                        value={formData.sale_price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 font-medium">₴</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Залишіть пустим, якщо знижки немає</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Мінімальна кількість замовлення
                    </label>
                    <input
                      type="number"
                      name="minimum_order_quantity"
                      value={formData.minimum_order_quantity}
                      onChange={handleInputChange}
                      step="0.001"
                      min="0.001"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Максимальна кількість замовлення
                    </label>
                    <input
                      type="number"
                      name="maximum_order_quantity"
                      value={formData.maximum_order_quantity}
                      onChange={handleInputChange}
                      step="0.001"
                      min="0.001"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
                      placeholder="Необмежено"
                    />
                    <p className="mt-1 text-xs text-gray-500">Залишіть пустим для необмеженої кількості</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Крок замовлення
                    </label>
                    <input
                      type="number"
                      name="order_increment"
                      value={formData.order_increment}
                      onChange={handleInputChange}
                      step="0.001"
                      min="0.001"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
                      placeholder="1"
                    />
                    <p className="mt-1 text-xs text-gray-500">На скільки одиниць може збільшуватися кількість</p>
                  </div>
                </div>
              )}

              {/* Logistics Tab */}
              {activeTab === 'logistics' && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Вага (кг)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        step="0.001"
                        min="0"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
                        placeholder="0.000"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 font-medium text-sm">кг</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Розміри
                    </label>
                    <input
                      type="text"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
                      placeholder="Д x Ш x В (см)"
                    />
                    <p className="mt-1 text-xs text-gray-500">Наприклад: 30 x 20 x 15</p>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Інформація про логістику</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>Вага та розміри використовуються для:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Розрахунку вартості доставки</li>
                              <li>Визначення способу доставки</li>
                              <li>Оптимізації пакування</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Images Tab */}
              {activeTab === 'images' && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Зображення товару
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <PhotoIcon className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Натисніть для завантаження</span> або перетягніть файли
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG (до 5MB)</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={image.id || index} className="relative group">
                          <img
                            src={image.image || image.url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(image.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Головне
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === 'variants' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Варіанти товару
                    </label>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="btn-primary"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Додати варіант
                    </button>
                  </div>

                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">
                            Варіант {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeVariant(variant.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Назва варіанту
                            </label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Наприклад: Червоний, L"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Ціна
                            </label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Кількість
                            </label>
                            <input
                              type="number"
                              value={variant.stock_quantity}
                              onChange={(e) => updateVariant(variant.id, 'stock_quantity', e.target.value)}
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {variants.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Немає варіантів товару</p>
                      <p className="text-xs mt-1">Натисніть "Додати варіант" щоб створити варіації товару</p>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/30 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse border-t border-gray-200/50">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Збереження...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {product ? 'Оновити' : 'Створити'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center items-center rounded-xl border-2 border-gray-200 shadow-sm px-6 py-3 bg-white/80 backdrop-blur-sm text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-500/20 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Скасувати
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
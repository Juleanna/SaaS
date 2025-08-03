import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const PriceListItemsModal = ({ 
  isOpen, 
  onClose, 
  priceList,
  storeId 
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Отримуємо позиції прайс-листа
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['pricelist-items', priceList?.id],
    queryFn: async () => {
      if (!priceList?.id || !storeId) return [];
      try {
        const response = await api.get(`/pricelists/api/stores/${storeId}/pricelists/${priceList.id}/items/`);
        return response.data.results || response.data;
      } catch (error) {
        console.error('Error fetching price list items:', error);
        // Mock data для демонстрації
        return [
          {
            id: '1',
            product: {
              id: '1',
              name: 'Телефон Samsung Galaxy S24',
              sku: 'PHONE-SAM-S24',
              image: null
            },
            current_cost: '15000.00',
            markup_type: 'percentage',
            markup_value: '25.00',
            calculated_price: '18750.00',
            final_price: '18750.00',
            profit_margin: '25.00',
            profit_amount: '3750.00',
            is_manual_override: false,
            last_price_update: '2024-01-20T10:30:00Z'
          },
          {
            id: '2',
            product: {
              id: '2',
              name: 'Ноутбук Lenovo ThinkPad',
              sku: 'LAPTOP-LEN-TP',
              image: null
            },
            current_cost: '25000.00',
            markup_type: 'fixed_amount',
            markup_value: '5000.00',
            calculated_price: '30000.00',
            final_price: '29999.00',
            profit_margin: '19.99',
            profit_amount: '4999.00',
            is_manual_override: true,
            last_price_update: '2024-01-19T14:15:00Z'
          }
        ];
      }
    },
    enabled: isOpen && !!priceList?.id && !!storeId,
  });

  // Отримуємо список товарів для додавання
  const { data: availableProducts = [] } = useQuery({
    queryKey: ['available-products', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      try {
        const response = await api.get(`/products/stores/${storeId}/products/`);
        return response.data.results || response.data;
      } catch (error) {
        return [];
      }
    },
    enabled: isOpen && !!storeId,
  });

  // Отримуємо категорії для фільтрації
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      try {
        const response = await api.get(`/products/stores/${storeId}/categories/`);
        return response.data.results || response.data;
      } catch (error) {
        return [];
      }
    },
    enabled: isOpen && !!storeId,
  });

  // Додавання товару до прайс-листа
  const addItemMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/pricelists/api/stores/${storeId}/pricelists/${priceList.id}/items/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pricelist-items', priceList?.id]);
      setIsAddItemModalOpen(false);
      toast.success('Товар додано до прайс-листа');
    },
    onError: (error) => {
      toast.error('Помилка додавання товару');
      console.error('Add item error:', error);
    },
  });

  // Оновлення позиції прайс-листа
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }) => {
      const response = await api.patch(`/pricelists/api/stores/${storeId}/pricelists/${priceList.id}/items/${itemId}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pricelist-items', priceList?.id]);
      setEditingItem(null);
      toast.success('Позицію оновлено');
    },
    onError: (error) => {
      toast.error('Помилка оновлення позиції');
      console.error('Update item error:', error);
    },
  });

  // Видалення позиції
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      await api.delete(`/pricelists/api/stores/${storeId}/pricelists/${priceList.id}/items/${itemId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pricelist-items', priceList?.id]);
      toast.success('Позицію видалено');
    },
    onError: (error) => {
      toast.error('Помилка видалення позиції');
      console.error('Delete item error:', error);
    },
  });

  // Фільтрація позицій
  const filteredItems = items.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category?.id === parseInt(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (productId, itemData) => {
    addItemMutation.mutate({
      product: productId,
      ...itemData
    });
  };

  const handleUpdateItem = (itemId, data) => {
    updateItemMutation.mutate({ itemId, data });
  };

  const handleDeleteItem = (item) => {
    if (window.confirm(`Видалити "${item.product.name}" з прайс-листа?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full relative z-10">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Позиції прайс-листа: {priceList?.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Управління цінами товарів в прайс-листі
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Додати товар
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Пошук товарів..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Всі категорії</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              {itemsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredItems.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Товар
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Собівартість
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Націнка
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ціна
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Прибуток
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Оновлено
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дії
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {item.product.image ? (
                                <img className="h-10 w-10 rounded-lg object-cover" src={item.product.image} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {item.product.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(item.current_cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.markup_type === 'percentage' 
                              ? `${item.markup_value}%`
                              : formatPrice(item.markup_value)
                            }
                          </div>
                          {item.is_manual_override && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Вручну
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(item.final_price)}
                          </div>
                          {item.calculated_price !== item.final_price && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatPrice(item.calculated_price)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatPrice(item.profit_amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {parseFloat(item.profit_margin).toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.last_price_update)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Немає товарів</h3>
                  <p className="text-gray-600 mb-4">Додайте товари до прайс-листа для управління цінами</p>
                  <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Додати товар
                  </button>
                </div>
              )}
            </div>

            {/* Statistics */}
            {filteredItems.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-900">
                      {filteredItems.length}
                    </div>
                    <div className="text-sm text-blue-600">Всього позицій</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-900">
                      {formatPrice(filteredItems.reduce((sum, item) => sum + parseFloat(item.profit_amount), 0))}
                    </div>
                    <div className="text-sm text-green-600">Загальний прибуток</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-900">
                      {(filteredItems.reduce((sum, item) => sum + parseFloat(item.profit_margin), 0) / filteredItems.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-yellow-600">Середня рентабельність</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-900">
                      {filteredItems.filter(item => item.is_manual_override).length}
                    </div>
                    <div className="text-sm text-purple-600">Ручних цін</div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal та Edit Item Modal будуть додані пізніше */}
    </div>
  );
};

export default PriceListItemsModal;
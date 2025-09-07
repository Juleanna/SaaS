import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FolderIcon,
  ChartBarIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import CategoryModal from '../components/CategoryModal';

const Categories = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [userStores, setUserStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState(storeId);
  
  // Отримуємо ID магазину
  const currentStoreId = selectedStoreId || userStores?.[0]?.id;

  // Функція завантаження магазинів
  const fetchUserStores = async () => {
    try {
      console.log('Fetching stores from API...');
      const response = await api.get('/stores/');
      const stores = response.data.results || response.data || [];
      console.log('API response for stores:', response.data);
      setUserStores(stores);
      
      // Встановлюємо перший магазин як вибраний, якщо не вибрано з URL
      if (!selectedStoreId && stores.length > 0) {
        setSelectedStoreId(stores[0].id);
      }
      
      if (stores.length === 0) {
        setError('У вас немає створених магазинів');
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setError(`Помилка завантаження магазинів: ${error.response?.status || error.message}`);
      setUserStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  // Функція завантаження категорій
  const fetchCategories = async () => {
    if (!currentStoreId) {
      setError('Не вказано ID магазину');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching categories for store: ${currentStoreId}`);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await api.get(`/products/stores/${currentStoreId}/categories/?${params}`);
      setCategories(response.data.results || response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(`Помилка завантаження категорій: ${error.response?.data?.detail || error.message}`);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Видалення категорії
  const handleDelete = async (categoryId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю категорію?')) {
      return;
    }

    try {
      await api.delete(`/products/stores/${currentStoreId}/categories/${categoryId}/`);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Помилка видалення категорії');
    }
  };

  // Зміна статусу категорії
  const handleToggleStatus = async (category) => {
    try {
      await api.patch(`/products/stores/${currentStoreId}/categories/${category.id}/`, {
        is_active: !category.is_active
      });
      fetchCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
      alert('Помилка зміни статусу категорії');
    }
  };

  // Ефекти
  useEffect(() => {
    fetchUserStores();
  }, []);

  useEffect(() => {
    if (!storesLoading && currentStoreId) {
      fetchCategories();
    }
  }, [currentStoreId, searchTerm, storesLoading]);

  // Оновлюємо URL при зміні магазину
  useEffect(() => {
    if (currentStoreId && currentStoreId !== storeId) {
      navigate(`/admin/categories/${currentStoreId}`, { replace: true });
    }
  }, [currentStoreId, storeId, navigate]);

  // Показуємо завантаження магазинів
  if (storesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Завантаження магазинів...</p>
      </div>
    );
  }

  // Показуємо помилку або відсутність магазинів
  if (error && userStores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.124 4c-.77-.833-2.186-.833-2.956 0L2.632 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Помилка завантаження</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="space-x-4">

          <button
            onClick={() => navigate('/admin/stores')}
            className="btn-primary"
          >
            Створити магазин
          </button>
        </div>
      </div>
    );
  }

  // Показуємо завантаження категорій
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Завантаження категорій...</p>
      </div>
    );
  }

  const filteredCategories = categories.filter(category => 
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категорії</h1>
          <p className="mt-1 text-sm text-gray-500">
            Керуйте категоріями товарів вашого магазину
          </p>
          {userStores.length > 1 && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Виберіть магазин
              </label>
              <select
                value={selectedStoreId || ''}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Оберіть магазин...</option>
                {userStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    <BuildingStorefrontIcon className="h-4 w-4 mr-2 inline" />
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {userStores.length === 1 && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
              {userStores[0].name}
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            disabled={!currentStoreId}
            className={`${currentStoreId ? 'btn-primary' : 'btn-disabled'}`}
            title={!currentStoreId ? 'Оберіть магазин для створення категорії' : 'Додати категорію'}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати категорію
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пошук
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Назва категорії..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <FolderIcon className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Всього категорій</dt>
                <dd className="text-lg font-medium text-gray-900">{filteredCategories.length}</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="text-2xl mr-4">✅</div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Активні</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {filteredCategories.filter(c => c.is_active).length}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="text-2xl mr-4">❌</div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Неактивні</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {filteredCategories.filter(c => !c.is_active).length}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Всього товарів</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {filteredCategories.reduce((sum, c) => sum + (c.products_count || 0), 0)}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="card">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категорія
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Кількість товарів
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Створена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FolderIcon className="h-10 w-10 text-gray-400 mr-4" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-500">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {category.products_count || 0} товарів
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      category.is_active ? 'badge-success' : 'badge-secondary'
                    }`}>
                      {category.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.created_at ? new Date(category.created_at).toLocaleDateString('uk-UA') : 'Невідомо'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/products?category=${category.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Переглянути товари"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingCategory(category)}
                        className="text-green-600 hover:text-green-900"
                        title="Редагувати"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(category)}
                        className={`${category.is_active ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                        title={category.is_active ? 'Деактивувати' : 'Активувати'}
                      >
                        {category.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Видалити"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCategories.length === 0 && !loading && (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Немає категорій</h3>
              <p className="mt-1 text-sm text-gray-500">
                Почніть з створення першої категорії для ваших товарів.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Додати категорію
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCreateModal || editingCategory !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        storeId={currentStoreId}
        onSave={() => {
          fetchCategories();
          setShowCreateModal(false);
          setEditingCategory(null);
        }}
      />
    </div>
  );
};

export default Categories;
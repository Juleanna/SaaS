import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FolderIcon,
  ChartBarIcon
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
  
  // Get store ID (from URL or user's first store)
  console.log('Full user object:', user);
  console.log('User stores from token:', user?.stores);
  console.log('User stores from API:', userStores);
  
  const currentStoreId = storeId || userStores?.[0]?.id || user?.stores?.[0]?.id;

  // Якщо завантажуються магазини
  if (storesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Завантажуємо магазини...</p>
      </div>
    );
  }

  // Якщо немає Store ID, показуємо повідомлення
  if (!currentStoreId || userStores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-yellow-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Немає доступних магазинів</h3>
        <p className="text-gray-600 mb-4">Спочатку створіть магазин, щоб керувати категоріями.</p>
        <button
          onClick={() => navigate('/admin/stores')}
          className="btn-primary"
        >
          Створити магазин
        </button>
      </div>
    );
  }

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      console.log('Fetching categories with storeId:', currentStoreId);
      
      if (!currentStoreId) {
        throw new Error('Немає ID магазину');
      }
      console.log('User:', user);
      
      const response = await api.get(`/products/stores/${currentStoreId}/categories/?${params}`);
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Показуємо детальнішу помилку
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Помилка завантаження категорій';
      setError(`${errorMessage} (Store ID: ${currentStoreId})`);
      setCategories([]); // Показуємо порожній список замість fallback даних
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Ви впевнені, що хочете видалити цю категорію? Всі товари в цій категорії будуть переміщені в "Без категорії".')) {
      try {
        await api.delete(`/products/stores/${currentStoreId}/categories/${categoryId}/`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Помилка видалення категорії');
      }
    }
  };

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

  const fetchUserStores = async () => {
    try {
      setStoresLoading(true);
      const response = await api.get('/stores/');
      setUserStores(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching user stores:', error);
      setUserStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStores();
  }, []);

  useEffect(() => {
    if (!storesLoading && currentStoreId) {
      fetchCategories();
    }
  }, [currentStoreId, searchTerm, storesLoading]);

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Завантажуємо категорії з API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.124 4c-.77-.833-2.186-.833-2.956 0L2.632 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Помилка завантаження</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchCategories();
          }}
          className="btn-primary"
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категорії</h1>
          <p className="mt-1 text-sm text-gray-500">
            Керуйте категоріями товарів вашого магазину
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати категорію
          </button>
        </div>
      </div>

      {/* Search and Filters */}
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
              <div className="flex-shrink-0">
                <FolderIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всього категорій
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredCategories.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">✅</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Активні
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredCategories.filter(c => c.is_active).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">❌</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Неактивні
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredCategories.filter(c => !c.is_active).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всього товарів
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredCategories.reduce((sum, c) => sum + (c.products_count || 0), 0)}
                  </dd>
                </dl>
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
                      <div className="flex-shrink-0">
                        <FolderIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
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
          
          {filteredCategories.length === 0 && (
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
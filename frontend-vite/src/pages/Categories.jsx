import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  EyeIcon,
  PauseCircleIcon,
  PlayCircleIcon,
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
      
      const url = `/products/stores/${currentStoreId}/categories/?${params}`;
      console.log('Fetching categories from:', url);
      const response = await api.get(url);
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

  // Оновлюємо URL при зміні магазину (тільки якщо це не з URL параметра)
  useEffect(() => {
    if (currentStoreId && !storeId && selectedStoreId) {
      navigate(`/categories/${currentStoreId}`, { replace: true });
    }
  }, [selectedStoreId, storeId, navigate]);

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
            onClick={() => navigate('/stores')}
            className="btn-primary"
          >
            Створити магазин
          </button>
        </div>
      </div>
    );
  }

  // Показуємо повідомлення коли не обрано магазин
  if (!storesLoading && userStores.length > 0 && !currentStoreId) {
    return (
      <div className="space-y-6">
        {/* Header з вибором магазину */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Категорії</h1>
            <p className="mt-1 text-sm text-gray-500">
              Керуйте категоріями товарів вашого магазину
            </p>
            <div className="mt-3">
              <label className="form-label">
                Виберіть магазин
              </label>
              <select
                value={selectedStoreId || ''}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="input w-64"
              >
                <option value="">Оберіть магазин...</option>
                {userStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="text-center py-12">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Оберіть магазин</h3>
          <p className="mt-1 text-sm text-gray-500">
            Виберіть магазин зі списку вище, щоб переглянути його категорії.
          </p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Категорії</h1>
            <p className="text-sm text-gray-500">Керуйте категоріями товарів вашого магазину</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userStores.length > 1 && (
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {userStores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!currentStoreId}
            className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати категорію
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук категорій..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всього категорій', value: filteredCategories.length, icon: FolderIcon, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
          { label: 'Активні', value: filteredCategories.filter(c => c.is_active).length, icon: CheckCircleIcon, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Неактивні', value: filteredCategories.filter(c => !c.is_active).length, icon: XCircleIcon, gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
          { label: 'Всього товарів', value: filteredCategories.reduce((sum, c) => sum + (c.products_count || 0), 0), icon: ChartBarIcon, gradient: 'from-purple-500 to-indigo-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl p-5 transition-all hover:shadow-md`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">{stat.label}</div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Категорія</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Товарів</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Створена</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <FolderIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-gray-500 line-clamp-1">{category.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
                    {category.products_count || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    category.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${category.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                    {category.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {category.created_at ? new Date(category.created_at).toLocaleDateString('uk-UA') : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/products?category=${category.id}`)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Переглянути товари"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Редагувати"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(category)}
                      className={`p-2 rounded-lg transition-colors ${category.is_active ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      title={category.is_active ? 'Деактивувати' : 'Активувати'}
                    >
                      {category.is_active ? <PauseCircleIcon className="h-4 w-4" /> : <PlayCircleIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
              <FolderIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Немає категорій</h3>
            <p className="text-sm text-gray-500 mb-6">Почніть з створення першої категорії для ваших товарів.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Додати категорію
            </button>
          </div>
        )}
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
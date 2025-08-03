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
  
  // Get store ID (from URL or user's first store)
  const currentStoreId = storeId || user?.stores?.[0]?.id || 1;

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await api.get(`/products/stores/${currentStoreId}/categories/?${params}`);
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Помилка завантаження категорій');
      // Fallback to mock data if API fails
      setCategories([
        {
          id: 1,
          name: 'Смартфони',
          description: 'Мобільні телефони та аксесуари',
          is_active: true,
          products_count: 15,
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-15T14:30:00Z',
        },
        {
          id: 2,
          name: 'Ноутбуки',
          description: 'Портативні комп\'ютери різних брендів',
          is_active: true,
          products_count: 8,
          created_at: '2024-01-12T11:00:00Z',
          updated_at: '2024-01-18T16:20:00Z',
        },
        {
          id: 3,
          name: 'Планшети',
          description: 'Планшетні комп\'ютери та електронні книги',
          is_active: false,
          products_count: 3,
          created_at: '2024-01-14T12:00:00Z',
          updated_at: '2024-01-20T10:15:00Z',
        },
      ]);
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

  useEffect(() => {
    fetchCategories();
  }, [currentStoreId, searchTerm]);

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
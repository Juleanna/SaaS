import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import ProductModal from '../components/ProductModal';

const Products = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [userStores, setUserStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  
  // Получаем ID магазина (можно из URL или из состояния)
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
        <p className="text-gray-600 mb-4">Спочатку створіть магазин, щоб керувати товарами.</p>
        <button
          onClick={() => navigate('/admin/stores')}
          className="btn-primary"
        >
          Створити магазин
        </button>
      </div>
    );
  }

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('ordering', sortBy);
      
      console.log('Fetching products with storeId:', currentStoreId);
      
      if (!currentStoreId) {
        throw new Error('Немає ID магазину');
      }
      console.log('User:', user);
      
      const response = await api.get(`/products/stores/${currentStoreId}/products/?${params}`);
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Показуємо детальнішу помилку
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Помилка завантаження товарів';
      setError(`${errorMessage} (Store ID: ${currentStoreId})`);
      setProducts([]); // Показуємо порожній список замість fallback даних
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get(`/products/stores/${currentStoreId}/categories/`);
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Показуємо порожній список замість fallback даних
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей товар?')) {
      try {
        await api.delete(`/products/stores/${currentStoreId}/products/${productId}/`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Помилка видалення товару');
      }
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await api.post(`/products/stores/${currentStoreId}/products/${product.id}/toggle-status/`);
      fetchProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Помилка зміни статусу товару');
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
      fetchProducts();
      fetchCategories();
    }
  }, [currentStoreId, searchTerm, selectedCategory, sortBy, statusFilter, storesLoading]);

  const getStatusBadge = (status, stock) => {
    if (stock === 0) return 'badge-danger';
    if (status === 'active') return 'badge-success';
    return 'badge-secondary';
  };

  const getStatusText = (status, stock) => {
    if (stock === 0) return 'Немає в наявності';
    if (status === 'active') return 'Активний';
    return 'Неактивний';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category?.id.toString() === selectedCategory;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.status === 'active') ||
                         (statusFilter === 'inactive' && product.status === 'inactive') ||
                         (statusFilter === 'out_of_stock' && (product.stock_quantity || 0) === 0);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Завантажуємо товари з API...</p>
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
            fetchProducts();
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
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Товари</h1>
          <p className="mt-1 text-sm text-gray-500">
            Керуйте товарами вашого магазину
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати товар
          </button>
        </div>
      </div>

      {/* Фільтри та пошук */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пошук
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Назва товару..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категорія
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Всі категорії</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Всі</option>
                <option value="active">Активні</option>
                <option value="inactive">Неактивні</option>
                <option value="out_of_stock">Немає в наявності</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сортування
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">За назвою</option>
                <option value="-created_at">За датою (нові)</option>
                <option value="created_at">За датою (старі)</option>
                <option value="price">За ціною (зростання)</option>
                <option value="-price">За ціною (спадання)</option>
                <option value="stock_quantity">За залишком</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всього товарів
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredProducts.length}
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
                    В наявності
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredProducts.filter(p => (p.stock_quantity || 0) > 0).length}
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
                    Немає в наявності
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredProducts.filter(p => (p.stock_quantity || 0) === 0).length}
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
                <div className="text-2xl">💰</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Середня ціна
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredProducts.length > 0 ? Math.round(filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length).toLocaleString() : 0} ₴
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Таблиця товарів */}
      <div className="card">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товар
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ціна
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Залишок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0].image || product.images[0].url} 
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                            📱
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                        {product.category && (
                          <div className="text-xs text-blue-600">
                            {product.category.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.price.toLocaleString()} ₴
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_quantity || 0} шт
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(product.status, product.stock_quantity || 0)}`}>
                      {getStatusText(product.status, product.stock_quantity || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Переглянути"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingProduct(product)}
                        className="text-green-600 hover:text-green-900"
                        title="Редагувати"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(product)}
                        className={`${product.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                        title={product.status === 'active' ? 'Деактивувати' : 'Активувати'}
                      >
                        {product.status === 'active' ? '⏸️' : '▶️'}
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
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
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={showCreateModal || editingProduct !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        storeId={currentStoreId}
        categories={categories}
        onSave={() => {
          fetchProducts();
          setShowCreateModal(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
};

export default Products;
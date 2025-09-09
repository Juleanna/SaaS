import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  QrCodeIcon,
  PrinterIcon,
  PhotoIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
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
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [userStores, setUserStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1
  });
  const [pageSize, setPageSize] = useState(20);

  const currentStoreId = storeId || userStores?.[0]?.id || user?.stores?.[0]?.id;

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

  const fetchProducts = async (page = 1) => {
    if (!currentStoreId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (statusFilter === 'active') params.append('is_active', 'true');
      if (statusFilter === 'inactive') params.append('is_active', 'false');
      if (statusFilter === 'featured') params.append('is_featured', 'true');
      
      params.append('ordering', sortBy);
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      
      const response = await api.get(`/products/stores/${currentStoreId}/products/?${params}`);
      
      if (response.data.results) {
        setProducts(response.data.results);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          total_pages: Math.ceil(response.data.count / pageSize)
        });
      } else {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error.response?.data?.detail || 'Помилка завантаження товарів';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!currentStoreId) return;
    
    try {
      const response = await api.get(`/products/stores/${currentStoreId}/categories/`);
      setCategories(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей товар?')) return;
    
    try {
      await api.delete(`/products/stores/${currentStoreId}/products/${productId}/`);
      fetchProducts(pagination.current_page);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Помилка видалення товару');
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await api.patch(`/products/stores/${currentStoreId}/products/${product.id}/`, {
        is_active: !product.is_active
      });
      fetchProducts(pagination.current_page);
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Помилка зміни статусу товару');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.size === 0) return;
    
    const productIds = Array.from(selectedProducts);
    
    try {
      switch (action) {
        case 'activate':
          await Promise.all(
            productIds.map(id => 
              api.patch(`/products/stores/${currentStoreId}/products/${id}/`, { is_active: true })
            )
          );
          break;
        case 'deactivate':
          await Promise.all(
            productIds.map(id => 
              api.patch(`/products/stores/${currentStoreId}/products/${id}/`, { is_active: false })
            )
          );
          break;
        case 'delete':
          if (!window.confirm(`Ви впевнені, що хочете видалити ${productIds.length} товарів?`)) return;
          await Promise.all(
            productIds.map(id => 
              api.delete(`/products/stores/${currentStoreId}/products/${id}/`)
            )
          );
          break;
      }
      
      setSelectedProducts(new Set());
      fetchProducts(pagination.current_page);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Помилка виконання масової дії');
    }
  };

  const handleSort = (field) => {
    const newDirection = sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc';
    const newSortBy = newDirection === 'desc' ? `-${field}` : field;
    
    setSortBy(newSortBy);
    setSortDirection(newDirection);
  };

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const generateBarcode = async (productId) => {
    try {
      await api.post(`/products/api/${productId}/generate-barcode/`);
      fetchProducts(pagination.current_page);
      alert('Штрихкод успішно згенеровано');
    } catch (error) {
      console.error('Error generating barcode:', error);
      alert('Помилка генерації штрихкоду');
    }
  };

  const generateQRCode = async (productId) => {
    try {
      await api.post(`/products/api/${productId}/generate-qr/`);
      fetchProducts(pagination.current_page);
      alert('QR код успішно згенеровано');
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Помилка генерації QR коду');
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
  }, [currentStoreId, searchTerm, selectedCategory, sortBy, statusFilter, storesLoading, pageSize]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  if (storesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Завантажуємо магазини...</p>
      </div>
    );
  }

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
          onClick={() => navigate('/stores')}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-xl text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg transform hover:scale-105 active:scale-95 relative overflow-hidden group"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
          <span className="relative z-10">Створити магазин</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Завантажуємо товари...</p>
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
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-xl text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg transform hover:scale-105 active:scale-95 relative overflow-hidden group"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
          <span className="relative z-10">Спробувати знову</span>
        </button>
      </div>
    );
  }

  const getStatusBadge = (product) => {
    const stockQuantity = product.stock_quantity || 0;
    
    if (!product.is_active) return 'bg-gray-100 text-gray-800';
    if (stockQuantity === 0) return 'bg-red-100 text-red-800';
    if (stockQuantity < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (product) => {
    const stockQuantity = product.stock_quantity || 0;
    
    if (!product.is_active) return 'Неактивний';
    if (stockQuantity === 0) return 'Немає в наявності';
    if (stockQuantity < 10) return 'Мало в наявності';
    return 'В наявності';
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 min-h-screen">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Товари
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Керуйте товарами вашого магазину
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {selectedProducts.size > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Дії ({selectedProducts.size})
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </button>
              {showBulkActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/60 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50/80 transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Активувати всі
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50/80 transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Деактивувати всі
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50/80 transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Видалити всі
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-xl text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg transform hover:scale-105 active:scale-95"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати товар
          </button>
        </div>
      </div>

      {/* Пошук */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4">
        <div className="flex items-center mb-3">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-semibold text-gray-800">Пошук товарів</h3>
        </div>
        <div className="flex items-center space-x-2 max-w-lg">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Назва, опис, SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 w-full px-3 py-2 border border-gray-200 rounded-lg bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 text-sm"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-1 text-sm font-medium"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            <span>Шукати</span>
          </button>
        </div>
      </div>

      {/* Фільтри */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4">
        <div className="flex items-center mb-3">
          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-800">Фільтри</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Категорія
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 appearance-none cursor-pointer text-sm"
              >
                <option value="">Всі категорії</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
            
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Статус
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 appearance-none cursor-pointer text-sm"
              >
                <option value="all">Всі</option>
                <option value="active">Активні</option>
                <option value="inactive">Неактивні</option>
                <option value="featured">Рекомендовані</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
            
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Сортування
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 appearance-none cursor-pointer text-sm"
              >
                <option value="name">За назвою (А-Я)</option>
                <option value="-name">За назвою (Я-А)</option>
                <option value="-created_at">За датою (нові)</option>
                <option value="created_at">За датою (старі)</option>
                <option value="price">За ціною (зростання)</option>
                <option value="-price">За ціною (спадання)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              На сторінку
            </label>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 appearance-none cursor-pointer text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-2xl p-6 shadow-lg border border-blue-200/50 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-sm font-semibold text-blue-700/80 truncate">
                Всього товарів
              </dt>
              <dd className="text-2xl font-bold text-blue-900">
                {pagination.count.toLocaleString()}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100/60 rounded-2xl p-6 shadow-lg border border-green-200/50 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-sm font-semibold text-green-700/80 truncate">
                Активні
              </dt>
              <dd className="text-2xl font-bold text-green-900">
                {products.filter(p => p.is_active).length.toLocaleString()}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/60 rounded-2xl p-6 shadow-lg border border-yellow-200/50 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-sm font-semibold text-yellow-700/80 truncate">
                Рекомендовані
              </dt>
              <dd className="text-2xl font-bold text-yellow-900">
                {products.filter(p => p.is_featured).length.toLocaleString()}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/60 rounded-2xl p-6 shadow-lg border border-purple-200/50 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-sm font-semibold text-purple-700/80 truncate">
                Середня ціна
              </dt>
              <dd className="text-2xl font-bold text-purple-900">
                {products.length > 0 
                  ? Math.round(products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / products.length).toLocaleString()
                  : 0
                } ₴
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Таблиця товарів */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/60">
            <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/40">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md transition-all duration-200 hover:scale-110"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Товар
                    {sortBy.includes('name') && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Ціна
                    {sortBy.includes('price') && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
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
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
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
                            <PhotoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku || 'Не вказано'}
                        </div>
                        {product.category && (
                          <div className="text-xs text-blue-600">
                            {product.category.name}
                          </div>
                        )}
                        {product.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            ⭐ Рекомендований
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {parseFloat(product.price || 0).toLocaleString()} ₴
                    </div>
                    {product.sale_price && (
                      <div className="text-xs text-red-600">
                        Акція: {parseFloat(product.sale_price).toLocaleString()} ₴
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_quantity || 0} шт
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(product)}`}>
                      {getStatusText(product)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
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
                        className={`${product.is_active ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                        title={product.is_active ? 'Деактивувати' : 'Активувати'}
                      >
                        {product.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button 
                        onClick={() => generateBarcode(product.id)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Генерувати штрихкод"
                      >
                        <PrinterIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => generateQRCode(product.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Генерувати QR код"
                      >
                        <QrCodeIcon className="h-4 w-4" />
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

      {/* Пагінація */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Показано {((pagination.current_page - 1) * pageSize) + 1} - {Math.min(pagination.current_page * pageSize, pagination.count)} з {pagination.count} товарів
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => fetchProducts(pagination.current_page - 1)}
              disabled={!pagination.previous}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Попередня
            </button>
            
            {[...Array(pagination.total_pages)].map((_, index) => {
              const page = index + 1;
              const isCurrentPage = page === pagination.current_page;
              const shouldShow = page === 1 || 
                               page === pagination.total_pages || 
                               (page >= pagination.current_page - 2 && page <= pagination.current_page + 2);
              
              if (!shouldShow) {
                if (page === pagination.current_page - 3 || page === pagination.current_page + 3) {
                  return <span key={page} className="px-3 py-2 text-sm font-medium text-gray-500">...</span>;
                }
                return null;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => fetchProducts(page)}
                  className={`px-3 py-2 text-sm font-medium border ${
                    isCurrentPage
                      ? 'text-blue-600 bg-blue-50 border-blue-500'
                      : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => fetchProducts(pagination.current_page + 1)}
              disabled={!pagination.next}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Наступна
            </button>
          </div>
        </div>
      )}

      {/* Порожній стан */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Немає товарів</h3>
          <p className="mt-1 text-sm text-gray-500">Почніть з додавання першого товару.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-xl text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg transform hover:scale-105 active:scale-95 relative overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
              <PlusIcon className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">Додати товар</span>
            </button>
          </div>
        </div>
      )}

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
          fetchProducts(pagination.current_page);
          setShowCreateModal(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
};

export default Products;
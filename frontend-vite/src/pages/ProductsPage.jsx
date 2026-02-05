import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

/**
 * Сторінка управління товарами магазину
 */
const ProductsPage = () => {
  const { storeId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [filters, storeId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (storeId) {
        params.store = storeId;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.category) {
        params.category = filters.category;
      }

      const response = await axios.get('/api/products/', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setProducts(response.data.results || response.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Помилка при завантаженні товарів');
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Ви впевнені що хочете видалити цей товар?')) {
      return;
    }

    try {
      await axios.delete(`/api/products/${productId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      alert('Помилка при видаленні товара');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🛍️ Товари</h1>
            <p className="text-gray-600 mt-2">
              Всього товарів: <strong>{products.length}</strong>
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            + Новий товар
          </button>
        </div>

        {/* Пошук та фільтри */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Пошук товарів..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Всі категорії</option>
              <option value="electronics">Електроніка</option>
              <option value="clothing">Одяг</option>
              <option value="food">Продукти</option>
              <option value="books">Книги</option>
              <option value="other">Інше</option>
            </select>
            <button
              onClick={() => setFilters({ search: '', category: '' })}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
            >
              Скинути
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Сітка товарів */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">Немає товарів</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              + Додати перший товар
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => setSelectedProduct(product)}
                onDelete={() => handleDeleteProduct(product.id)}
              />
            ))}
          </div>
        )}

        {/* Модальне вікно створення товара */}
        {showCreateModal && (
          <CreateProductModal
            onClose={() => {
              setShowCreateModal(false);
              fetchProducts();
            }}
            storeId={storeId}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Карточка товара
 */
const ProductCard = ({ product, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-600 text-sm">Ціна</p>
            <p className="text-2xl font-bold text-gray-900">
              {product.price} ₴
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Кількість</p>
            <p className="text-2xl font-bold text-gray-900">
              {product.stock}
            </p>
          </div>
        </div>

        {product.status === 'active' ? (
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mb-4">
            ✓ Активний
          </span>
        ) : (
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold mb-4">
            ⊘ Неактивний
          </span>
        )}

        <div className="flex gap-2">
          <Link
            to={`/products/${product.id}/edit`}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm transition-colors"
          >
            Редагувати
          </Link>
          <button
            onClick={onDelete}
            className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold text-sm transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Модальне вікно для створення товара
 */
const CreateProductModal = ({ onClose, storeId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'other',
    status: 'active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        '/api/products/',
        {
          ...formData,
          store: storeId,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      onClose();
    } catch (err) {
      alert('Помилка при створенні товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          ➕ Новий товар
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Назва */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Назва товара
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введіть назву"
            />
          </div>

          {/* Опис */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Опис
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введіть опис товара"
            />
          </div>

          {/* Ціна */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ціна (₴)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Кількість */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Наявна кількість
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {/* Категорія */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категорія
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="electronics">Електроніка</option>
              <option value="clothing">Одяг</option>
              <option value="food">Продукти</option>
              <option value="books">Книги</option>
              <option value="other">Інше</option>
            </select>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Активний</option>
              <option value="inactive">Неактивний</option>
            </select>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Створення...' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductsPage;

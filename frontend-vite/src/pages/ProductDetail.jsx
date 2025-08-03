import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  PhotoIcon,
  QrCodeIcon,
  PrinterIcon,
  EyeIcon,
  ShoppingCartIcon,
  CubeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import ProductModal from '../components/ProductModal';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Get store ID (from URL or user's first store)
  const currentStoreId = user?.stores?.[0]?.id || 1;

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/stores/${currentStoreId}/products/${productId}/`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Помилка завантаження товару');
      
      // Fallback mock data
      setProduct({
        id: productId,
        name: 'iPhone 15 Pro',
        description: 'Новий iPhone з потужним процесором A17 Pro, титановим корпусом та найкращою камерою в серії iPhone.',
        price: 45000,
        cost: 35000,
        stock_quantity: 5,
        status: 'active',
        category: { id: 1, name: 'Смартфони' },
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        weight: 0.187,
        dimensions: '146.6 x 70.6 x 8.25',
        meta_title: 'iPhone 15 Pro - купити в Україні',
        meta_description: 'iPhone 15 Pro з титановим корпусом та чіпом A17 Pro. Офіційна гарантія, доставка по Україні.',
        images: [
          { id: 1, image: '/api/placeholder/400/400', order: 0 },
          { id: 2, image: '/api/placeholder/400/400', order: 1 },
        ],
        variants: [
          { id: 1, name: '128GB Титановий', price: 45000, stock_quantity: 3 },
          { id: 2, name: '256GB Титановий', price: 50000, stock_quantity: 2 },
        ],
        barcode: '1234567890123',
        qr_code: 'QR123456',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T15:45:00Z',
      });
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
      setCategories([
        { id: 1, name: 'Смартфони' },
        { id: 2, name: 'Ноутбуки' },
        { id: 3, name: 'Планшети' },
      ]);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Ви впевнені, що хочете видалити цей товар?')) {
      try {
        await api.delete(`/products/stores/${currentStoreId}/products/${productId}/`);
        navigate('/products');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Помилка видалення товару');
      }
    }
  };

  const handleToggleStatus = async () => {
    try {
      await api.post(`/products/stores/${currentStoreId}/products/${productId}/toggle-status/`);
      fetchProduct();
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Помилка зміни статусу товару');
    }
  };

  const generateBarcode = async () => {
    try {
      const response = await api.post(`/products/api/${productId}/generate-barcode/`);
      setProduct(prev => ({ ...prev, barcode: response.data.barcode }));
      alert('Штрих-код згенеровано успішно');
    } catch (error) {
      console.error('Error generating barcode:', error);
      alert('Помилка генерації штрих-коду');
    }
  };

  const generateQRCode = async () => {
    try {
      const response = await api.post(`/products/api/${productId}/generate-qr/`);
      setProduct(prev => ({ ...prev, qr_code: response.data.qr_code }));
      alert('QR-код згенеровано успішно');
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Помилка генерації QR-коду');
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [productId, currentStoreId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/products')}
          className="btn-primary"
        >
          Повернутися до товарів
        </button>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product?.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Деталі товару • ID: {product?.id}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-secondary"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Редагувати
          </button>
          <button
            onClick={handleToggleStatus}
            className={`btn ${product?.status === 'active' ? 'btn-warning' : 'btn-success'}`}
          >
            {product?.status === 'active' ? 'Деактивувати' : 'Активувати'}
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Видалити
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Зображення</h3>
              
              {product?.images && product.images.length > 0 ? (
                <div>
                  {/* Main Image */}
                  <div className="mb-4">
                    <img
                      src={product.images[activeImageIndex]?.image || product.images[activeImageIndex]?.url}
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Thumbnails */}
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {product.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative rounded-lg overflow-hidden ${
                            index === activeImageIndex ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <img
                            src={image.image || image.url}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-16 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Немає зображень</p>
                </div>
              )}
            </div>
          </div>

          {/* Codes */}
          <div className="card mt-6">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Коди товару</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Штрих-код
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={product?.barcode || 'Не згенеровано'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <button
                      onClick={generateBarcode}
                      className="p-2 text-blue-600 hover:text-blue-900"
                      title="Згенерувати штрих-код"
                    >
                      <QrCodeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowBarcodeModal(true)}
                      className="p-2 text-gray-600 hover:text-gray-900"
                      title="Переглянути штрих-код"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR-код
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={product?.qr_code || 'Не згенеровано'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <button
                      onClick={generateQRCode}
                      className="p-2 text-blue-600 hover:text-blue-900"
                      title="Згенерувати QR-код"
                    >
                      <QrCodeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="p-2 text-gray-600 hover:text-gray-900"
                      title="Переглянути QR-код"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Основна інформація</h3>
                <span className={`badge ${getStatusBadge(product?.status, product?.stock_quantity || 0)}`}>
                  {getStatusText(product?.status, product?.stock_quantity || 0)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Назва</label>
                  <p className="mt-1 text-sm text-gray-900">{product?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Категорія</label>
                  <p className="mt-1 text-sm text-gray-900">{product?.category?.name || 'Не вказано'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ціна</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {product?.price?.toLocaleString()} ₴
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Собівартість</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {product?.cost ? `${product.cost.toLocaleString()} ₴` : 'Не вказано'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Кількість на складі</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <CubeIcon className="inline h-4 w-4 mr-1" />
                    {product?.stock_quantity || 0} шт
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Прибуток</label>
                  <p className="mt-1 text-sm text-green-600 font-medium">
                    {product?.price && product?.cost 
                      ? `${(product.price - product.cost).toLocaleString()} ₴`
                      : 'Розрахувати неможливо'
                    }
                  </p>
                </div>

                {product?.brand && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Бренд</label>
                    <p className="mt-1 text-sm text-gray-900">{product.brand}</p>
                  </div>
                )}

                {product?.model && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Модель</label>
                    <p className="mt-1 text-sm text-gray-900">{product.model}</p>
                  </div>
                )}

                {product?.weight && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Вага</label>
                    <p className="mt-1 text-sm text-gray-900">{product.weight} кг</p>
                  </div>
                )}

                {product?.dimensions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Розміри</label>
                    <p className="mt-1 text-sm text-gray-900">{product.dimensions} см</p>
                  </div>
                )}
              </div>

              {product?.description && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Опис</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Variants */}
          {product?.variants && product.variants.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Варіанти товару</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Назва варіанту
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ціна
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Кількість
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {product.variants.map((variant) => (
                        <tr key={variant.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {variant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {variant.price?.toLocaleString()} ₴
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {variant.stock_quantity || 0} шт
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SEO Info */}
          {(product?.meta_title || product?.meta_description) && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SEO інформація</h3>
                
                <div className="space-y-4">
                  {product?.meta_title && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SEO заголовок</label>
                      <p className="mt-1 text-sm text-gray-900">{product.meta_title}</p>
                    </div>
                  )}
                  
                  {product?.meta_description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SEO опис</label>
                      <p className="mt-1 text-sm text-gray-900">{product.meta_description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Системна інформація</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Створено</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {product?.created_at ? new Date(product.created_at).toLocaleString('uk-UA') : 'Невідомо'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Останнє оновлення</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {product?.updated_at ? new Date(product.updated_at).toLocaleString('uk-UA') : 'Невідомо'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ProductModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        product={product}
        storeId={currentStoreId}
        categories={categories}
        onSave={() => {
          fetchProduct();
          setShowEditModal(false);
        }}
      />
    </div>
  );
};

export default ProductDetail;
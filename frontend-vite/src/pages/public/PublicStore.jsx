import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { getResults } from '../../services/api';
import ShoppingCart from '../../components/ShoppingCart';
import CheckoutModal from '../../components/CheckoutModal';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ShareIcon,
  EyeIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import logger from '../../services/logger';

// ============================================================
// ProductQuickView Modal
// ============================================================
const ProductQuickView = ({ product, onClose, onAddToCart, favorites, onToggleFavorite, formatPrice }) => {
  if (!product) return null;

  const effectivePrice = product.sale_price || product.price;
  const discountPercent = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Image */}
            <div className="bg-gray-100 flex items-center justify-center">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center">
                  <EyeIcon className="h-24 w-24 text-gray-300" />
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="p-8 flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      i < Math.floor(product.rating) ? (
                        <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                      )
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {product.rating} ({product.reviews_count} відгуків)
                  </span>
                </div>
              )}

              {/* Description (full, not truncated) */}
              <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

              {/* Price */}
              <div className="mb-4">
                {product.sale_price ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-red-600">
                      {formatPrice(product.sale_price)}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="badge-sale">-{discountPercent}%</span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {/* Availability */}
              <div className="mb-2">
                {product.is_available && product.stock_quantity > 0 ? (
                  <span className="text-green-600 font-medium">
                    В наявності ({product.stock_quantity} шт.)
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Немає в наявності</span>
                )}
              </div>

              {/* SKU */}
              {product.sku && (
                <p className="text-sm text-gray-400 mb-6">Артикул: {product.sku}</p>
              )}

              {/* Actions */}
              <div className="mt-auto flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  disabled={!product.is_available || product.stock_quantity === 0}
                  className="btn btn-primary flex-1 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Додати до кошика
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(product.id);
                  }}
                  className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {favorites.includes(product.id) ? (
                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main PublicStore Component
// ============================================================
const PublicStore = () => {
  const { storeSlug } = useParams();

  // Existing state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [favorites, setFavorites] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // New state
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartBounce, setCartBounce] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // ----------------------------------------------------------
  // Data fetching
  // ----------------------------------------------------------

  // Store info
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['public-store', storeSlug],
    queryFn: async () => {
      try {
        const response = await api.get(`/stores/public/${storeSlug}/`);
        return response.data;
      } catch (error) {
        logger.error('Error fetching store:', error);
        return {
          id: 1,
          name: 'TechStore',
          slug: storeSlug,
          description: 'Інтернет-магазин електроніки та гаджетів',
          logo: null,
          banner: null,
          address: 'вул. Хрещатик, 1, Київ',
          phone: '+380 44 123 45 67',
          email: 'info@techstore.ua',
          website: 'https://techstore.ua',
          is_active: true,
          working_hours: 'Пн-Пт: 9:00-18:00, Сб: 10:00-16:00',
          social_links: {
            facebook: 'https://facebook.com/techstore',
            instagram: 'https://instagram.com/techstore',
            telegram: 'https://t.me/techstore'
          }
        };
      }
    },
    enabled: !!storeSlug,
  });

  // Products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['public-products', storeSlug, searchTerm, selectedCategory, sortBy],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);
        if (sortBy) params.append('ordering', sortBy);

        const response = await api.get(`/stores/public/${storeSlug}/products/?${params}`);
        return getResults(response.data);
      } catch (error) {
        logger.error('Error fetching products:', error);
        return [
          {
            id: 1,
            name: 'iPhone 15 Pro',
            description: 'Найновіший смартфон від Apple з потужним процесором A17 Pro',
            price: 45999.00,
            sale_price: null,
            image: null,
            images: [],
            category: { id: 1, name: 'Смартфони' },
            is_available: true,
            stock_quantity: 10,
            sku: 'IPHONE-15-PRO',
            rating: 4.8,
            reviews_count: 24
          },
          {
            id: 2,
            name: 'MacBook Air M2',
            description: 'Легкий та потужний ноутбук для професійної роботи',
            price: 54999.00,
            sale_price: 49999.00,
            image: null,
            images: [],
            category: { id: 2, name: 'Ноутбуки' },
            is_available: true,
            stock_quantity: 5,
            sku: 'MACBOOK-AIR-M2',
            rating: 4.9,
            reviews_count: 18
          },
          {
            id: 3,
            name: 'AirPods Pro',
            description: 'Бездротові навушники з активним шумопоглинанням',
            price: 8999.00,
            sale_price: null,
            image: null,
            images: [],
            category: { id: 3, name: 'Аксесуари' },
            is_available: true,
            stock_quantity: 15,
            sku: 'AIRPODS-PRO',
            rating: 4.7,
            reviews_count: 42
          }
        ];
      }
    },
    enabled: !!storeSlug,
  });

  // Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories', storeSlug],
    queryFn: async () => {
      try {
        const response = await api.get(`/stores/public/${storeSlug}/categories/`);
        return getResults(response.data);
      } catch (error) {
        return [
          { id: 1, name: 'Смартфони' },
          { id: 2, name: 'Ноутбуки' },
          { id: 3, name: 'Аксесуари' }
        ];
      }
    },
    enabled: !!storeSlug,
  });

  // ----------------------------------------------------------
  // Filtering & Sorting
  // ----------------------------------------------------------

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category.id.toString() === selectedCategory;

    // Price range filter
    const effectivePrice = product.sale_price || product.price;
    const matchesMinPrice = priceRange.min === '' || effectivePrice >= Number(priceRange.min);
    const matchesMaxPrice = priceRange.max === '' || effectivePrice <= Number(priceRange.max);

    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return (a.sale_price || a.price) - (b.sale_price || b.price);
      case 'price_desc':
        return (b.sale_price || b.price) - (a.sale_price || a.price);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'newest':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const toggleFavorite = (productId) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    toast.success(`${product.name} додано до кошика`);

    // Cart bounce animation
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 300);
  };

  const shareStore = () => {
    if (navigator.share) {
      navigator.share({
        title: store?.name,
        text: store?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Посилання скопійовано');
    }
  };

  const handleCheckout = (cart) => {
    setShowCheckout(true);
  };

  const handleOrderCreated = (order) => {
    setCartItems([]);
    setShowCheckout(false);
    toast.success(`Замовлення #${order.order_number || ''} успішно створено!`);
  };

  // ----------------------------------------------------------
  // Render helpers for stars
  // ----------------------------------------------------------
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) =>
      i < Math.floor(rating) ? (
        <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
      ) : (
        <StarIcon key={i} className="h-4 w-4 text-gray-300" />
      )
    );
  };

  // ----------------------------------------------------------
  // Loading state
  // ----------------------------------------------------------
  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Завантаження магазину...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Магазин не знайдено</h1>
          <p className="text-gray-600 mb-6">Перевірте правильність посилання</p>
          <Link to="/marketplace" className="btn btn-primary">
            Повернутися до маркетплейсу
          </Link>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ====== Header ====== */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {store.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
                <p className="text-sm text-gray-600 hidden sm:block">{store.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={shareStore}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className={cartBounce ? 'animate-cart-bounce inline-block' : 'inline-block'}>
                  <ShoppingCartIcon className="h-6 w-6" />
                </span>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ====== Breadcrumb ====== */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm text-gray-500">
            <Link to="/marketplace" className="hover:text-blue-600 transition-colors">
              Маркетплейс
            </Link>
            <span className="mx-2">&rarr;</span>
            <span className="text-gray-900 font-medium">{store.name}</span>
          </nav>
        </div>
      </div>

      {/* ====== Banner ====== */}
      <div
        className="relative h-64 bg-cover bg-center"
        style={{
          backgroundImage: store.banner
            ? `url(${store.banner})`
            : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)'
        }}
      >
        {/* Gradient overlay (always shown) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Banner content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-6">
          {/* Store logo overlay */}
          {store.logo ? (
            <img
              src={store.logo}
              alt={store.name}
              className="h-20 w-20 rounded-2xl border-4 border-white shadow-xl object-cover mr-5 mb-1"
            />
          ) : (
            <div className="h-20 w-20 rounded-2xl border-4 border-white shadow-xl bg-blue-600 flex items-center justify-center mr-5 mb-1">
              <span className="text-white font-bold text-3xl">
                {store.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="text-white">
            <h2 className="text-3xl font-bold mb-1 drop-shadow-lg">{store.name}</h2>
            <p className="text-white/80 text-sm mb-2 max-w-xl">{store.description}</p>
            <div className="flex items-center gap-4">
              {/* Rating on banner */}
              <div className="flex items-center">
                {renderStars(store.rating || 4.8)}
                <span className="text-white/90 text-sm ml-1.5">
                  {store.rating || '4.8'}
                </span>
              </div>
              {/* Products count */}
              <span className="text-white/70 text-sm">
                {products.length} товарів
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ====== Main Content ====== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ====== Sidebar ====== */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Store Contacts */}
              <div className="card card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Контакти</h3>
                <div className="space-y-3">
                  {store.address && (
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{store.address}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${store.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {store.phone}
                      </a>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${store.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {store.email}
                      </a>
                    </div>
                  )}
                  {store.working_hours && (
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{store.working_hours}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="card card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Категорії</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      !selectedCategory
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Всі товари ({products.length})
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id.toString())}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        selectedCategory === category.id.toString()
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {category.name} ({products.filter(p => p.category.id === category.id).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="card card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Діапазон цін</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="form-label text-xs text-gray-500">Від</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="input"
                      min="0"
                    />
                  </div>
                  <span className="text-gray-400 mt-5">&mdash;</span>
                  <div className="flex-1">
                    <label className="form-label text-xs text-gray-500">До</label>
                    <input
                      type="number"
                      placeholder="99999"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="input"
                      min="0"
                    />
                  </div>
                </div>
                {(priceRange.min || priceRange.max) && (
                  <button
                    onClick={() => setPriceRange({ min: '', max: '' })}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Скинути ціну
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ====== Main Content Area ====== */}
          <div className="lg:col-span-3">
            {/* Filter Bar */}
            <div className="card card-body mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Пошук товарів..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input flex-1 sm:w-48"
                  >
                    <option value="name">За назвою</option>
                    <option value="price_asc">За ціною ↑</option>
                    <option value="price_desc">За ціною ↓</option>
                    <option value="rating">За рейтингом</option>
                    <option value="newest">Новинки</option>
                  </select>

                  {/* View mode toggle */}
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-100'
                      }`}
                      title="Плиткою"
                    >
                      <Squares2X2Icon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-100'
                      }`}
                      title="Списком"
                    >
                      <ListBulletIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-3 text-sm text-gray-500">
                Знайдено: {sortedProducts.length} товарів
              </div>
            </div>

            {/* ====== Products ====== */}
            {productsLoading ? (
              /* Loading skeletons */
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {[...Array(6)].map((_, i) => (
                  viewMode === 'grid' ? (
                    <div key={i} className="bg-white rounded-xl shadow overflow-hidden">
                      <div className="h-48 shimmer"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 shimmer rounded w-3/4"></div>
                        <div className="h-4 shimmer rounded w-full"></div>
                        <div className="h-6 shimmer rounded w-1/2"></div>
                        <div className="h-10 shimmer rounded"></div>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="bg-white rounded-xl shadow overflow-hidden flex">
                      <div className="w-48 h-48 shimmer flex-shrink-0"></div>
                      <div className="p-4 flex-1 space-y-3">
                        <div className="h-5 shimmer rounded w-1/3"></div>
                        <div className="h-4 shimmer rounded w-full"></div>
                        <div className="h-4 shimmer rounded w-2/3"></div>
                        <div className="h-6 shimmer rounded w-1/4"></div>
                        <div className="h-10 shimmer rounded w-1/3"></div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              viewMode === 'grid' ? (
                /* ====== GRID VIEW ====== */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map(product => (
                    <div
                      key={product.id}
                      className="card product-card cursor-pointer transition-shadow hover:shadow-lg"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="relative overflow-hidden rounded-t-lg">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-48 object-cover product-card-img transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <EyeIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {/* Sale badge */}
                        {product.sale_price && (
                          <div className="absolute top-2 left-2 badge-sale">
                            -{Math.round((1 - product.sale_price / product.price) * 100)}%
                          </div>
                        )}

                        {/* Favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                        >
                          {favorites.includes(product.id) ? (
                            <HeartIconSolid className="h-5 w-5 text-red-500" />
                          ) : (
                            <HeartIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Rating */}
                        {product.rating && (
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {renderStars(product.rating)}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">
                              {product.rating} ({product.reviews_count})
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            {product.sale_price ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-red-600">
                                  {formatPrice(product.sale_price)}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                          <div className="text-sm">
                            {product.is_available && product.stock_quantity > 0 ? (
                              <span className="text-green-600 font-medium">В наявності</span>
                            ) : (
                              <span className="text-red-600 font-medium">Немає</span>
                            )}
                          </div>
                        </div>

                        {/* Add to cart button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          disabled={!product.is_available || product.stock_quantity === 0}
                          className="btn btn-primary w-full disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <ShoppingCartIcon className="h-5 w-5 mr-2" />
                          Додати до кошика
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ====== LIST VIEW ====== */
                <div className="space-y-4">
                  {sortedProducts.map(product => (
                    <div
                      key={product.id}
                      className="card product-card cursor-pointer transition-shadow hover:shadow-lg flex flex-col sm:flex-row overflow-hidden"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {/* Image */}
                      <div className="relative overflow-hidden flex-shrink-0 w-full sm:w-48 h-48">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover product-card-img transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <EyeIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {product.sale_price && (
                          <div className="absolute top-2 left-2 badge-sale">
                            -{Math.round((1 - product.sale_price / product.price) * 100)}%
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                            {product.name}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(product.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors ml-3 flex-shrink-0"
                          >
                            {favorites.includes(product.id) ? (
                              <HeartIconSolid className="h-5 w-5 text-red-500" />
                            ) : (
                              <HeartIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Rating */}
                        {product.rating && (
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {renderStars(product.rating)}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">
                              {product.rating} ({product.reviews_count})
                            </span>
                          </div>
                        )}

                        <div className="mt-auto flex items-center justify-between">
                          {/* Price */}
                          <div>
                            {product.sale_price ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-red-600">
                                  {formatPrice(product.sale_price)}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold text-gray-900">
                                {formatPrice(product.price)}
                              </span>
                            )}
                            <div className="text-sm mt-0.5">
                              {product.is_available && product.stock_quantity > 0 ? (
                                <span className="text-green-600 font-medium">В наявності</span>
                              ) : (
                                <span className="text-red-600 font-medium">Немає в наявності</span>
                              )}
                            </div>
                          </div>

                          {/* Add to cart */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            disabled={!product.is_available || product.stock_quantity === 0}
                            className="btn btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            <ShoppingCartIcon className="h-5 w-5 mr-2" />
                            Додати до кошика
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* ====== Empty state ====== */
              <div className="text-center py-16">
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Товари не знайдено</h3>
                <p className="text-gray-600 mb-4">Спробуйте змінити параметри пошуку або фільтри</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setPriceRange({ min: '', max: '' });
                  }}
                  className="btn btn-primary"
                >
                  Скинути всі фільтри
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== Product Quick View Modal ====== */}
      <ProductQuickView
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        formatPrice={formatPrice}
      />

      {/* ====== Shopping Cart ====== */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        storeSlug={storeSlug}
        onCheckout={handleCheckout}
      />

      {/* ====== Checkout Modal ====== */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={{ items: cartItems, total_amount: cartItems.reduce((s, i) => s + (i.sale_price || i.price) * i.quantity, 0), items_count: cartItems.reduce((s, i) => s + i.quantity, 0) }}
        storeSlug={storeSlug}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};

export default PublicStore;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import ShoppingCart from '../../components/ShoppingCart';
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
  EyeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const PublicStore = () => {
  const { storeSlug } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [favorites, setFavorites] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Отримуємо інформацію про магазин
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['public-store', storeSlug],
    queryFn: async () => {
      try {
        const response = await api.get(`/stores/public/${storeSlug}/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching store:', error);
        // Mock data
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

  // Отримуємо товари магазину
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['public-products', storeSlug, searchTerm, selectedCategory, sortBy],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);
        if (sortBy) params.append('ordering', sortBy);
        
        const response = await api.get(`/stores/public/${storeSlug}/products/?${params}`);
        return response.data.results || response.data;
      } catch (error) {
        console.error('Error fetching products:', error);
        // Mock data
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

  // Отримуємо категорії
  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories', storeSlug],
    queryFn: async () => {
      try {
        const response = await api.get(`/stores/public/${storeSlug}/categories/`);
        return response.data.results || response.data;
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

  // Фільтрація товарів
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category.id.toString() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Сортування товарів
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

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Магазин не знайдено</h1>
          <p className="text-gray-600">Перевірте правильність посилання</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <p className="text-sm text-gray-600">{store.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={shareStore}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {store.banner ? (
        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${store.banner})` }}>
          <div className="h-48 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-2">Ласкаво просимо до {store.name}</h2>
              <p className="text-lg">{store.description}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold">Ласкаво просимо до {store.name}</h2>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Store Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Контакти</h3>
                <div className="space-y-3">
                  {store.address && (
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-600">{store.address}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <a href={`tel:${store.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {store.phone}
                      </a>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <a href={`mailto:${store.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {store.email}
                      </a>
                    </div>
                  )}
                  {store.working_hours && (
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-600">{store.working_hours}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Категорії</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !selectedCategory ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Всі товари ({products.length})
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id.toString())}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedCategory === category.id.toString() 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {category.name} ({products.filter(p => p.category.id === category.id).length})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
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
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name">За назвою</option>
                    <option value="price_asc">За ціною ↑</option>
                    <option value="price_desc">За ціною ↓</option>
                    <option value="rating">За рейтингом</option>
                    <option value="newest">Новинки</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="relative">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                          <EyeIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {product.sale_price && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          -{Math.round((1 - product.sale_price / product.price) * 100)}%
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                      >
                        {favorites.includes(product.id) ? (
                          <HeartIconSolid className="h-5 w-5 text-red-500" />
                        ) : (
                          <HeartIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      
                      {product.rating && (
                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(product.rating) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">
                            {product.rating} ({product.reviews_count})
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          {product.sale_price ? (
                            <div>
                              <span className="text-lg font-bold text-red-600">
                                {formatPrice(product.sale_price)}
                              </span>
                              <span className="text-sm text-gray-500 line-through ml-2">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {product.is_available && product.stock_quantity > 0 ? (
                            <span className="text-green-600">В наявності</span>
                          ) : (
                            <span className="text-red-600">Немає в наявності</span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => addToCart(product)}
                        disabled={!product.is_available || product.stock_quantity === 0}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <ShoppingCartIcon className="h-5 w-5 mr-2" />
                        Додати до кошика
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Товари не знайдено</h3>
                <p className="text-gray-600">Спробуйте змінити параметри пошуку</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shopping Cart */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        storeSlug={storeSlug}
        onUpdateItems={setCartItems}
      />
    </div>
  );
};

export default PublicStore;
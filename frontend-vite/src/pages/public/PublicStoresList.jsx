import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  EyeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  FunnelIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Gradient palettes for store cards
const cardGradients = [
  'from-blue-500 via-blue-600 to-indigo-700',
  'from-purple-500 via-purple-600 to-pink-600',
  'from-emerald-500 via-teal-600 to-cyan-700',
  'from-orange-500 via-red-500 to-pink-600',
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-cyan-500 via-blue-500 to-indigo-600',
  'from-rose-500 via-pink-500 to-fuchsia-600',
  'from-amber-500 via-orange-500 to-red-500',
];

const PublicStoresList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState('');

  // Отримуємо список публічних магазинів
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['public-stores', searchTerm, selectedCategory, selectedCity],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedCity) params.append('city', selectedCity);

        const response = await api.get(`/stores/public/?${params}`);
        return response.data.results || response.data;
      } catch (error) {
        console.error('Error fetching stores:', error);
        // Mock data
        return [
          {
            id: 1,
            name: 'TechStore',
            slug: 'techstore',
            description: 'Інтернет-магазин електроніки та гаджетів. Найкращі ціни та швидка доставка по всій Україні.',
            logo: null,
            banner: null,
            address: 'вул. Хрещатик, 1, Київ',
            city: 'Київ',
            phone: '+380 44 123 45 67',
            email: 'info@techstore.ua',
            is_active: true,
            working_hours: 'Пн-Пт: 9:00-18:00',
            rating: 4.8,
            reviews_count: 156,
            products_count: 250,
            categories: ['Електроніка', 'Гаджети'],
            featured: true,
            is_new: false
          },
          {
            id: 2,
            name: 'Fashion Hub',
            slug: 'fashion-hub',
            description: 'Модний одяг та аксесуари для всієї родини. Світові бренди та українські дизайнери.',
            logo: null,
            banner: null,
            address: 'вул. Саксаганського, 15, Київ',
            city: 'Київ',
            phone: '+380 44 234 56 78',
            email: 'info@fashionhub.ua',
            is_active: true,
            working_hours: 'Пн-Нд: 10:00-22:00',
            rating: 4.6,
            reviews_count: 89,
            products_count: 1200,
            categories: ['Одяг', 'Аксесуари'],
            featured: false,
            is_new: true
          },
          {
            id: 3,
            name: 'Home & Garden',
            slug: 'home-garden',
            description: 'Все для дому та саду. Меблі, декор, садові інструменти та насіння.',
            logo: null,
            banner: null,
            address: 'пр. Перемоги, 50, Львів',
            city: 'Львів',
            phone: '+380 32 345 67 89',
            email: 'info@homegarden.ua',
            is_active: true,
            working_hours: 'Пн-Сб: 8:00-20:00',
            rating: 4.7,
            reviews_count: 203,
            products_count: 800,
            categories: ['Дім', 'Сад'],
            featured: true,
            is_new: false
          },
          {
            id: 4,
            name: 'SportLife',
            slug: 'sportlife',
            description: 'Спортивні товари для активного способу життя.',
            logo: null,
            banner: null,
            address: 'вул. Шевченка, 25, Одеса',
            city: 'Одеса',
            phone: '+380 48 456 78 90',
            email: 'info@sportlife.ua',
            is_active: true,
            working_hours: 'Пн-Нд: 9:00-21:00',
            rating: 4.5,
            reviews_count: 67,
            products_count: 430,
            categories: ['Спорт', 'Активний відпочинок'],
            featured: false,
            is_new: true
          }
        ];
      }
    },
  });

  // Отримуємо категорії магазинів
  const { data: storeCategories = [] } = useQuery({
    queryKey: ['store-categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/stores/categories/');
        return response.data.results || response.data;
      } catch (error) {
        return ['Електроніка', 'Одяг', 'Дім', 'Сад', 'Гаджети', 'Аксесуари', 'Спорт'];
      }
    },
  });

  // Отримуємо міста
  const { data: cities = [] } = useQuery({
    queryKey: ['store-cities'],
    queryFn: async () => {
      try {
        const response = await api.get('/stores/cities/');
        return response.data.results || response.data;
      } catch (error) {
        return ['Київ', 'Львів', 'Одеса', 'Харків', 'Дніпро'];
      }
    },
  });

  // Обчислюємо загальну статистику
  const totalProducts = useMemo(() => stores.reduce((sum, s) => sum + (s.products_count || 0), 0), [stores]);
  const totalReviews = useMemo(() => stores.reduce((sum, s) => sum + (s.reviews_count || 0), 0), [stores]);

  // Перевіряємо чи є активні фільтри
  const hasActiveFilters = searchTerm || selectedCategory || selectedCity || sortBy;

  // Скидання всіх фільтрів
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedCity('');
    setSortBy('');
  };

  // Фільтрація магазинів
  const filteredStores = useMemo(() => {
    let result = stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           store.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory ||
                             store.categories.some(cat => cat.toLowerCase().includes(selectedCategory.toLowerCase()));
      const matchesCity = !selectedCity || store.city === selectedCity;

      return matchesSearch && matchesCategory && matchesCity;
    });

    // Сортування
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'products_count') {
      result = [...result].sort((a, b) => (b.products_count || 0) - (a.products_count || 0));
    }

    return result;
  }, [stores, searchTerm, selectedCategory, selectedCity, sortBy]);

  // Розділяємо на рекомендовані та звичайні
  const featuredStores = filteredStores.filter(store => store.featured);
  const regularStores = filteredStores.filter(store => !store.featured);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:inline">На головну</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">SaaS Marketplace</h1>
                <p className="text-sm text-gray-600">Каталог магазинів</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with animated gradient */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 py-20 overflow-hidden">
        {/* Floating decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-white/10 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-10 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-float"></div>
        <div className="absolute bottom-5 right-1/3 w-16 h-16 bg-white/10 rounded-full animate-float-delayed"></div>
        <div className="absolute top-5 left-1/2 w-12 h-12 bg-white/5 rounded-full animate-float"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
            Знайдіть ідеальний магазин
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Тисячі товарів від перевірених продавців з усієї України. Обирайте найкраще для себе та своїх близьких.
          </p>

          {/* Counter Stats */}
          <div className="flex items-center justify-center gap-8 mb-10">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <BuildingStorefrontIcon className="h-5 w-5 text-blue-200" />
                <span className="text-3xl font-bold text-white">{stores.length}</span>
              </div>
              <span className="text-sm text-blue-200">Магазинів</span>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <ShoppingBagIcon className="h-5 w-5 text-blue-200" />
                <span className="text-3xl font-bold text-white">{totalProducts}</span>
              </div>
              <span className="text-sm text-blue-200">Товарів</span>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-200" />
                <span className="text-3xl font-bold text-white">{totalReviews}</span>
              </div>
              <span className="text-sm text-blue-200">Відгуків</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="h-6 w-6 absolute left-5 top-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Пошук магазинів за назвою або описом..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 text-lg bg-white border-0 rounded-2xl focus:ring-4 focus:ring-white/30 focus:outline-none shadow-2xl placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="card card-body space-y-6 sticky top-24">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Фільтри</h3>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors duration-200"
                    >
                      Скинути фільтри
                    </button>
                  )}
                </div>

                {/* Знайдено магазинів */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Знайдено {filteredStores.length} магазинів
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Sorting */}
                  <div>
                    <label className="form-label">
                      Сортування
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="input"
                    >
                      <option value="">За замовчуванням</option>
                      <option value="name">За назвою</option>
                      <option value="rating">За рейтингом</option>
                      <option value="products_count">За кількістю товарів</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">
                      Категорія
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input"
                    >
                      <option value="">Всі категорії</option>
                      {storeCategories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">
                      Місто
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="input"
                    >
                      <option value="">Всі міста</option>
                      {cities.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Статистика</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Всього магазинів:</span>
                    <span className="font-semibold text-gray-900">{stores.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Активних:</span>
                    <span className="font-semibold text-gray-900">{stores.filter(s => s.is_active).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Рекомендованих:</span>
                    <span className="font-semibold text-gray-900">{featuredStores.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Загалом товарів:</span>
                    <span className="font-semibold text-gray-900">{totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Загалом відгуків:</span>
                    <span className="font-semibold text-gray-900">{totalReviews}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-10">
            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="h-48 bg-gray-200 shimmer"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-5 bg-gray-200 rounded-lg shimmer w-3/5"></div>
                      <div className="h-4 bg-gray-200 rounded-lg shimmer w-full"></div>
                      <div className="h-4 bg-gray-200 rounded-lg shimmer w-4/5"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded-lg shimmer w-20"></div>
                        <div className="h-8 bg-gray-200 rounded-lg shimmer w-20"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded-lg shimmer w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Featured Stores */}
                {featuredStores.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <SparklesIcon className="h-7 w-7 text-yellow-500" />
                      <h3 className="text-2xl font-bold text-gray-900">Рекомендовані магазини</h3>
                    </div>
                    <p className="text-gray-500 mb-6">
                      Знайдено {featuredStores.length} магазинів
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {featuredStores.map((store, index) => (
                        <StoreCard key={store.id} store={store} featured={true} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Stores */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {featuredStores.length > 0 ? 'Всі магазини' : 'Магазини'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Знайдено {regularStores.length} магазинів
                  </p>

                  {regularStores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {regularStores.map((store, index) => (
                        <StoreCard key={store.id} store={store} featured={false} index={index + featuredStores.length} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                      <BuildingStorefrontIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Магазини не знайдено</h3>
                      <p className="text-gray-500 mb-6">Спробуйте змінити параметри пошуку або скиньте фільтри</p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="btn btn-primary"
                        >
                          Скинути фільтри
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <BuildingStorefrontIcon className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold text-white">SaaS Marketplace</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Платформа для створення та управління інтернет-магазинами. Об&apos;єднуємо продавців та покупців з усієї України.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Навігація</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Головна
                  </Link>
                </li>
                <li>
                  <Link to="/stores" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Каталог магазинів
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Увійти
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Реєстрація
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Контакти</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center space-x-2">
                  <MapPinIcon className="h-4 w-4" />
                  <span>Україна, Київ</span>
                </li>
                <li className="flex items-center space-x-2">
                  <PhoneIcon className="h-4 w-4" />
                  <span>+380 44 000 00 00</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SaaS Marketplace. Всі права захищені.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Render star rating
const RenderStars = ({ rating }) => {
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating || 0) - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <StarIconSolid key={`full-${i}`} className="h-4 w-4 text-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <StarIcon className="h-4 w-4 text-yellow-400" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <StarIconSolid className="h-4 w-4 text-yellow-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      ))}
    </div>
  );
};

// Store Card Component
const StoreCard = ({ store, featured, index }) => {
  const gradientClass = cardGradients[index % cardGradients.length];

  return (
    <div
      className={`card overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
        featured ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      {/* Featured badge */}
      {featured && (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 px-4 py-1.5 text-xs font-bold text-center tracking-wide uppercase">
          Рекомендований магазин
        </div>
      )}

      {/* Banner area */}
      <div className="relative">
        {store.banner ? (
          <img
            src={store.banner}
            alt={store.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className={`w-full h-48 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
            <BuildingStorefrontIcon className="h-16 w-16 text-white/80" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {store.is_new && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg">
              Новий
            </span>
          )}
          {store.products_count > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 shadow-lg backdrop-blur-sm">
              <ShoppingBagIcon className="h-3.5 w-3.5 mr-1" />
              {store.products_count} товарів
            </span>
          )}
        </div>

        {store.logo && (
          <div className="absolute bottom-4 left-4">
            <img
              src={store.logo}
              alt={store.name}
              className="h-14 w-14 rounded-xl border-2 border-white shadow-lg object-cover"
            />
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Title + Rating */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">{store.name}</h3>
          {store.rating != null && (
            <div className="flex flex-col items-end ml-3 shrink-0">
              <RenderStars rating={store.rating} />
              <span className="text-xs text-gray-500 mt-0.5">
                {store.rating} ({store.reviews_count} відгуків)
              </span>
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{store.description}</p>

        {/* Info rows */}
        <div className="space-y-2 mb-4">
          {store.address && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPinIcon className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
              <span className="truncate">{store.address}</span>
            </div>
          )}
          {store.phone && (
            <div className="flex items-center text-sm text-gray-500">
              <PhoneIcon className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
              {store.phone}
            </div>
          )}
          {store.working_hours && (
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
              {store.working_hours}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-wrap gap-1.5">
            {store.categories.slice(0, 2).map(category => (
              <span
                key={category}
                className="badge badge-primary"
              >
                {category}
              </span>
            ))}
            {store.categories.length > 2 && (
              <span className="badge badge-secondary">
                +{store.categories.length - 2}
              </span>
            )}
          </div>
        </div>

        <Link
          to={`/store/${store.slug}`}
          className="btn btn-primary w-full justify-center"
        >
          <EyeIcon className="h-5 w-5 mr-2" />
          Переглянути магазин
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default PublicStoresList;

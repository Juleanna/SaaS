import React, { useState } from 'react';
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
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const PublicStoresList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

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
            description: 'Інтернет-магазин електроніки та гаджетів',
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
            featured: true
          },
          {
            id: 2,
            name: 'Fashion Hub',
            slug: 'fashion-hub',
            description: 'Модний одяг та аксесуари для всієї родини',
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
            featured: false
          },
          {
            id: 3,
            name: 'Home & Garden',
            slug: 'home-garden',
            description: 'Все для дому та саду',
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
            featured: true
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
        return ['Електроніка', 'Одяг', 'Дім', 'Сад', 'Гаджети', 'Аксесуари'];
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

  // Фільтрація магазинів
  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || 
                           store.categories.some(cat => cat.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesCity = !selectedCity || store.city === selectedCity;
    
    return matchesSearch && matchesCategory && matchesCity;
  });

  // Розділяємо на рекомендовані та звичайні
  const featuredStores = filteredStores.filter(store => store.featured);
  const regularStores = filteredStores.filter(store => !store.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">SaaS Marketplace</h1>
                <p className="text-sm text-gray-600">Каталог магазинів</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Знайдіть ідеальний магазин
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Тисячі товарів від перевірених продавців
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="h-6 w-6 absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Пошук магазинів..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-white focus:border-white shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Фільтри</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категорія
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Місто
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Всього магазинів:</span>
                    <span className="font-medium">{stores.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Активних:</span>
                    <span className="font-medium">{stores.filter(s => s.is_active).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Рекомендованих:</span>
                    <span className="font-medium">{featuredStores.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Stores */}
            {featuredStores.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Рекомендовані магазини</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredStores.map(store => (
                    <StoreCard key={store.id} store={store} featured={true} />
                  ))}
                </div>
              </div>
            )}

            {/* All Stores */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {featuredStores.length > 0 ? 'Всі магазини' : 'Магазини'}
              </h3>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                      <div className="p-6 space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : regularStores.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularStores.map(store => (
                    <StoreCard key={store.id} store={store} featured={false} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BuildingStorefrontIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Магазини не знайдено</h3>
                  <p className="text-gray-600">Спробуйте змінити параметри пошуку</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Store Card Component
const StoreCard = ({ store, featured }) => {
  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${featured ? 'ring-2 ring-yellow-400' : ''}`}>
      {featured && (
        <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-t-lg text-xs font-medium text-center">
          Рекомендований магазин
        </div>
      )}
      
      <div className="relative">
        {store.banner ? (
          <img
            src={store.banner}
            alt={store.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
            <BuildingStorefrontIcon className="h-16 w-16 text-white" />
          </div>
        )}
        
        {store.logo && (
          <div className="absolute bottom-4 left-4">
            <img
              src={store.logo}
              alt={store.name}
              className="h-12 w-12 rounded-lg border-2 border-white shadow-lg object-cover"
            />
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{store.name}</h3>
          {store.rating && (
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">
                {store.rating} ({store.reviews_count})
              </span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{store.description}</p>
        
        <div className="space-y-2 mb-4">
          {store.address && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2" />
              {store.address}
            </div>
          )}
          {store.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <PhoneIcon className="h-4 w-4 mr-2" />
              {store.phone}
            </div>
          )}
          {store.working_hours && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-2" />
              {store.working_hours}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{store.products_count}</span> товарів
          </div>
          <div className="flex flex-wrap gap-1">
            {store.categories.slice(0, 2).map(category => (
              <span
                key={category}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {category}
              </span>
            ))}
            {store.categories.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{store.categories.length - 2}
              </span>
            )}
          </div>
        </div>
        
        <Link
          to={`/store/${store.slug}`}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
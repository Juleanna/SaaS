import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, CubeIcon, ShoppingCartIcon, ChartBarIcon, PencilIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const StoreDetails = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();

  // Отримуємо дані магазину з API
  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      try {
        const response = await api.get(`/stores/${storeId}/`);
        return response.data;
      } catch (error) {
        console.error('Store fetch error:', error);
        // Fallback на мокові дані
        return {
          id: parseInt(storeId),
          name: 'Мій інтернет-магазин',
          slug: 'my-online-store',
          description: 'Продаж електроніки та аксесуарів',
          status: 'active',
          products_count: 12,
          orders_count: 8,
          revenue: 15600,
          created_at: '2024-01-15',
        };
      }
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Завантаження магазину...</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Магазин не знайдено</div>
        <Link to="/stores" className="btn-primary">
          Повернутися до списку
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Навігація назад */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/stores')}
          className="btn-outline flex items-center hover:scale-105 transition-transform"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Назад до магазинів
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/stores', { state: { editStore: store } })}
            className="btn-primary flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Редагувати магазин
          </button>
        </div>
      </div>

      {/* Hero секція з банером та інформацією */}
      <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl">
        {/* Банер */}
        {store.banner_image && (
          <div className="h-64 relative overflow-hidden">
            <img
              src={store.banner_image}
              alt="Store banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </div>
        )}
        
        {/* Головна інформація */}
        <div className="p-8 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Логотип */}
              <div className="flex-shrink-0">
                {store.logo ? (
                  <img
                    src={store.logo}
                    alt="Store logo"
                    className="w-20 h-20 object-cover rounded-2xl border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white">
                    <span className="text-white font-bold text-2xl">
                      {store.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <h1 className="text-4xl font-bold gradient-text-blue mb-2">{store.name}</h1>
                <p className="text-lg text-gray-600 mb-4 max-w-2xl">
                  {store.description || 'Опис магазину не вказано'}
                </p>
                <div className="flex items-center space-x-6">
                  <span className={`badge text-sm px-4 py-2 ${(store.is_active || store.status === 'active') ? 'badge-success' : 'badge-warning'}`}>
                    {(store.is_active || store.status === 'active') ? '🟢 Активний' : '🟡 Неактивний'}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-8m-8 4h16"/>
                    </svg>
                    Створено: {new Date(store.created_at).toLocaleDateString('uk-UA')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика з анімацією */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card hover:scale-105 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CubeIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {store.products_count || store.products || 0}
            </div>
            <div className="text-sm text-gray-600 font-medium">Товари в асортименті</div>
            <div className="mt-2">
              <Link
                to={`/stores/${store.id}/products`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Переглянути →
              </Link>
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShoppingCartIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {store.orders_count || store.orders || 0}
            </div>
            <div className="text-sm text-gray-600 font-medium">Всього замовлень</div>
            <div className="mt-2">
              <Link
                to={`/stores/${store.id}/orders`}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Переглянути →
              </Link>
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {store.revenue || 0}₴
            </div>
            <div className="text-sm text-gray-600 font-medium">Загальний дохід</div>
            <div className="mt-2">
              <span className="text-purple-600 text-sm font-medium">
                За весь час
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Швидкі дії з покращеним дизайном */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="card-body">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Швидкі дії</h2>
            <p className="text-gray-600">Керуйте вашим магазином</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to={`/stores/${store.id}/products`}
              className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <CubeIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Товари</h3>
              <p className="text-sm text-gray-600">Керування асортиментом</p>
            </Link>

            <Link
              to={`/stores/${store.id}/orders`}
              className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <ShoppingCartIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Замовлення</h3>
              <p className="text-sm text-gray-600">Обробка замовлень</p>
            </Link>

            <Link
              to={`/stores/${store.id}/analytics`}
              className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Аналітика</h3>
              <p className="text-sm text-gray-600">Звіти та статистика</p>
            </Link>

            <button
              onClick={() => navigate('/stores', { state: { editStore: store } })}
              className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <PencilIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Налаштування</h3>
              <p className="text-sm text-gray-600">Редагування магазину</p>
            </button>
          </div>
        </div>
      </div>

      {/* Детальна інформація */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Основна інформація */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="card-body">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Основна інформація</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="form-label flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  URL адреса
                </label>
                <div className="mt-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border">
                  <code className="text-blue-600 font-mono text-sm">{store.slug}</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(store.slug)}
                    className="ml-3 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    📋 Копіювати
                  </button>
                </div>
              </div>
              
              <div>
                <label className="form-label flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Статус
                </label>
                <div className="mt-2">
                  <span className={`badge text-sm px-4 py-2 ${(store.is_active || store.status === 'active') ? 'badge-success' : 'badge-warning'}`}>
                    {(store.is_active || store.status === 'active') ? '🟢 Активний' : '🟡 Неактивний'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="form-label flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                  Опис
                </label>
                <div className="mt-2 bg-gray-50 rounded-xl p-4 text-gray-700">
                  {store.description || 'Опис магазину не вказано'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Контактна інформація */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="card-body">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Контактна інформація</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="form-label flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  Телефон
                </label>
                <div className="mt-2 bg-gray-50 rounded-xl p-4">
                  {store.phone ? (
                    <a href={`tel:${store.phone}`} className="text-green-600 hover:text-green-700 font-medium">
                      {store.phone}
                    </a>
                  ) : (
                    <span className="text-gray-500">Не вказано</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="form-label flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Email
                </label>
                <div className="mt-2 bg-gray-50 rounded-xl p-4">
                  {store.email ? (
                    <a href={`mailto:${store.email}`} className="text-blue-600 hover:text-blue-700 font-medium">
                      {store.email}
                    </a>
                  ) : (
                    <span className="text-gray-500">Не вказано</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="form-label flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Адреса
                </label>
                <div className="mt-2 bg-gray-50 rounded-xl p-4 text-gray-700">
                  {store.address || 'Адреса не вказана'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Дизайн і SEO */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Кольорова схема */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Кольорова схема</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-lg mx-auto mb-2 border"
                  style={{ backgroundColor: store.primary_color || '#3B82F6' }}
                ></div>
                <div className="text-xs text-gray-500">Основний</div>
                <div className="text-xs font-mono">{store.primary_color || '#3B82F6'}</div>
              </div>
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-lg mx-auto mb-2 border"
                  style={{ backgroundColor: store.secondary_color || '#1F2937' }}
                ></div>
                <div className="text-xs text-gray-500">Додатковий</div>
                <div className="text-xs font-mono">{store.secondary_color || '#1F2937'}</div>
              </div>
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-lg mx-auto mb-2 border"
                  style={{ backgroundColor: store.accent_color || '#F59E0B' }}
                ></div>
                <div className="text-xs text-gray-500">Акцентний</div>
                <div className="text-xs font-mono">{store.accent_color || '#F59E0B'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO налаштування */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 mb-4">SEO налаштування</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Meta Title</label>
                <div className="mt-1 text-sm text-gray-900">
                  {store.meta_title || 'Не вказано'}
                </div>
              </div>
              
              <div>
                <label className="form-label">Meta Description</label>
                <div className="mt-1 text-sm text-gray-900">
                  {store.meta_description || 'Не вказано'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Налаштування лендингу */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Налаштування лендингу</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded ${store.show_telegram_button !== false ? 'bg-green-500' : 'bg-gray-300'} mr-3`}></div>
              <span className="text-sm text-gray-900">Показувати кнопку Telegram</span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded ${store.show_instagram_feed ? 'bg-green-500' : 'bg-gray-300'} mr-3`}></div>
              <span className="text-sm text-gray-900">Показувати Instagram стрічку</span>
            </div>
          </div>
        </div>
      </div>

      {/* Зображення */}
      {(store.logo || store.banner_image) && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Зображення магазину</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {store.logo && (
                <div>
                  <label className="form-label">Логотип</label>
                  <div className="mt-2">
                    <img
                      src={store.logo}
                      alt="Store logo"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              )}
              
              {store.banner_image && (
                <div>
                  <label className="form-label">Банер</label>
                  <div className="mt-2">
                    <img
                      src={store.banner_image}
                      alt="Store banner"
                      className="w-full max-w-md h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Соціальні мережі */}
      {store.social_links && store.social_links.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Соціальні мережі</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {store.social_links
                .filter(link => link.is_active)
                .map((link) => {
                  const getSocialIcon = (type) => {
                    const icons = {
                      instagram: '📷',
                      telegram: '📱',
                      facebook: '📘',
                      twitter: '🐦',
                      youtube: '📺',
                      website: '🌐'
                    };
                    return icons[type] || '🔗';
                  };

                  const getSocialName = (type) => {
                    const names = {
                      instagram: 'Instagram',
                      telegram: 'Telegram',
                      facebook: 'Facebook',
                      twitter: 'Twitter',
                      youtube: 'YouTube',
                      website: 'Веб-сайт'
                    };
                    return names[type] || type;
                  };

                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xl mr-3">{getSocialIcon(link.social_type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {link.title || getSocialName(link.social_type)}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {link.url}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Блоки контенту */}
      {store.blocks && store.blocks.length > 0 && (
        <div className="space-y-6">
          {store.blocks
            .filter(block => block.is_active)
            .sort((a, b) => a.order - b.order)
            .map((block) => {
              const getBlockIcon = (type) => {
                const icons = {
                  about: '📝',
                  contact: '📞',
                  faq: '❓',
                  custom: '🔧'
                };
                return icons[type] || '📄';
              };

              return (
                <div key={block.id} className="card">
                  <div className="card-body">
                    <div className="flex items-center mb-4">
                      <span className="text-xl mr-3">{getBlockIcon(block.block_type)}</span>
                      <h2 className="text-lg font-medium text-gray-900">{block.title}</h2>
                    </div>
                    
                    <div 
                      className="text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default StoreDetails;
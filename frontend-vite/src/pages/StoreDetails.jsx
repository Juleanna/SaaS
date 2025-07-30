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
    <div className="space-y-6">
      {/* Навігація назад */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/stores')}
          className="btn-outline flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Назад до магазинів
        </button>
      </div>

      {/* Банер магазину */}
      {store.banner_image && (
        <div className="mb-6">
          <img
            src={store.banner_image}
            alt="Store banner"
            className="w-full h-48 object-cover rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Логотип */}
          {store.logo && (
            <div className="flex-shrink-0">
              <img
                src={store.logo}
                alt="Store logo"
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {store.description || 'Без опису'}
            </p>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`badge ${(store.is_active || store.status === 'active') ? 'badge-success' : 'badge-warning'}`}>
                {(store.is_active || store.status === 'active') ? 'Активний' : 'Неактивний'}
              </span>
              <span className="text-sm text-gray-500">
                Створено: {new Date(store.created_at).toLocaleDateString('uk-UA')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/stores', { state: { editStore: store } })}
            className="btn-outline flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Редагувати
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {store.products_count || store.products || 0}
                </div>
                <div className="text-sm text-gray-500">Товари</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {store.orders_count || store.orders || 0}
                </div>
                <div className="text-sm text-gray-500">Замовлення</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {store.revenue || 0} ₴
                </div>
                <div className="text-sm text-gray-500">Дохід</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Швидкі дії */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Швидкі дії</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to={`/stores/${store.id}/products`}
              className="btn-outline flex items-center justify-center"
            >
              <CubeIcon className="h-4 w-4 mr-2" />
              Керувати товарами
            </Link>
            <Link
              to={`/stores/${store.id}/orders`}
              className="btn-outline flex items-center justify-center"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Переглянути замовлення
            </Link>
          </div>
        </div>
      </div>

      {/* Інформація про магазин */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Основна інформація */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Основна інформація</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">URL адреса</label>
                <div className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                  {store.slug}
                </div>
              </div>
              
              <div>
                <label className="form-label">Статус</label>
                <div className="mt-1">
                  <span className={`badge ${(store.is_active || store.status === 'active') ? 'badge-success' : 'badge-warning'}`}>
                    {(store.is_active || store.status === 'active') ? 'Активний' : 'Неактивний'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="form-label">Опис</label>
                <div className="mt-1 text-sm text-gray-900">
                  {store.description || 'Опис не вказано'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Контактна інформація */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Контактна інформація</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Телефон</label>
                <div className="mt-1 text-sm text-gray-900">
                  {store.phone || 'Не вказано'}
                </div>
              </div>
              
              <div>
                <label className="form-label">Email</label>
                <div className="mt-1 text-sm text-gray-900">
                  {store.email || 'Не вказано'}
                </div>
              </div>
              
              <div>
                <label className="form-label">Адреса</label>
                <div className="mt-1 text-sm text-gray-900">
                  {store.address || 'Не вказано'}
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
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  PencilIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  LinkIcon,
  Cog6ToothIcon,
  EyeIcon,
  SwatchIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CameraIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';

const StoreDetails = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [copiedSlug, setCopiedSlug] = useState(false);

  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      try {
        const response = await api.get(`/stores/${storeId}/`);
        return response.data;
      } catch (error) {
        console.error('Store fetch error:', error);
        return {
          id: parseInt(storeId),
          name: 'Мій інтернет-магазин',
          slug: 'my-online-store',
          description: 'Продаж електроніки та аксесуарів',
          status: 'active',
          is_active: true,
          products_count: 12,
          orders_count: 8,
          revenue: 15600,
          created_at: '2024-01-15',
        };
      }
    },
    retry: false,
  });

  const copySlug = () => {
    navigator.clipboard.writeText(`${window.location.origin}/store/${store.slug}`);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Завантаження магазину...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CubeIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Магазин не знайдено</h3>
        <p className="text-gray-500 mb-6">Перевірте посилання або поверніться до списку</p>
        <Link to="/stores" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          До списку магазинів
        </Link>
      </div>
    );
  }

  const isActive = store.is_active || store.status === 'active';
  const stats = [
    {
      label: 'Товарів',
      value: store.products_count || store.products || 0,
      icon: CubeIcon,
      color: 'blue',
      link: `/stores/${store.id}/products`,
    },
    {
      label: 'Замовлень',
      value: store.orders_count || store.orders || 0,
      icon: ShoppingCartIcon,
      color: 'green',
      link: `/stores/${store.id}/orders`,
    },
    {
      label: 'Дохід',
      value: `${(store.revenue || 0).toLocaleString('uk-UA')} ₴`,
      icon: ChartBarIcon,
      color: 'purple',
    },
  ];

  const gradients = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-violet-600',
    orange: 'from-orange-500 to-amber-600',
  };

  const bgLight = {
    blue: 'bg-blue-50',
    green: 'bg-emerald-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
  };

  const textColor = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/stores')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
          Магазини
        </button>

        <div className="flex items-center gap-2">
          {store.slug && (
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-1.5" />
              Переглянути
            </a>
          )}
          <button
            onClick={() => navigate('/stores', { state: { editStore: store } })}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Редагувати
          </button>
        </div>
      </div>

      {/* Store Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
        {/* Banner gradient */}
        <div className="h-32 relative overflow-hidden">
          {store.banner_image ? (
            <img src={store.banner_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Store info */}
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex items-end gap-5">
            {/* Logo */}
            {store.logo ? (
              <img
                src={store.logo}
                alt={store.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-white font-bold text-2xl">{store.name.charAt(0).toUpperCase()}</span>
              </div>
            )}

            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {isActive ? 'Активний' : 'Неактивний'}
                </span>
              </div>
              {store.description && (
                <p className="text-gray-500 text-sm">{store.description}</p>
              )}
            </div>
          </div>

          {/* URL bar */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
              <LinkIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <code className="text-sm text-blue-600 font-mono truncate">{window.location.origin}/store/{store.slug}</code>
            </div>
            <button
              onClick={copySlug}
              className={`inline-flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${copiedSlug ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {copiedSlug ? <CheckIcon className="h-4 w-4 mr-1" /> : <ClipboardDocumentIcon className="h-4 w-4 mr-1" />}
              {copiedSlug ? 'Скопійовано' : 'Копіювати'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[stat.color]} flex items-center justify-center`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              {stat.link && (
                <Link to={stat.link} className={`text-xs font-medium ${textColor[stat.color]} hover:underline`}>
                  Переглянути
                </Link>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Швидкі дії</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Додати товар', desc: 'Новий товар в каталог', icon: CubeIcon, color: 'blue', link: `/products` },
            { label: 'Замовлення', desc: 'Переглянути замовлення', icon: ShoppingCartIcon, color: 'green', link: `/orders` },
            { label: 'Аналітика', desc: 'Звіти та графіки', icon: ChartBarIcon, color: 'purple', link: `/stores/${store.id}/analytics` },
            { label: 'Налаштування', desc: 'Параметри магазину', icon: Cog6ToothIcon, color: 'orange', action: () => navigate('/stores', { state: { editStore: store } }) },
          ].map((item, i) => {
            const Wrapper = item.link ? Link : 'button';
            const props = item.link ? { to: item.link } : { onClick: item.action };
            return (
              <Wrapper key={i} {...props} className={`group flex flex-col items-center p-4 rounded-xl ${bgLight[item.color]} hover:shadow-md transition-all text-center`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[item.color]} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                <span className="text-xs text-gray-500 mt-0.5">{item.desc}</span>
              </Wrapper>
            );
          })}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <PhoneIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Контакти</h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: PhoneIcon, label: 'Телефон', value: store.phone, href: store.phone ? `tel:${store.phone}` : null },
              { icon: EnvelopeIcon, label: 'Email', value: store.email, href: store.email ? `mailto:${store.email}` : null },
              { icon: MapPinIcon, label: 'Адреса', value: store.address },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                <item.icon className="h-4.5 w-4.5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                  {item.value ? (
                    item.href ? (
                      <a href={item.href} className="text-sm text-blue-600 hover:underline">{item.value}</a>
                    ) : (
                      <span className="text-sm text-gray-900">{item.value}</span>
                    )
                  ) : (
                    <span className="text-sm text-gray-400 italic">Не вказано</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Design */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <SwatchIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Дизайн</h2>
          </div>

          {/* Colors */}
          <div className="mb-5">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Кольорова схема</div>
            <div className="flex items-center gap-3">
              {[
                { label: 'Основний', color: store.primary_color || '#3B82F6' },
                { label: 'Додатковий', color: store.secondary_color || '#1F2937' },
                { label: 'Акцент', color: store.accent_color || '#F59E0B' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
                  <div className="w-6 h-6 rounded-md border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: c.color }}></div>
                  <div>
                    <div className="text-xs text-gray-500">{c.label}</div>
                    <div className="text-xs font-mono text-gray-700">{c.color}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Елементи</div>
          <div className="space-y-2">
            {[
              { label: 'Кнопка Telegram', icon: ChatBubbleLeftRightIcon, active: store.show_telegram_button !== false },
              { label: 'Instagram стрічка', icon: CameraIcon, active: store.show_instagram_feed },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80">
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <div className={`w-8 h-5 rounded-full flex items-center transition-colors ${item.active ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                  <div className="w-3.5 h-3.5 bg-white rounded-full mx-0.5 shadow-sm"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEO */}
      {(store.meta_title || store.meta_description) && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <DocumentTextIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">SEO</h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-blue-700 text-base font-medium mb-1 truncate">
              {store.meta_title || store.name}
            </div>
            <div className="text-emerald-700 text-xs mb-1 truncate">
              {window.location.origin}/store/{store.slug}
            </div>
            <div className="text-gray-600 text-sm line-clamp-2">
              {store.meta_description || store.description || 'Опис не вказано'}
            </div>
          </div>
        </div>
      )}

      {/* Social Links */}
      {store.social_links && store.social_links.filter(l => l.is_active).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <GlobeAltIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Соціальні мережі</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {store.social_links.filter(l => l.is_active).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <div className="text-sm font-medium text-gray-900 flex-1 truncate">
                  {link.title || link.social_type}
                </div>
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Content Blocks */}
      {store.blocks && store.blocks.filter(b => b.is_active).length > 0 && (
        <div className="space-y-4">
          {store.blocks.filter(b => b.is_active).sort((a, b) => a.order - b.order).map((block) => (
            <div key={block.id} className="bg-white rounded-2xl border border-gray-200/80 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{block.title}</h2>
              <div className="text-gray-600 text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
            </div>
          ))}
        </div>
      )}

      {/* Footer meta */}
      <div className="text-center pb-4">
        <p className="text-xs text-gray-400">
          Створено {new Date(store.created_at).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default StoreDetails;

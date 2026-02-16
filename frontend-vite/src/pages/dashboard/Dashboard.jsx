import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBagIcon,
  CubeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  EyeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();

  // Отримуємо статистику дашборда
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Спробуємо отримати реальні дані з різних endpoints
        const [storesResponse, ordersResponse] = await Promise.allSettled([
          api.get('/stores/'),
          api.get('/orders/recent/?limit=1')
        ]);

        const stores_count = storesResponse.status === 'fulfilled' 
          ? (storesResponse.value.data.results || storesResponse.value.data || []).length 
          : 2;

        // Отримуємо кількість товарів з усіх магазинів користувача
        let products_count = 0;
        if (storesResponse.status === 'fulfilled') {
          const stores = storesResponse.value.data.results || storesResponse.value.data || [];
          const productPromises = stores.map(store => 
            api.get(`/products/stores/${store.id}/products/?page_size=1`).catch(() => ({ data: { count: 0 } }))
          );
          const productResponses = await Promise.allSettled(productPromises);
          products_count = productResponses.reduce((total, response) => {
            if (response.status === 'fulfilled') {
              return total + (response.value.data.count || 0);
            }
            return total;
          }, 0);
        }

        const orders_count = ordersResponse.status === 'fulfilled' 
          ? (ordersResponse.value.data.count || 128)
          : 128;

        // Fallback до mock даних з реальними отриманими значеннями
        return {
          stores_count,
          products_count,
          orders_count,
          total_revenue: 234500.00,
          monthly_revenue: 45600.00,
          weekly_orders: 23,
          conversion_rate: 3.2,
          average_order_value: 1832.00,
          trends: {
            orders: { value: 12, direction: 'up' },
            revenue: { value: 8.5, direction: 'up' },
            products: { value: 3, direction: 'up' },
            customers: { value: 15, direction: 'up' }
          }
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Fallback до mock даних
        return {
          stores_count: 2,
          products_count: 45,
          orders_count: 128,
          total_revenue: 234500.00,
          monthly_revenue: 45600.00,
          weekly_orders: 23,
          conversion_rate: 3.2,
          average_order_value: 1832.00,
          trends: {
            orders: { value: 12, direction: 'up' },
            revenue: { value: 8.5, direction: 'up' },
            products: { value: 3, direction: 'up' },
            customers: { value: 15, direction: 'up' }
          }
        };
      }
    },
  });

  // Отримуємо останні замовлення
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      try {
        const response = await api.get('/orders/recent/?limit=5');
        return response.data.results || response.data;
      } catch (error) {
        console.error('Error fetching recent orders:', error);
        // Mock реальних даних
        return [
          {
            id: 1,
            order_number: 'ORD-2024-001',
            customer: { first_name: 'Олександр', last_name: 'Петренко' },
            total_amount: 2350.00,
            status: 'confirmed',
            created_at: '2024-01-20T14:30:00Z',
            store: { name: 'TechStore' }
          },
          {
            id: 2,
            order_number: 'ORD-2024-002',
            customer: { first_name: 'Марія', last_name: 'Коваленко' },
            total_amount: 1890.00,
            status: 'processing',
            created_at: '2024-01-20T12:15:00Z',
            store: { name: 'Fashion Hub' }
          },
          {
            id: 3,
            order_number: 'ORD-2024-003',
            customer: { first_name: 'Іван', last_name: 'Сидоренко' },
            total_amount: 3200.00,
            status: 'shipped',
            created_at: '2024-01-19T18:45:00Z',
            store: { name: 'TechStore' }
          },
          {
            id: 4,
            order_number: 'ORD-2024-004',
            customer: { first_name: 'Анна', last_name: 'Мельник' },
            total_amount: 950.00,
            status: 'pending',
            created_at: '2024-01-19T16:20:00Z',
            store: { name: 'Home & Garden' }
          },
          {
            id: 5,
            order_number: 'ORD-2024-005',
            customer: { first_name: 'Дмитро', last_name: 'Кравченко' },
            total_amount: 4100.00,
            status: 'delivered',
            created_at: '2024-01-18T20:10:00Z',
            store: { name: 'TechStore' }
          }
        ];
      }
    },
  });

  // Отримуємо популярні товари
  const { data: topProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      try {
        // Спробуємо отримати топ товари з API
        const response = await api.get('/products/top/?limit=5');
        return response.data.results || response.data;
      } catch (error) {
        console.error('Error fetching top products:', error);
        // Якщо не вдалося, спробуємо отримати просто останні товари з магазинів
        try {
          const storesResponse = await api.get('/stores/');
          const stores = storesResponse.data.results || storesResponse.data || [];
          
          if (stores.length > 0) {
            const productsResponse = await api.get(`/products/stores/${stores[0].id}/products/?page_size=5&ordering=-created_at`);
            const products = productsResponse.data.results || [];
            
            return products.map(product => ({
              ...product,
              order_count: Math.floor(Math.random() * 50) + 1, // Mock продажів
              revenue: product.price * (Math.floor(Math.random() * 50) + 1),
              store: { name: stores[0].name }
            }));
          }
        } catch (err) {
          console.error('Error fetching products from stores:', err);
        }
        
        // Fallback до mock даних
        return [
          {
            id: 1,
            name: 'iPhone 15 Pro',
            sales_count: 23,
            revenue: 1035000.00,
            image: null,
            store: { name: 'TechStore' },
            price: 45000
          },
          {
            id: 2,
            name: 'MacBook Air M2',
            sales_count: 15,
            revenue: 824985.00,
            image: null,
            store: { name: 'TechStore' },
            price: 54999
          },
          {
            id: 3,
            name: 'Зимова куртка Nike',
            sales_count: 31,
            revenue: 95690.00,
            image: null,
            store: { name: 'Fashion Hub' },
            price: 3087
          }
        ];
      }
    },
  });

  const quickActions = [
    {
      name: 'Створити магазин',
      href: '/stores',
      icon: ShoppingBagIcon,
      description: 'Створіть новий магазин для продажів',
      color: 'bg-blue-500',
    },
    {
      name: 'Додати товар',
      href: '/products',
      icon: CubeIcon,
      description: 'Додайте новий товар до каталогу',
      color: 'bg-green-500',
    },
    {
      name: 'Переглянути замовлення',
      href: '/stores/1/orders',
      icon: ShoppingCartIcon,
      description: 'Перегляньте всі замовлення',
      color: 'bg-yellow-500',
    },
    {
      name: 'Управління цінами',
      href: '/pricelists',
      icon: CurrencyDollarIcon,
      description: 'Налаштуйте прайс-листи',
      color: 'bg-green-600',
    },
    {
      name: 'Склад',
      href: '/warehouse',
      icon: UserGroupIcon,
      description: 'Управління складськими залишками',
      color: 'bg-purple-500',
    },
    {
      name: 'Налаштування профілю',
      href: '/profile',
      icon: UserGroupIcon,
      description: 'Оновіть інформацію профілю',
      color: 'bg-indigo-500',
    },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrendIcon = (direction) => {
    return direction === 'up' ? ArrowUpIcon : ArrowDownIcon;
  };

  const getTrendColor = (direction) => {
    return direction === 'up' ? 'text-green-500' : 'text-red-500';
  };


  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-info',
      shipped: 'badge-success',
      delivered: 'badge-success',
      cancelled: 'badge-danger',
    };
    return statusMap[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Очікує підтвердження',
      confirmed: 'Підтверджено',
      processing: 'В обробці',
      shipped: 'Відправлено',
      delivered: 'Доставлено',
      cancelled: 'Скасовано',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Привіт, {user?.first_name || user?.username}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ось що відбувається у ваших магазинах сьогодні
            </p>
          </div>
        </div>
        <div className="text-right bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-600">Сьогодні</p>
          <p className="text-lg font-bold text-gray-900">
            {new Date().toLocaleDateString('uk-UA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Основна статистика */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 shadow-sm border border-blue-200/50 min-w-0 overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <ShoppingBagIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-blue-700/80 truncate">Магазини</dt>
              <dd className="flex items-baseline flex-wrap">
                <span className="text-xl font-bold text-blue-900">
                  {statsLoading ? '...' : (dashboardStats?.stores_count || 0)}
                </span>
                {dashboardStats?.trends?.stores && (
                  <span className={`ml-2 text-xs font-semibold ${getTrendColor(dashboardStats.trends.stores.direction)}`}>
                    {dashboardStats.trends.stores.direction === 'up' ? '\u2191' : '\u2193'}{dashboardStats.trends.stores.value}%
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 shadow-sm border border-green-200/50 min-w-0 overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-green-700/80 truncate">Товари</dt>
              <dd className="flex items-baseline flex-wrap">
                <span className="text-xl font-bold text-green-900">
                  {statsLoading ? '...' : (dashboardStats?.products_count || 0)}
                </span>
                {dashboardStats?.trends?.products && (
                  <span className={`ml-2 text-xs font-semibold ${getTrendColor(dashboardStats.trends.products.direction)}`}>
                    {dashboardStats.trends.products.direction === 'up' ? '\u2191' : '\u2193'}{dashboardStats.trends.products.value}%
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-5 shadow-sm border border-yellow-200/50 min-w-0 overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-11 h-11 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <ShoppingCartIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-yellow-700/80 truncate">Замовлення</dt>
              <dd className="flex items-baseline flex-wrap">
                <span className="text-xl font-bold text-yellow-900">
                  {statsLoading ? '...' : (dashboardStats?.orders_count || 0)}
                </span>
                {dashboardStats?.trends?.orders && (
                  <span className={`ml-2 text-xs font-semibold ${getTrendColor(dashboardStats.trends.orders.direction)}`}>
                    {dashboardStats.trends.orders.direction === 'up' ? '\u2191' : '\u2193'}{dashboardStats.trends.orders.value}%
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 shadow-sm border border-purple-200/50 min-w-0 overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-purple-700/80 truncate">Загальний дохід</dt>
              <dd className="flex items-baseline flex-wrap">
                <span className="text-lg font-bold text-purple-900 truncate">
                  {statsLoading ? '...' : formatPrice(dashboardStats?.total_revenue || 0)}
                </span>
                {dashboardStats?.trends?.revenue && (
                  <span className={`ml-1 text-xs font-semibold ${getTrendColor(dashboardStats.trends.revenue.direction)}`}>
                    {dashboardStats.trends.revenue.direction === 'up' ? '\u2191' : '\u2193'}{dashboardStats.trends.revenue.value}%
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Додаткова статистика */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-5 shadow-sm border border-indigo-200/50 min-w-0 overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-indigo-700/80 truncate">Середній чек</dt>
              <dd className="text-lg font-bold text-indigo-900 truncate">
                {statsLoading ? '...' : formatPrice(dashboardStats?.average_order_value || 0)}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 shadow-sm border border-orange-200/50 min-w-0 overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-orange-700/80 truncate">Замовлень за тиждень</dt>
              <dd className="text-lg font-bold text-orange-900">
                {statsLoading ? '...' : (dashboardStats?.weekly_orders || 0)}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-5 shadow-sm border border-pink-200/50 min-w-0 overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-pink-700/80 truncate">Конверсія</dt>
              <dd className="text-lg font-bold text-pink-900">
                {statsLoading ? '...' : `${dashboardStats?.conversion_rate || 0}%`}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Швидкі дії */}
      <div>
        <div className="flex items-center mb-6">
          <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">Швидкі дії</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="relative group bg-white p-6 focus-within:ring-4 focus-within:ring-blue-500/20 rounded-2xl shadow-sm hover:shadow-md border border-gray-200/50 transition-all duration-200"
            >
              <div>
                <span className={`rounded-xl inline-flex p-3 ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {action.name}
                </h3>
                <p className="mt-1 text-xs text-gray-600">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Останні замовлення */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200/50">
          <div className="px-6 py-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <ShoppingCartIcon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg leading-6 font-bold text-gray-900">Останні замовлення</h3>
              </div>
              <Link
                to="/stores/1/orders"
                className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Переглянути всі →
              </Link>
            </div>
            
            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <ShoppingCartIcon className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {order.order_number}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {order.customer.first_name} {order.customer.last_name} • {order.store.name}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(order.total_amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Немає замовлень</h3>
                <p className="mt-1 text-sm text-gray-500">Почніть продавати щоб побачити замовлення тут.</p>
              </div>
            )}
          </div>
        </div>

        {/* Популярні товари */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200/50">
          <div className="px-6 py-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                  <CubeIcon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg leading-6 font-bold text-gray-900">Популярні товари</h3>
              </div>
              <Link
                to="/products"
                className="text-sm font-semibold text-green-600 hover:text-green-500 transition-colors duration-200"
              >
                Переглянути всі →
              </Link>
            </div>
            
            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {topProducts.map((product) => (
                    <li key={product.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {product.image ? (
                            <img className="h-12 w-12 rounded object-cover" src={product.image} alt="" />
                          ) : (
                            <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                              <EyeIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {product.store?.name} • {product.order_count || product.sales_count || 0} продажів
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(product.revenue || (product.current_price * (product.order_count || 0)))}
                          </p>
                          <p className="text-xs text-gray-500">
                            дохід
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Немає товарів</h3>
                <p className="mt-1 text-sm text-gray-500">Додайте товари щоб побачити статистику продажів.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
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
        const response = await api.get('/dashboard/stats/');
        return response.data;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Mock реальних даних
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
        const response = await api.get('/products/top/?limit=5');
        return response.data.results || response.data;
      } catch (error) {
        console.error('Error fetching top products:', error);
        // Mock реальних даних
        return [
          {
            id: 1,
            name: 'iPhone 15 Pro',
            sales_count: 23,
            revenue: 1035000.00,
            image: null,
            store: { name: 'TechStore' }
          },
          {
            id: 2,
            name: 'MacBook Air M2',
            sales_count: 15,
            revenue: 824985.00,
            image: null,
            store: { name: 'TechStore' }
          },
          {
            id: 3,
            name: 'Зимова куртка Nike',
            sales_count: 31,
            revenue: 95690.00,
            image: null,
            store: { name: 'Fashion Hub' }
          },
          {
            id: 4,
            name: 'Кавомашина Delonghi',
            sales_count: 8,
            revenue: 67920.00,
            image: null,
            store: { name: 'Home & Garden' }
          },
          {
            id: 5,
            name: 'AirPods Pro',
            sales_count: 42,
            revenue: 377580.00,
            image: null,
            store: { name: 'TechStore' }
          }
        ];
      }
    },
  });

  const quickActions = [
    {
      name: 'Створити магазин',
      href: '/admin/stores',
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
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Привіт, {user?.first_name || user?.username}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ось що відбувається у ваших магазинах сьогодні
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Сьогодні</p>
          <p className="text-lg font-semibold text-gray-900">
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBagIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Магазини
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statsLoading ? '...' : dashboardStats?.stores_count || 0}
                    </div>
                    {dashboardStats?.trends?.stores && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(dashboardStats.trends.stores.direction)}`}>
                        {React.createElement(getTrendIcon(dashboardStats.trends.stores.direction), { className: 'h-4 w-4 flex-shrink-0 self-center' })}
                        <span className="sr-only">
                          {dashboardStats.trends.stores.direction === 'up' ? 'Збільшення' : 'Зменшення'} на
                        </span>
                        {dashboardStats.trends.stores.value}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Товари
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statsLoading ? '...' : dashboardStats?.products_count || 0}
                    </div>
                    {dashboardStats?.trends?.products && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(dashboardStats.trends.products.direction)}`}>
                        {React.createElement(getTrendIcon(dashboardStats.trends.products.direction), { className: 'h-4 w-4 flex-shrink-0 self-center' })}
                        {dashboardStats.trends.products.value}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Замовлення
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statsLoading ? '...' : dashboardStats?.orders_count || 0}
                    </div>
                    {dashboardStats?.trends?.orders && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(dashboardStats.trends.orders.direction)}`}>
                        {React.createElement(getTrendIcon(dashboardStats.trends.orders.direction), { className: 'h-4 w-4 flex-shrink-0 self-center' })}
                        {dashboardStats.trends.orders.value}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Загальний дохід
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statsLoading ? '...' : formatPrice(dashboardStats?.total_revenue || 0)}
                    </div>
                    {dashboardStats?.trends?.revenue && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(dashboardStats.trends.revenue.direction)}`}>
                        {React.createElement(getTrendIcon(dashboardStats.trends.revenue.direction), { className: 'h-4 w-4 flex-shrink-0 self-center' })}
                        {dashboardStats.trends.revenue.value}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Додаткова статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Середній чек
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsLoading ? '...' : formatPrice(dashboardStats?.average_order_value || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Замовлень за тиждень
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsLoading ? '...' : dashboardStats?.weekly_orders || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-pink-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Конверсія
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsLoading ? '...' : `${dashboardStats?.conversion_rate || 0}%`}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Швидкі дії */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Швидкі дії</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {action.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Останні замовлення */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Останні замовлення</h3>
              <Link
                to="/stores/1/orders"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Переглянути всі
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
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Популярні товари</h3>
              <Link
                to="/products"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Переглянути всі
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
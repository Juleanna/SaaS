import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

/**
 * Панель управління для продавця
 */
const DashboardPage = () => {
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_revenue: 0,
    today_orders: 0,
    today_revenue: 0
  });
  const [stores, setStores] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Отримання статистики
      const statsRes = await axios.get('/api/orders/statistics/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);

      // Отримання магазинів
      const storesRes = await axios.get('/api/stores/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(storesRes.data);

      // Отримання останніх замовлень
      const ordersRes = await axios.get('/api/orders/?limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentOrders(ordersRes.data);

      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Помилка при завантаженні даних');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Панель управління
          </h1>
          <p className="text-gray-600 mt-2">
            Добрий день! Ось огляд вашої діяльності
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Всього замовлень"
            value={stats.total_orders}
            icon="📦"
            color="blue"
          />
          <StatCard
            title="На розгляді"
            value={stats.pending_orders}
            icon="⏳"
            color="yellow"
          />
          <StatCard
            title="Завершено"
            value={stats.completed_orders}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Загальний доход"
            value={`${stats.total_revenue} ₴`}
            icon="💰"
            color="purple"
          />
        </div>

        {/* Сьогодні */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Замовлень сьогодні</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.today_orders}
                </p>
              </div>
              <div className="text-5xl text-blue-500">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Доход сьогодні</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.today_revenue} ₴
                </p>
              </div>
              <div className="text-5xl text-green-500">💵</div>
            </div>
          </div>
        </div>

        {/* Магазини */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🏪 Мої магазини</h2>
            <Link
              to="/stores/create"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              + Новий магазин
            </Link>
          </div>

          {stores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">У вас ще немає магазинів</p>
              <Link
                to="/stores/create"
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Створити магазин
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map(store => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>

        {/* Останні замовлення */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📋 Останні замовлення
            </h2>
            <Link
              to="/orders"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Переглянути все →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Замовлень ще немає
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      № Замовлення
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Клієнт
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Товари
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Сума
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">
                          {order.customer_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.customer_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {order.items.length} товар{order.items.length !== 1 ? 'ів' : 'а'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {order.total_amount} ₴
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${
                            order.status === 'completed'
                              ? 'bg-green-500'
                              : order.status === 'processing'
                              ? 'bg-blue-500'
                              : order.status === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }`}
                        >
                          {order.status === 'pending'
                            ? 'Очікує'
                            : order.status === 'processing'
                            ? 'Обробляється'
                            : order.status === 'completed'
                            ? 'Завершено'
                            : order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('uk-UA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Карточка статистики
 */
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-30">{icon}</div>
      </div>
    </div>
  );
};

/**
 * Карточка магазину
 */
const StoreCard = ({ store }) => {
  return (
    <Link
      to={`/stores/${store.id}/edit`}
      className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border border-gray-200"
    >
      {store.logo && (
        <img
          src={store.logo}
          alt={store.name}
          className="w-full h-32 object-cover rounded mb-3"
        />
      )}
      <h3 className="font-semibold text-gray-900 mb-1">{store.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{store.slug}</p>
      <div className="flex justify-between text-sm text-gray-600">
        <span>{store.products_count} товарів</span>
        <span>{store.orders_count} замовлень</span>
      </div>
    </Link>
  );
};

export default DashboardPage;

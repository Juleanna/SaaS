import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Сторінка управління замовленнями для продавця
 */
const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.startDate) {
        params.append('created_after', filters.startDate);
      }
      if (filters.endDate) {
        params.append('created_before', filters.endDate);
      }

      const response = await axios.get(
        `/api/orders/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      
      setOrders(response.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Помилка при завантаженні замовлень');
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `/api/orders/${orderId}/`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      
      // Оновити замовлення в списку
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      // Оновити вибране замовлення якщо воно открыте
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      alert('Помилка при оновленні статусу');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      processing: 'blue',
      shipped: 'purple',
      delivered: 'green',
      cancelled: 'red',
      refunded: 'gray'
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Очікує',
      processing: 'Обробляється',
      shipped: 'Відправлено',
      delivered: 'Доставлено',
      cancelled: 'Скасовано',
      refunded: 'Повернено'
    };
    return labels[status] || status;
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
      <div className="max-w-6xl mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📦 Замовлення</h1>
          <p className="text-gray-600 mt-2">
            Всього замовлень: <strong>{orders.length}</strong>
          </p>
        </div>

        {/* Фільтри */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статуси</option>
              <option value="pending">Очікує</option>
              <option value="processing">Обробляється</option>
              <option value="shipped">Відправлено</option>
              <option value="delivered">Доставлено</option>
              <option value="cancelled">Скасовано</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="З дати"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="До дати"
            />

            <button
              onClick={() => setFilters({ status: 'all', startDate: '', endDate: '' })}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
            >
              Скинути фільтри
            </button>
          </div>
        </div>

        {/* Таблиця замовлень */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">Немає замовлень</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">
                    № Замовлення
                  </th>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">
                    Клієнт
                  </th>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">
                    Товари
                  </th>
                  <th className="px-6 py-3 text-right text-gray-900 font-semibold">
                    Сума
                  </th>
                  <th className="px-6 py-3 text-center text-gray-900 font-semibold">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-gray-900 font-semibold">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-center text-gray-900 font-semibold">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-semibold">
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
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white bg-${getStatusColor(order.status)}-500`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
                      >
                        Деталі
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Модальне вікно з деталями замовлення */}
        {showDetailModal && selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedOrder(null);
            }}
            onStatusChange={handleStatusChange}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Модальне вікно з деталями замовлення
 */
const OrderDetailModal = ({ order, onClose, onStatusChange, getStatusColor, getStatusLabel }) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-100 border-b border-gray-300 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Замовлення #{order.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Інформація про замовлення */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Інформація про замовлення
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Статус</p>
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value)}
                  className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  disabled={updatingStatus}
                >
                  <option value="pending">Очікує</option>
                  <option value="processing">Обробляється</option>
                  <option value="shipped">Відправлено</option>
                  <option value="delivered">Доставлено</option>
                  <option value="cancelled">Скасовано</option>
                </select>
              </div>
              <div>
                <p className="text-sm text-gray-600">Дата створення</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString('uk-UA')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Сума замовлення</p>
                <p className="mt-1 font-semibold text-gray-900 text-lg">
                  {order.total_amount} ₴
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Статус платежу</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {order.payment_status === 'paid' ? '✅ Оплачено' : '⏳ Не оплачено'}
                </p>
              </div>
            </div>
          </div>

          {/* Інформація про клієнта */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              👤 Інформація про клієнта
            </h3>
            <div className="space-y-2">
              <p>
                <span className="text-gray-600">Ім'я:</span>{' '}
                <span className="font-semibold text-gray-900">{order.customer_name}</span>
              </p>
              <p>
                <span className="text-gray-600">Email:</span>{' '}
                <span className="font-semibold text-gray-900">{order.customer_email}</span>
              </p>
              <p>
                <span className="text-gray-600">Телефон:</span>{' '}
                <span className="font-semibold text-gray-900">{order.customer_phone}</span>
              </p>
              <p>
                <span className="text-gray-600">Адреса доставки:</span>{' '}
                <span className="font-semibold text-gray-900">
                  {order.shipping_address}, {order.shipping_city}
                </span>
              </p>
            </div>
          </div>

          {/* Товари в замовленні */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🛍️ Товари
            </h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start border-b border-gray-200 pb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-600">
                      Кількість: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {item.quantity * item.price} ₴
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.price} ₴ за од.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки дій */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
            >
              Закрити
            </button>
            <button
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
            >
              📧 Відправити повідомлення
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

const Orders = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Get store ID (from URL or user's first store)
  const currentStoreId = storeId || user?.stores?.[0]?.id || 1;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate;
        switch (dateFilter) {
          case 'today':
            startDate = today.toISOString().split('T')[0];
            params.append('created_at__gte', startDate);
            break;
          case 'week':
            startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
            params.append('created_at__gte', startDate);
            break;
          case 'month':
            startDate = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
            params.append('created_at__gte', startDate);
            break;
        }
      }
      
      const response = await api.get(`/orders/api/stores/${currentStoreId}/orders/?${params}`);
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Помилка завантаження замовлень');
      // Fallback to mock data if API fails
      setOrders([
        {
          id: 1,
          order_number: 'ORD-12345678',
          customer_name: 'Іван Петренко',
          customer_email: 'ivan@example.com',
          total_amount: 1500,
          status: 'pending',
          created_at: '2024-01-15T10:30:00Z',
          items_count: 3,
          items: [],
        },
        {
          id: 2,
          order_number: 'ORD-12345679',
          customer_name: 'Марія Коваленко',
          customer_email: 'maria@example.com',
          total_amount: 2300,
          status: 'confirmed',
          created_at: '2024-01-14T11:20:00Z',
          items_count: 2,
          items: [],
        },
        {
          id: 3,
          order_number: 'ORD-12345680',
          customer_name: 'Олексій Сидоренко',
          customer_email: 'oleksiy@example.com',
          total_amount: 890,
          status: 'shipped',
          created_at: '2024-01-13T14:45:00Z',
          items_count: 1,
          items: [],
        },
        {
          id: 4,
          order_number: 'ORD-12345681',
          customer_name: 'Анна Іваненко',
          customer_email: 'anna@example.com',
          total_amount: 3200,
          status: 'delivered',
          created_at: '2024-01-12T16:15:00Z',
          items_count: 5,
          items: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/orders/api/stores/${currentStoreId}/orders/statistics/`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Fallback statistics
      setStatistics({
        pending_count: orders.filter(o => o.status === 'pending').length,
        processing_count: orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length,
        completed_count: orders.filter(o => o.status === 'delivered').length,
        total_amount: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      });
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.post(`/orders/api/stores/${currentStoreId}/orders/${orderId}/status/`, {
        status: newStatus
      });
      fetchOrders();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Помилка оновлення статусу замовлення');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') params.append('date_filter', dateFilter);
      
      const response = await api.get(`/orders/api/stores/${currentStoreId}/orders/export/?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Помилка експорту замовлень');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentStoreId, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    if (orders.length > 0) {
      fetchStatistics();
    }
  }, [orders]);

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-info',
      shipped: 'badge-primary',
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Замовлення</h1>
          <p className="mt-1 text-sm text-gray-500">
            Керуйте всіма замовленнями вашого магазину
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExport}
            className="btn-outline"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Експорт
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Нове замовлення
          </button>
        </div>
      </div>

      {/* Фільтри та пошук */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пошук
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Номер замовлення, клієнт..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Всі</option>
                <option value="pending">Очікують</option>
                <option value="confirmed">Підтверджені</option>
                <option value="processing">В обробці</option>
                <option value="shipped">Відправлені</option>
                <option value="delivered">Доставлені</option>
                <option value="cancelled">Скасовані</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Період
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Весь час</option>
                <option value="today">Сьогодні</option>
                <option value="week">Останній тиждень</option>
                <option value="month">Останній місяць</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дії
              </label>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Очистити
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Очікують
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics?.pending_count || orders.filter(o => o.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    В обробці
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics?.processing_count || orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Виконані
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics?.completed_count || orders.filter(o => o.status === 'delivered').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">₴</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Загальна сума
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(statistics?.total_amount || orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)).toLocaleString()} ₴
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Таблиця замовлень */}
      <div className="card">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Замовлення
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клієнт
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сума
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Завантаження замовлень...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Немає замовлень</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Почніть з створення першого замовлення.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Нове замовлення
                      </button>
                    </div>
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {order.order_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items_count || order.items?.length || 0} товар(ів)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer_name}
                    </div>
                    <div className="text-sm text-gray-500">{order.customer_email || order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.total_amount?.toLocaleString()} ₴
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('uk-UA') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Переглянути"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <div className="relative group">
                        <button className="text-green-600 hover:text-green-900" title="Змінити статус">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                          <div className="py-1">
                            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleStatusUpdate(order.id, status)}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                  order.status === status ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                {getStatusText(status)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
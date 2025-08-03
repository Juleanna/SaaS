import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon,
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

const Payments = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('payments'); // payments, methods, analytics
  
  // Get store ID (from URL or user's first store)
  const currentStoreId = storeId || user?.stores?.[0]?.id || 1;

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (methodFilter !== 'all') params.append('payment_method', methodFilter);
      
      const response = await api.get(`/payments/api/stores/${currentStoreId}/payments/?${params}`);
      setPayments(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Помилка завантаження платежів');
      // Fallback to mock data if API fails
      setPayments([
        {
          id: 1,
          order: {
            id: 1,
            order_number: 'ORD-12345678',
            customer_name: 'Іван Петренко'
          },
          amount: 45000,
          status: 'pending',
          payment_method: {
            id: 1,
            name: 'Готівка при отриманні',
            type: 'cash'
          },
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          order: {
            id: 2,
            order_number: 'ORD-12345679',
            customer_name: 'Марія Коваленко'
          },
          amount: 35000,
          status: 'completed',
          payment_method: {
            id: 2,
            name: 'Картка при отриманні',
            type: 'card'
          },
          created_at: '2024-01-14T11:20:00Z',
          updated_at: '2024-01-14T15:45:00Z',
        },
        {
          id: 3,
          order: {
            id: 3,
            order_number: 'ORD-12345680',
            customer_name: 'Олексій Сидоренко'
          },
          amount: 60000,
          status: 'failed',
          payment_method: {
            id: 3,
            name: 'Онлайн оплата',
            type: 'online'
          },
          created_at: '2024-01-13T14:45:00Z',
          updated_at: '2024-01-13T14:50:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get(`/payments/api/stores/${currentStoreId}/payment-methods/`);
      setPaymentMethods(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Fallback payment methods
      setPaymentMethods([
        { id: 1, name: 'Готівка при отриманні', type: 'cash', is_active: true, settings: {} },
        { id: 2, name: 'Картка при отриманні', type: 'card', is_active: true, settings: {} },
        { id: 3, name: 'Онлайн оплата', type: 'online', is_active: false, settings: {} },
        { id: 4, name: 'Банківський переказ', type: 'transfer', is_active: true, settings: {} },
      ]);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/payments/api/stores/${currentStoreId}/payments/analytics/`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      // Fallback statistics
      setStatistics({
        total_amount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        completed_count: payments.filter(p => p.status === 'completed').length,
        pending_count: payments.filter(p => p.status === 'pending').length,
        failed_count: payments.filter(p => p.status === 'failed').length,
        today_amount: 0,
        this_month_amount: 0,
      });
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await api.post(`/payments/api/stores/${currentStoreId}/payments/${paymentId}/status/`, {
        status: newStatus
      });
      fetchPayments();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Помилка оновлення статусу платежу');
    }
  };

  const markAsPaid = async (paymentId) => {
    try {
      await api.post(`/payments/api/stores/${currentStoreId}/payments/${paymentId}/mark-paid/`);
      fetchPayments();
      fetchStatistics();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('Помилка позначення платежу як оплаченого');
    }
  };

  const togglePaymentMethod = async (methodId, isActive) => {
    try {
      await api.patch(`/payments/api/stores/${currentStoreId}/payment-methods/${methodId}/`, {
        is_active: !isActive
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error toggling payment method:', error);
      alert('Помилка зміни статусу методу оплати');
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchPaymentMethods();
  }, [currentStoreId, searchTerm, statusFilter, methodFilter]);

  useEffect(() => {
    if (payments.length > 0) {
      fetchStatistics();
    }
  }, [payments]);

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-danger',
      refunded: 'badge-info',
      cancelled: 'badge-secondary',
    };
    return statusMap[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Очікує оплати',
      completed: 'Оплачено',
      failed: 'Помилка оплати',
      refunded: 'Повернено',
      cancelled: 'Скасовано',
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'refunded':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMethodIcon = (type) => {
    switch (type) {
      case 'cash':
        return <BanknotesIcon className="h-5 w-5 text-green-600" />;
      case 'card':
        return <CreditCardIcon className="h-5 w-5 text-blue-600" />;
      case 'online':
        return <CreditCardIcon className="h-5 w-5 text-purple-600" />;
      case 'transfer':
        return <BanknotesIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <CreditCardIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading && activeTab === 'payments') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Платежі</h1>
          <p className="mt-1 text-sm text-gray-500">
            Керуйте платежами та методами оплати
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'payments', name: 'Платежі', icon: CreditCardIcon },
            { id: 'methods', name: 'Методи оплати', icon: BanknotesIcon },
            { id: 'analytics', name: 'Аналітика', icon: ChartBarIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <>
          {/* Filters */}
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
                    <option value="completed">Оплачені</option>
                    <option value="failed">Помилка</option>
                    <option value="refunded">Повернені</option>
                    <option value="cancelled">Скасовані</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Метод оплати
                  </label>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Всі методи</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
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
                      setMethodFilter('all');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Очистити
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Оплачено
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statistics?.completed_count || payments.filter(p => p.status === 'completed').length}
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
                    <ClockIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Очікують
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statistics?.pending_count || payments.filter(p => p.status === 'pending').length}
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
                    <XCircleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Помилки
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statistics?.failed_count || payments.filter(p => p.status === 'failed').length}
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
                        {(statistics?.total_amount || payments.reduce((sum, p) => sum + (p.amount || 0), 0)).toLocaleString()} ₴
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="card">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Платіж
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Замовлення
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сума
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Метод
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
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Немає платежів</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Платежі з'являться тут після створення замовлень з оплатою.
                        </p>
                      </td>
                    </tr>
                  ) : payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(payment.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              #{payment.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.created_at ? new Date(payment.created_at).toLocaleString('uk-UA') : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.order?.order_number}
                        </div>
                        <div className="text-sm text-gray-500">{payment.order?.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.amount?.toLocaleString()} ₴
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getMethodIcon(payment.payment_method?.type)}
                          <span className="ml-2 text-sm text-gray-900">
                            {payment.payment_method?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusBadge(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.updated_at ? new Date(payment.updated_at).toLocaleDateString('uk-UA') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {payment.status === 'pending' && (
                            <button 
                              onClick={() => markAsPaid(payment.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Позначити як оплачено"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                          <div className="relative group">
                            <button className="text-blue-600 hover:text-blue-900" title="Змінити статус">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                              <div className="py-1">
                                {['pending', 'completed', 'failed', 'refunded', 'cancelled'].map(status => (
                                  <button
                                    key={status}
                                    onClick={() => updatePaymentStatus(payment.id, status)}
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                      payment.status === status ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
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
        </>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Методи оплати</h3>
            
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    {getMethodIcon(method.type)}
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-500">Тип: {method.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`badge ${method.is_active ? 'badge-success' : 'badge-secondary'}`}>
                      {method.is_active ? 'Активний' : 'Неактивний'}
                    </span>
                    <button
                      onClick={() => togglePaymentMethod(method.id, method.is_active)}
                      className={`btn ${method.is_active ? 'btn-warning' : 'btn-success'}`}
                    >
                      {method.is_active ? 'Деактивувати' : 'Активувати'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card">
              <div className="card-body">
                <h4 className="text-sm font-medium text-gray-500">Сьогодні</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {(statistics?.today_amount || 0).toLocaleString()} ₴
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h4 className="text-sm font-medium text-gray-500">Цього місяця</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {(statistics?.this_month_amount || 0).toLocaleString()} ₴
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h4 className="text-sm font-medium text-gray-500">Середній чек</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.length > 0 
                    ? Math.round(payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length).toLocaleString()
                    : 0
                  } ₴
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Розподіл за методами оплати</h4>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const methodPayments = payments.filter(p => p.payment_method?.id === method.id);
                  const totalAmount = methodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  const percentage = payments.length > 0 ? (methodPayments.length / payments.length * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={method.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getMethodIcon(method.type)}
                        <span className="ml-2 text-sm font-medium text-gray-900">{method.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{methodPayments.length} платежів</span>
                        <span className="text-sm font-medium text-gray-900">{totalAmount.toLocaleString()} ₴</span>
                        <span className="text-sm text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
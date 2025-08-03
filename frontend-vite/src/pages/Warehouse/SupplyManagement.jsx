import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../stores/warehouseStore';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SupplyManagement = () => {
  const {
    warehouses,
    suppliers,
    supplies,
    suppliesLoading,
    fetchWarehouses,
    fetchSuppliers,
    fetchSupplies,
    createSupply,
    updateSupplyStatus
  } = useWarehouseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [supplyForm, setSupplyForm] = useState({
    number: '',
    supplier: '',
    warehouse: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchWarehouses();
    fetchSuppliers();
    fetchSupplies();
  }, [fetchWarehouses, fetchSuppliers, fetchSupplies]);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchSupplies(selectedWarehouse);
    }
  }, [selectedWarehouse, fetchSupplies]);

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    return supply.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'in_transit':
        return 'text-yellow-600 bg-yellow-100';
      case 'received':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft':
        return 'Чернетка';
      case 'confirmed':
        return 'Підтверджено';
      case 'in_transit':
        return 'В дорозі';
      case 'received':
        return 'Отримано';
      case 'cancelled':
        return 'Скасовано';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <PencilIcon className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'in_transit':
        return <TruckIcon className="h-4 w-4" />;
      case 'received':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const resetForm = () => {
    setSupplyForm({
      number: `SUP-${Date.now()}`,
      supplier: '',
      warehouse: selectedWarehouse || '',
      order_date: new Date().toISOString().split('T')[0],
      expected_date: '',
      notes: '',
      items: []
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const openDetailModal = (supply) => {
    setSelectedSupply(supply);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSupply(null);
  };

  const handleCreateSupply = async (e) => {
    e.preventDefault();
    
    const result = await createSupply(supplyForm);
    
    if (result.success) {
      toast.success('Постачання створено успішно');
      closeCreateModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleStatusChange = async (supplyId, newStatus) => {
    const result = await updateSupplyStatus(supplyId, newStatus);
    
    if (result.success) {
      toast.success('Статус постачання оновлено');
    } else {
      toast.error(result.error);
    }
  };

  const getSupplyStats = () => {
    return supplies.reduce((acc, supply) => {
      acc[supply.status] = (acc[supply.status] || 0) + 1;
      acc.total++;
      return acc;
    }, { total: 0, draft: 0, confirmed: 0, in_transit: 0, received: 0, cancelled: 0 });
  };

  const stats = getSupplyStats();

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управління постачаннями</h1>
          <p className="mt-1 text-sm text-gray-500">
            Створення та відстеження постачань товарів
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Нове постачання
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Всього</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PencilIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Чернетки</dt>
                  <dd className="text-lg font-medium text-gray-600">{stats.draft || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Підтверджено</dt>
                  <dd className="text-lg font-medium text-blue-600">{stats.confirmed || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">В дорозі</dt>
                  <dd className="text-lg font-medium text-yellow-600">{stats.in_transit || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Отримано</dt>
                  <dd className="text-lg font-medium text-green-600">{stats.received || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Скасовано</dt>
                  <dd className="text-lg font-medium text-red-600">{stats.cancelled || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Фільтри та пошук */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Пошук постачань..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Всі склади</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">Всі статуси</option>
                <option value="draft">Чернетки</option>
                <option value="confirmed">Підтверджено</option>
                <option value="in_transit">В дорозі</option>
                <option value="received">Отримано</option>
                <option value="cancelled">Скасовано</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Список постачань */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Постачання ({filteredSupplies.length})
          </h3>

          {suppliesLoading ? (
            <div className="animate-pulse">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredSupplies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер / Постачальник
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Склад
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата замовлення
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Очікувана дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сума
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSupplies.map((supply) => (
                    <tr key={supply.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Постачання #{supply.number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supply.supplier?.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <BuildingStorefrontIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {supply.warehouse?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(supply.order_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supply.expected_date ? (
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(supply.expected_date).toLocaleDateString()}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₴{supply.total_amount?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={supply.status}
                          onChange={(e) => handleStatusChange(supply.id, e.target.value)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-indigo-500 ${getStatusColor(supply.status)}`}
                        >
                          <option value="draft">Чернетка</option>
                          <option value="confirmed">Підтверджено</option>
                          <option value="in_transit">В дорозі</option>
                          <option value="received">Отримано</option>
                          <option value="cancelled">Скасовано</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openDetailModal(supply)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Немає постачань</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'За вашим запитом нічого не знайдено' : 'Почніть з створення вашого першого постачання'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Модальне вікно створення */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
              <form onSubmit={handleCreateSupply}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Створити постачання
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Номер постачання *
                      </label>
                      <input
                        type="text"
                        value={supplyForm.number}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, number: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Постачальник *
                        </label>
                        <select
                          value={supplyForm.supplier}
                          onChange={(e) => setSupplyForm(prev => ({ ...prev, supplier: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Оберіть постачальника</option>
                          {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Склад *
                        </label>
                        <select
                          value={supplyForm.warehouse}
                          onChange={(e) => setSupplyForm(prev => ({ ...prev, warehouse: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Оберіть склад</option>
                          {warehouses.map(warehouse => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Дата замовлення *
                        </label>
                        <input
                          type="date"
                          value={supplyForm.order_date}
                          onChange={(e) => setSupplyForm(prev => ({ ...prev, order_date: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Очікувана дата
                        </label>
                        <input
                          type="date"
                          value={supplyForm.expected_date}
                          onChange={(e) => setSupplyForm(prev => ({ ...prev, expected_date: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Примітки
                      </label>
                      <textarea
                        value={supplyForm.notes}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Створити
                  </button>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно деталей */}
      {isDetailModalOpen && selectedSupply && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Деталі постачання #{selectedSupply.number}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSupply.status)}`}>
                    {getStatusIcon(selectedSupply.status)}
                    <span className="ml-1">{getStatusText(selectedSupply.status)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Постачальник</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSupply.supplier?.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Склад</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSupply.warehouse?.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Дата замовлення</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedSupply.order_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Очікувана дата</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSupply.expected_date ? 
                          new Date(selectedSupply.expected_date).toLocaleDateString() : 
                          'Не вказано'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Дата отримання</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSupply.received_date ? 
                          new Date(selectedSupply.received_date).toLocaleDateString() : 
                          'Не отримано'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Загальна сума</label>
                      <p className="mt-1 text-sm text-gray-900">
                        ₴{selectedSupply.total_amount?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedSupply.notes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700">Примітки</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSupply.notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyManagement;
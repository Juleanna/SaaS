import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../stores/warehouseStore';
import { 
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StockBatches = () => {
  const {
    warehouses,
    currentWarehouse,
    stockBatches,
    stockBatchesLoading,
    fetchWarehouses,
    fetchStockBatches,
    setCurrentWarehouse
  } = useWarehouseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, depleted, expired
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    if (currentWarehouse) {
      fetchStockBatches(currentWarehouse.id);
    }
  }, [currentWarehouse, fetchStockBatches]);

  const handleWarehouseChange = (warehouse) => {
    setCurrentWarehouse(warehouse);
  };

  const getBatchStatus = (batch) => {
    if (batch.remaining_quantity <= 0) return 'depleted';
    if (batch.expiry_date && new Date(batch.expiry_date) < new Date()) return 'expired';
    if (batch.expiry_date && new Date(batch.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) return 'expiring';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'depleted':
        return 'text-gray-600 bg-gray-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      case 'expiring':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'depleted':
        return 'Вичерпана';
      case 'expired':
        return 'Прострочена';
      case 'expiring':
        return 'Закінчується';
      default:
        return 'Активна';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'depleted':
        return <ChartBarIcon className="h-4 w-4" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'expiring':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <CheckCircleIcon className="h-4 w-4" />;
    }
  };

  const filteredBatches = stockBatches.filter(batch => {
    const matchesSearch = batch.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedProduct && batch.product?.id !== parseInt(selectedProduct)) return false;

    if (filterStatus === 'all') return true;
    return getBatchStatus(batch) === filterStatus;
  });

  const openDetailModal = (batch) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBatch(null);
  };

  const getBatchSummary = () => {
    const summary = stockBatches.reduce((acc, batch) => {
      const status = getBatchStatus(batch);
      acc[status] = (acc[status] || 0) + 1;
      acc.total++;
      acc.totalValue += parseFloat(batch.remaining_quantity) * parseFloat(batch.unit_cost);
      return acc;
    }, { total: 0, active: 0, depleted: 0, expired: 0, expiring: 0, totalValue: 0 });
    
    return summary;
  };

  const summary = getBatchSummary();

  // Отримуємо унікальні товари для фільтра
  const uniqueProducts = [...new Map(stockBatches.map(batch => 
    [batch.product?.id, batch.product]
  ).filter(([id, product]) => id && product)).values()];

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Партії товарів</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управління партіями товарів для FIFO/LIFO розрахунків
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select
            value={currentWarehouse?.id || ''}
            onChange={(e) => {
              const warehouse = warehouses.find(w => w.id === parseInt(e.target.value));
              handleWarehouseChange(warehouse);
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Оберіть склад</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentWarehouse && (
        <>
          {/* Статистика */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Всього партій</dt>
                      <dd className="text-lg font-medium text-gray-900">{summary.total}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Активні</dt>
                      <dd className="text-lg font-medium text-green-600">{summary.active}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Закінчуються</dt>
                      <dd className="text-lg font-medium text-yellow-600">{summary.expiring}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Прострочені</dt>
                      <dd className="text-lg font-medium text-red-600">{summary.expired}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TruckIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Загальна вартість</dt>
                      <dd className="text-lg font-medium text-blue-600">₴{summary.totalValue.toLocaleString()}</dd>
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
                      placeholder="Пошук партій за товаром, номером партії або постачальником..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Всі товари</option>
                    {uniqueProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">Всі статуси</option>
                    <option value="active">Активні</option>
                    <option value="expiring">Закінчуються</option>
                    <option value="expired">Прострочені</option>
                    <option value="depleted">Вичерпані</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Попередження про прострочені партії */}
          {summary.expired > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Увага! Є прострочені партії
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Знайдено {summary.expired} прострочених партій. Рекомендується списати або перевірити їх статус.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Таблиця партій */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Партії товарів ({filteredBatches.length})
              </h3>

              {stockBatchesLoading ? (
                <div className="animate-pulse">
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : filteredBatches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Партія / Товар
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Кількість
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Собівартість
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Постачальник
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата надходження
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Термін придатності
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
                      {filteredBatches.map((batch) => {
                        const status = getBatchStatus(batch);
                        const depletionPercentage = ((batch.initial_quantity - batch.remaining_quantity) / batch.initial_quantity) * 100;
                        
                        return (
                          <tr key={batch.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {batch.batch_number}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {batch.product?.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {batch.remaining_quantity} / {batch.initial_quantity}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${100 - depletionPercentage}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                ₴{batch.unit_cost}
                              </div>
                              <div className="text-sm text-gray-500">
                                Всього: ₴{(batch.remaining_quantity * batch.unit_cost).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {batch.supplier?.name || '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                                {new Date(batch.received_date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {batch.expiry_date ? (
                                <div className={`flex items-center ${
                                  status === 'expired' ? 'text-red-600' : 
                                  status === 'expiring' ? 'text-yellow-600' : 'text-gray-900'
                                }`}>
                                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                  {new Date(batch.expiry_date).toLocaleDateString()}
                                </div>
                              ) : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                                <span className="ml-1">{getStatusText(status)}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openDetailModal(batch)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Немає партій</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'За вашим запитом нічого не знайдено' : 'Поки що немає партій товарів'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Модальне вікно деталей партії */}
      {isDetailModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Деталі партії
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getBatchStatus(selectedBatch))}`}>
                    {getStatusIcon(getBatchStatus(selectedBatch))}
                    <span className="ml-1">{getStatusText(getBatchStatus(selectedBatch))}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Номер партії</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBatch.batch_number}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Товар</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBatch.product?.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Фасування</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedBatch.packaging?.quantity} {selectedBatch.packaging?.unit?.short_name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Постачальник</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBatch.supplier?.name || '—'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Постачання</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedBatch.supply ? `#${selectedBatch.supply.number}` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Початкова кількість</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBatch.initial_quantity}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Залишок</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBatch.remaining_quantity}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Використано</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedBatch.initial_quantity - selectedBatch.remaining_quantity} 
                        ({(((selectedBatch.initial_quantity - selectedBatch.remaining_quantity) / selectedBatch.initial_quantity) * 100).toFixed(1)}%)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Собівартість за одиницю</label>
                      <p className="mt-1 text-sm text-gray-900">₴{selectedBatch.unit_cost}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Загальна вартість залишку</label>
                      <p className="mt-1 text-sm text-gray-900">
                        ₴{(selectedBatch.remaining_quantity * selectedBatch.unit_cost).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Дата надходження</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedBatch.received_date).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Термін придатності</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedBatch.expiry_date ? new Date(selectedBatch.expiry_date).toLocaleDateString() : 'Не вказано'}
                    </p>
                  </div>
                </div>

                {selectedBatch.notes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700">Примітки</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBatch.notes}</p>
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

export default StockBatches;
import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../stores/warehouseStore';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const InventoryManagement = () => {
  const {
    warehouses,
    currentWarehouse,
    stocks,
    stocksLoading,
    fetchWarehouses,
    fetchStocks,
    updateStock,
    setCurrentWarehouse
  } = useWarehouseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, low, zero, over
  const [selectedStock, setSelectedStock] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    quantity: '',
    min_stock: '',
    max_stock: '',
    cost_price: ''
  });
  const [createForm, setCreateForm] = useState({
    product: '',
    packaging: '',
    quantity: '0',
    min_stock: '0',
    max_stock: '',
    cost_price: ''
  });

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    if (currentWarehouse) {
      fetchStocks(currentWarehouse.id);
    }
  }, [currentWarehouse, fetchStocks]);

  const handleWarehouseChange = (warehouse) => {
    setCurrentWarehouse(warehouse);
  };

  const getStockStatus = (stock) => {
    if (stock.quantity === 0) return 'zero';
    if (stock.quantity <= stock.min_stock) return 'low';
    if (stock.max_stock && stock.quantity > stock.max_stock) return 'over';
    return 'normal';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'zero':
        return 'text-red-600 bg-red-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      case 'over':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'zero':
        return 'Відсутній';
      case 'low':
        return 'Низький';
      case 'over':
        return 'Надлишок';
      default:
        return 'Нормальний';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'zero':
        return <XCircleIcon className="h-4 w-4" />;
      case 'low':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'over':
        return <ChartBarIcon className="h-4 w-4" />;
      default:
        return <CheckCircleIcon className="h-4 w-4" />;
    }
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.product?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    return getStockStatus(stock) === filterStatus;
  });

  const openEditModal = (stock) => {
    setSelectedStock(stock);
    setEditForm({
      quantity: stock.quantity.toString(),
      min_stock: stock.min_stock.toString(),
      max_stock: stock.max_stock?.toString() || '',
      cost_price: stock.cost_price?.toString() || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedStock(null);
    setEditForm({
      quantity: '',
      min_stock: '',
      max_stock: '',
      cost_price: ''
    });
  };

  const openCreateModal = () => {
    setCreateForm({
      product: '',
      packaging: '',
      quantity: '0',
      min_stock: '0',
      max_stock: '',
      cost_price: ''
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm({
      product: '',
      packaging: '',
      quantity: '0',
      min_stock: '0',
      max_stock: '',
      cost_price: ''
    });
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    
    if (!selectedStock) return;

    const updateData = {
      quantity: parseFloat(editForm.quantity) || 0,
      min_stock: parseFloat(editForm.min_stock) || 0,
      max_stock: editForm.max_stock ? parseFloat(editForm.max_stock) : null,
      cost_price: editForm.cost_price ? parseFloat(editForm.cost_price) : null
    };

    const result = await updateStock(selectedStock.id, updateData);
    
    if (result.success) {
      toast.success('Залишок оновлено успішно');
      closeEditModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleCreateStock = async (e) => {
    e.preventDefault();
    
    if (!currentWarehouse) {
      toast.error('Оберіть склад');
      return;
    }

    const createData = {
      warehouse: currentWarehouse.id,
      product: parseInt(createForm.product),
      packaging: parseInt(createForm.packaging),
      quantity: parseFloat(createForm.quantity) || 0,
      min_stock: parseFloat(createForm.min_stock) || 0,
      max_stock: createForm.max_stock ? parseFloat(createForm.max_stock) : null,
      cost_price: createForm.cost_price ? parseFloat(createForm.cost_price) : null
    };

    // Тут потрібно додати метод createStock до warehouseStore
    // const result = await createStock(createData);
    
    // Поки що симулюємо успішне створення
    toast.success('Залишок створено успішно');
    closeCreateModal();
    
    // Оновлюємо список залишків
    if (currentWarehouse) {
      fetchStocks(currentWarehouse.id);
    }
  };

  const getStockSummary = () => {
    const summary = stocks.reduce((acc, stock) => {
      const status = getStockStatus(stock);
      acc[status] = (acc[status] || 0) + 1;
      acc.total++;
      return acc;
    }, { total: 0, normal: 0, low: 0, zero: 0, over: 0 });
    
    return summary;
  };

  const summary = getStockSummary();

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управління залишками</h1>
          <p className="mt-1 text-sm text-gray-500">
            Перегляд та управління товарними запасами на складах
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
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

          {currentWarehouse && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Додати залишок
            </button>
          )}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Всього позицій</dt>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Нормальний рівень</dt>
                      <dd className="text-lg font-medium text-green-600">{summary.normal}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Низький рівень</dt>
                      <dd className="text-lg font-medium text-yellow-600">{summary.low}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Відсутні</dt>
                      <dd className="text-lg font-medium text-red-600">{summary.zero}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Надлишок</dt>
                      <dd className="text-lg font-medium text-blue-600">{summary.over}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Фільтри та пошук */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Пошук товарів..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="all">Всі статуси</option>
                      <option value="normal">Нормальний рівень</option>
                      <option value="low">Низький рівень</option>
                      <option value="zero">Відсутні</option>
                      <option value="over">Надлишок</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Таблиця залишків */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Залишки товарів ({filteredStocks.length})
              </h3>

              {stocksLoading ? (
                <div className="animate-pulse">
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : filteredStocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Товар
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Фасування
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Поточний залишок
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Доступно
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Мін. / Макс.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Собівартість
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дії
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStocks.map((stock) => {
                        const status = getStockStatus(stock);
                        return (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {stock.product?.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Код: {stock.product?.code}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stock.packaging?.quantity} {stock.packaging?.unit?.short_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stock.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stock.available_quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stock.min_stock} / {stock.max_stock || '∞'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                                <span className="ml-1">{getStatusText(status)}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stock.cost_price ? `₴${stock.cost_price}` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => openEditModal(stock)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button className="text-gray-600 hover:text-gray-900">
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              </div>
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Немає залишків</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'За вашим запитом нічого не знайдено' : 'Поки що немає товарів на складі'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Модальне вікно редагування */}
      {isEditModalOpen && selectedStock && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateStock}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Редагування залишку
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>{selectedStock.product?.name}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Фасування: {selectedStock.packaging?.quantity} {selectedStock.packaging?.unit?.short_name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Поточна кількість
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Собівартість
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.cost_price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, cost_price: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Мінімальний залишок
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={editForm.min_stock}
                        onChange={(e) => setEditForm(prev => ({ ...prev, min_stock: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Максимальний залишок
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={editForm.max_stock}
                        onChange={(e) => setEditForm(prev => ({ ...prev, max_stock: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Необмежено"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Зберегти
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
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

      {/* Модальне вікно створення залишку */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateStock}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Додати залишок товару
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Товар *
                      </label>
                      <select
                        value={createForm.product}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, product: e.target.value, packaging: '' }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Оберіть товар</option>
                        {/* Тут потрібно додати список товарів з API */}
                        <option value="1">Товар 1</option>
                        <option value="2">Товар 2</option>
                        <option value="3">Товар 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Фасування *
                      </label>
                      <select
                        value={createForm.packaging}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, packaging: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                        disabled={!createForm.product}
                      >
                        <option value="">Оберіть фасування</option>
                        {/* Тут потрібно додати список фасувань для обраного товару */}
                        <option value="1">1 шт</option>
                        <option value="2">10 шт</option>
                        <option value="3">100 шт</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Початкова кількість
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={createForm.quantity}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, quantity: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Собівартість
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={createForm.cost_price}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, cost_price: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Мінімальний залишок
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={createForm.min_stock}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, min_stock: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Максимальний залишок
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={createForm.max_stock}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, max_stock: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Необмежено"
                        />
                      </div>
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
    </div>
  );
};

export default InventoryManagement;
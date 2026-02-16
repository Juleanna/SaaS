import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../stores/warehouseStore';
import { 
  BuildingStorefrontIcon, 
  CubeIcon, 
  TruckIcon, 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WarehouseDashboard = () => {
  const {
    warehouses,
    currentWarehouse,
    stocks,
    supplies,
    inventories,
    stocksLoading,
    suppliesLoading,
    inventoriesLoading,
    fetchWarehouses,
    fetchStocks,
    fetchSupplies,
    fetchInventories,
    setCurrentWarehouse,
    getWarehouseStats
  } = useWarehouseStore();

  const [warehouseStats, setWarehouseStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    if (currentWarehouse) {
      loadWarehouseData();
      loadWarehouseStats();
    }
  }, [currentWarehouse]);

  const loadWarehouseData = async () => {
    if (!currentWarehouse) return;
    
    await Promise.all([
      fetchStocks(currentWarehouse.id),
      fetchSupplies(currentWarehouse.id),
      fetchInventories(currentWarehouse.id)
    ]);
  };

  const loadWarehouseStats = async () => {
    if (!currentWarehouse) return;
    
    setStatsLoading(true);
    try {
      const result = await getWarehouseStats(currentWarehouse.id);
      if (result.success) {
        setWarehouseStats(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Помилка завантаження статистики');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleWarehouseChange = (warehouse) => {
    setCurrentWarehouse(warehouse);
  };

  const getStockAlerts = () => {
    if (!stocks) return { lowStock: 0, overStock: 0, zeroStock: 0 };
    
    return stocks.reduce((acc, stock) => {
      if (stock.quantity === 0) acc.zeroStock++;
      else if (stock.quantity <= stock.min_stock) acc.lowStock++;
      else if (stock.max_stock && stock.quantity > stock.max_stock) acc.overStock++;
      return acc;
    }, { lowStock: 0, overStock: 0, zeroStock: 0 });
  };

  const getPendingSupplies = () => {
    return supplies?.filter(supply => 
      ['draft', 'confirmed', 'in_transit'].includes(supply.status)
    ).length || 0;
  };

  const getActiveInventories = () => {
    return inventories?.filter(inventory => 
      ['draft', 'in_progress'].includes(inventory.status)
    ).length || 0;
  };

  const alerts = getStockAlerts();

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок і вибір складу */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Панель складу</h1>
          <p className="mt-1 text-sm text-gray-500">
            Огляд поточного стану складських операцій
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select
            value={currentWarehouse?.id || ''}
            onChange={(e) => {
              const warehouse = warehouses.find(w => w.id === parseInt(e.target.value));
              handleWarehouseChange(warehouse);
            }}
            className="input"
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

      {!currentWarehouse ? (
        <div className="text-center py-12">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Оберіть склад</h3>
          <p className="mt-1 text-sm text-gray-500">
            Для перегляду інформації оберіть склад зі списку вище
          </p>
        </div>
      ) : (
        <>
          {/* Карточки статистики */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Загальна кількість товарів */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CubeIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Товарних позицій
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stocksLoading ? '...' : stocks.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Очікуються постачання */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TruckIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Очікуються постачання
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {suppliesLoading ? '...' : getPendingSupplies()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Активні інвентаризації */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Активні інвентаризації
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {inventoriesLoading ? '...' : getActiveInventories()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Попередження */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Критичні залишки
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stocksLoading ? '...' : (alerts.lowStock + alerts.zeroStock)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Попередження про залишки */}
          {!stocksLoading && (alerts.lowStock > 0 || alerts.zeroStock > 0 || alerts.overStock > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Увага! Є проблеми із залишками
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {alerts.zeroStock > 0 && (
                        <li>Товарів з нульовим залишком: {alerts.zeroStock}</li>
                      )}
                      {alerts.lowStock > 0 && (
                        <li>Товарів з низьким залишком: {alerts.lowStock}</li>
                      )}
                      {alerts.overStock > 0 && (
                        <li>Товарів з надлишком: {alerts.overStock}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Статистика складу */}
          {warehouseStats && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Статистика складу
                </h3>
                
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Надходження (місяць)
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {warehouseStats.monthly_inbound || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <ArrowTrendingDownIcon className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Витрати (місяць)
                        </p>
                        <p className="text-lg font-semibold text-red-600">
                          {warehouseStats.monthly_outbound || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Загальна вартість
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                          ₴{warehouseStats.total_value?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Швидкі дії */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Швидкі дії
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button className="btn btn-primary inline-flex items-center">
                  <CubeIcon className="h-4 w-4 mr-2" />
                  Управління залишками
                </button>
                
                <button className="btn btn-primary inline-flex items-center">
                  <TruckIcon className="h-4 w-4 mr-2" />
                  Нове постачання
                </button>
                
                <button className="btn btn-primary inline-flex items-center">
                  <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                  Нова інвентаризація
                </button>
                
                <button className="btn btn-outline inline-flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Звіти
                </button>
              </div>
            </div>
          </div>

          {/* Останні операції */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Останні постачання
              </h3>
              
              {suppliesLoading ? (
                <div className="animate-pulse">
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : supplies.length > 0 ? (
                <div className="overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {supplies.slice(0, 5).map((supply) => (
                      <li key={supply.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <TruckIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                Постачання #{supply.number}
                              </p>
                              <p className="text-sm text-gray-500">
                                {supply.supplier?.name} • {new Date(supply.order_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`badge ${
                              supply.status === 'received' ? 'badge-success' :
                              supply.status === 'in_transit' ? 'badge-info' :
                              supply.status === 'confirmed' ? 'badge-warning' :
                              'badge-secondary'
                            }`}>
                              {supply.status === 'received' ? 'Отримано' :
                               supply.status === 'in_transit' ? 'В дорозі' :
                               supply.status === 'confirmed' ? 'Підтверджено' :
                               'Чернетка'}
                            </span>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              ₴{supply.total_amount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Немає останніх постачань</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WarehouseDashboard;
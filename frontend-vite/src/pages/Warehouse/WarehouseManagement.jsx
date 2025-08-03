import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../stores/warehouseStore';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WarehouseManagement = () => {
  const {
    warehouses,
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
  } = useWarehouseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    address: '',
    manager: '',
    is_active: true,
    description: ''
  });

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    return filterStatus === 'active' ? warehouse.is_active : !warehouse.is_active;
  });

  const resetForm = () => {
    setWarehouseForm({
      name: '',
      code: '',
      address: '',
      manager: '',
      is_active: true,
      description: ''
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

  const openEditModal = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name || '',
      code: warehouse.code || '',
      address: warehouse.address || '',
      manager: warehouse.manager?.id || '',
      is_active: warehouse.is_active,
      description: warehouse.description || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedWarehouse(null);
    resetForm();
  };

  const openDeleteModal = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedWarehouse(null);
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    
    const result = await createWarehouse(warehouseForm);
    
    if (result.success) {
      toast.success('Склад створено успішно');
      closeCreateModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdateWarehouse = async (e) => {
    e.preventDefault();
    
    if (!selectedWarehouse) return;

    const result = await updateWarehouse(selectedWarehouse.id, warehouseForm);
    
    if (result.success) {
      toast.success('Склад оновлено успішно');
      closeEditModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!selectedWarehouse) return;

    const result = await deleteWarehouse(selectedWarehouse.id);
    
    if (result.success) {
      toast.success('Склад видалено успішно');
      closeDeleteModal();
    } else {
      toast.error(result.error);
    }
  };

  const getWarehouseStats = () => {
    return warehouses.reduce((acc, warehouse) => {
      if (warehouse.is_active) acc.active++;
      else acc.inactive++;
      acc.total++;
      return acc;
    }, { total: 0, active: 0, inactive: 0 });
  };

  const stats = getWarehouseStats();

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управління складами</h1>
          <p className="mt-1 text-sm text-gray-500">
            Створення та управління складськими приміщеннями
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати склад
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingStorefrontIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Всього складів</dt>
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
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Активні</dt>
                  <dd className="text-lg font-medium text-green-600">{stats.active}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Неактивні</dt>
                  <dd className="text-lg font-medium text-red-600">{stats.inactive}</dd>
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
                  placeholder="Пошук складів..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">Всі статуси</option>
                <option value="active">Активні</option>
                <option value="inactive">Неактивні</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Список складів */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Склади ({filteredWarehouses.length})
          </h3>

          {filteredWarehouses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWarehouses.map((warehouse) => (
                <div key={warehouse.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">{warehouse.name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {warehouse.is_active ? 'Активний' : 'Неактивний'}
                        </span>
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">Код: {warehouse.code}</p>
                      </div>

                      {warehouse.address && (
                        <div className="mt-2 flex items-start text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{warehouse.address}</span>
                        </div>
                      )}

                      {warehouse.manager && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 mr-2" />
                          <span>Завідувач: {warehouse.manager.first_name} {warehouse.manager.last_name}</span>
                        </div>
                      )}

                      {warehouse.description && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 line-clamp-2">{warehouse.description}</p>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Створено: {new Date(warehouse.created_at).toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(warehouse)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(warehouse)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Немає складів</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'За вашим запитом нічого не знайдено' : 'Почніть з створення вашого першого складу'}
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
              <form onSubmit={handleCreateWarehouse}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Створити склад
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Назва *
                        </label>
                        <input
                          type="text"
                          value={warehouseForm.name}
                          onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Код *
                        </label>
                        <input
                          type="text"
                          value={warehouseForm.code}
                          onChange={(e) => setWarehouseForm(prev => ({ ...prev, code: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Адреса
                      </label>
                      <textarea
                        value={warehouseForm.address}
                        onChange={(e) => setWarehouseForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Опис
                      </label>
                      <textarea
                        value={warehouseForm.description}
                        onChange={(e) => setWarehouseForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={warehouseForm.is_active}
                        onChange={(e) => setWarehouseForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Активний склад
                      </label>
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

      {/* Модальне вікно редагування */}
      {isEditModalOpen && selectedWarehouse && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
              <form onSubmit={handleUpdateWarehouse}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Редагувати склад
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Назва *
                        </label>
                        <input
                          type="text"
                          value={warehouseForm.name}
                          onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Код *
                        </label>
                        <input
                          type="text"
                          value={warehouseForm.code}
                          onChange={(e) => setWarehouseForm(prev => ({ ...prev, code: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Адреса
                      </label>
                      <textarea
                        value={warehouseForm.address}
                        onChange={(e) => setWarehouseForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Опис
                      </label>
                      <textarea
                        value={warehouseForm.description}
                        onChange={(e) => setWarehouseForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={warehouseForm.is_active}
                        onChange={(e) => setWarehouseForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Активний склад
                      </label>
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

      {/* Модальне вікно видалення */}
      {isDeleteModalOpen && selectedWarehouse && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Видалити склад
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Ви впевнені, що хочете видалити склад <strong>{selectedWarehouse.name}</strong>? 
                        Цю дію неможливо відмінити.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteWarehouse}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Видалити
                </button>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseManagement;
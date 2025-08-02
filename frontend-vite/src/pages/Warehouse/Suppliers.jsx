import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../stores/warehouseStore';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Suppliers = () => {
  const {
    suppliers,
    suppliersLoading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  } = useWarehouseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    payment_terms: 30,
    is_active: true,
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    return filterStatus === 'active' ? supplier.is_active : !supplier.is_active;
  });

  const resetForm = () => {
    setSupplierForm({
      name: '',
      code: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      payment_terms: 30,
      is_active: true,
      notes: ''
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

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      code: supplier.code || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      tax_number: supplier.tax_number || '',
      payment_terms: supplier.payment_terms || 30,
      is_active: supplier.is_active,
      notes: supplier.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSupplier(null);
    resetForm();
  };

  const openDeleteModal = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    
    const result = await createSupplier(supplierForm);
    
    if (result.success) {
      toast.success('Постачальника створено успішно');
      closeCreateModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    
    if (!selectedSupplier) return;

    const result = await updateSupplier(selectedSupplier.id, supplierForm);
    
    if (result.success) {
      toast.success('Постачальника оновлено успішно');
      closeEditModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    const result = await deleteSupplier(selectedSupplier.id);
    
    if (result.success) {
      toast.success('Постачальника видалено успішно');
      closeDeleteModal();
    } else {
      toast.error(result.error);
    }
  };

  const getSupplierStats = () => {
    return suppliers.reduce((acc, supplier) => {
      if (supplier.is_active) acc.active++;
      else acc.inactive++;
      acc.total++;
      return acc;
    }, { total: 0, active: 0, inactive: 0 });
  };

  const stats = getSupplierStats();

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Постачальники</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управління базою даних постачальників товарів
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати постачальника
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Всього постачальників</dt>
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
                  placeholder="Пошук постачальників..."
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

      {/* Список постачальників */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Постачальники ({filteredSuppliers.length})
          </h3>

          {suppliersLoading ? (
            <div className="animate-pulse">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">{supplier.name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.is_active ? 'Активний' : 'Неактивний'}
                        </span>
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">Код: {supplier.code}</p>
                      </div>

                      {supplier.contact_person && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700">
                            <strong>Контакт:</strong> {supplier.contact_person}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-2" />
                            {supplier.phone}
                          </div>
                        )}
                        
                        {supplier.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 mr-2" />
                            {supplier.email}
                          </div>
                        )}
                        
                        {supplier.address && (
                          <div className="flex items-start text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{supplier.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Умови оплати: {supplier.payment_terms} днів
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(supplier)}
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
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Немає постачальників</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'За вашим запитом нічого не знайдено' : 'Почніть з додавання вашого першого постачальника'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Модальне вікно створення */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateSupplier}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Додати постачальника
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Назва *
                        </label>
                        <input
                          type="text"
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
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
                          value={supplierForm.code}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, code: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Контактна особа
                      </label>
                      <input
                        type="text"
                        value={supplierForm.contact_person}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, contact_person: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Телефон
                        </label>
                        <input
                          type="tel"
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Адреса
                      </label>
                      <textarea
                        value={supplierForm.address}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ІПН/ЄДРПОУ
                        </label>
                        <input
                          type="text"
                          value={supplierForm.tax_number}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, tax_number: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Умови оплати (днів)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={supplierForm.payment_terms}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, payment_terms: parseInt(e.target.value) || 0 }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Примітки
                      </label>
                      <textarea
                        value={supplierForm.notes}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={supplierForm.is_active}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Активний постачальник
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

      {/* Модальне вікно редагування (схоже на створення) */}
      {isEditModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateSupplier}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Редагувати постачальника
                  </h3>
                  
                  {/* Тот же контент що і в модалці створення */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Назва *
                        </label>
                        <input
                          type="text"
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
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
                          value={supplierForm.code}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, code: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Контактна особа
                      </label>
                      <input
                        type="text"
                        value={supplierForm.contact_person}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, contact_person: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Телефон
                        </label>
                        <input
                          type="tel"
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Адреса
                      </label>
                      <textarea
                        value={supplierForm.address}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ІПН/ЄДРПОУ
                        </label>
                        <input
                          type="text"
                          value={supplierForm.tax_number}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, tax_number: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Умови оплати (днів)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={supplierForm.payment_terms}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, payment_terms: parseInt(e.target.value) || 0 }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Примітки
                      </label>
                      <textarea
                        value={supplierForm.notes}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={supplierForm.is_active}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Активний постачальник
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
      {isDeleteModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Видалити постачальника
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Ви впевнені, що хочете видалити постачальника <strong>{selectedSupplier.name}</strong>? 
                        Цю дію неможливо відмінити.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteSupplier}
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

export default Suppliers;
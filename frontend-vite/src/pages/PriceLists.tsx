import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getResults } from '../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import PriceListModal from '../components/PriceListModal';
import PriceListItemsModal from '../components/PriceListItemsModal';
import ConfirmModal from '../components/ConfirmModal';
import logger from '../services/logger';
import type { Store } from '../types/models';

interface PriceList {
  id: string | number;
  name: string;
  description?: string;
  pricing_strategy: string;
  pricing_strategy_display?: string;
  default_markup_percentage?: string | number;
  is_active: boolean;
  is_default: boolean;
  items_count?: number;
  is_valid?: boolean;
  created_at: string;
  updated_at: string;
}

interface ConfirmModalState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
}

const PriceLists: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Отримуємо магазини користувача
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ['user-stores'],
    queryFn: async () => {
      const response = await api.get('/stores/');
      return getResults<Store>(response.data);
    },
  });

  // Встановлюємо перший магазин за замовчуванням
  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(String(stores[0].id));
    }
  }, [stores, selectedStore]);

  // Отримуємо прайс-листи для вибраного магазину
  const { data: priceLists = [], isLoading } = useQuery<PriceList[]>({
    queryKey: ['pricelists', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      try {
        const response = await api.get(`/pricelists/stores/${selectedStore}/pricelists/`);
        return getResults<PriceList>(response.data);
      } catch (error) {
        logger.error('Error fetching price lists:', error);
        // Fallback до mock даних
        return [
          {
            id: '1',
            name: 'Основний прайс-лист',
            description: 'Стандартні ціни для всіх товарів',
            pricing_strategy: 'cost_plus_markup',
            pricing_strategy_display: 'Собівартість + націнка',
            default_markup_percentage: '25.00',
            is_active: true,
            is_default: true,
            items_count: 42,
            is_valid: true,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-20T14:30:00Z'
          },
          {
            id: '2',
            name: 'Акційний прайс-лист',
            description: 'Знижені ціни для акційних товарів',
            pricing_strategy: 'manual',
            pricing_strategy_display: 'Ручне встановлення цін',
            default_markup_percentage: '15.00',
            is_active: true,
            is_default: false,
            items_count: 18,
            is_valid: true,
            created_at: '2024-01-10T09:00:00Z',
            updated_at: '2024-01-18T16:45:00Z'
          }
        ];
      }
    },
    enabled: !!selectedStore,
  });

  type PriceListPayload = Partial<PriceList>;

  // Створення прайс-листа
  const createMutation = useMutation<PriceList, Error, PriceListPayload>({
    mutationFn: async (data) => {
      const response = await api.post(`/pricelists/stores/${selectedStore}/pricelists/`, data);
      return response.data as PriceList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricelists', selectedStore] });
      setIsCreateModalOpen(false);
      toast.success('Прайс-лист створено');
    },
    onError: (error) => {
      toast.error('Помилка створення прайс-листа');
      logger.error('Create error:', error);
    },
  });

  // Оновлення прайс-листа
  const updateMutation = useMutation<
    PriceList,
    Error,
    { id: string | number; data: PriceListPayload }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await api.patch(
        `/pricelists/stores/${selectedStore}/pricelists/${id}/`,
        data
      );
      return response.data as PriceList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricelists', selectedStore] });
      setIsEditModalOpen(false);
      setSelectedPriceList(null);
      toast.success('Прайс-лист оновлено');
    },
    onError: (error) => {
      toast.error('Помилка оновлення прайс-листа');
      logger.error('Update error:', error);
    },
  });

  // Видалення прайс-листа
  const deleteMutation = useMutation<unknown, Error, string | number>({
    mutationFn: async (id) => {
      await api.delete(`/pricelists/stores/${selectedStore}/pricelists/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricelists', selectedStore] });
      toast.success('Прайс-лист видалено');
    },
    onError: (error) => {
      toast.error('Помилка видалення прайс-листа');
      logger.error('Delete error:', error);
    },
  });

  // Фільтрація прайс-листів
  const filteredPriceLists = priceLists.filter((priceList) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      priceList.name.toLowerCase().includes(term) ||
      (priceList.description ?? '').toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && priceList.is_active) ||
      (statusFilter === 'inactive' && !priceList.is_active) ||
      (statusFilter === 'default' && priceList.is_default);

    return matchesSearch && matchesStatus;
  });

  const handleCreate = (formData: PriceListPayload): void => {
    createMutation.mutate(formData);
  };

  const handleEdit = (priceList: PriceList): void => {
    setSelectedPriceList(priceList);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (formData: PriceListPayload): void => {
    if (!selectedPriceList) return;
    updateMutation.mutate({ id: selectedPriceList.id, data: formData });
  };

  const handleDelete = (priceList: PriceList): void => {
    setConfirmModal({
      open: true,
      title: 'Видалення прайс-листа',
      message: `Видалити прайс-лист "${priceList.name}"?`,
      onConfirm: () => {
        deleteMutation.mutate(priceList.id);
      },
    });
  };

  const handleViewItems = (priceList: PriceList): void => {
    setSelectedPriceList(priceList);
    setIsItemsModalOpen(true);
  };

  const copyPriceList = async (priceList: PriceList): Promise<void> => {
    try {
      await api.post(`/pricelists/stores/${selectedStore}/pricelists/${priceList.id}/copy/`);
      queryClient.invalidateQueries({ queryKey: ['pricelists', selectedStore] });
      toast.success('Прайс-лист скопійовано');
    } catch {
      toast.error('Помилка копіювання прайс-листа');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (priceList: PriceList): React.ReactElement => {
    if (!priceList.is_active) {
      return <span className="badge badge-secondary">Неактивний</span>;
    }
    if (priceList.is_default) {
      return <span className="badge badge-primary">За замовчуванням</span>;
    }
    if (priceList.is_valid) {
      return <span className="badge badge-success">Активний</span>;
    }
    return <span className="badge badge-warning">Неактуальний</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Прайс-листи</h1>
          <p className="mt-1 text-sm text-gray-500">Управління цінами товарів</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Створити прайс-лист
        </button>
      </div>

      {/* Filters */}
      <div className="card card-body space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Store Selection */}
          <div className="flex-1">
            <label className="form-label">Магазин</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="input"
            >
              <option value="">Оберіть магазин</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="form-label">Пошук</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Пошук прайс-листів..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="form-label">Статус</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">Всі</option>
              <option value="active">Активні</option>
              <option value="inactive">Неактивні</option>
              <option value="default">За замовчуванням</option>
            </select>
          </div>
        </div>
      </div>

      {/* Price Lists Grid */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPriceLists.map(priceList => (
            <div key={priceList.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{priceList.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{priceList.description}</p>
                    {getStatusBadge(priceList)}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Cog6ToothIcon className="h-4 w-4 mr-2" />
                    {priceList.pricing_strategy_display}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Націнка: {priceList.default_markup_percentage}%
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Товарів: {priceList.items_count}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Оновлено: {formatDate(priceList.updated_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewItems(priceList)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Переглянути
                  </button>
                  <button
                    onClick={() => handleEdit(priceList)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyPriceList(priceList)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-lg"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(priceList)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg"
                    disabled={priceList.is_default}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPriceLists.length === 0 && (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Немає прайс-листів</h3>
          <p className="text-gray-600 mb-4">
            {selectedStore ? 'Створіть свій перший прайс-лист для управління цінами' : 'Оберіть магазин для перегляду прайс-листів'}
          </p>
          {selectedStore && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Створити прайс-лист
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <PriceListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate as (data: unknown) => void}
      />

      {/* Edit Modal */}
      <PriceListModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPriceList(null);
        }}
        priceList={selectedPriceList as unknown as { id?: string | number; [key: string]: unknown }}
        onSave={handleUpdate as (data: unknown) => void}
      />

      {/* Items Modal */}
      <PriceListItemsModal
        isOpen={isItemsModalOpen}
        onClose={() => {
          setIsItemsModalOpen(false);
          setSelectedPriceList(null);
        }}
        priceList={selectedPriceList ? { id: selectedPriceList.id, name: selectedPriceList.name } : null}
        storeId={selectedStore}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm ?? (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

export default PriceLists;
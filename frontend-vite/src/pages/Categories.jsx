import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
  FolderIcon, ChartBarIcon, BuildingStorefrontIcon,
  CheckCircleIcon, XCircleIcon, TagIcon, EyeIcon,
  PauseCircleIcon, PlayCircleIcon,
} from '@heroicons/react/24/outline';
import api, { getResults } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import CategoryModal from '../components/CategoryModal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const Categories = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [stores, setStores] = useState([]);
  const [storesLoaded, setStoresLoaded] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(storeId || null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const currentStoreId = selectedStoreId || stores[0]?.id;

  // Завантаження магазинів — один раз
  useEffect(() => {
    api.get('/stores/')
      .then(res => {
        const list = getResults(res.data);
        setStores(list);
        if (!selectedStoreId && list.length > 0) {
          setSelectedStoreId(list[0].id);
        }
      })
      .catch(() => setStores([]))
      .finally(() => setStoresLoaded(true));
  }, []);

  // Завантаження категорій — при зміні магазину або пошуку
  const loadCategories = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await api.get(`/products/stores/${currentStoreId}/categories/${params}`);
      setCategories(getResults(res.data));
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [currentStoreId, searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // URL sync
  useEffect(() => {
    if (currentStoreId && !storeId) {
      navigate(`/categories/${currentStoreId}`, { replace: true });
    }
  }, [currentStoreId, storeId, navigate]);

  // Дії
  const handleDelete = (id) => {
    setConfirmModal({
      open: true,
      title: 'Видалення',
      message: 'Видалити цю категорію?',
      onConfirm: async () => {
        const backup = categories;
        setCategories(prev => prev.filter(c => c.id !== id));
        toast.success('Категорію видалено');
        try {
          await api.delete(`/products/stores/${currentStoreId}/categories/${id}/`);
        } catch {
          setCategories(backup);
          toast.error('Помилка видалення');
        }
      },
    });
  };

  const handleToggleStatus = async (cat) => {
    const newStatus = !cat.is_active;
    // Оптимістичне оновлення — одразу показуємо зміну
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newStatus } : c));
    toast.success(newStatus ? 'Категорію активовано' : 'Категорію деактивовано');
    try {
      await api.patch(`/products/stores/${currentStoreId}/categories/${cat.id}/`, {
        is_active: newStatus,
      });
    } catch {
      // Відкат при помилці
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: cat.is_active } : c));
      toast.error('Помилка зміни статусу');
    }
  };

  const openCreate = () => { setEditingCategory(null); setModalOpen(true); };
  const openEdit = (cat) => { setEditingCategory(cat); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingCategory(null); };

  const handleModalSuccess = (savedData, isEditing) => {
    if (isEditing && savedData?.id) {
      setCategories(prev => prev.map(c => c.id === savedData.id ? { ...c, ...savedData } : c));
      toast.success('Категорію оновлено');
    } else if (savedData) {
      setCategories(prev => [...prev, savedData]);
      toast.success('Категорію створено');
    }
  };

  // Фільтрація (додатковий клієнтський пошук)
  const filtered = categories;
  const activeCount = filtered.filter(c => c.is_active).length;
  const totalProducts = filtered.reduce((s, c) => s + (c.products_count || 0), 0);

  // Поки магазини не завантажились — спінер
  if (!storesLoaded) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Немає магазинів — пропонуємо створити
  if (stores.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-yellow-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Немає доступних магазинів</h3>
        <p className="text-gray-600 mb-4">Спочатку створіть магазин, щоб керувати категоріями.</p>
        <button
          onClick={() => navigate('/stores')}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-xl text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg transform hover:scale-105 active:scale-95 relative overflow-hidden group"
        >
          <span className="relative z-10">Створити магазин</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Категорії</h1>
            <p className="text-sm text-gray-500">Керуйте категоріями товарів</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stores.length > 1 && (
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white"
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button onClick={openCreate} className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg transition-all">
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати категорію
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Пошук категорій..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всього', value: filtered.length, icon: FolderIcon, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
          { label: 'Активні', value: activeCount, icon: CheckCircleIcon, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Неактивні', value: filtered.length - activeCount, icon: XCircleIcon, gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
          { label: 'Товарів', value: totalProducts, icon: ChartBarIcon, gradient: 'from-purple-500 to-indigo-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">{s.label}</div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 text-center py-16">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">Немає категорій</h3>
          <p className="mt-1 text-sm text-gray-500">Створіть першу категорію для товарів</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати категорію
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Категорія</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Товарів</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Створена</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <FolderIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{cat.name}</div>
                        {cat.description && <div className="text-xs text-gray-500 line-clamp-1">{cat.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
                      {cat.products_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cat.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cat.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {cat.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cat.created_at ? new Date(cat.created_at).toLocaleDateString('uk-UA') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/products?category=${cat.id}`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Товари">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(cat)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Редагувати">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleToggleStatus(cat)} className={`p-2 rounded-lg ${cat.is_active ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={cat.is_active ? 'Деактивувати' : 'Активувати'}>
                        {cat.is_active ? <PauseCircleIcon className="h-4 w-4" /> : <PlayCircleIcon className="h-4 w-4" />}
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Видалити">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={closeModal}
        category={editingCategory}
        storeId={currentStoreId}
        onSuccess={handleModalSuccess}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

export default Categories;

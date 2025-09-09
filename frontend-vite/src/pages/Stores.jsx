import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const SOCIAL_TYPES = [
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'telegram', label: 'Telegram', icon: '📱' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'website', label: 'Веб-сайт', icon: '🌐' },
];

const BLOCK_TYPES = [
  { value: 'about', label: 'Про нас', icon: '📝' },
  { value: 'contact', label: 'Контакти', icon: '📞' },
  { value: 'faq', label: 'Часті питання', icon: '❓' },
  { value: 'custom', label: 'Кастомний блок', icon: '🔧' },
];

const Stores = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Мутація для видалення магазину
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId) => {
      await api.delete(`/stores/${storeId}/`);
    },
    onSuccess: (_, storeId) => {
      // Оновлюємо кеш після успішного видалення
      queryClient.setQueryData(['stores'], (oldData) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.filter(store => store.id !== storeId);
        }
        if (oldData.results) {
          return {
            ...oldData,
            results: oldData.results.filter(store => store.id !== storeId)
          };
        }
        return oldData;
      });
      
      toast.success('Магазин успішно видалено!');
      setShowDeleteModal(false);
      setStoreToDelete(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          'Помилка видалення магазину';
      toast.error(errorMessage);
    }
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [socialLinks, setSocialLinks] = useState([]);
  const [storeBlocks, setStoreBlocks] = useState([]);

  // Отримуємо дані магазинів з API
  const { data: stores = [], isLoading: isLoadingStores, refetch } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      try {
        const response = await api.get('/stores/');
        return response.data.results || response.data || [];
      } catch (error) {
        console.error('Stores fetch error:', error);
        // Fallback на моковані дані якщо API недоступне
        return [
          {
            id: 1,
            name: 'Мій інтернет-магазин',
            slug: 'my-online-store',
            description: 'Продаж електроніки та аксесуарів',
            status: 'active',
            products_count: 12,
            orders_count: 8,
            revenue: 15600,
          },
        ];
      }
    },
    retry: false,
  });

  // Форма для створення/редагування магазину
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Функція для відкриття модального вікна створення магазину
  const handleCreateStore = () => {
    setEditingStore(null);
    reset({
      name: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      primary_color: '#3B82F6',
      secondary_color: '#1F2937',
      accent_color: '#F59E0B',
      show_instagram_feed: false,
      show_telegram_button: true,
      meta_title: '',
      meta_description: '',
      is_active: true,
    });
    setShowModal(true);
    clearFiles();
    clearSocialLinks();
    clearStoreBlocks();
  };

  // Функція для відкриття модального вікна редагування
  const handleEditStore = (store) => {
    setEditingStore(store);
    reset({
      name: store.name,
      description: store.description || '',
      phone: store.phone || '',
      email: store.email || '',
      address: store.address || '',
      primary_color: store.primary_color || '#3B82F6',
      secondary_color: store.secondary_color || '#1F2937',
      accent_color: store.accent_color || '#F59E0B',
      show_instagram_feed: store.show_instagram_feed || false,
      show_telegram_button: store.show_telegram_button !== false,
      meta_title: store.meta_title || '',
      meta_description: store.meta_description || '',
      is_active: store.is_active !== false,
    });
    setShowModal(true);
    
    // Встановлюємо preview для існуючих зображень
    if (store.logo) {
      setLogoPreview(store.logo);
    } else {
      setLogoPreview(null);
    }
    
    if (store.banner_image) {
      setBannerPreview(store.banner_image);
    } else {
      setBannerPreview(null);
    }
    
    setLogoFile(null);
    setBannerFile(null);
    
    // Завантажуємо соціальні мережі
    if (store.social_links && store.social_links.length > 0) {
      setSocialLinks(store.social_links.map(link => ({ ...link, isNew: false })));
    } else {
      clearSocialLinks();
    }
    
    // Завантажуємо блоки магазину
    if (store.blocks && store.blocks.length > 0) {
      setStoreBlocks(store.blocks.map(block => ({ ...block, isNew: false })));
    } else {
      clearStoreBlocks();
    }
  };

  // Функція для збереження магазину
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      let storeData;
      
      // Створюємо FormData якщо є файли для завантаження
      if (logoFile || bannerFile) {
        const formData = new FormData();
        
        // Додаємо всі поля форми
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
          }
        });
        
        // Додаємо файли якщо є
        if (logoFile) {
          formData.append('logo', logoFile);
        }
        if (bannerFile) {
          formData.append('banner_image', bannerFile);
        }
        
        storeData = formData;
      } else {
        storeData = data;
      }
      
      let storeId;
      
      if (editingStore) {
        // Редагування існуючого магазину
        await api.put(`/stores/${editingStore.id}/`, storeData, {
          headers: (logoFile || bannerFile) ? {
            'Content-Type': 'multipart/form-data',
          } : {}
        });
        storeId = editingStore.id;
        toast.success('Магазин успішно оновлено!');
      } else {
        // Створення нового магазину
        const response = await api.post('/stores/', storeData, {
          headers: (logoFile || bannerFile) ? {
            'Content-Type': 'multipart/form-data',
          } : {}
        });
        storeId = response.data.id;
        toast.success('Магазин успішно створено!');
      }
      
      // Зберігаємо соціальні мережі
      if (socialLinks.length > 0) {
        await saveSocialLinks(storeId);
      }
      
      // Зберігаємо блоки магазину
      if (storeBlocks.length > 0) {
        await saveStoreBlocks(storeId);
      }
      
      setShowModal(false);
      setActiveTab('basic');
      clearFiles();
      clearSocialLinks();
      clearStoreBlocks();
      refetch(); // Оновлюємо список магазинів
    } catch (error) {
      console.error('Store save error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          (editingStore ? 'Помилка оновлення магазину' : 'Помилка створення магазину');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для відкриття модального вікна видалення
  const handleDeleteStore = (store) => {
    setStoreToDelete(store);
    setShowDeleteModal(true);
  };

  // Функція для підтвердження видалення магазину
  const confirmDeleteStore = () => {
    if (!storeToDelete) return;
    deleteStoreMutation.mutate(storeToDelete.id);
  };

  // Функція для скасування видалення
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStoreToDelete(null);
  };

  // Функція для обробки завантаження логотипу
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Перевіряємо тип файлу
    if (!file.type.startsWith('image/')) {
      toast.error('Будь ласка, виберіть файл зображення');
      return;
    }

    // Перевіряємо розмір файлу (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Розмір файлу не повинен перевищувати 2MB');
      return;
    }

    setLogoFile(file);
    
    // Створюємо preview
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Функція для обробки завантаження банеру
  const handleBannerUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Перевіряємо тип файлу
    if (!file.type.startsWith('image/')) {
      toast.error('Будь ласка, виберіть файл зображення');
      return;
    }

    // Перевіряємо розмір файлу (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Розмір файлу не повинен перевищувати 5MB');
      return;
    }

    setBannerFile(file);
    
    // Створюємо preview
    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Функція для очищення файлів
  const clearFiles = () => {
    setLogoFile(null);
    setBannerFile(null);
    setLogoPreview(null);
    setBannerPreview(null);
  };

  // Функції для роботи з соціальними мережами
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { 
      id: Date.now(), // Тимчасовий ID для нових записів
      social_type: 'instagram', 
      url: '', 
      title: '', 
      is_active: true,
      isNew: true // Позначаємо як новий запис
    }]);
  };

  const updateSocialLink = (index, field, value) => {
    const updatedLinks = [...socialLinks];
    updatedLinks[index][field] = value;
    setSocialLinks(updatedLinks);
  };

  const removeSocialLink = (index) => {
    const updatedLinks = socialLinks.filter((_, i) => i !== index);
    setSocialLinks(updatedLinks);
  };

  const clearSocialLinks = () => {
    setSocialLinks([]);
  };

  // Функція для збереження соціальних мереж
  const saveSocialLinks = async (storeId) => {
    if (!storeId) return;

    for (const link of socialLinks) {
      try {
        if (link.isNew) {
          // Створюємо новий запис
          if (link.url.trim()) { // Тільки якщо URL не порожній
            await api.post(`/stores/${storeId}/social-links/`, {
              social_type: link.social_type,
              url: link.url,
              title: link.title,
              is_active: link.is_active
            });
          }
        } else {
          // Оновлюємо існуючий запис
          await api.put(`/stores/${storeId}/social-links/${link.id}/`, {
            social_type: link.social_type,
            url: link.url,
            title: link.title,
            is_active: link.is_active
          });
        }
      } catch (error) {
        console.error('Error saving social link:', error);
        // Не блокуємо весь процес збереження через помилку в одній соціальній мережі
      }
    }
  };

  // Функції для роботи з блоками магазину
  const addStoreBlock = () => {
    const newOrder = storeBlocks.length > 0 ? Math.max(...storeBlocks.map(b => b.order)) + 1 : 0;
    setStoreBlocks([...storeBlocks, { 
      id: Date.now(), // Тимчасовий ID для нових записів
      title: '', 
      content: '', 
      block_type: 'custom',
      order: newOrder,
      is_active: true,
      isNew: true // Позначаємо як новий запис
    }]);
  };

  const updateStoreBlock = (index, field, value) => {
    const updatedBlocks = [...storeBlocks];
    updatedBlocks[index][field] = value;
    setStoreBlocks(updatedBlocks);
  };

  const removeStoreBlock = (index) => {
    const updatedBlocks = storeBlocks.filter((_, i) => i !== index);
    setStoreBlocks(updatedBlocks);
  };

  const moveStoreBlock = (index, direction) => {
    const updatedBlocks = [...storeBlocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < updatedBlocks.length) {
      // Міняємо місцями
      [updatedBlocks[index], updatedBlocks[newIndex]] = [updatedBlocks[newIndex], updatedBlocks[index]];
      
      // Оновлюємо order
      updatedBlocks.forEach((block, i) => {
        block.order = i;
      });
      
      setStoreBlocks(updatedBlocks);
    }
  };

  const clearStoreBlocks = () => {
    setStoreBlocks([]);
  };

  // Функція для збереження блоків магазину
  const saveStoreBlocks = async (storeId) => {
    if (!storeId) return;

    for (const block of storeBlocks) {
      try {
        if (block.isNew) {
          // Створюємо новий запис
          if (block.title.trim() && block.content.trim()) { // Тільки якщо є заголовок і контент
            await api.post(`/stores/${storeId}/blocks/`, {
              title: block.title,
              content: block.content,
              block_type: block.block_type,
              order: block.order,
              is_active: block.is_active
            });
          }
        } else {
          // Оновлюємо існуючий запис
          await api.put(`/stores/${storeId}/blocks/${block.id}/`, {
            title: block.title,
            content: block.content,
            block_type: block.block_type,
            order: block.order,
            is_active: block.is_active
          });
        }
      } catch (error) {
        console.error('Error saving store block:', error);
        // Не блокуємо весь процес збереження через помилку в одному блоці
      }
    }
  };

  // Перевіряємо чи передано магазин для редагування
  useEffect(() => {
    if (location.state?.editStore) {
      const storeToEdit = location.state.editStore;
      handleEditStore(storeToEdit);
      
      // Очищуємо стан після обробки
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (isLoadingStores) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Завантаження магазинів...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 animate-fade-in-up">
        {/* Hero заголовок з градієнтом */}
        <div className="glass-strong rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold gradient-text-blue mb-4">Мої магазини</h1>
            <p className="text-lg text-gray-600 mb-8">
              Створюйте, керуйте та розвивайте свої інтернет-магазини в одному місці
            </p>
            <button onClick={handleCreateStore} className="btn-primary text-sm px-4 py-2 flex items-center justify-center whitespace-nowrap mx-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              Створити новий магазин
            </button>
          </div>
          
          {/* Декоративні елементи */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Список магазинів */}
        {stores.length === 0 ? (
          <div className="card text-center py-16 animate-fade-in-scale">
            <div className="card-body">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Створіть свій перший магазин</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Почніть свій шлях в електронній комерції. Створіть красивий магазин за декілька хвилин.
              </p>
              <button onClick={handleCreateStore} className="btn-primary text-lg px-8 py-4 flex items-center justify-center whitespace-nowrap mx-auto">
                <PlusIcon className="h-5 w-5 mr-3" />
                Створити перший магазин
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store, index) => (
              <div 
                key={store.id} 
                className="card group hover:scale-105 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-body relative overflow-hidden">
                  {/* Логотип або плейсхолдер */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {store.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {store.name}
                        </h3>
                        <span className={`badge text-xs ${(store.is_active || store.status === 'active') ? 'badge-success' : 'badge-warning'}`}>
                          {(store.is_active || store.status === 'active') ? '🟢 Активний' : '🟡 Неактивний'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
                    {store.description || 'Опис магазину не вказано'}
                  </p>
                  
                  {/* Дії */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/stores/${store.id}`}
                      className="btn-outline flex-1 flex items-center justify-center text-sm py-2 whitespace-nowrap"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Переглянути
                    </Link>
                    <button 
                      onClick={() => handleEditStore(store)}
                      className="btn-outline px-3 py-2"
                      title="Редагувати"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteStore(store)}
                      className="btn-outline px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                      title="Видалити"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальне вікно для створення/редагування магазину */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-slate-900/80 transition-all duration-300 backdrop-blur-sm" 
              onClick={() => { setShowModal(false); setActiveTab('basic'); }}
            ></div>

            {/* Invisible element to center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal */}
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all duration-300 sm:my-8 sm:align-middle w-full max-w-5xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0v-5a2 2 0 00-2-2H8a2 2 0 00-2 2v5m5 0V9a1 1 0 00-1-1H9a1 1 0 00-1 1v10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        {editingStore ? 'Редагувати магазин' : 'Створити магазин'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {editingStore ? 'Оновіть інформацію про ваш магазин' : 'Створіть новий магазин для продажу товарів'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setActiveTab('basic');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200/60 mb-8">
                  <nav className="-mb-px flex space-x-4">
                    {[
                      { id: 'basic', name: 'Основна інформація' },
                      { id: 'contact', name: 'Контакти' },
                      { id: 'design', name: 'Дизайн' },
                      { id: 'landing', name: 'Лендинг' },
                      { id: 'social', name: 'Соцмережі' },
                      { id: 'blocks', name: 'Контент' },
                      { id: 'seo', name: 'SEO' },
                      { id: 'settings', name: 'Налаштування' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3 px-4 border-b-2 font-semibold text-sm rounded-t-lg transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>
            
                  <form id="store-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Основна інформація */}
                    {activeTab === 'basic' && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="name" className="form-label">Назва магазину *</label>
                          <input
                            id="name"
                            type="text"
                            {...register('name', {
                              required: 'Назва магазину обов\'язкова',
                              minLength: {
                                value: 2,
                                message: 'Назва повинна містити принаймні 2 символи',
                              },
                            })}
                            className="input"
                            placeholder="Введіть назву магазину"
                          />
                          {errors.name && (
                            <p className="form-error">{errors.name.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="form-label">Опис</label>
                          <textarea
                            id="description"
                            rows={4}
                            {...register('description')}
                            className="input"
                            placeholder="Розкажіть про ваш магазин..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Контактна інформація */}
                    {activeTab === 'contact' && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="phone" className="form-label">Телефон</label>
                          <input
                            id="phone"
                            type="tel"
                            {...register('phone')}
                            className="input"
                            placeholder="+380 (XX) XXX-XX-XX"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="form-label">Email</label>
                          <input
                            id="email"
                            type="email"
                            {...register('email')}
                            className="input"
                            placeholder="store@example.com"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="address" className="form-label">Адреса</label>
                          <textarea
                            id="address"
                            rows={3}
                            {...register('address')}
                            className="input"
                            placeholder="Введіть адресу магазину або точку видачі..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Дизайн */}
                    {activeTab === 'design' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <label htmlFor="primary_color" className="form-label">Основний колір</label>
                            <input
                              id="primary_color"
                              type="color"
                              {...register('primary_color')}
                              className="input h-12"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="secondary_color" className="form-label">Додатковий колір</label>
                            <input
                              id="secondary_color"
                              type="color"
                              {...register('secondary_color')}
                              className="input h-12"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="accent_color" className="form-label">Акцентний колір</label>
                            <input
                              id="accent_color"
                              type="color"
                              {...register('accent_color')}
                              className="input h-12"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Лендинг */}
                    {activeTab === 'landing' && (
                      <div className="space-y-6">
                        {/* Логотип */}
                        <div>
                          <label className="form-label">Логотип магазину</label>
                          <div className="mt-2">
                            {logoPreview ? (
                              <div className="relative inline-block">
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLogoPreview(null);
                                    setLogoFile(null);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                  </svg>
                                  <p className="text-xs text-gray-500">Завантажити</p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Рекомендований розмір: 200x200px. Максимум: 2MB
                          </p>
                        </div>

                        {/* Банер */}
                        <div>
                          <label className="form-label">Банер магазину</label>
                          <div className="mt-2">
                            {bannerPreview ? (
                              <div className="relative inline-block">
                                <img
                                  src={bannerPreview}
                                  alt="Banner preview"
                                  className="w-full max-w-md h-32 object-cover rounded-lg border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBannerPreview(null);
                                    setBannerFile(null);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full max-w-md h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                  </svg>
                                  <p className="text-xs text-gray-500">Завантажити банер</p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleBannerUpload}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Рекомендований розмір: 1200x400px. Максимум: 5MB
                          </p>
                        </div>

                        {/* Налаштування лендингу */}
                        <div>
                          <h3 className="text-base font-medium text-gray-900 mb-4">Налаштування лендингу</h3>
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <input
                                id="show_telegram_button"
                                type="checkbox"
                                {...register('show_telegram_button')}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label htmlFor="show_telegram_button" className="ml-2 block text-sm text-gray-900">
                                Показувати кнопку Telegram
                              </label>
                            </div>
                            
                            <div className="flex items-center">
                              <input
                                id="show_instagram_feed"
                                type="checkbox"
                                {...register('show_instagram_feed')}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label htmlFor="show_instagram_feed" className="ml-2 block text-sm text-gray-900">
                                Показувати Instagram стрічку
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Соціальні мережі */}
                    {activeTab === 'social' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900">Соціальні мережі</h3>
                          <button
                            type="button"
                            onClick={addSocialLink}
                            className="btn-outline flex items-center whitespace-nowrap"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Додати соцмережу
                          </button>
                        </div>

                        {socialLinks.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>Соціальні мережі не додано</p>
                            <button
                              type="button"
                              onClick={addSocialLink}
                              className="btn-primary mt-4 whitespace-nowrap"
                            >
                              Додати першу соцмережу
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {socialLinks.map((link, index) => (
                              <div key={link.id || index} className="border border-gray-200 rounded-lg p-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <div>
                                    <label className="form-label">Тип соцмережі</label>
                                    <select
                                      value={link.social_type}
                                      onChange={(e) => updateSocialLink(index, 'social_type', e.target.value)}
                                      className="input"
                                    >
                                      {SOCIAL_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                          {type.icon} {type.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="form-label">URL</label>
                                    <input
                                      type="url"
                                      value={link.url}
                                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                      className="input"
                                      placeholder="https://instagram.com/username"
                                    />
                                  </div>

                                  <div>
                                    <label className="form-label">Назва (необов'язково)</label>
                                    <input
                                      type="text"
                                      value={link.title}
                                      onChange={(e) => updateSocialLink(index, 'title', e.target.value)}
                                      className="input"
                                      placeholder="Наш Instagram"
                                    />
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={link.is_active}
                                        onChange={(e) => updateSocialLink(index, 'is_active', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <label className="ml-2 block text-sm text-gray-900">
                                        Активна
                                      </label>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => removeSocialLink(index)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Блоки контенту */}
                    {activeTab === 'blocks' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900">Блоки контенту</h3>
                          <button
                            type="button"
                            onClick={addStoreBlock}
                            className="btn-outline flex items-center whitespace-nowrap"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Додати блок
                          </button>
                        </div>

                        {storeBlocks.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>Блоки контенту не додано</p>
                            <p className="text-sm mt-2">Додайте блоки для створення інформативного лендингу вашого магазину</p>
                            <button
                              type="button"
                              onClick={addStoreBlock}
                              className="btn-primary mt-4 whitespace-nowrap"
                            >
                              Додати перший блок
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {storeBlocks.map((block, index) => (
                              <div key={block.id || index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={block.block_type}
                                      onChange={(e) => updateStoreBlock(index, 'block_type', e.target.value)}
                                      className="text-sm border border-gray-300 rounded px-2 py-1"
                                    >
                                      {BLOCK_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                          {type.icon} {type.label}
                                        </option>
                                      ))}
                                    </select>
                                    
                                    <div className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={block.is_active}
                                        onChange={(e) => updateStoreBlock(index, 'is_active', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <label className="ml-2 text-sm text-gray-600">
                                        Активний
                                      </label>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    {/* Кнопки переміщення */}
                                    <button
                                      type="button"
                                      onClick={() => moveStoreBlock(index, 'up')}
                                      disabled={index === 0}
                                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <ChevronUpIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveStoreBlock(index, 'down')}
                                      disabled={index === storeBlocks.length - 1}
                                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <ChevronDownIcon className="h-4 w-4" />
                                    </button>
                                    
                                    {/* Кнопка видалення */}
                                    <button
                                      type="button"
                                      onClick={() => removeStoreBlock(index)}
                                      className="p-1 text-red-600 hover:text-red-800"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className="form-label">Заголовок блоку *</label>
                                    <input
                                      type="text"
                                      value={block.title}
                                      onChange={(e) => updateStoreBlock(index, 'title', e.target.value)}
                                      className="input"
                                      placeholder="Введіть заголовок блоку"
                                    />
                                  </div>

                                  <div>
                                    <label className="form-label">Контент *</label>
                                    <textarea
                                      rows={6}
                                      value={block.content}
                                      onChange={(e) => updateStoreBlock(index, 'content', e.target.value)}
                                      className="input"
                                      placeholder="Введіть контент блоку. Підтримується HTML розмітка..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Підтримується HTML розмітка для форматування тексту
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="text-xs text-gray-500">
                                    Порядок: #{index + 1} | Тип: {BLOCK_TYPES.find(t => t.value === block.block_type)?.label}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {storeBlocks.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                  Поради для блоків контенту
                                </h3>
                                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                                  <li><strong>Про нас</strong> - розкажіть про історію та місію магазину</li>
                                  <li><strong>Контакти</strong> - додайте контактну інформацію та години роботи</li>
                                  <li><strong>Часті питання</strong> - відповіді на популярні запитання клієнтів</li>
                                  <li><strong>Кастомний блок</strong> - будь-яка додаткова інформація</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SEO */}
                    {activeTab === 'seo' && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="meta_title" className="form-label">Meta Title</label>
                          <input
                            id="meta_title"
                            type="text"
                            {...register('meta_title', {
                              maxLength: {
                                value: 60,
                                message: 'Meta title повинен бути до 60 символів'
                              }
                            })}
                            className="input"
                            placeholder="SEO заголовок для пошукових систем"
                          />
                          {errors.meta_title && (
                            <p className="form-error">{errors.meta_title.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="meta_description" className="form-label">Meta Description</label>
                          <textarea
                            id="meta_description"
                            rows={3}
                            {...register('meta_description', {
                              maxLength: {
                                value: 160,
                                message: 'Meta description повинен бути до 160 символів'
                              }
                            })}
                            className="input"
                            placeholder="Опис для пошукових систем..."
                          />
                          {errors.meta_description && (
                            <p className="form-error">{errors.meta_description.message}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Налаштування */}
                    {activeTab === 'settings' && (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            id="is_active"
                            type="checkbox"
                            {...register('is_active')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                            Магазин активний
                          </label>
                        </div>
                      </div>
                    )}
                    
                  </form>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/30 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse border-t border-gray-200/50">
                  <button
                    type="submit"
                    form="store-form"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Збереження...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {editingStore ? 'Оновити' : 'Створити'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setActiveTab('basic');
                    }}
                    className="mt-3 w-full inline-flex justify-center items-center rounded-xl border-2 border-gray-200 shadow-sm px-6 py-3 bg-white/80 backdrop-blur-sm text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-500/20 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          </div>
        
      )}

      {/* Модальне вікно підтвердження видалення */}
      {showDeleteModal && storeToDelete && (
        <div className="fixed inset-0 z-[9999]">
          <div className="fixed inset-0 bg-black/70" onClick={cancelDelete}></div>
          
          <div className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in-scale">
            <div 
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <TrashIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Видалення магазину
                      </h3>
                      <p className="text-sm text-gray-600">
                        Це безповоротна дія
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={cancelDelete}
                    disabled={deleteStoreMutation.isPending}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
            
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-700 mb-3">
                    Ви впевнені, що хочете видалити магазин?
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="font-bold text-lg text-gray-900">
                      "{storeToDelete.name}"
                    </p>
                    {storeToDelete.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {storeToDelete.description}
                      </p>
                    )}
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center justify-center space-x-2 text-red-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                      <span className="font-medium">Увага!</span>
                    </div>
                    <p className="text-sm text-red-600 mt-2">
                      Всі дані магазину будуть втрачені назавжди.
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={confirmDeleteStore}
                    disabled={deleteStoreMutation.isPending}
                    className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 flex-1 flex items-center justify-center py-3 whitespace-nowrap"
                  >
                    {deleteStoreMutation.isPending && (
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {deleteStoreMutation.isPending ? 'Видалення...' : 'Так, видалити'}
                  </button>
                  <button
                    onClick={cancelDelete}
                    disabled={deleteStoreMutation.isPending}
                    className="btn-outline flex-1 py-3 whitespace-nowrap"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Stores;
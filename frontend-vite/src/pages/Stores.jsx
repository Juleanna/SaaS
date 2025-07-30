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
  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;

    setIsLoading(true);
    try {
      await api.delete(`/stores/${storeToDelete.id}/`);
      toast.success('Магазин успішно видалено!');
      setShowDeleteModal(false);
      setStoreToDelete(null);
      refetch(); // Оновлюємо список магазинів
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          'Помилка видалення магазину';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для скасування видалення
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStoreToDelete(null);
  };

  // Функція для генерації slug з назви
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мої магазини</h1>
          <p className="mt-1 text-sm text-gray-500">
            Керуйте всіма вашими магазинами
          </p>
        </div>
        <button onClick={handleCreateStore} className="btn-primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          Створити магазин
        </button>
      </div>

      {/* Список магазинів */}
      {stores.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">У вас поки немає магазинів</div>
          <button onClick={handleCreateStore} className="btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Створити перший магазин
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <div key={store.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {store.name}
                  </h3>
                  <span className={`badge ${(store.is_active || store.status === 'active') ? 'badge-success' : 'badge-warning'}`}>
                    {(store.is_active || store.status === 'active') ? 'Активний' : 'Неактивний'}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{store.description || 'Без опису'}</p>
                
                {/* Контактна інформація якщо є */}
                {(store.phone || store.email) && (
                  <div className="mt-3 text-xs text-gray-400 space-y-1">
                    {store.phone && <div>📞 {store.phone}</div>}
                    {store.email && <div>✉️ {store.email}</div>}
                  </div>
                )}
                
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {store.products_count || store.products || 0}
                    </div>
                    <div className="text-xs text-gray-500">Товари</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {store.orders_count || store.orders || 0}
                    </div>
                    <div className="text-xs text-gray-500">Замовлення</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {store.revenue || 0} ₴
                    </div>
                    <div className="text-xs text-gray-500">Дохід</div>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-2">
                  <Link
                    to={`/stores/${store.id}`}
                    className="btn-outline flex-1 flex items-center justify-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Переглянути
                  </Link>
                  <button 
                    onClick={() => handleEditStore(store)}
                    className="btn-outline"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteStore(store)}
                    className="btn-outline text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальне вікно для створення/редагування магазину */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingStore ? 'Редагувати магазин' : 'Створити новий магазин'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setActiveTab('basic');
                }}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'basic', name: 'Основне' },
                  { id: 'contact', name: 'Контакти' },
                  { id: 'design', name: 'Дизайн' },
                  { id: 'landing', name: 'Лендинг' },
                  { id: 'social', name: 'Соціальні мережі' },
                  { id: 'blocks', name: 'Блоки контенту' },
                  { id: 'seo', name: 'SEO' },
                  { id: 'settings', name: 'Налаштування' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    {errors.description && (
                      <p className="form-error">{errors.description.message}</p>
                    )}
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
                      placeholder="Повна адреса магазину або складу..."
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
                      className="btn-outline flex items-center"
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
                        className="btn-primary mt-4"
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
                      className="btn-outline flex items-center"
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
                        className="btn-primary mt-4"
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
              
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {isLoading ? 'Збереження...' : (editingStore ? 'Оновити' : 'Створити')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setActiveTab('basic');
                  }}
                  disabled={isLoading}
                  className="btn-outline"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальне вікно підтвердження видалення */}
      {showDeleteModal && storeToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Підтвердження видалення
              </h3>
              <button
                onClick={cancelDelete}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">
                Ви впевнені, що хочете видалити магазин?
              </p>
              <p className="text-base font-medium text-gray-900">
                "{storeToDelete.name}"
              </p>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Ця дія є незворотною. Всі дані магазину будуть втрачені назавжди.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteStore}
                disabled={isLoading}
                className="btn-primary bg-red-600 hover:bg-red-700 flex-1 flex items-center justify-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Видалення...' : 'Видалити'}
              </button>
              <button
                onClick={cancelDelete}
                disabled={isLoading}
                className="btn-outline flex-1"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stores;
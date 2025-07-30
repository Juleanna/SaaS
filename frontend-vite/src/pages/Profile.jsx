import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, CheckIcon, XMarkIcon, CreditCardIcon, PlusIcon, CameraIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const Profile = () => {
  const { user, updateProfile, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Отримуємо повну інформацію профілю з API
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/profile/');
        return response.data;
      } catch (error) {
        console.error('Profile fetch error:', error);
        return user; // Fallback на дані з store
      }
    },
    retry: false,
  });

  // Використовуємо дані з API або з store
  const currentUser = profileData || user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: currentUser?.first_name || '',
      last_name: currentUser?.last_name || '',
      email: currentUser?.email || '',
      company_name: currentUser?.company_name || '',
      telegram_username: currentUser?.telegram_username || '',
      instagram_username: currentUser?.instagram_username || '',
      email_notifications: currentUser?.email_notifications ?? true,
      telegram_notifications: currentUser?.telegram_notifications ?? false,
    },
  });

  // Оновлюємо форму при зміні даних користувача
  useEffect(() => {
    if (currentUser) {
      reset({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        company_name: currentUser.company_name || '',
        telegram_username: currentUser.telegram_username || '',
        instagram_username: currentUser.instagram_username || '',
        email_notifications: currentUser.email_notifications ?? true,
        telegram_notifications: currentUser.telegram_notifications ?? false,
      });
    }
  }, [currentUser, reset]);

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      first_name: currentUser?.first_name || '',
      last_name: currentUser?.last_name || '',
      email: currentUser?.email || '',
      company_name: currentUser?.company_name || '',
      telegram_username: currentUser?.telegram_username || '',
      instagram_username: currentUser?.instagram_username || '',
      email_notifications: currentUser?.email_notifications ?? true,
      telegram_notifications: currentUser?.telegram_notifications ?? false,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await updateProfile(data);
      
      if (result.success) {
        toast.success('Профіль успішно оновлено!');
        setIsEditing(false);
        // Оновлюємо дані профілю з API
        refetchProfile();
        // Також оновлюємо локальні дані
        updateUser(data);
      } else {
        toast.error(result.error || 'Помилка оновлення профілю');
      }
    } catch (error) {
      toast.error('Помилка оновлення профілю');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = () => {
    // Временная заглушка для управления подпиской
    toast.success('Функція управління підпискою буде доступна скоро!');
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast.error('Введіть коректну суму поповнення');
      return;
    }

    const amount = parseFloat(topUpAmount);
    if (amount > 10000) {
      toast.error('Максимальна сума поповнення: 10,000 ₴');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/top-up-balance/', {
        amount: amount
      });
      
      toast.success(response.data.message);
      setTopUpAmount('');
      setShowBilling(false);
      refetchProfile(); // Оновлюємо дані після поповнення
      
      // Також оновлюємо дані в authStore
      updateUser({ balance: response.data.new_balance });
    } catch (error) {
      console.error('Top up error:', error);
      const errorMessage = error.response?.data?.error || 'Помилка поповнення рахунку';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedAmounts = [100, 500, 1000, 2000];

  const handleAvatarUpload = async (event) => {
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

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // Відправляємо файл на сервер
      const response = await api.post('/auth/upload-avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Аватар успішно завантажено!');
      refetchProfile(); // Оновлюємо дані профілю
      
      // Інвалідуємо всі кеші профілю
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile-layout'] });
      
      // Також оновлюємо дані в authStore
      updateUser({ avatar: response.data.avatar_url });
    } catch (error) {
      console.error('Avatar upload error:', error);
      const errorMessage = error.response?.data?.error || 'Помилка завантаження аватару';
      toast.error(errorMessage);
    } finally {
      setIsUploadingAvatar(false);
      // Очищуємо input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Профіль користувача</h1>
        <p className="mt-1 text-sm text-gray-500">
          Керуйте інформацією вашого облікового запису
        </p>
      </div>

      {/* Аватар */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              {/* Кнопка завантаження */}
              <label className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
                <CameraIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </label>
              
              {/* Loading overlay */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="text-white text-xs">
                    Завантаження...
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {currentUser?.first_name && currentUser?.last_name 
                  ? `${currentUser.first_name} ${currentUser.last_name}`
                  : currentUser?.email || 'Користувач'
                }
              </h3>
              <p className="text-sm text-gray-500">{currentUser?.email}</p>
              {currentUser?.company_name && (
                <p className="text-sm text-gray-500">{currentUser.company_name}</p>
              )}
              
              <div className="mt-2 flex items-center space-x-2">
                <span className={`badge ${
                  currentUser?.subscription_plan === 'premium' ? 'badge-primary' : 
                  currentUser?.subscription_plan === 'basic' ? 'badge-info' : 'badge-secondary'
                }`}>
                  {currentUser?.subscription_plan === 'premium' ? 'Преміум' :
                   currentUser?.subscription_plan === 'basic' ? 'Базовий' : 'Безкоштовний'}
                </span>
                <span className={`badge ${currentUser?.is_subscribed ? 'badge-success' : 'badge-warning'}`}>
                  {currentUser?.is_subscribed ? 'Активна' : 'Неактивна'}
                </span>
              </div>
              
              <p className="mt-2 text-xs text-gray-400">
                Підтримуються формати: JPG, PNG, GIF. Максимальний розмір: 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Особиста інформація</h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="btn-outline flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Редагувати
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {isLoading ? 'Збереження...' : 'Зберегти'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="btn-outline flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Скасувати
                </button>
              </div>
            )}
          </div>
          
          {!isEditing ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Ім'я</label>
                <div className="mt-1 text-sm text-gray-900">{currentUser?.first_name || 'Не вказано'}</div>
              </div>
              
              <div>
                <label className="form-label">Прізвище</label>
                <div className="mt-1 text-sm text-gray-900">{currentUser?.last_name || 'Не вказано'}</div>
              </div>
              
              <div>
                <label className="form-label">Email</label>
                <div className="mt-1 text-sm text-gray-900">{currentUser?.email}</div>
              </div>
              
              <div>
                <label className="form-label">Назва компанії</label>
                <div className="mt-1 text-sm text-gray-900">{currentUser?.company_name || 'Не вказано'}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="form-label">Ім'я</label>
                <input
                  id="first_name"
                  type="text"
                  {...register('first_name', {
                    required: 'Ім\'я обов\'язкове',
                  })}
                  className="input"
                  placeholder="Введіть ваше ім'я"
                />
                {errors.first_name && (
                  <p className="form-error">{errors.first_name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="last_name" className="form-label">Прізвище</label>
                <input
                  id="last_name"
                  type="text"
                  {...register('last_name', {
                    required: 'Прізвище обов\'язкове',
                  })}
                  className="input"
                  placeholder="Введіть ваше прізвище"
                />
                {errors.last_name && (
                  <p className="form-error">{errors.last_name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email обов\'язковий',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Неправильний формат email',
                    },
                  })}
                  className="input"
                  placeholder="Введіть ваш email"
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="company_name" className="form-label">Назва компанії</label>
                <input
                  id="company_name"
                  type="text"
                  {...register('company_name')}
                  className="input"
                  placeholder="Введіть назву компанії"
                />
                {errors.company_name && (
                  <p className="form-error">{errors.company_name.message}</p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Баланс та біллінг */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Баланс рахунку</h2>
            <button
              onClick={() => setShowBilling(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Поповнити
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="form-label">Поточний баланс</label>
              <div className="mt-1 text-2xl font-bold text-green-600">
                {currentUser?.balance || 0} ₴
              </div>
            </div>
            
            <div>
              <label className="form-label">Витрачено цього місяця</label>
              <div className="mt-1 text-lg text-gray-900">
                {currentUser?.monthly_spending || 0} ₴
              </div>
            </div>
            
            <div>
              <label className="form-label">Середні витрати</label>
              <div className="mt-1 text-lg text-gray-900">
                {currentUser?.avg_spending || 0} ₴/міс
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Підписка */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Підписка</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="form-label">Поточний план</label>
              <div className="mt-1">
                <span className={`badge ${
                  currentUser?.subscription_plan === 'premium' ? 'badge-primary' : 
                  currentUser?.subscription_plan === 'basic' ? 'badge-info' : 'badge-secondary'
                }`}>
                  {currentUser?.subscription_plan === 'premium' ? 'Преміум' :
                   currentUser?.subscription_plan === 'basic' ? 'Базовий' : 'Безкоштовний'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="form-label">Статус</label>
              <div className="mt-1">
                <span className={`badge ${currentUser?.is_subscribed ? 'badge-success' : 'badge-warning'}`}>
                  {currentUser?.is_subscribed ? 'Активна' : 'Неактивна'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              className="btn-primary"
              onClick={handleManageSubscription}
            >
              Керувати підпискою
            </button>
          </div>
        </div>
      </div>

      {/* Соціальні мережі */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Соціальні мережі</h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="btn-outline flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Редагувати
              </button>
            ) : null}
          </div>
          
          {!isEditing ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Telegram</label>
                <div className="mt-1 text-sm text-gray-900">
                  {currentUser?.telegram_username ? `@${currentUser.telegram_username}` : 'Не вказано'}
                </div>
              </div>
              
              <div>
                <label className="form-label">Instagram</label>
                <div className="mt-1 text-sm text-gray-900">
                  {currentUser?.instagram_username ? `@${currentUser.instagram_username}` : 'Не вказано'}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="telegram_username" className="form-label">Telegram username</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">@</span>
                  </div>
                  <input
                    id="telegram_username"
                    type="text"
                    {...register('telegram_username')}
                    className="input pl-7"
                    placeholder="username"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="instagram_username" className="form-label">Instagram username</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">@</span>
                  </div>
                  <input
                    id="instagram_username"
                    type="text"
                    {...register('instagram_username')}
                    className="input pl-7"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Платежі */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Платежі</h2>
          
          <div className="space-y-6">
            <div>
              <label className="form-label">Stripe Customer ID</label>
              <div className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                {currentUser?.stripe_customer_id || 'Не налаштовано'}
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Налаштування платежів
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Для налаштування платежів зв'яжіться з нашою службою підтримки.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Налаштування сповіщень */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Налаштування сповіщень</h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="btn-outline flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Редагувати
              </button>
            ) : null}
          </div>
          
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Email сповіщення</label>
                  <p className="text-sm text-gray-500">Отримувати сповіщення на email</p>
                </div>
                <span className={`badge ${currentUser?.email_notifications ? 'badge-success' : 'badge-secondary'}`}>
                  {currentUser?.email_notifications ? 'Увімкнено' : 'Вимкнено'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Telegram сповіщення</label>
                  <p className="text-sm text-gray-500">Отримувати сповіщення в Telegram</p>
                </div>
                <span className={`badge ${currentUser?.telegram_notifications ? 'badge-success' : 'badge-secondary'}`}>
                  {currentUser?.telegram_notifications ? 'Увімкнено' : 'Вимкнено'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="email_notifications" className="text-sm font-medium text-gray-900">Email сповіщення</label>
                  <p className="text-sm text-gray-500">Отримувати сповіщення про замовлення, оновлення та інші події на email</p>
                </div>
                <div className="ml-4">
                  <input
                    id="email_notifications"
                    type="checkbox"
                    {...register('email_notifications')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="telegram_notifications" className="text-sm font-medium text-gray-900">Telegram сповіщення</label>
                  <p className="text-sm text-gray-500">Отримувати сповіщення в Telegram (потрібно налаштувати Telegram username)</p>
                </div>
                <div className="ml-4">
                  <input
                    id="telegram_notifications"
                    type="checkbox"
                    {...register('telegram_notifications')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {currentUser?.telegram_notifications && !currentUser?.telegram_username && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-orange-700">
                        Для отримання Telegram сповіщень необхідно вказати ваш Telegram username в блоці "Соціальні мережі".
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальне вікно поповнення */}
      {showBilling && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Поповнення рахунку</h3>
              <button
                onClick={() => setShowBilling(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Сума поповнення (₴)</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="input"
                  placeholder="Введіть суму"
                  min="1"
                  max="10000"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Мінімальна сума: 1 ₴, максимальна: 10,000 ₴
                </p>
              </div>
              
              <div>
                <p className="form-label">Швидкий вибір:</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {predefinedAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTopUpAmount(amount.toString())}
                      className="btn-outline text-sm"
                    >
                      {amount} ₴
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleTopUp}
                  disabled={isLoading || !topUpAmount}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  {isLoading ? 'Обробка...' : 'Поповнити'}
                </button>
                <button
                  onClick={() => setShowBilling(false)}
                  disabled={isLoading}
                  className="btn-outline"
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

export default Profile;
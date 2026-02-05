import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Сторінка підписок та тарифних планів
 */
const SubscriptionsPage = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Отримати планы
      const plansRes = await axios.get('/api/subscriptions/plans/');
      setPlans(plansRes.data);
      
      // Отримати поточну підписку користувача
      const subRes = await axios.get(
        '/api/subscriptions/current/',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      setCurrentSubscription(subRes.data);
      
      setLoading(false);
    } catch (err) {
      setError('Помилка при завантаженні даних');
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    try {
      const response = await axios.post(
        '/api/subscriptions/upgrade/',
        { plan_id: plan.id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.data.payment_required) {
        // Перенаправити на сторінку оплати
        // window.location.href = `/checkout/${response.data.payment_id}`;
        alert('Потрібна оплата за новий план');
      } else {
        setCurrentSubscription(response.data);
        setShowModal(false);
        setSelectedPlan(null);
      }
    } catch (err) {
      alert('Помилка при оновленні плану');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💳 Тарифні плани
          </h1>
          <p className="text-xl text-gray-600">
            Виберіть найкращий план для вашого магазину
          </p>
        </div>

        {/* Поточна підписка */}
        {currentSubscription && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-12">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Ваша поточна підписка
            </h2>
            <p className="text-blue-800 mb-2">
              <strong>{currentSubscription.plan_name}</strong> - 
              {currentSubscription.is_active ? ' ✅ Активна' : ' ❌ Неактивна'}
            </p>
            {currentSubscription.is_active && (
              <p className="text-sm text-blue-700">
                Закінчується через {currentSubscription.days_remaining} днів
              </p>
            )}
          </div>
        )}

        {/* Сітка планів */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                plan.is_featured ? 'md:scale-105 ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.is_featured && (
                <div className="bg-blue-500 text-white py-2 text-center font-semibold">
                  ⭐ РЕКОМЕНДОВАНИЙ
                </div>
              )}
              
              <div className="bg-white p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {plan.billing_cycle === 'monthly' ? '₴/місяць' : '₴/рік'}
                  </span>
                </div>

                <p className="text-gray-600 mb-6">
                  {plan.description}
                </p>

                {/* Характеристики */}
                <div className="space-y-3 mb-8">
                  <FeatureItem label="Магазинів" value={plan.max_stores} />
                  <FeatureItem label="Товарів" value={plan.max_products} />
                  <FeatureItem 
                    label="Замовлень/місяць" 
                    value={plan.max_monthly_orders} 
                  />
                  <FeatureItem 
                    label="Комісія" 
                    value={`${plan.commission_percentage}%`} 
                  />
                </div>

                {/* Функції */}
                <div className="space-y-2 mb-8">
                  {plan.has_analytics && <FeatureCheckbox label="Аналітика" />}
                  {plan.has_email_support && <FeatureCheckbox label="Email підтримка" />}
                  {plan.has_priority_support && <FeatureCheckbox label="Пріоритетна підтримка" />}
                  {plan.has_custom_domain && <FeatureCheckbox label="Кастомний домен" />}
                  {plan.has_api_access && <FeatureCheckbox label="API доступ" />}
                  {plan.has_integrations && <FeatureCheckbox label="Інтеграції" />}
                </div>

                {/* Кнопка */}
                <button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowModal(true);
                  }}
                  disabled={
                    currentSubscription?.plan === plan.id && currentSubscription?.is_active
                  }
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                    currentSubscription?.plan === plan.id && currentSubscription?.is_active
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {currentSubscription?.plan === plan.id && currentSubscription?.is_active
                    ? '✅ Поточний план'
                    : 'Вибрати план'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Модальне вікно підтвердження */}
        {showModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Оновити на {selectedPlan.name}?
              </h2>
              
              <p className="text-gray-600 mb-6">
                Ви переходите на план <strong>{selectedPlan.name}</strong> за{' '}
                <strong>{selectedPlan.price} ₴/{selectedPlan.billing_cycle}</strong>
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPlan(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
                >
                  Скасувати
                </button>
                
                <button
                  onClick={() => handleUpgrade(selectedPlan)}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Продовжити
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Допоміжний компонент для відображення характеристики
 */
const FeatureItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}:</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

/**
 * Допоміжний компонент для відображення функції з галочкою
 */
const FeatureCheckbox = ({ label }) => (
  <div className="flex items-center">
    <span className="text-green-500 mr-2">✓</span>
    <span className="text-gray-700">{label}</span>
  </div>
);

export default SubscriptionsPage;

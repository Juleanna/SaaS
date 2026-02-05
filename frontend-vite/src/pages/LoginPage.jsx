import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * Сторінка входу
 */
const LoginPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember_me: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/accounts/token/', {
        username: formData.username,
        password: formData.password
      });

      // Збереження токенів
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Оновлення інформації користувача, якщо передається функція callback
      if (onLoginSuccess) {
        onLoginSuccess(response.data);
      }

      // Перенаправлення на панель управління
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Невірне ім\'я користувача або пароль');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Помилка при вході. Спробуйте пізніше.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            🛒 StoreHub
          </h1>
          <p className="text-gray-600">Ваша платформа для продажу онлайн</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ім'я користувача */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Ім'я користувача або Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your_username"
            />
          </div>

          {/* Пароль */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {/* Запам'ятати мене та забули пароль */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="remember_me"
                checked={formData.remember_me}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Запам'ятати мене</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Забули пароль?
            </Link>
          </div>

          {/* Кнопка входу */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <span className="inline-flex items-center">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Вхід...
              </span>
            ) : (
              'Увійти'
            )}
          </button>

          {/* Посилання на реєстрацію */}
          <p className="text-center text-gray-600 text-sm mt-4">
            Не маєте акаунту?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Зареєструватися
            </Link>
          </p>
        </form>

        {/* Демо акаунт */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm mb-4">
            Хочете спробувати?
          </p>
          <button
            onClick={() => {
              setFormData({
                username: 'demo',
                password: 'demo1234',
                remember_me: false
              });
            }}
            className="w-full py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors"
          >
            🔓 Використати демо акаунт
          </button>
        </div>

        {/* Особливості */}
        <div className="mt-8 space-y-3">
          <div className="flex items-start text-sm text-gray-700">
            <span className="text-blue-500 mr-2 text-lg">✦</span>
            <span>Управління магазином та товарами</span>
          </div>
          <div className="flex items-start text-sm text-gray-700">
            <span className="text-blue-500 mr-2 text-lg">✦</span>
            <span>Відстеження замовлень і платежів</span>
          </div>
          <div className="flex items-start text-sm text-gray-700">
            <span className="text-blue-500 mr-2 text-lg">✦</span>
            <span>Інтеграція з Stripe, PayPal, ЮKassa</span>
          </div>
          <div className="flex items-start text-sm text-gray-700">
            <span className="text-blue-500 mr-2 text-lg">✦</span>
            <span>Telegram bot для продажів</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

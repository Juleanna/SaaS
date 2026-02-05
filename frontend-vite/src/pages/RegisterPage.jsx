import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * Сторінка реєстрації
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    store_name: '',
    agree_terms: false
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
      // Валідація паролів
      if (formData.password !== formData.password_confirm) {
        setError('Паролі не збігаються');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Пароль повинен мати мінімум 8 символів');
        setLoading(false);
        return;
      }

      if (!formData.agree_terms) {
        setError('Ви повинні прийняти умови користування');
        setLoading(false);
        return;
      }

      // Реєстрація користувача
      const registerResponse = await axios.post('/api/accounts/register/', {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password
      });

      // Отримання токенів
      const tokenResponse = await axios.post('/api/accounts/token/', {
        username: formData.username,
        password: formData.password
      });

      // Збереження токенів
      localStorage.setItem('access_token', tokenResponse.data.access);
      localStorage.setItem('refresh_token', tokenResponse.data.refresh);

      // Створення магазину, якщо вказано
      if (formData.store_name) {
        await axios.post(
          '/api/stores/',
          {
            name: formData.store_name,
            slug: formData.store_name.toLowerCase().replace(/\s+/g, '-')
          },
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.data.access}`
            }
          }
        );
      }

      // Перенаправлення на панель управління
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.values(errors)
            .flat()
            .join(', ');
          setError(errorMessages);
        } else {
          setError(errors.detail || 'Помилка при реєстрації');
        }
      } else {
        setError('Помилка при реєстрації. Спробуйте пізніше.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            🛒 StoreHub
          </h1>
          <p className="text-gray-600">Створіть свій магазин за 2 хвилини</p>
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
              Ім'я користувача
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your_username"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          {/* Ім'я та прізвище */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                Ім'я
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Іван"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Прізвище
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Петренко"
              />
            </div>
          </div>

          {/* Назва магазину */}
          <div>
            <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-1">
              Назва магазину (опціонально)
            </label>
            <input
              type="text"
              id="store_name"
              name="store_name"
              value={formData.store_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Мій чудесний магазин"
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
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Мінімум 8 символів"
            />
            <p className="text-xs text-gray-500 mt-1">
              Мінімум 8 символів, з буквами та цифрами
            </p>
          </div>

          {/* Підтвердження пароля */}
          <div>
            <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Підтвердьте пароль
            </label>
            <input
              type="password"
              id="password_confirm"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Повторіть пароль"
            />
          </div>

          {/* Прийняття умов */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="agree_terms"
              name="agree_terms"
              checked={formData.agree_terms}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="agree_terms" className="ml-2 block text-sm text-gray-700">
              Я прийняв <a href="#" className="text-blue-600 hover:underline">умови користування</a> та{' '}
              <a href="#" className="text-blue-600 hover:underline">політику конфіденційності</a>
            </label>
          </div>

          {/* Кнопка реєстрації */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Реєстрація...
              </span>
            ) : (
              'Створити акаунт'
            )}
          </button>

          {/* Посилання на сторінку входу */}
          <p className="text-center text-gray-600 text-sm">
            Вже маєте акаунт?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Увійти
            </Link>
          </p>
        </form>

        {/* Переваги */}
        <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-2">✓</span>
            Безкоштовна реєстрація
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-2">✓</span>
            Не потрібна кредитна карта
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-2">✓</span>
            Почніть продавати відразу
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

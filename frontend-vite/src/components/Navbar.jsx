import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

/**
 * Основна навігаційна панель
 */
const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        '/api/notifications/unread-count/',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      setUnreadNotifications(response.data.count);
    } catch (err) {
      console.error('Помилка при завантаженні кількості сповіщень');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">
              🛒 StoreHub
            </span>
          </Link>

          {/* Меню посередині */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive('/') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Головна
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`font-medium transition-colors ${
                    isActive('/dashboard') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Панель управління
                </Link>

                <Link
                  to="/orders"
                  className={`font-medium transition-colors ${
                    isActive('/orders') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Замовлення
                </Link>

                <Link
                  to="/subscriptions"
                  className={`font-medium transition-colors ${
                    isActive('/subscriptions') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Підписка
                </Link>
              </>
            )}
          </div>

          {/* Права частина */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Сповіщення */}
                <Link
                  to="/notifications"
                  className="relative text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                {/* Меню профілю */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <img
                      src={user?.avatar || 'https://via.placeholder.com/32'}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.first_name || user?.username || 'Профіль'}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                      >
                        👤 Мій профіль
                      </Link>
                      <Link
                        to="/stores"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        🏪 Мої магазини
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        ⚙️ Налаштування
                      </Link>
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 last:rounded-b-lg border-t border-gray-200"
                      >
                        🚪 Вихід
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Вхід
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Реєстрація
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Мобільне меню */}
        <MobileMenu isAuthenticated={isAuthenticated} user={user} onLogout={onLogout} />
      </div>
    </nav>
  );
};

/**
 * Мобільне меню
 */
const MobileMenu = ({ isAuthenticated, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="md:hidden">
      {/* Кнопка меню */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-4 top-4 text-gray-700"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Меню */}
      {isOpen && (
        <div className="bg-white border-t border-gray-200">
          <Link
            to="/"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Головна
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Панель управління
              </Link>
              <Link
                to="/orders"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Замовлення
              </Link>
              <Link
                to="/subscriptions"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Підписка
              </Link>
              <Link
                to="/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Профіль
              </Link>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 border-t border-gray-200"
              >
                Вихід
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Вхід
              </Link>
              <Link
                to="/register"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Реєстрація
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;

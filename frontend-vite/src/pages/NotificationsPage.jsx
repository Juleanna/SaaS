import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Сторінка сповіщень
 */
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter !== 'all') {
        params.is_read = filter === 'unread' ? false : true;
      }

      const response = await axios.get(
        '/api/notifications/',
        {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      
      setNotifications(response.data.results || response.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Помилка при завантаженні сповіщень');
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `/api/notifications/${notificationId}/mark_as_read/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      setNotifications(
        notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('Помилка при позначенні сповіщення як прочитаного');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(
        '/api/notifications/mark_all_as_read/',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      setNotifications(
        notifications.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Помилка при позначенні всіх сповіщень');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(
        `/api/notifications/${notificationId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      setNotifications(
        notifications.filter(n => n.id !== notificationId)
      );
    } catch (err) {
      console.error('Помилка при видаленні сповіщення');
    }
  };

  const getNotificationIcon = (notificationType) => {
    const icons = {
      order_created: '📦',
      order_status_changed: '🔄',
      payment_received: '💰',
      order_cancelled: '❌',
      product_created: '🎁',
      store_updated: '🏪',
      system_alert: '⚠️'
    };
    return icons[notificationType] || '📌';
  };

  const getNotificationColor = (notificationType) => {
    const colors = {
      order_created: 'blue',
      order_status_changed: 'purple',
      payment_received: 'green',
      order_cancelled: 'red',
      product_created: 'yellow',
      store_updated: 'indigo',
      system_alert: 'orange'
    };
    return colors[notificationType] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🔔 Сповіщення
            </h1>
            <p className="text-gray-600 mt-2">
              {unreadCount > 0 ? `${unreadCount} нових сповіщень` : 'Немає нових сповіщень'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              Позначити все як прочитане
            </button>
          )}
        </div>

        {/* Фільтри */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Не прочитані ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'read'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Прочитані
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Список сповіщень */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">
              {filter === 'unread' ? 'Немає нових сповіщень' : 'Немає сповіщень'}
            </p>
            <p className="text-gray-500">
              {filter === 'unread'
                ? 'Все чудово! Бути на зв\'язку'
                : 'Сповіщення з\'являться тут'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`rounded-lg shadow transition-colors ${
                  notification.is_read
                    ? 'bg-white'
                    : 'bg-blue-50 border-l-4 border-blue-500'
                }`}
              >
                <div className="p-6 flex items-start justify-between">
                  <div className="flex items-start flex-1 min-w-0">
                    {/* Іконка */}
                    <div className="text-3xl mr-4 flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-2">
                        {notification.message}
                      </p>

                      {notification.related_order_number && (
                        <p className="text-sm text-gray-600 mb-2">
                          Замовлення #{notification.related_order_number}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString('uk-UA')}
                      </p>
                    </div>
                  </div>

                  {/* Кнопки дій */}
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Позначити як прочитане"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Видалити"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

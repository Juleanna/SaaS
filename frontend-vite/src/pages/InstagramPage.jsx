import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Сторінка Instagram інтеграції
 */
const InstagramPage = ({ storeId }) => {
  const [account, setAccount] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [autoPosts, setAutoPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAutoPostModal, setShowAutoPostModal] = useState(false);
  const [dmKeywords, setDMKeywords] = useState([]);
  const [showKeywordModal, setShowKeywordModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Отримати акаунт
      const accountRes = await axios.get('/api/instagram/accounts/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (accountRes.data.length > 0) {
        const acc = accountRes.data[0];
        setAccount(acc);

        // Отримати більше деталей
        const detailRes = await axios.get(
          `/api/instagram/accounts/${acc.id}/statistics/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setStatistics(detailRes.data.statistics || []);

        // Отримати пости
        const postsRes = await axios.get('/api/instagram/posts/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentPosts(postsRes.data);

        // Отримати автопости
        const autoPostsRes = await axios.get('/api/instagram/auto-posts/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAutoPosts(autoPostsRes.data);

        // Отримати DM ключові слова
        const keywordsRes = await axios.get('/api/instagram/dm-keywords/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDMKeywords(keywordsRes.data);
      }

      setError(null);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 404) {
        // Акаунт не підключений
        setAccount(null);
      } else {
        setError('Помилка при завантаженні даних');
      }
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/instagram/accounts/oauth_login_url/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      window.location.href = response.data.login_url;
    } catch (err) {
      alert('Помилка при підключенні');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Ви впевнені?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `/api/instagram/accounts/${account.id}/disconnect/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAccount(null);
      setStatistics([]);
      setRecentPosts([]);
      setAutoPosts([]);
    } catch (err) {
      alert('Помилка при відключенні');
    }
  };

  const handleSyncMedia = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `/api/instagram/accounts/${account.id}/sync_media/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Синхронізація розпочата');
    } catch (err) {
      alert('Помилка при синхронізації');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📸 Instagram</h1>
            <p className="text-gray-600 mt-2">Інтеграція з Instagram</p>
          </div>
          {account && (
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Відключити акаунт
            </button>
          )}
        </div>

        {!account ? (
          // Не підключено
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Підключіть Instagram
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Синхронізуйте свій Instagram з магазином, щоб:
            </p>
            <ul className="text-left max-w-md mx-auto mb-8 space-y-2">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Автоматично постити товари
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Відслідковувати статистику
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Отримувати автовідповіді на DM
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Керувати постами
              </li>
            </ul>

            <button
              onClick={handleConnect}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              🔗 Підключити Instagram
            </button>
          </div>
        ) : (
          // Підключено
          <div className="space-y-8">
            {/* Інформація акаунту */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {account.profile_picture_url && (
                    <img
                      src={account.profile_picture_url}
                      alt={account.instagram_username}
                      className="w-20 h-20 rounded-full mr-6"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      @{account.instagram_username}
                    </h2>
                    <p className="text-gray-600">{account.instagram_name}</p>
                    <p className="text-gray-600 mt-2">
                      👥 {account.followers_count.toLocaleString()} підписників
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSyncMedia}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                  🔄 Синхронізувати
                </button>
              </div>

              {account.bio && (
                <p className="mt-4 text-gray-700 border-t border-gray-200 pt-4">
                  {account.bio}
                </p>
              )}
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Всього постів"
                value={account.total_posts}
                icon="📊"
              />
              <StatCard
                title="Взаємодій"
                value={account.total_interactions}
                icon="❤️"
              />
              <StatCard
                title="Статус"
                value={account.status === 'connected' ? '✅ Активний' : '⏸ Неактивний'}
                icon="⚙️"
              />
              <StatCard
                title="Тип акаунту"
                value={account.account_type === 'business' ? 'Бізнес' : 'Особистий'}
                icon="👤"
              />
            </div>

            {/* График статистики */}
            {statistics.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  📈 Статистика останніх 30 днів
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Дата
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                          Підписників
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                          Нових
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                          Взаємодія
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.map((stat, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(stat.date).toLocaleDateString('uk-UA')}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">
                            {stat.followers}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-green-600">
                            +{stat.new_followers}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">
                            {(stat.engagement_rate || 0).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Останні пости */}
            {recentPosts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  📸 Останні пости
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recentPosts.slice(0, 8).map(post => (
                    <div key={post.id} className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={post.media_url}
                        alt={post.caption}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3 bg-gray-50">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>❤️ {post.likes_count}</span>
                          <span>💬 {post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Налаштування */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">⚙️ Налаштування</h3>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={account.auto_post_products}
                    disabled
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">
                    Автоматично постити нові товари
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={account.auto_respond_enabled}
                    disabled
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">
                    Автовідповіді на DM повідомлення
                  </span>
                </label>
              </div>

              {account.hashtags && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Хештеги для постів
                  </label>
                  <p className="text-gray-700">{account.hashtags}</p>
                </div>
              )}

              <button
                className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              >
                Редагувати налаштування
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Карточка статистики
 */
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className="text-4xl opacity-30">{icon}</div>
    </div>
  </div>
);

export default InstagramPage;

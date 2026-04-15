import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { getResults } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

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
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const accountRes = await api.get('/instagram/accounts/');
      const accounts = getResults(accountRes.data);

      if (accounts.length > 0) {
        const acc = accounts[0];
        setAccount(acc);

        const detailRes = await api.get(`/instagram/accounts/${acc.id}/statistics/`);
        const stats = detailRes.data?.statistics;
        setStatistics(Array.isArray(stats) ? stats : []);

        const postsRes = await api.get('/instagram/posts/');
        setRecentPosts(getResults(postsRes.data));

        const autoPostsRes = await api.get('/instagram/auto-posts/');
        setAutoPosts(getResults(autoPostsRes.data));

        const keywordsRes = await api.get('/instagram/dm-keywords/');
        setDMKeywords(getResults(keywordsRes.data));
      }

      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setAccount(null);
      } else {
        setError('Помилка при завантаженні даних');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await api.get('/instagram/accounts/oauth_login_url/');
      window.location.href = response.data.login_url;
    } catch {
      toast.error('Помилка при підключенні');
    }
  };

  const handleDisconnect = () => {
    setConfirmModal({
      open: true,
      title: 'Відключення акаунту',
      message: 'Ви впевнені, що хочете відключити Instagram акаунт?',
      onConfirm: async () => {
        try {
          await api.post(`/instagram/accounts/${account.id}/disconnect/`);
          setAccount(null);
          setStatistics([]);
          setRecentPosts([]);
          setAutoPosts([]);
          toast.success('Акаунт відключено');
        } catch {
          toast.error('Помилка при відключенні');
        }
      },
    });
  };

  const handleSyncMedia = async () => {
    try {
      await api.post(`/instagram/accounts/${account.id}/sync_media/`);
      toast.success('Синхронізація розпочата');
    } catch {
      toast.error('Помилка при синхронізації');
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
            <p className="mt-1 text-sm text-gray-500">Інтеграція з Instagram</p>
          </div>
          {account && (
            <button
              onClick={handleDisconnect}
              className="btn btn-danger"
            >
              Відключити акаунт
            </button>
          )}
        </div>

        {!account ? (
          // Не підключено
          <div className="card card-body text-center">
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
              className="btn btn-primary"
            >
              🔗 Підключити Instagram
            </button>
          </div>
        ) : (
          // Підключено
          <div className="space-y-8">
            {/* Інформація акаунту */}
            <div className="card card-body">
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
                      👥 {(account.followers_count || 0).toLocaleString()} підписників
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSyncMedia}
                  className="btn btn-primary"
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
              <div className="card card-body">
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
              <div className="card card-body">
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
            <div className="card card-body">
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
                  <label className="form-label">
                    Хештеги для постів
                  </label>
                  <p className="text-gray-700">{account.hashtags}</p>
                </div>
              )}

              <button
                className="btn btn-primary mt-6"
              >
                Редагувати налаштування
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Підтвердити"
      />
    </div>
  );
};

/**
 * Карточка статистики
 */
const StatCard = ({ title, value, icon }) => (
  <div className="card card-body">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="text-2xl opacity-30">{icon}</div>
    </div>
  </div>
);

export default InstagramPage;

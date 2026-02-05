import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

/**
 * Лендинг сторінка магазину (публічна)
 */
const StoreLanding = () => {
  const { storeSlug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        
        // Отримати дані магазину
        const storeRes = await axios.get(`/api/stores/public/${storeSlug}/`);
        setStore(storeRes.data);
        
        // Отримати товари магазину
        const productsRes = await axios.get(`/api/products/?store=${storeRes.data.id}`);
        setProducts(productsRes.data.results || productsRes.data);
        
        setLoading(false);
      } catch (err) {
        setError('Помилка при завантаженні магазину');
        setLoading(false);
      }
    };

    if (storeSlug) {
      fetchStoreData();
    }
  }, [storeSlug]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500 text-xl">Магазин не знайдено</div>
      </div>
    );
  }

  const primaryColor = store.primary_color || '#3B82F6';
  const backgroundColor = store.secondary_color || '#1F2937';

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Шапка магазину */}
      <header className="text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              {store.logo && (
                <img src={store.logo} alt={store.name} className="h-12 mb-2" />
              )}
              <h1 className="text-4xl font-bold">{store.name}</h1>
              <p className="text-gray-300 mt-2">{store.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Банер */}
      {store.banner_image && (
        <div className="w-full h-64 overflow-hidden">
          <img
            src={store.banner_image}
            alt="Банер"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Каталог товарів */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-white mb-8">📦 Каталог товарів</h2>
            
            {products.length === 0 ? (
              <div className="text-gray-400 text-center py-12">
                Немає доступних товарів
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {product.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {product.short_description || product.description.substring(0, 100)}...
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <span
                          className="text-2xl font-bold"
                          style={{ color: primaryColor }}
                        >
                          {product.price} {product.currency}
                        </span>
                        
                        <button
                          onClick={() => addToCart(product)}
                          className="px-4 py-2 rounded-lg text-white transition-colors"
                          style={{ backgroundColor: primaryColor }}
                        >
                          🛒 Додати
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кошик */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                🛒 Ваш кошик
              </h2>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Кошик порожній</p>
              ) : (
                <>
                  <div className="space-y-4 mb-4">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            x{item.quantity} = {item.price * item.quantity} {item.currency}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-800">Всього:</span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: primaryColor }}
                      >
                        {getTotalPrice().toFixed(2)}
                      </span>
                    </div>

                    <button
                      className="w-full py-3 rounded-lg text-white font-semibold transition-colors"
                      style={{ backgroundColor: primaryColor }}
                    >
                      ✅ Оформити замовлення
                    </button>
                  </div>
                </>
              )}

              {/* Контакти магазину */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📞 Контакти</h3>
                {store.phone && (
                  <p className="text-sm text-gray-600 mb-2">
                    Телефон: {' '}
                    <a href={`tel:${store.phone}`} className="text-blue-600 hover:underline">
                      {store.phone}
                    </a>
                  </p>
                )}
                {store.email && (
                  <p className="text-sm text-gray-600">
                    Email: {' '}
                    <a href={`mailto:${store.email}`} className="text-blue-600 hover:underline">
                      {store.email}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLanding;

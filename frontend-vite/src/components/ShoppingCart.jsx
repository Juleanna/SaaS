import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  MinusIcon, 
  PlusIcon, 
  TrashIcon,
  ShoppingBagIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';
import logger from '../services/logger';

const ShoppingCart = ({ 
  isOpen, 
  onClose, 
  storeSlug,
  onCheckout
}) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const fetchCart = async () => {
    if (!storeSlug) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/orders/public/${storeSlug}/cart/`);
      setCart(response.data);
    } catch (error) {
      logger.error('Error fetching cart:', error);
      setError('Помилка завантаження кошика');
      
      // Fallback mock data
      setCart({
        id: 1,
        total_amount: 80000,
        items_count: 2,
        items: [
          {
            id: 1,
            product: {
              id: 1,
              name: 'iPhone 15 Pro',
              price: 45000,
              images: [{ image: '/api/placeholder/100/100' }]
            },
            variant: {
              id: 1,
              name: '128GB Титановий'
            },
            quantity: 1,
            price: 45000,
            total_price: 45000
          },
          {
            id: 2,
            product: {
              id: 2,
              name: 'Samsung Galaxy S24',
              price: 35000,
              images: [{ image: '/api/placeholder/100/100' }]
            },
            variant: null,
            quantity: 1,
            price: 35000,
            total_price: 35000
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      await api.patch(`/orders/public/${storeSlug}/cart/items/${itemId}/`, {
        quantity: newQuantity
      });
      fetchCart();
    } catch (error) {
      logger.error('Error updating quantity:', error);
      toast.error('Помилка оновлення кількості');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/orders/public/${storeSlug}/cart/items/${itemId}/`);
      fetchCart();
    } catch (error) {
      logger.error('Error removing item:', error);
      toast.error('Помилка видалення товару');
    }
  };

  const clearCart = () => {
    setConfirmModal({
      open: true,
      title: 'Очищення кошика',
      message: 'Ви впевнені, що хочете очистити кошик?',
      onConfirm: async () => {
        try {
          // Delete all items
          const deletePromises = cart.items.map(item =>
            api.delete(`/orders/public/${storeSlug}/cart/items/${item.id}/`)
          );
          await Promise.all(deletePromises);
          fetchCart();
        } catch (error) {
          logger.error('Error clearing cart:', error);
          toast.error('Помилка очищення кошика');
        }
      },
    });
  };

  const handleCheckout = () => {
    if (cart && cart.items.length > 0) {
      onCheckout && onCheckout(cart);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && storeSlug) {
      fetchCart();
    }
  }, [isOpen, storeSlug]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md">
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-6 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Кошик</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : cart && cart.items.length > 0 ? (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                  <div className="mt-8">
                    <div className="flow-root">
                      <ul className="-my-6 divide-y divide-gray-200">
                        {cart.items.map((item) => (
                          <li key={item.id} className="flex py-6">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200">
                              {item.product.images && item.product.images.length > 0 ? (
                                <img
                                  src={item.product.images[0].image || item.product.images[0].url}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover object-center"
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                  <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>{item.product.name}</h3>
                                  <p className="ml-4">{item.total_price?.toLocaleString()} ₴</p>
                                </div>
                                {item.variant && (
                                  <p className="mt-1 text-sm text-gray-500">{item.variant.name}</p>
                                )}
                                <p className="mt-1 text-sm text-gray-500">
                                  {item.price?.toLocaleString()} ₴ за одиницю
                                </p>
                              </div>
                              <div className="flex flex-1 items-end justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </button>
                                  <span className="text-gray-900 font-semibold px-3 min-w-[2rem] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="flex">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Разом</p>
                    <p>{cart.total_amount?.toLocaleString()} ₴</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <p>Товарів у кошику</p>
                    <p>{cart.items_count} шт</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Доставка та податки будуть розраховані при оформленні замовлення.
                  </p>
                  
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleCheckout}
                      className="btn btn-primary w-full"
                    >
                      <CreditCardIcon className="h-5 w-5 mr-2" />
                      Оформити замовлення
                    </button>
                    
                    <button
                      onClick={clearCart}
                      className="btn btn-outline w-full"
                    >
                      <TrashIcon className="h-5 w-5 mr-2" />
                      Очистити кошик
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-4">
                <ShoppingBagIcon className="h-24 w-24 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Кошик порожній</h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Додайте товари до кошика, щоб продовжити покупки
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 btn btn-primary"
                >
                  Продовжити покупки
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Очистити"
      />
    </div>
  );
};

export default ShoppingCart;
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CreditCardIcon,
  TruckIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  cart,
  storeSlug,
  onOrderCreated
}) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    payment_method: '',
    notes: '',
    delivery_method: 'delivery',
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Customer Info, 2: Delivery, 3: Payment

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get(`/payments/api/public/${storeSlug}/payment-methods/`);
      setPaymentMethods(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Fallback payment methods
      setPaymentMethods([
        { id: 1, name: 'Готівка при отриманні', type: 'cash', is_active: true },
        { id: 2, name: 'Картка при отриманні', type: 'card', is_active: true },
        { id: 3, name: 'Онлайн оплата', type: 'online', is_active: true },
        { id: 4, name: 'Банківський переказ', type: 'transfer', is_active: true },
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber === 1) {
      if (!formData.customer_name.trim()) {
        newErrors.customer_name = "Ім'я обов'язкове";
      }
      if (!formData.customer_phone.trim()) {
        newErrors.customer_phone = "Телефон обов'язковий";
      }
      if (formData.customer_email && !/\S+@\S+\.\S+/.test(formData.customer_email)) {
        newErrors.customer_email = "Невірний формат email";
      }
    }
    
    if (stepNumber === 2) {
      if (formData.delivery_method === 'delivery' && !formData.shipping_address.trim()) {
        newErrors.shipping_address = "Адреса доставки обов'язкова";
      }
    }
    
    if (stepNumber === 3) {
      if (!formData.payment_method) {
        newErrors.payment_method = "Виберіть спосіб оплати";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone,
        shipping_address: formData.delivery_method === 'delivery' ? formData.shipping_address : null,
        payment_method_id: formData.payment_method,
        notes: formData.notes || null,
        source: 'website',
        delivery_method: formData.delivery_method,
      };

      const response = await api.post(`/orders/api/public/${storeSlug}/checkout/`, orderData);
      
      onOrderCreated && onOrderCreated(response.data);
      onClose();
      
      // Show success message
      alert(`Замовлення #${response.data.order_number} успішно створено! Ми зв'яжемося з вами найближчим часом.`);
      
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response?.data) {
        const serverErrors = {};
        Object.keys(error.response.data).forEach(key => {
          serverErrors[key] = Array.isArray(error.response.data[key]) 
            ? error.response.data[key][0] 
            : error.response.data[key];
        });
        setErrors(serverErrors);
      } else {
        alert('Помилка створення замовлення');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && storeSlug) {
      fetchPaymentMethods();
    }
  }, [isOpen, storeSlug]);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setStep(1);
      setErrors({});
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        shipping_address: '',
        payment_method: '',
        notes: '',
        delivery_method: 'delivery',
      });
    }
  }, [isOpen]);

  if (!isOpen || !cart) return null;

  const selectedPaymentMethod = paymentMethods.find(pm => pm.id.toString() === formData.payment_method);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Оформлення замовлення
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center">
                  {[1, 2, 3].map((stepNumber) => (
                    <React.Fragment key={stepNumber}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        step >= stepNumber 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {stepNumber}
                      </div>
                      {stepNumber < 3 && (
                        <div className={`flex-1 h-1 mx-2 ${
                          step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Контактні дані</span>
                  <span>Доставка</span>
                  <span>Оплата</span>
                </div>
              </div>

              {/* Step 1: Customer Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Контактна інформація
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ім'я та прізвище *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.customer_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Введіть ваше ім'я"
                    />
                    {errors.customer_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        className={`pl-10 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.customer_phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="+380 XX XXX XX XX"
                      />
                    </div>
                    {errors.customer_phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer_phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (необов'язково)
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="customer_email"
                        value={formData.customer_email}
                        onChange={handleInputChange}
                        className={`pl-10 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.customer_email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.customer_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer_email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Delivery */}
              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800 flex items-center">
                    <TruckIcon className="h-5 w-5 mr-2" />
                    Спосіб отримання
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="delivery_method"
                        value="delivery"
                        checked={formData.delivery_method === 'delivery'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Доставка за адресою</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="delivery_method"
                        value="pickup"
                        checked={formData.delivery_method === 'pickup'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Самовивіз</span>
                    </label>
                  </div>

                  {formData.delivery_method === 'delivery' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Адреса доставки *
                      </label>
                      <div className="relative">
                        <MapPinIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                        <textarea
                          name="shipping_address"
                          value={formData.shipping_address}
                          onChange={handleInputChange}
                          rows={3}
                          className={`pl-10 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.shipping_address ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Місто, вулиця, будинок, квартира"
                        />
                      </div>
                      {errors.shipping_address && (
                        <p className="mt-1 text-sm text-red-600">{errors.shipping_address}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Примітки до замовлення
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Додаткова інформація..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Спосіб оплати
                  </h4>
                  
                  <div className="space-y-3">
                    {paymentMethods.filter(pm => pm.is_active).map((method) => (
                      <label key={method.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.id}
                          checked={formData.payment_method === method.id.toString()}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">{method.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.payment_method && (
                    <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                  )}

                  {/* Order Summary */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Підсумок замовлення</h5>
                    <div className="space-y-2">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.product.name} {item.variant && `(${item.variant.name})`} x {item.quantity}
                          </span>
                          <span className="text-gray-900">{item.total_price?.toLocaleString()} ₴</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-medium">
                          <span>Разом:</span>
                          <span>{cart.total_amount?.toLocaleString()} ₴</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {step === 3 ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Створення замовлення...' : 'Підтвердити замовлення'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Далі
                </button>
              )}
              
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Назад
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Скасувати
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
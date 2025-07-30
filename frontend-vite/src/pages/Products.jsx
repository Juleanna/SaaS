import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Products = () => {
  // Моковые данные товаров
  const products = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      description: 'Новий iPhone з потужним процесором',
      price: 45000,
      stock: 5,
      status: 'active',
      image: '/api/placeholder/150/150',
    },
    {
      id: 2,
      name: 'Samsung Galaxy S24',
      description: 'Флагманський смартфон Samsung',
      price: 35000,
      stock: 12,
      status: 'active',
      image: '/api/placeholder/150/150',
    },
    {
      id: 3,
      name: 'MacBook Air M3',
      description: 'Легкий та потужний ноутбук',
      price: 60000,
      stock: 0,
      status: 'out_of_stock',
      image: '/api/placeholder/150/150',
    },
  ];

  const getStatusBadge = (status, stock) => {
    if (stock === 0) return 'badge-danger';
    if (status === 'active') return 'badge-success';
    return 'badge-secondary';
  };

  const getStatusText = (status, stock) => {
    if (stock === 0) return 'Немає в наявності';
    if (status === 'active') return 'Активний';
    return 'Неактивний';
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Товари</h1>
          <p className="mt-1 text-sm text-gray-500">
            Керуйте товарами вашого магазину
          </p>
        </div>
        <Link to="/stores/1/products/create" className="btn-primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          Додати товар
        </Link>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всього товарів
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">✅</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    В наявності
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.filter(p => p.stock > 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">❌</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Немає в наявності
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.filter(p => p.stock === 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">💰</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Середня ціна
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length).toLocaleString()} ₴
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Таблиця товарів */}
      <div className="card">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товар
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ціна
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Залишок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                          📱
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.price.toLocaleString()} ₴
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock} шт
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(product.status, product.stock)}`}>
                      {getStatusText(product.status, product.stock)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;
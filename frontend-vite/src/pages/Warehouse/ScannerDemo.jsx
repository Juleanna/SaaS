import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../../components/BarcodeScanner';
import {
  QrCodeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ScannerDemo = () => {
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]);

  const handleScan = (code) => {
    // Додаємо код до списку відсканованих
    const newScan = {
      id: Date.now(),
      code,
      timestamp: new Date().toISOString(),
      type: code.length > 12 ? 'qr_code' : 'barcode', // Простий спосіб визначення типу
      product: `Товар ${code}` // В реальності тут буде пошук товару по коду
    };

    setScannedCodes(prev => [newScan, ...prev.slice(0, 19)]); // Зберігаємо останні 20 сканів
    setIsScannerOpen(false);
    
    toast.success(`Код відсканований: ${code}`);
  };

  const clearHistory = () => {
    setScannedCodes([]);
    toast.success('Історію сканування очищено');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'barcode': return 'bg-blue-100 text-blue-800';
      case 'qr_code': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'barcode': return 'Штрих-код';
      case 'qr_code': return 'QR код';
      default: return 'Невідомо';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/warehouse')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Демо сканера штрих-кодів</h1>
            <p className="text-gray-600">Тестування функціональності сканування</p>
          </div>
        </div>
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <QrCodeIcon className="h-5 w-5 mr-2" />
          Сканувати код
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ListBulletIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Всього сканів</p>
              <p className="text-2xl font-semibold text-gray-900">
                {scannedCodes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <QrCodeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">QR коди</p>
              <p className="text-2xl font-semibold text-gray-900">
                {scannedCodes.filter(scan => scan.type === 'qr_code').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Штрих-коди</p>
              <p className="text-2xl font-semibold text-gray-900">
                {scannedCodes.filter(scan => scan.type === 'barcode').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Як користуватися сканером:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Сканування камерою:</h4>
            <ul className="space-y-1">
              <li>• Натисніть "Сканувати код"</li>
              <li>• Дозвольте доступ до камери</li>
              <li>• Наведіть камеру на код</li>
              <li>• Код буде автоматично розпізнаний</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Ручне введення:</h4>
            <ul className="space-y-1">
              <li>• Введіть код в поле вводу</li>
              <li>• Натисніть "Сканувати"</li>
              <li>• Для тесту використайте: 1234567890123</li>
              <li>• Або QR код: https://example.com/product/123</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scanned Codes History */}
      {scannedCodes.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Історія сканування</h3>
            <button
              onClick={clearHistory}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Очистити історію
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Код
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Товар
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Час сканування
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scannedCodes.map((scan, index) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{scan.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(scan.type)}`}>
                        {getTypeText(scan.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{scan.product}</div>
                      <div className="text-sm text-gray-500">ID: {scan.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(scan.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleScan(scan.code)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Сканувати знову
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <QrCodeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Немає відсканованих кодів</h3>
          <p className="text-gray-600 mb-6">
            Натисніть кнопку "Сканувати код" щоб почати тестування сканера
          </p>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Сканувати перший код
          </button>
        </div>
      )}

      {/* Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
        title="Демо сканер штрих-кодів"
        placeholder="Наведіть камеру на штрих-код або QR код для тестування"
      />
    </div>
  );
};

export default ScannerDemo;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import BarcodeScanner from '../../components/BarcodeScanner';
import {
  QrCodeIcon,
  ListBulletIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const InventoryScanner = () => {
  const { inventoryId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [scanMode, setScanMode] = useState('single'); // 'single' или 'batch'

  // Отримуємо інформацію про інвентаризацію
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory', inventoryId],
    queryFn: async () => {
      try {
        const response = await api.get(`/warehouse/inventory/${inventoryId}/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching inventory:', error);
        // Mock data
        return {
          id: inventoryId,
          number: 'INV-2024-001',
          warehouse: { name: 'Основний склад' },
          status: 'in_progress',
          responsible_person: { name: 'Іван Петренко' },
          created_at: '2024-01-20T10:00:00Z'
        };
      }
    },
    enabled: !!inventoryId,
  });

  // Отримуємо підсумки сканування
  const { data: scanSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['inventory-scan-summary', inventoryId],
    queryFn: async () => {
      try {
        const response = await api.get(`/warehouse/inventory/${inventoryId}/scan/summary/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching scan summary:', error);
        // Mock data
        return {
          summary: {
            total_items: scannedItems.length,
            scanned_items: scannedItems.filter(item => item.scan_method !== 'manual').length,
            manual_items: scannedItems.filter(item => item.scan_method === 'manual').length,
            barcode_scans: scannedItems.filter(item => item.scan_method === 'barcode').length,
            qr_code_scans: scannedItems.filter(item => item.scan_method === 'qr_code').length,
            items_with_discrepancies: 0,
            scanning_methods: {
              barcode: scannedItems.filter(item => item.scan_method === 'barcode').length,
              qr_code: scannedItems.filter(item => item.scan_method === 'qr_code').length,
              manual: scannedItems.filter(item => item.scan_method === 'manual').length,
            }
          }
        };
      }
    },
    enabled: !!inventoryId,
  });

  // Сканування одного товару
  const scanSingleMutation = useMutation({
    mutationFn: async ({ code, quantity }) => {
      const response = await api.post(`/warehouse/inventory/${inventoryId}/scan/`, {
        code,
        actual_quantity: quantity
      });
      return response.data;
    },
    onSuccess: (data) => {
      setScannedItems(prev => {
        const existing = prev.find(item => item.code === data.inventory_item.product.sku);
        if (existing) {
          return prev.map(item => 
            item.code === data.inventory_item.product.sku 
              ? { ...item, quantity: data.inventory_item.actual_quantity, updated_at: new Date().toISOString() }
              : item
          );
        } else {
          return [...prev, {
            id: data.inventory_item.id,
            code: data.inventory_item.product.sku,
            name: data.inventory_item.product.name,
            quantity: data.inventory_item.actual_quantity,
            scan_method: data.scan_method,
            created: data.created,
            updated_at: new Date().toISOString()
          }];
        }
      });
      
      refetchSummary();
      toast.success(data.message);
      setCurrentQuantity(1);
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Помилка сканування товару';
      toast.error(message);
    },
  });

  // Масове сканування товарів
  const bulkScanMutation = useMutation({
    mutationFn: async (items) => {
      const response = await api.post(`/warehouse/inventory/${inventoryId}/scan/bulk/`, {
        items
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Оброблено ${data.processed} товарів, ${data.errors_count} помилок`);
      refetchSummary();
      setScannedItems([]);
    },
    onError: (error) => {
      toast.error('Помилка масового сканування');
    },
  });

  const handleScan = (code) => {
    if (scanMode === 'single') {
      scanSingleMutation.mutate({ code, quantity: currentQuantity });
    } else {
      // Додаємо до списку для масового сканування
      setScannedItems(prev => {
        const existing = prev.find(item => item.code === code);
        if (existing) {
          return prev.map(item => 
            item.code === code 
              ? { ...item, quantity: item.quantity + currentQuantity }
              : item
          );
        } else {
          return [...prev, {
            id: `temp-${Date.now()}`,
            code,
            name: `Товар ${code}`,
            quantity: currentQuantity,
            scan_method: 'pending',
            created: true,
            updated_at: new Date().toISOString()
          }];
        }
      });
      setCurrentQuantity(1);
    }
    setIsScannerOpen(false);
  };

  const handleBulkSubmit = () => {
    if (scannedItems.length === 0) {
      toast.error('Немає товарів для сканування');
      return;
    }

    const items = scannedItems.map(item => ({
      code: item.code,
      actual_quantity: item.quantity
    }));

    bulkScanMutation.mutate(items);
  };

  const updateQuantity = (itemId, change) => {
    setScannedItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeItem = (itemId) => {
    setScannedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (inventoryLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/warehouse/inventory')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Сканування: {inventory?.number}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>Склад: {inventory?.warehouse?.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inventory?.status)}`}>
                {inventory?.status === 'in_progress' ? 'В процесі' : inventory?.status}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <QrCodeIcon className="h-5 w-5 mr-2" />
          Сканувати
        </button>
      </div>

      {/* Stats Cards */}
      {scanSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ListBulletIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Всього позицій</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {scanSummary.summary.total_items}
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
                <p className="text-sm font-medium text-gray-500">Відскановано</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {scanSummary.summary.scanned_items}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Штрих-коди</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {scanSummary.summary.barcode_scans}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">QR коди</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {scanSummary.summary.qr_code_scans}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Mode Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Режим сканування</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="single"
                checked={scanMode === 'single'}
                onChange={(e) => setScanMode(e.target.value)}
                className="mr-2"
              />
              Одиночне сканування
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="batch"
                checked={scanMode === 'batch'}
                onChange={(e) => setScanMode(e.target.value)}
                className="mr-2"
              />
              Пакетне сканування
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Кількість:</label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setCurrentQuantity(Math.max(1, currentQuantity - 1))}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="1"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-0 focus:ring-0"
              />
              <button
                onClick={() => setCurrentQuantity(currentQuantity + 1)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scanned Items */}
      {scannedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {scanMode === 'single' ? 'Останні відскановані товари' : 'Товари для пакетного сканування'}
            </h3>
            {scanMode === 'batch' && (
              <button
                onClick={handleBulkSubmit}
                disabled={bulkScanMutation.isLoading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {bulkScanMutation.isLoading ? 'Обробка...' : 'Підтвердити всі'}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Товар
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Код
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Кількість
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Метод
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Час
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scannedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{item.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {scanMode === 'batch' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium text-gray-900 min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.scan_method === 'barcode' ? 'bg-blue-100 text-blue-800' :
                        item.scan_method === 'qr_code' ? 'bg-green-100 text-green-800' :
                        item.scan_method === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.scan_method === 'barcode' ? 'Штрих-код' :
                         item.scan_method === 'qr_code' ? 'QR код' :
                         item.scan_method === 'pending' ? 'Очікує' :
                         'Вручну'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {scanMode === 'batch' && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
        title="Сканування товару для інвентаризації"
        placeholder="Наведіть камеру на штрих-код або QR код товару"
      />
    </div>
  );
};

export default InventoryScanner;
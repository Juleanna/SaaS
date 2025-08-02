import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useWarehouseStore = create(
  persist(
    (set, get) => ({
      // Склади
      warehouses: [],
      currentWarehouse: null,
      
      // Залишки товарів
      stocks: [],
      stocksLoading: false,
      
      // Постачальники
      suppliers: [],
      suppliersLoading: false,
      
      // Постачання
      supplies: [],
      suppliesLoading: false,
      
      // Партії товарів
      stockBatches: [],
      stockBatchesLoading: false,
      
      // Рухи товарів
      stockMovements: [],
      stockMovementsLoading: false,
      
      // Інвентаризації
      inventories: [],
      inventoriesLoading: false,
      
      // Одиниці вимірювання
      units: [],
      
      // Методи розрахунку собівартості
      costingMethods: [],
      
      // Фасування
      packagings: [],
      
      // Завантаження складів
      fetchWarehouses: async () => {
        try {
          const response = await api.get('/warehouse/warehouses/');
          set({ warehouses: response.data });
          return { success: true };
        } catch (error) {
          console.error('Error fetching warehouses:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження складів' };
        }
      },
      
      // Створення складу
      createWarehouse: async (warehouseData) => {
        try {
          const response = await api.post('/warehouse/warehouses/', warehouseData);
          set(state => ({
            warehouses: [...state.warehouses, response.data]
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error creating warehouse:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка створення складу' };
        }
      },
      
      // Оновлення складу
      updateWarehouse: async (warehouseId, warehouseData) => {
        try {
          const response = await api.put(`/warehouse/warehouses/${warehouseId}/`, warehouseData);
          set(state => ({
            warehouses: state.warehouses.map(w => w.id === warehouseId ? response.data : w)
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error updating warehouse:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка оновлення складу' };
        }
      },
      
      // Видалення складу
      deleteWarehouse: async (warehouseId) => {
        try {
          await api.delete(`/warehouse/warehouses/${warehouseId}/`);
          set(state => ({
            warehouses: state.warehouses.filter(w => w.id !== warehouseId)
          }));
          return { success: true };
        } catch (error) {
          console.error('Error deleting warehouse:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка видалення складу' };
        }
      },
      
      // Встановлення поточного складу
      setCurrentWarehouse: (warehouse) => {
        set({ currentWarehouse: warehouse });
      },
      
      // Завантаження залишків
      fetchStocks: async (warehouseId) => {
        try {
          set({ stocksLoading: true });
          const response = await api.get(`/warehouse/stocks/`, {
            params: { warehouse: warehouseId }
          });
          set({ stocks: response.data, stocksLoading: false });
          return { success: true };
        } catch (error) {
          console.error('Error fetching stocks:', error);
          set({ stocksLoading: false });
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження залишків' };
        }
      },
      
      // Оновлення залишку
      updateStock: async (stockId, stockData) => {
        try {
          const response = await api.put(`/warehouse/stocks/${stockId}/`, stockData);
          set(state => ({
            stocks: state.stocks.map(s => s.id === stockId ? response.data : s)
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error updating stock:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка оновлення залишку' };
        }
      },
      
      // Завантаження постачальників
      fetchSuppliers: async () => {
        try {
          set({ suppliersLoading: true });
          const response = await api.get('/warehouse/suppliers/');
          set({ suppliers: response.data, suppliersLoading: false });
          return { success: true };
        } catch (error) {
          console.error('Error fetching suppliers:', error);
          set({ suppliersLoading: false });
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження постачальників' };
        }
      },
      
      // Створення постачальника
      createSupplier: async (supplierData) => {
        try {
          const response = await api.post('/warehouse/suppliers/', supplierData);
          set(state => ({
            suppliers: [...state.suppliers, response.data]
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error creating supplier:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка створення постачальника' };
        }
      },
      
      // Оновлення постачальника
      updateSupplier: async (supplierId, supplierData) => {
        try {
          const response = await api.put(`/warehouse/suppliers/${supplierId}/`, supplierData);
          set(state => ({
            suppliers: state.suppliers.map(s => s.id === supplierId ? response.data : s)
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error updating supplier:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка оновлення постачальника' };
        }
      },
      
      // Видалення постачальника
      deleteSupplier: async (supplierId) => {
        try {
          await api.delete(`/warehouse/suppliers/${supplierId}/`);
          set(state => ({
            suppliers: state.suppliers.filter(s => s.id !== supplierId)
          }));
          return { success: true };
        } catch (error) {
          console.error('Error deleting supplier:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка видалення постачальника' };
        }
      },
      
      // Завантаження постачань
      fetchSupplies: async (warehouseId) => {
        try {
          set({ suppliesLoading: true });
          const response = await api.get('/warehouse/supplies/', {
            params: warehouseId ? { warehouse: warehouseId } : {}
          });
          set({ supplies: response.data, suppliesLoading: false });
          return { success: true };
        } catch (error) {
          console.error('Error fetching supplies:', error);
          set({ suppliesLoading: false });
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження постачань' };
        }
      },
      
      // Створення постачання
      createSupply: async (supplyData) => {
        try {
          const response = await api.post('/warehouse/supplies/', supplyData);
          set(state => ({
            supplies: [...state.supplies, response.data]
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error creating supply:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка створення постачання' };
        }
      },
      
      // Оновлення статусу постачання
      updateSupplyStatus: async (supplyId, status) => {
        try {
          const response = await api.patch(`/warehouse/supplies/${supplyId}/`, { status });
          set(state => ({
            supplies: state.supplies.map(s => s.id === supplyId ? response.data : s)
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error updating supply status:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка оновлення статусу постачання' };
        }
      },
      
      // Завантаження партій товарів
      fetchStockBatches: async (warehouseId, productId) => {
        try {
          set({ stockBatchesLoading: true });
          const response = await api.get('/warehouse/stock-batches/', {
            params: { 
              warehouse: warehouseId,
              product: productId
            }
          });
          set({ stockBatches: response.data, stockBatchesLoading: false });
          return { success: true };
        } catch (error) {
          console.error('Error fetching stock batches:', error);
          set({ stockBatchesLoading: false });
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження партій' };
        }
      },
      
      // Завантаження руху товарів
      fetchStockMovements: async (warehouseId, productId) => {
        try {
          set({ stockMovementsLoading: true });
          const response = await api.get('/warehouse/stock-movements/', {
            params: { 
              warehouse: warehouseId,
              product: productId
            }
          });
          set({ stockMovements: response.data, stockMovementsLoading: false });
          return { success: true };
        } catch (error) {
          console.error('Error fetching stock movements:', error);
          set({ stockMovementsLoading: false });
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження руху товарів' };
        }
      },
      
      // Завантаження інвентаризацій
      fetchInventories: async (warehouseId) => {
        try {
          set({ inventoriesLoading: true });
          const response = await api.get('/warehouse/inventories/', {
            params: warehouseId ? { warehouse: warehouseId } : {}
          });
          set({ inventories: response.data, inventoriesLoading: false });
          return { success: true };
        } catch (error) {
          console.error('Error fetching inventories:', error);
          set({ inventoriesLoading: false });
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження інвентаризацій' };
        }
      },
      
      // Створення інвентаризації
      createInventory: async (inventoryData) => {
        try {
          const response = await api.post('/warehouse/inventories/', inventoryData);
          set(state => ({
            inventories: [...state.inventories, response.data]
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error creating inventory:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка створення інвентаризації' };
        }
      },
      
      // Оновлення статусу інвентаризації
      updateInventoryStatus: async (inventoryId, status) => {
        try {
          const response = await api.patch(`/warehouse/inventories/${inventoryId}/`, { status });
          set(state => ({
            inventories: state.inventories.map(i => i.id === inventoryId ? response.data : i)
          }));
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error updating inventory status:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка оновлення статусу інвентаризації' };
        }
      },
      
      // Завантаження одиниць вимірювання
      fetchUnits: async () => {
        try {
          const response = await api.get('/warehouse/units/');
          set({ units: response.data });
          return { success: true };
        } catch (error) {
          console.error('Error fetching units:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження одиниць вимірювання' };
        }
      },
      
      // Завантаження методів розрахунку собівартості
      fetchCostingMethods: async () => {
        try {
          const response = await api.get('/warehouse/costing-methods/');
          set({ costingMethods: response.data });
          return { success: true };
        } catch (error) {
          console.error('Error fetching costing methods:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження методів розрахунку' };
        }
      },
      
      // Завантаження фасувань
      fetchPackagings: async (productId) => {
        try {
          const response = await api.get('/warehouse/packagings/', {
            params: productId ? { product: productId } : {}
          });
          set({ packagings: response.data });
          return { success: true };
        } catch (error) {
          console.error('Error fetching packagings:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження фасувань' };
        }
      },
      
      // Очищення стану
      clearWarehouseData: () => {
        set({
          stocks: [],
          stockBatches: [],
          stockMovements: [],
          currentWarehouse: null
        });
      },
      
      // Отримання статистики складу
      getWarehouseStats: async (warehouseId) => {
        try {
          const response = await api.get(`/warehouse/warehouses/${warehouseId}/stats/`);
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error fetching warehouse stats:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка завантаження статистики' };
        }
      },
      
      // Експорт даних складу
      exportWarehouseData: async (warehouseId, format = 'excel') => {
        try {
          const response = await api.get(`/warehouse/warehouses/${warehouseId}/export/`, {
            params: { format },
            responseType: 'blob'
          });
          return { success: true, data: response.data };
        } catch (error) {
          console.error('Error exporting warehouse data:', error);
          return { success: false, error: error.response?.data?.message || 'Помилка експорту даних' };
        }
      }
    }),
    {
      name: 'warehouse-storage',
      partialize: (state) => ({ 
        warehouses: state.warehouses,
        currentWarehouse: state.currentWarehouse,
        suppliers: state.suppliers,
        units: state.units,
        costingMethods: state.costingMethods
      }),
    }
  )
);
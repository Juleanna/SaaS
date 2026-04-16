import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import logger from '../services/logger';
import type { Warehouse, Stock, Supplier, Supply, Inventory } from '../types/models';

export interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generic-сутність для довідників (units, costingMethods, packagings, batches, movements)
interface RefEntity {
  id: number;
  name?: string;
  [key: string]: unknown;
}

// Часткові payload-и для create/update операцій
type WarehousePayload = Partial<Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>>;
type StockPayload = Partial<Omit<Stock, 'id'>>;
type SupplierPayload = Partial<Omit<Supplier, 'id'>>;
type SupplyPayload = Partial<Omit<Supply, 'id' | 'created_at'>>;
type InventoryPayload = Partial<Omit<Inventory, 'id' | 'created_at'>>;

interface WarehouseState {
  warehouses: Warehouse[];
  currentWarehouse: Warehouse | null;
  stocks: Stock[];
  stocksLoading: boolean;
  suppliers: Supplier[];
  suppliersLoading: boolean;
  supplies: Supply[];
  suppliesLoading: boolean;
  stockBatches: RefEntity[];
  stockBatchesLoading: boolean;
  stockMovements: RefEntity[];
  stockMovementsLoading: boolean;
  inventories: Inventory[];
  inventoriesLoading: boolean;
  units: RefEntity[];
  costingMethods: RefEntity[];
  packagings: RefEntity[];

  fetchWarehouses: () => Promise<ApiResult>;
  createWarehouse: (data: WarehousePayload) => Promise<ApiResult<Warehouse>>;
  updateWarehouse: (id: number, data: WarehousePayload) => Promise<ApiResult<Warehouse>>;
  deleteWarehouse: (id: number) => Promise<ApiResult>;
  setCurrentWarehouse: (warehouse: Warehouse | null) => void;
  fetchStocks: (warehouseId: number) => Promise<ApiResult>;
  updateStock: (id: number, data: StockPayload) => Promise<ApiResult<Stock>>;
  fetchSuppliers: () => Promise<ApiResult>;
  createSupplier: (data: SupplierPayload) => Promise<ApiResult<Supplier>>;
  updateSupplier: (id: number, data: SupplierPayload) => Promise<ApiResult<Supplier>>;
  deleteSupplier: (id: number) => Promise<ApiResult>;
  fetchSupplies: (warehouseId?: number) => Promise<ApiResult>;
  createSupply: (data: SupplyPayload) => Promise<ApiResult<Supply>>;
  updateSupplyStatus: (id: number, status: Supply['status']) => Promise<ApiResult<Supply>>;
  fetchStockBatches: (warehouseId?: number, productId?: number) => Promise<ApiResult>;
  fetchStockMovements: (warehouseId?: number, productId?: number) => Promise<ApiResult>;
  fetchInventories: (warehouseId?: number) => Promise<ApiResult>;
  createInventory: (data: InventoryPayload) => Promise<ApiResult<Inventory>>;
  updateInventoryStatus: (id: number, status: Inventory['status']) => Promise<ApiResult<Inventory>>;
  fetchUnits: () => Promise<ApiResult>;
  fetchCostingMethods: () => Promise<ApiResult>;
  fetchPackagings: (productId?: number) => Promise<ApiResult>;
  clearWarehouseData: () => void;
  getWarehouseStats: (id: number) => Promise<ApiResult>;
  exportWarehouseData: (id: number, format?: string) => Promise<ApiResult<Blob>>;
}

const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || fallback;
};

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set, _get) => ({
      warehouses: [],
      currentWarehouse: null,
      stocks: [],
      stocksLoading: false,
      suppliers: [],
      suppliersLoading: false,
      supplies: [],
      suppliesLoading: false,
      stockBatches: [],
      stockBatchesLoading: false,
      stockMovements: [],
      stockMovementsLoading: false,
      inventories: [],
      inventoriesLoading: false,
      units: [],
      costingMethods: [],
      packagings: [],

      fetchWarehouses: async () => {
        try {
          const response = await api.get('/warehouse/warehouses/');
          set({ warehouses: response.data });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching warehouses:', error);
          return { success: false, error: errorMessage(error, 'Помилка завантаження складів') };
        }
      },

      createWarehouse: async (warehouseData) => {
        try {
          const response = await api.post('/warehouse/warehouses/', warehouseData);
          set((state) => ({ warehouses: [...state.warehouses, response.data] }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error creating warehouse:', error);
          return { success: false, error: errorMessage(error, 'Помилка створення складу') };
        }
      },

      updateWarehouse: async (id, warehouseData) => {
        try {
          const response = await api.put(`/warehouse/warehouses/${id}/`, warehouseData);
          set((state) => ({
            warehouses: state.warehouses.map((w) => (w.id === id ? response.data : w)),
          }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error updating warehouse:', error);
          return { success: false, error: errorMessage(error, 'Помилка оновлення складу') };
        }
      },

      deleteWarehouse: async (id) => {
        try {
          await api.delete(`/warehouse/warehouses/${id}/`);
          set((state) => ({ warehouses: state.warehouses.filter((w) => w.id !== id) }));
          return { success: true };
        } catch (error) {
          logger.error('Error deleting warehouse:', error);
          return { success: false, error: errorMessage(error, 'Помилка видалення складу') };
        }
      },

      setCurrentWarehouse: (warehouse) => set({ currentWarehouse: warehouse }),

      fetchStocks: async (warehouseId) => {
        try {
          set({ stocksLoading: true });
          const response = await api.get('/warehouse/stocks/', { params: { warehouse: warehouseId } });
          set({ stocks: response.data, stocksLoading: false });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching stocks:', error);
          set({ stocksLoading: false });
          return { success: false, error: errorMessage(error, 'Помилка завантаження залишків') };
        }
      },

      updateStock: async (id, stockData) => {
        try {
          const response = await api.put(`/warehouse/stocks/${id}/`, stockData);
          set((state) => ({ stocks: state.stocks.map((s) => (s.id === id ? response.data : s)) }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error updating stock:', error);
          return { success: false, error: errorMessage(error, 'Помилка оновлення залишку') };
        }
      },

      fetchSuppliers: async () => {
        try {
          set({ suppliersLoading: true });
          const response = await api.get('/warehouse/suppliers/');
          set({ suppliers: response.data, suppliersLoading: false });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching suppliers:', error);
          set({ suppliersLoading: false });
          return { success: false, error: errorMessage(error, 'Помилка завантаження постачальників') };
        }
      },

      createSupplier: async (supplierData) => {
        try {
          const response = await api.post('/warehouse/suppliers/', supplierData);
          set((state) => ({ suppliers: [...state.suppliers, response.data] }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error creating supplier:', error);
          return { success: false, error: errorMessage(error, 'Помилка створення постачальника') };
        }
      },

      updateSupplier: async (id, supplierData) => {
        try {
          const response = await api.put(`/warehouse/suppliers/${id}/`, supplierData);
          set((state) => ({
            suppliers: state.suppliers.map((s) => (s.id === id ? response.data : s)),
          }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error updating supplier:', error);
          return { success: false, error: errorMessage(error, 'Помилка оновлення постачальника') };
        }
      },

      deleteSupplier: async (id) => {
        try {
          await api.delete(`/warehouse/suppliers/${id}/`);
          set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
          return { success: true };
        } catch (error) {
          logger.error('Error deleting supplier:', error);
          return { success: false, error: errorMessage(error, 'Помилка видалення постачальника') };
        }
      },

      fetchSupplies: async (warehouseId) => {
        try {
          set({ suppliesLoading: true });
          const response = await api.get('/warehouse/supplies/', {
            params: warehouseId ? { warehouse: warehouseId } : {},
          });
          set({ supplies: response.data, suppliesLoading: false });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching supplies:', error);
          set({ suppliesLoading: false });
          return { success: false, error: errorMessage(error, 'Помилка завантаження постачань') };
        }
      },

      createSupply: async (supplyData) => {
        try {
          const response = await api.post('/warehouse/supplies/', supplyData);
          set((state) => ({ supplies: [...state.supplies, response.data] }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error creating supply:', error);
          return { success: false, error: errorMessage(error, 'Помилка створення постачання') };
        }
      },

      updateSupplyStatus: async (id, status) => {
        try {
          const response = await api.patch(`/warehouse/supplies/${id}/`, { status });
          set((state) => ({
            supplies: state.supplies.map((s) => (s.id === id ? response.data : s)),
          }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error updating supply status:', error);
          return { success: false, error: errorMessage(error, 'Помилка оновлення статусу постачання') };
        }
      },

      fetchStockBatches: async (warehouseId, productId) => {
        try {
          set({ stockBatchesLoading: true });
          const response = await api.get('/warehouse/stock-batches/', {
            params: { warehouse: warehouseId, product: productId },
          });
          set({ stockBatches: response.data, stockBatchesLoading: false });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching stock batches:', error);
          set({ stockBatchesLoading: false });
          return { success: false, error: errorMessage(error, 'Помилка завантаження партій') };
        }
      },

      fetchStockMovements: async (warehouseId, productId) => {
        try {
          set({ stockMovementsLoading: true });
          const response = await api.get('/warehouse/stock-movements/', {
            params: { warehouse: warehouseId, product: productId },
          });
          set({ stockMovements: response.data, stockMovementsLoading: false });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching stock movements:', error);
          set({ stockMovementsLoading: false });
          return { success: false, error: errorMessage(error, 'Помилка завантаження руху товарів') };
        }
      },

      fetchInventories: async (warehouseId) => {
        try {
          set({ inventoriesLoading: true });
          const response = await api.get('/warehouse/inventories/', {
            params: warehouseId ? { warehouse: warehouseId } : {},
          });
          set({ inventories: response.data, inventoriesLoading: false });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching inventories:', error);
          set({ inventoriesLoading: false });
          return { success: false, error: errorMessage(error, 'Помилка завантаження інвентаризацій') };
        }
      },

      createInventory: async (inventoryData) => {
        try {
          const response = await api.post('/warehouse/inventories/', inventoryData);
          set((state) => ({ inventories: [...state.inventories, response.data] }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error creating inventory:', error);
          return { success: false, error: errorMessage(error, 'Помилка створення інвентаризації') };
        }
      },

      updateInventoryStatus: async (id, status) => {
        try {
          const response = await api.patch(`/warehouse/inventories/${id}/`, { status });
          set((state) => ({
            inventories: state.inventories.map((i) => (i.id === id ? response.data : i)),
          }));
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error updating inventory status:', error);
          return { success: false, error: errorMessage(error, 'Помилка оновлення статусу') };
        }
      },

      fetchUnits: async () => {
        try {
          const response = await api.get('/warehouse/units/');
          set({ units: response.data });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching units:', error);
          return { success: false, error: errorMessage(error, 'Помилка завантаження одиниць') };
        }
      },

      fetchCostingMethods: async () => {
        try {
          const response = await api.get('/warehouse/costing-methods/');
          set({ costingMethods: response.data });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching costing methods:', error);
          return { success: false, error: errorMessage(error, 'Помилка завантаження методів') };
        }
      },

      fetchPackagings: async (productId) => {
        try {
          const response = await api.get('/warehouse/packagings/', {
            params: productId ? { product: productId } : {},
          });
          set({ packagings: response.data });
          return { success: true };
        } catch (error) {
          logger.error('Error fetching packagings:', error);
          return { success: false, error: errorMessage(error, 'Помилка завантаження фасувань') };
        }
      },

      clearWarehouseData: () => {
        set({ stocks: [], stockBatches: [], stockMovements: [], currentWarehouse: null });
      },

      getWarehouseStats: async (id) => {
        try {
          const response = await api.get(`/warehouse/warehouses/${id}/stats/`);
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error fetching warehouse stats:', error);
          return { success: false, error: errorMessage(error, 'Помилка завантаження статистики') };
        }
      },

      exportWarehouseData: async (id, format = 'excel') => {
        try {
          const response = await api.get(`/warehouse/warehouses/${id}/export/`, {
            params: { format },
            responseType: 'blob',
          });
          return { success: true, data: response.data };
        } catch (error) {
          logger.error('Error exporting warehouse data:', error);
          return { success: false, error: errorMessage(error, 'Помилка експорту даних') };
        }
      },
    }),
    {
      name: 'warehouse-storage',
      partialize: (state) => ({
        warehouses: state.warehouses,
        currentWarehouse: state.currentWarehouse,
        suppliers: state.suppliers,
        units: state.units,
        costingMethods: state.costingMethods,
      }),
    }
  )
);

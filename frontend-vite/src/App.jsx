import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/Profile';
import Stores from './pages/Stores';
import StoreDetails from './pages/StoreDetails';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import WarehouseDashboard from './pages/Warehouse/WarehouseDashboard';
import InventoryManagement from './pages/Warehouse/InventoryManagement';
import StockBatches from './pages/Warehouse/StockBatches';
import Suppliers from './pages/Warehouse/Suppliers';
import WarehouseManagement from './pages/Warehouse/WarehouseManagement';
import SupplyManagement from './pages/Warehouse/SupplyManagement';
import InventoryScanner from './pages/Warehouse/InventoryScanner';
import ScannerDemo from './pages/Warehouse/ScannerDemo';
import PriceLists from './pages/PriceLists';
import PublicStore from './pages/public/PublicStore';
import PublicStoresList from './pages/public/PublicStoresList';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/stores" element={<PublicStoresList />} />
        <Route path="/store/:storeSlug" element={<PublicStore />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {isAuthenticated ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin/stores" element={<Stores />} />
            <Route path="stores/:storeId" element={<StoreDetails />} />
            <Route path="stores/:storeId/products" element={<Products />} />
            <Route path="stores/:storeId/orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:productId" element={<ProductDetail />} />
            <Route path="categories" element={<Categories />} />
            <Route path="payments" element={<Payments />} />
            <Route path="pricelists" element={<PriceLists />} />
            <Route path="warehouse" element={<WarehouseDashboard />} />
            <Route path="warehouse/management" element={<WarehouseManagement />} />
            <Route path="warehouse/inventory" element={<InventoryManagement />} />
            <Route path="warehouse/batches" element={<StockBatches />} />
            <Route path="warehouse/suppliers" element={<Suppliers />} />
            <Route path="warehouse/supplies" element={<SupplyManagement />} />
            <Route path="warehouse/inventory/:inventoryId/scan" element={<InventoryScanner />} />
            <Route path="warehouse/scanner-demo" element={<ScannerDemo />} />
          </Route>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </div>
  );
}

export default App;

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
import Orders from './pages/Orders';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {isAuthenticated ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="stores" element={<Stores />} />
            <Route path="stores/:storeId" element={<StoreDetails />} />
            <Route path="stores/:storeId/products" element={<Products />} />
            <Route path="stores/:storeId/orders" element={<Orders />} />
          </Route>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </div>
  );
}

export default App;

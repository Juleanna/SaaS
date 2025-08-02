import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  HomeIcon,
  ShoppingBagIcon,
  CubeIcon,
  ShoppingCartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  
  // Отримуємо актуальні дані профілю для аватару
  const { data: profileData } = useQuery({
    queryKey: ['user-profile-layout'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/profile/');
        return response.data;
      } catch (error) {
        return user; // Fallback на дані з store
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });

  // Використовуємо дані з API або з store
  const currentUser = profileData || user;

  const navigation = [
    { name: 'Головна', href: '/', icon: HomeIcon },
    { name: 'Магазини', href: '/stores', icon: ShoppingBagIcon },
    { name: 'Склад', href: '/warehouse', icon: BuildingStorefrontIcon, 
      submenu: [
        { name: 'Панель складу', href: '/warehouse' },
        { name: 'Управління складами', href: '/warehouse/management' },
        { name: 'Залишки', href: '/warehouse/inventory' },
        { name: 'Партії товарів', href: '/warehouse/batches' },
        { name: 'Постачальники', href: '/warehouse/suppliers' },
        { name: 'Постачання', href: '/warehouse/supplies' },
      ]
    },
    { name: 'Товари', href: '/stores/1/products', icon: CubeIcon },
    { name: 'Замовлення', href: '/stores/1/orders', icon: ShoppingCartIcon },
    { name: 'Профіль', href: '/profile', icon: UserIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const toggleSubmenu = (itemName) => {
    setOpenSubmenu(openSubmenu === itemName ? null : itemName);
  };

  const renderNavigationItem = (item, isMobile = false) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openSubmenu === item.name;
    const isItemActive = isActive(item.href);

    if (hasSubmenu) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md ${
              isItemActive
                ? 'bg-primary-100 text-primary-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
            <svg
              className={`ml-auto h-4 w-4 transition-transform ${
                isSubmenuOpen ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isSubmenuOpen && (
            <div className="ml-6 mt-1 space-y-1">
              {item.submenu.map((subItem) => (
                <Link
                  key={subItem.name}
                  to={subItem.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    location.pathname === subItem.href
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  {subItem.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          isItemActive
            ? 'bg-primary-100 text-primary-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={() => isMobile && setSidebarOpen(false)}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold text-gray-900">SaaS Platform</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => renderNavigationItem(item, true))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold text-gray-900">SaaS Platform</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => renderNavigationItem(item, false))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Profile dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{currentUser?.first_name} {currentUser?.last_name}</p>
                    <p className="text-gray-500">{currentUser?.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate('/profile')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Вийти
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 
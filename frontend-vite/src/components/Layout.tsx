
import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
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
  CreditCardIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  TagIcon,
  TruckIcon,
  ArchiveBoxIcon,
  CameraIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Square3Stack3DIcon,
  UserGroupIcon,
  QrCodeIcon,
  BellIcon,
  SparklesIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

interface NavSubItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: NavSubItem[];
}

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
    >
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
};

const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Отримуємо актуальні дані профілю для аватару
  const { data: profileData } = useQuery({
    queryKey: ['user-profile-layout'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/profile/');
        return response.data;
      } catch (error) {
        return user;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const currentUser = profileData || user;

  // Навігація з секціями
  const navigationSections = [
    {
      label: null, // Без заголовку — головна секція
      items: [
        { name: 'Дашборд', href: '/', icon: HomeIcon },
        { name: 'Маркетплейс', href: '/marketplace', icon: GlobeAltIcon },
      ],
    },
    {
      label: 'Управління',
      items: [
        { name: 'Магазини', href: '/stores', icon: BuildingStorefrontIcon },
        {
          name: 'Товари',
          href: '/products',
          icon: CubeIcon,
          submenu: [
            { name: 'Категорії', href: '/categories', icon: TagIcon },
            { name: 'Всі товари', href: '/products', icon: CubeIcon },
          ],
        },
        { name: 'Замовлення', href: '/orders', icon: ShoppingCartIcon },
        { name: 'Платежі', href: '/payments', icon: CreditCardIcon },
        { name: 'Прайс-листи', href: '/pricelists', icon: DocumentTextIcon },
      ],
    },
    {
      label: 'Підписка',
      items: [
        { name: 'Тарифні плани', href: '/subscriptions', icon: SparklesIcon },
      ],
    },
    {
      label: 'Склад',
      items: [
        { name: 'Панель складу', href: '/warehouse', icon: ChartBarIcon },
        { name: 'Управління складами', href: '/warehouse/management', icon: BuildingStorefrontIcon },
        { name: 'Залишки', href: '/warehouse/inventory', icon: ClipboardDocumentListIcon },
        { name: 'Партії товарів', href: '/warehouse/batches', icon: Square3Stack3DIcon },
        { name: 'Постачальники', href: '/warehouse/suppliers', icon: UserGroupIcon },
        { name: 'Постачання', href: '/warehouse/supplies', icon: TruckIcon },
        { name: 'Сканер', href: '/warehouse/scanner-demo', icon: QrCodeIcon },
      ],
    },
    {
      label: 'Інтеграції',
      items: [
        { name: 'Instagram', href: '/instagram', icon: CameraIcon },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (href: string): boolean => {
    if (href === '/') return location.pathname === '/';
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const toggleSubmenu = (itemName: string): void => {
    setOpenSubmenu(openSubmenu === itemName ? null : itemName);
  };

  // ========================================
  // Рендер елементу навігації
  // ========================================
  const renderNavItem = (item: NavItem, isMobile = false, collapsed = false) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openSubmenu === item.name;
    const isItemActive = isActive(item.href);

    if (hasSubmenu) {
      if (collapsed && !isMobile) {
        return (
          <div key={item.name} className="relative group/sub">
            <Link
              to={item.href}
              className={`group flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${
                isItemActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={item.name}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${
                isItemActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
              }`} />
            </Link>
            <div className="absolute left-full top-0 ml-2 hidden group-hover/sub:block z-50">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                {item.submenu.map((subItem) => {
                  const isSubActive = location.pathname === subItem.href;
                  return (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      className={`flex items-center px-3 py-2 text-sm ${
                        isSubActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
              isItemActive
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
              isItemActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
            }`} />
            <span className="flex-1 text-left">{item.name}</span>
            <ChevronRightIcon
              className={`h-4 w-4 transition-transform duration-200 ${
                isSubmenuOpen ? 'rotate-90' : ''
              } ${isItemActive ? 'text-white/80' : 'text-gray-400'}`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              isSubmenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
              {item.submenu.map((subItem) => {
                const isSubActive = location.pathname === subItem.href;
                return (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isSubActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    {subItem.icon && (
                      <subItem.icon className={`mr-2.5 h-4 w-4 ${
                        isSubActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    )}
                    {subItem.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (collapsed && !isMobile) {
      return (
        <Link
          key={item.name}
          to={item.href}
          className={`group flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${
            isItemActive
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title={item.name}
        >
          <item.icon className={`h-5 w-5 flex-shrink-0 ${
            isItemActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
          }`} />
        </Link>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          isItemActive
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        onClick={() => isMobile && setSidebarOpen(false)}
      >
        <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
          isItemActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
        }`} />
        {item.name}
      </Link>
    );
  };

  // ========================================
  // Рендер sidebar контенту (спільний для mobile та desktop)
  // ========================================
  const renderSidebarContent = (isMobile = false) => {
    const collapsed = sidebarCollapsed && !isMobile;

    return (
      <>
        {/* Logo / Brand */}
        <div className={`flex items-center h-16 border-b border-gray-100 flex-shrink-0 ${collapsed ? 'px-2' : 'px-5'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3 flex-1'}`}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <ShoppingBagIcon className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex-1">
                <h1 className="text-base font-bold text-gray-900 leading-tight">StoreHub</h1>
                <p className="text-[11px] text-gray-400 leading-tight">Панель управління</p>
              </div>
            )}
          </div>
          {!isMobile && !collapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Згорнути меню"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 space-y-6 ${collapsed ? 'px-2' : 'px-3'}`}>
          {navigationSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.label && !collapsed && (
                <div className="px-3 mb-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {section.label}
                  </span>
                </div>
              )}
              {section.label && collapsed && (
                <div className="border-t border-gray-100 my-2" />
              )}
              <div className="space-y-1.5">
                {section.items.map((item) => renderNavItem(item, isMobile, collapsed))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section at bottom */}
        <div className={`flex-shrink-0 border-t border-gray-100 ${collapsed ? 'p-2' : 'p-4'}`}>
          {collapsed && !isMobile ? (
            <div className="space-y-2">
              <Link
                to="/profile"
                className="flex items-center justify-center p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                title={currentUser?.email || 'Профіль'}
              >
                <div className="h-9 w-9 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </Link>
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                title="Розгорнути меню"
              >
                <ChevronDoubleRightIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/profile"
              className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser?.first_name} {currentUser?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
              </div>
              <Cog6ToothIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
            </Link>
          )}
        </div>
      </>
    );
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-50 xl:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderSidebarContent(true)}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden xl:fixed xl:inset-y-0 xl:z-30 xl:flex xl:flex-col transition-all duration-300 ${sidebarCollapsed ? 'xl:w-[72px]' : 'xl:w-72'}`}>
        <div className="flex flex-col h-full overflow-hidden bg-white border-r border-gray-200/80">
          {renderSidebarContent(false)}
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'xl:pl-[72px]' : 'xl:pl-72'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl px-4 sm:px-6 xl:px-8">
          {/* Mobile menu button */}
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors xl:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Breadcrumb / page title area */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-x-3">
            <ThemeToggle />

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-x-3">
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <div className="text-sm leading-tight">
                <p className="font-medium text-gray-900">
                  {currentUser?.first_name} {currentUser?.last_name}
                </p>
              </div>
            </div>

            {/* Settings */}
            <button
              onClick={() => navigate('/profile')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Налаштування"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Вийти"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

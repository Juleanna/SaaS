import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import { useThemeStore } from './stores/themeStore';

// Sentry (опційно, активується якщо VITE_SENTRY_DSN задано)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  // Динамічний імпорт щоб не тягнути Sentry bundle без потреби
  import('@sentry/react').then(({ init, browserTracingIntegration }) => {
    init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
      integrations: [browserTracingIntegration()],
      tracesSampleRate: 0.1,
    });
  }).catch(() => {
    // Sentry не встановлений — це OK
  });
}

// Ініціалізуємо тему (читає збережене значення)
useThemeStore.getState().setTheme(useThemeStore.getState().theme);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '12px',
              padding: '0',
              maxWidth: '420px',
            },
            success: {
              style: { background: '#065f46', color: '#fff' },
            },
            error: {
              style: { background: '#991b1b', color: '#fff' },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t} style={{ ...t.style, padding: 0 }}>
              {({ icon, message }) => (
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '10px', width: '100%' }}>
                  {icon}
                  <div style={{ flex: 1, fontSize: '14px' }}>{message}</div>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '16px',
                      lineHeight: 1,
                      flexShrink: 0,
                      borderRadius: '6px',
                      fontWeight: 'bold',
                    }}
                  >
                    &#215;
                  </button>
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

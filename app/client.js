'use client';

import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import MainContent from './components/MainContent';
import AdminContent from './admin/AdminContent';

// ============================================
// EXTERNAL SCRIPT YÜKLEYİCİ
// ============================================
function ExternalScripts() {
  useEffect(() => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js'
    ];

    scripts.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const script   = document.createElement('script');
      script.src     = src;
      script.async   = false;
      document.head.appendChild(script);
    });

    console.log('✅ External scriptler yükleniyor...');
  }, []);

  return null;
}

// ============================================
// PWA SERVICE WORKER
// ============================================
function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => console.log('✅ PWA: Service Worker kayıtlı!', reg.scope))
          .catch(err => console.log('❌ PWA: Service Worker kaydedilemedi:', err));
      });
    }
  }, []);

  return null;
}

// ============================================
// ANA UYGULAMA — Login / rol bazlı yönlendirme
// ============================================
function App() {
  const { currentUser } = useAuth();

  if (!currentUser) return <LoginScreen />;
  if (currentUser.rol === 'admin' || currentUser.rol === 'yonetici') return <AdminContent />;
  return <MainContent />;
}

// ============================================
// ROOT — AuthProvider ile sar
// ============================================
export default function Root() {
  return (
    <AuthProvider>
      <ExternalScripts />
      <PWARegistration />
      <App />
    </AuthProvider>
  );
}
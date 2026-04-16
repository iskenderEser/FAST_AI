'use client';

import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import MainContent from './components/MainContent';

// ============================================
// GÜVENLİK KATI
// ============================================
function SecurityLayer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('keydown', e => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && ['u', 's', 'p'].includes(e.key))
      ) {
        e.preventDefault();
      }
    });

    document.addEventListener('copy', e => e.preventDefault());
    document.addEventListener('cut',  e => e.preventDefault());

    document.addEventListener('selectstart', e => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    });

    document.addEventListener('dragstart', e => e.preventDefault());

    const style       = document.createElement('style');
    style.textContent = `* { user-select: none !important; } input, textarea { user-select: text !important; }`;
    document.head.appendChild(style);

    console.log('✅ Güvenlik katmanı aktif!');
  }, []);

  return null;
}

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
// ANA UYGULAMA — Login / MainContent geçişi
// ============================================
function App() {
  const { currentUser } = useAuth();

  return (
    <>
      <SecurityLayer />
      <ExternalScripts />
      <PWARegistration />
      {!currentUser ? <LoginScreen /> : <MainContent />}
    </>
  );
}

// ============================================
// ROOT — AuthProvider ile sar
// ============================================
export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
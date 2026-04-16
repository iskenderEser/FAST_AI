'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const login = useCallback((kullanici) => {
    setCurrentUser(kullanici);
    // Geriye dönük uyumluluk için window.currentUser da set ediliyor
    // API route'larına geçiş tamamlandıkça bu satır kaldırılacak
    if (typeof window !== 'undefined') {
      window.currentUser = kullanici;
    }
    console.log('✅ Giriş başarılı:', kullanici.rol);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.currentUser = null;
    }
    console.log('🚪 Çıkış yapıldı');
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır');
  return ctx;
}
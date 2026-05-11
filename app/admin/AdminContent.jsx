'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import Firmalar from './Firmalar';
import Kullanicilar from './Kullanicilar';
import Urunler from './Urunler';
import Raporlar from './Raporlar';

export default function AdminContent() {
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser?.rol === 'admin';

  const [activeTab, setActiveTab] = useState(isAdmin ? 'firmalar' : 'kullanicilar');

  const TABS = [
    ...(isAdmin ? [{ id: 'firmalar', label: '🏢 Firmalar' }] : []),
    { id: 'kullanicilar', label: '👥 Kullanıcılar' },
    { id: 'urunler',      label: '💊 Ürünler' },
    { id: 'raporlar',     label: '📊 Raporlar' },
  ];

  const baslik = isAdmin ? 'Admin Paneli' : 'Yönetici Paneli';

  return (
    <div className="admin-layout">

      <div className="admin-header">
        <div>
          <div className="admin-header__logo">🧠 FAST AI — {baslik}</div>
          <div className="admin-header__subtitle">{currentUser?.ad_soyad || currentUser?.rol}</div>
        </div>
        <Button variant="ghost" size="small" onClick={logout}>Çıkış</Button>
      </div>

      <div className="admin-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab${activeTab === tab.id ? ' admin-tab--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-body">
        <div className="admin-card">
          {activeTab === 'firmalar'     && <Firmalar />}
          {activeTab === 'kullanicilar' && <Kullanicilar />}
          {activeTab === 'urunler'      && <Urunler />}
          {activeTab === 'raporlar'     && <Raporlar />}
        </div>
      </div>

    </div>
  );
}
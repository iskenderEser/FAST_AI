'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>

      {/* HEADER */}
      <div style={{
        background: 'white', borderBottom: '0.5px solid #eee',
        padding: '10px 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#e30a17' }}>
            🧠 FAST CPR — {baslik}
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
            {currentUser?.ad_soyad || currentUser?.rol}
          </div>
        </div>
        <button onClick={logout} style={{
          padding: '7px 14px', borderRadius: '8px',
          border: '0.5px solid #ddd', background: 'transparent',
          cursor: 'pointer', fontSize: '13px', color: '#666'
        }}>
          Çıkış
        </button>
      </div>

      {/* SEKMELER */}
      <div style={{
        background: 'white', borderBottom: '0.5px solid #eee',
        padding: '0 24px', display: 'flex', gap: '4px'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 18px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              color: activeTab === tab.id ? '#003cbb' : '#888',
              borderBottom: activeTab === tab.id ? '2px solid #003cbb' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* İÇERİK */}
      <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{
          background: 'white', borderRadius: '12px',
          border: '0.5px solid #eee', padding: '20px'
        }}>
          {activeTab === 'firmalar'     && <Firmalar />}
          {activeTab === 'kullanicilar' && <Kullanicilar />}
          {activeTab === 'urunler'      && <Urunler />}
          {activeTab === 'raporlar'     && <Raporlar />}
        </div>
      </div>

    </div>
  );
}
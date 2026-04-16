'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FastCPRProvider } from '../context/FastCPRContext';
import S4Survey from './S4Survey';
import PDFStock from './PDFStock';
import Kart1KonforAlani from './cards/Kart1KonforAlani';
import Kart2OgrenmStili from './cards/Kart2OgrenmStili';
import Kart3TedaviUrun from './cards/Kart3TedaviUrun';
import Kart4TemelCPR from './cards/Kart4TemelCPR';
import Kart5StilCPR from './cards/Kart5StilCPR';

export default function MainContent() {
  const { currentUser, logout } = useAuth();

  const [profilDropdownOpen, setProfilDropdownOpen] = useState(false);
  const [s4ModalOpen, setS4ModalOpen]               = useState(false);
  const [socialStyle, setSocialStyle]               = useState('');

  function handleLogout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) logout();
  }

  const kullaniciAd = currentUser?.ad_soyad || currentUser?.telefon || '';
  const firmaAd     = currentUser?.firma_adi || '';
  const initials    = kullaniciAd
    ? kullaniciAd.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'KU';

  return (
    <FastCPRProvider>
      <div id="mainContent" className="visible">

        {/* HEADER */}
        <div style={{
          background: 'white', borderBottom: '0.5px solid var(--border)',
          padding: '10px 24px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', position: 'sticky', top: 0, zIndex: 100
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#e30a17' }}>
              🧠 FAST CPR KOÇU
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
              Tanıtımın Verimliliğini Destekler
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            <button
              onClick={() => setProfilDropdownOpen(prev => !prev)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 14px', borderRadius: '8px',
                border: '0.5px solid var(--border)',
                background: 'white', cursor: 'pointer', fontSize: '13px'
              }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: '#003cbb', color: 'white',
                fontSize: '10px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {initials}
              </div>
              <span>Profilim</span>
              <span style={{ fontSize: '10px', color: '#888' }}>▾</span>
            </button>

            {profilDropdownOpen && (
              <>
                <div onClick={() => setProfilDropdownOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div style={{
                  position: 'absolute', top: '42px', right: 0, zIndex: 100,
                  background: 'white', borderRadius: '10px',
                  border: '0.5px solid var(--border)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: '220px', overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{kullaniciAd || 'Kullanıcı'}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{firmaAd}</div>
                  </div>
                  <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--border)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    İndirilen PDF: <strong>{currentUser?.pdf_count ?? '—'}</strong>
                  </div>
                  <div
                    onClick={() => { setProfilDropdownOpen(false); setS4ModalOpen(true); }}
                    style={{
                      padding: '10px 16px', fontSize: '13px', color: '#003cbb',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                    <span>Sosyal Stil Testi</span>
                    <span style={{ fontSize: '11px' }}>→</span>
                  </div>
                </div>
              </>
            )}

            <button onClick={handleLogout} style={{
              padding: '7px 14px', borderRadius: '8px',
              border: '0.5px solid var(--border)',
              background: 'transparent', cursor: 'pointer',
              fontSize: '13px', color: '#666'
            }}>
              Çıkış
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div style={{
          padding: '10px 24px', display: 'flex', gap: '10px',
          background: 'white', borderBottom: '0.5px solid var(--border)'
        }}>
          <PDFStock />
        </div>

        {/* ANA İÇERİK */}
        <div className="container" style={{ padding: '20px 24px' }}>
          <Kart1KonforAlani />
          <Kart2OgrenmStili />
          <Kart3TedaviUrun />
          <Kart4TemelCPR />
          <Kart5StilCPR />
        </div>

        {/* S4 SURVEY MODALİ */}
        {s4ModalOpen && (
          <div onClick={e => { if (e.target === e.currentTarget) setS4ModalOpen(false); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}>
            <div style={{
              background: 'white', borderRadius: '12px',
              border: '0.5px solid var(--border)',
              width: '100%', maxWidth: '600px',
              maxHeight: '90vh', overflow: 'hidden',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{
                padding: '14px 18px', borderBottom: '0.5px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
              }}>
                <span style={{ fontSize: '15px', fontWeight: 500 }}>Sosyal Stil Testi</span>
                <button onClick={() => setS4ModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666', lineHeight: 1 }}>
                  ×
                </button>
              </div>
              <div style={{ padding: '18px', overflowY: 'auto', flex: 1 }}>
                {socialStyle && (
                  <div style={{
                    padding: '8px 14px', marginBottom: '14px', borderRadius: '8px',
                    background: '#eef2ff', color: '#003cbb', fontSize: '13px'
                  }}>
                    Mevcut stil: <strong>{socialStyle}</strong>
                  </div>
                )}
                <S4Survey onStyleCalculated={style => {
                  setSocialStyle(style);
                  setS4ModalOpen(false);
                }} />
              </div>
            </div>
          </div>
        )}

      </div>
    </FastCPRProvider>
  );
}
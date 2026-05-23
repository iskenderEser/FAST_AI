'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FastCPRProvider } from '../context/FastCPRContext';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import S4Survey from './S4Survey';
import PDFStock from './PDFStock';
import Raporlar from '../admin/Raporlar';
import Kart1KonforAlani from './cards/Kart1KonforAlani';
import Kart2OgrenmStili from './cards/Kart2OgrenmStili';
import Kart3TedaviUrun from './cards/Kart3TedaviUrun';
import Kart5StilCPR from './cards/Kart5StilCPR';

// ============================================
// PROFILE DROPDOWN COMPONENT
// ============================================

function ProfileDropdown({ isOpen, onClose, userName, firmName, onOpenS4Modal }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="dropdown-overlay" onClick={onClose} />
      <div className="profile-dropdown">
        <div className="profile-dropdown-header">
          <div className="profile-dropdown-name">{userName || 'Kullanıcı'}</div>
          <div className="profile-dropdown-firm">{firmName}</div>
        </div>
        <div className="profile-dropdown-item" onClick={onOpenS4Modal}>
          <span>Sosyal Stil Testi</span>
          <span className="profile-dropdown-arrow">→</span>
        </div>
      </div>
    </>
  );
}

// ============================================
// HEADER COMPONENT
// ============================================

function Header({ initials, userName, firmName, onProfileToggle, onLogout, profilDropdownOpen, onCloseDropdown, onOpenS4Modal }) {
  return (
    <div className="main-header">
      <div>
        <div className="logo">🧠 FAST AI</div>
        <div className="logo-subtitle">Tanıtımın Verimliliğini Destekler</div>
      </div>
      <div className="header-actions">
        <button className="profile-button" onClick={onProfileToggle}>
          <div className="profile-avatar">{initials}</div>
          <span>Profilim</span>
          <span className="dropdown-arrow">▾</span>
        </button>
        <Button variant="ghost" size="small" onClick={onLogout}>
          Çıkış
        </Button>
        <ProfileDropdown
          isOpen={profilDropdownOpen}
          onClose={onCloseDropdown}
          userName={userName}
          firmName={firmName}
          onOpenS4Modal={onOpenS4Modal}
        />
      </div>
    </div>
  );
}

// ============================================
// TOOLBAR COMPONENT
// ============================================

function Toolbar({ onToggleRaporlar, raporlarAcik }) {
  return (
    <div className="main-toolbar">
      <PDFStock />
      <Button
        variant={raporlarAcik ? 'primary' : 'ghost'}
        size="small"
        onClick={onToggleRaporlar}
      >
        <span>📊</span>
        <span>{raporlarAcik ? 'CPR Üret' : 'Raporlar'}</span>
      </Button>
    </div>
  );
}

// ============================================
// S4 MODAL CONTENT
// ============================================

function S4ModalContent({ socialStyle, onStyleCalculated, onClose }) {
  return (
    <div className="s4-modal-content">
      {socialStyle && (
        <div className="s4-current-style">
          Mevcut stil: <strong>{socialStyle}</strong>
        </div>
      )}
      <S4Survey onStyleCalculated={onStyleCalculated} />
    </div>
  );
}

// ============================================
// MAIN CONTENT
// ============================================

export default function MainContent() {
  const { currentUser, logout } = useAuth();

  const [profilDropdownOpen, setProfilDropdownOpen] = useState(false);
  const [s4ModalOpen, setS4ModalOpen]               = useState(false);
  const [socialStyle, setSocialStyle]               = useState('');
  const [raporlarAcik, setRaporlarAcik]             = useState(false);

  function handleLogout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) logout();
  }

  const kullaniciAd = currentUser?.ad_soyad || currentUser?.telefon || '';
  const firmaAd     = currentUser?.firma_adi || '';
  const initials    = kullaniciAd
    ? kullaniciAd.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'KU';

  const handleS4StyleCalculated = (style) => {
    setSocialStyle(style);
  };

  return (
    <FastCPRProvider>
      <div id="mainContent">
        <Header
          initials={initials}
          userName={kullaniciAd}
          firmName={firmaAd}
          onProfileToggle={() => setProfilDropdownOpen(prev => !prev)}
          onLogout={handleLogout}
          profilDropdownOpen={profilDropdownOpen}
          onCloseDropdown={() => setProfilDropdownOpen(false)}
          onOpenS4Modal={() => {
            setProfilDropdownOpen(false);
            setS4ModalOpen(true);
          }}
        />

        <Toolbar
          onToggleRaporlar={() => setRaporlarAcik(prev => !prev)}
          raporlarAcik={raporlarAcik}
        />

        {raporlarAcik && (
          <div className="raporlar-container">
            <Raporlar />
          </div>
        )}

        {!raporlarAcik && (
          <div className="main-container">
            <Kart1KonforAlani />
            <Kart2OgrenmStili />
            <Kart3TedaviUrun />
            <Kart5StilCPR />
          </div>
        )}

        <Modal
          isOpen={s4ModalOpen}
          onClose={() => setS4ModalOpen(false)}
          title="Sosyal Stil Testi"
          size="default"
        >
          <S4ModalContent
            socialStyle={socialStyle}
            onStyleCalculated={handleS4StyleCalculated}
            onClose={() => setS4ModalOpen(false)}
          />
        </Modal>
      </div>
    </FastCPRProvider>
  );
}
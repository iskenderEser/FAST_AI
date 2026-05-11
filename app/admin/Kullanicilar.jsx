'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

function Badge({ aktif }) {
  return (
    <span className={`admin-badge ${aktif ? 'admin-badge--active' : 'admin-badge--passive'}`}>
      {aktif ? 'Aktif' : 'Pasif'}
    </span>
  );
}

function RolBadge({ rol }) {
  return (
    <span className={`admin-badge admin-badge--${rol}`}>
      {rol}
    </span>
  );
}

export default function Kullanicilar() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.rol === 'admin';

  const [firmalar, setFirmalar]         = useState([]);
  const [seciliFirma, setSeciliFirma]   = useState('');
  const [kullanicilar, setKullanicilar] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);
  const [adSoyad, setAdSoyad]           = useState('');
  const [telefon, setTelefon]           = useState('');
  const [rol, setRol]                   = useState('kullanici');
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState('');

  useEffect(() => {
    if (isAdmin) {
      async function loadFirmalar() {
        try {
          const res  = await fetch('/api/admin/firms');
          const data = await res.json();
          if (data.success) setFirmalar(data.data.filter(f => f.aktif));
        } catch (e) {}
      }
      loadFirmalar();
    } else {
      const firmaId = currentUser?.firma_id || '';
      setSeciliFirma(firmaId);
      if (firmaId) loadKullanicilar(firmaId);
    }
  }, []);

  async function loadKullanicilar(firmaId) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/panel/users?firma_id=${firmaId}`);
      const data = await res.json();
      if (data.success) setKullanicilar(data.data);
    } catch (e) {}
    setLoading(false);
  }

  function handleFirmaChange(firmaId) {
    setSeciliFirma(firmaId);
    setKullanicilar([]);
    if (firmaId) loadKullanicilar(firmaId);
  }

  async function handleEkle() {
    if (!adSoyad.trim() || !telefon.trim() || !seciliFirma) return setMsg('Tüm alanları doldurun.');
    setSaving(true);
    try {
      const res  = await fetch('/api/panel/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firma_id: seciliFirma, ad_soyad: adSoyad.trim(), telefon: telefon.trim(), rol })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✅ Kullanıcı eklendi.');
        setAdSoyad(''); setTelefon(''); setRol('kullanici');
        setModalOpen(false);
        loadKullanicilar(seciliFirma);
      } else {
        setMsg('❌ ' + data.error);
      }
    } catch (e) {
      setMsg('❌ Hata oluştu.');
    }
    setSaving(false);
  }

  async function handleToggle(id, aktif) {
    try {
      await fetch('/api/panel/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aktif: !aktif })
      });
      loadKullanicilar(seciliFirma);
    } catch (e) {}
  }

  return (
    <div>
      {isAdmin && (
        <div className="admin-form__group">
          <label className="admin-form__label">Firma Seçiniz</label>
          <select
            className="admin-form__input"
            value={seciliFirma}
            onChange={e => handleFirmaChange(e.target.value)}
          >
            <option value="">Seçiniz...</option>
            {firmalar.map(f => (
              <option key={f.id} value={f.id}>{f.firma_adi}</option>
            ))}
          </select>
        </div>
      )}

      {seciliFirma && (
        <div className="admin-panel__toolbar">
          <span className="admin-panel__count">{kullanicilar.length} kullanıcı</span>
          <Button variant="primary" size="small" onClick={() => { setModalOpen(true); setMsg(''); }}>
            + Kullanıcı Ekle
          </Button>
        </div>
      )}

      {msg && <div className="admin-panel__msg">{msg}</div>}

      {loading ? (
        <div className="admin-panel__loading">Yükleniyor...</div>
      ) : kullanicilar.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Tel (son 4)</th>
              <th>Rol</th>
              <th>Durum</th>
              <th className="admin-table th--right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {kullanicilar.map(k => (
              <tr key={k.id}>
                <td className="admin-table td--bold">{k.ad_soyad}</td>
                <td className="admin-table td--muted">****{k.telefon_son4}</td>
                <td><RolBadge rol={k.rol} /></td>
                <td><Badge aktif={k.aktif} /></td>
                <td className="admin-table td--right">
                  <button
                    onClick={() => handleToggle(k.id, k.aktif)}
                    className={`admin-toggle-btn ${k.aktif ? 'admin-toggle-btn--deactivate' : 'admin-toggle-btn--activate'}`}
                  >
                    {k.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : seciliFirma ? (
        <div className="admin-panel__loading">Bu firmaya ait kullanıcı yok.</div>
      ) : null}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni Kullanıcı Ekle"
        size="small"
      >
        <div className="admin-form__group">
          <label className="admin-form__label">Ad Soyad</label>
          <input
            className="admin-form__input"
            value={adSoyad}
            onChange={e => setAdSoyad(e.target.value)}
            placeholder="Ali Yılmaz"
          />
        </div>
        <div className="admin-form__group">
          <label className="admin-form__label">Telefon</label>
          <input
            type="tel"
            className="admin-form__input"
            value={telefon}
            onChange={e => setTelefon(e.target.value)}
            placeholder="05xx xxx xx xx"
          />
        </div>
        <div className="admin-form__group admin-form__group--last">
          <label className="admin-form__label">Rol</label>
          <select
            className="admin-form__input"
            value={rol}
            onChange={e => setRol(e.target.value)}
          >
            <option value="kullanici">Kullanıcı (Mümessil)</option>
            <option value="yonetici">Yönetici</option>
            {isAdmin && <option value="admin">Admin</option>}
          </select>
        </div>
        {msg && <div className="admin-form__error">{msg}</div>}
        <div className="admin-form__actions">
          <Button variant="ghost" size="small" onClick={() => setModalOpen(false)}>İptal</Button>
          <Button variant="primary" size="small" onClick={handleEkle} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
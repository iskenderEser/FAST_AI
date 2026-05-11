'use client';

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

function Badge({ aktif }) {
  return (
    <span className={`admin-badge ${aktif ? 'admin-badge--active' : 'admin-badge--passive'}`}>
      {aktif ? 'Aktif' : 'Pasif'}
    </span>
  );
}

export default function Firmalar() {
  const [firmalar, setFirmalar]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [firmaKodu, setFirmaKodu] = useState('');
  const [firmaAdi, setFirmaAdi]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');

  async function loadFirmalar() {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/firms');
      const data = await res.json();
      if (data.success) setFirmalar(data.data);
    } catch (e) {
      setMsg('❌ Yüklenemedi');
    }
    setLoading(false);
  }

  useEffect(() => { loadFirmalar(); }, []);

  async function handleEkle() {
    if (!firmaKodu.trim() || !firmaAdi.trim()) return setMsg('Tüm alanları doldurun.');
    setSaving(true);
    try {
      const res  = await fetch('/api/admin/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firma_kodu: firmaKodu.trim(), firma_adi: firmaAdi.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✅ Firma eklendi.');
        setFirmaKodu('');
        setFirmaAdi('');
        setModalOpen(false);
        loadFirmalar();
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
      await fetch('/api/admin/firms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aktif: !aktif })
      });
      loadFirmalar();
    } catch (e) {}
  }

  return (
    <div>
      <div className="admin-panel__toolbar">
        <span className="admin-panel__count">{firmalar.length} firma kayıtlı</span>
        <Button variant="primary" size="small" onClick={() => { setModalOpen(true); setMsg(''); }}>
          + Firma Ekle
        </Button>
      </div>

      {msg && <div className="admin-panel__msg">{msg}</div>}

      {loading ? (
        <div className="admin-panel__loading">Yükleniyor...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Firma Kodu</th>
              <th>Firma Adı</th>
              <th>Durum</th>
              <th className="admin-table th--right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {firmalar.map(f => (
              <tr key={f.id}>
                <td className="admin-table td--bold">{f.firma_kodu}</td>
                <td>{f.firma_adi}</td>
                <td><Badge aktif={f.aktif} /></td>
                <td className="admin-table td--right">
                  <button
                    onClick={() => handleToggle(f.id, f.aktif)}
                    className={`admin-toggle-btn ${f.aktif ? 'admin-toggle-btn--deactivate' : 'admin-toggle-btn--activate'}`}
                  >
                    {f.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni Firma Ekle"
        size="small"
      >
        <div className="admin-form__group">
          <label className="admin-form__label">Firma Kodu</label>
          <input
            className="admin-form__input"
            value={firmaKodu}
            onChange={e => setFirmaKodu(e.target.value)}
            placeholder="MILL, ABC..."
          />
        </div>
        <div className="admin-form__group admin-form__group--last">
          <label className="admin-form__label">Firma Adı</label>
          <input
            className="admin-form__input"
            value={firmaAdi}
            onChange={e => setFirmaAdi(e.target.value)}
            placeholder="Mill Danışmanlık..."
          />
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
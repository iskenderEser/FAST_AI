'use client';

import { useState, useEffect } from 'react';

function Badge({ aktif }) {
  return (
    <span style={{
      fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
      background: aktif ? '#eaf3de' : '#fdecea',
      color:      aktif ? '#3b6d11' : '#c0392b',
      fontWeight: 500
    }}>
      {aktif ? 'Aktif' : 'Pasif'}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid #eee', width: '100%', maxWidth: '460px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '20px',
            cursor: 'pointer', color: '#666', lineHeight: 1
          }}>×</button>
        </div>
        <div style={{ padding: '18px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#888' }}>{firmalar.length} firma kayıtlı</div>
        <button
          onClick={() => { setModalOpen(true); setMsg(''); }}
          style={{
            padding: '7px 14px', borderRadius: '7px', border: 'none',
            background: '#003cbb', color: 'white', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500
          }}>
          + Firma Ekle
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: '7px', background: '#f1f3f8',
          fontSize: '12px', marginBottom: '12px', color: '#333'
        }}>{msg}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yükleniyor...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Firma Kodu</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Firma Adı</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Durum</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: '#555', fontWeight: 600 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {firmalar.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{f.firma_kodu}</td>
                <td style={{ padding: '10px 12px' }}>{f.firma_adi}</td>
                <td style={{ padding: '10px 12px' }}><Badge aktif={f.aktif} /></td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleToggle(f.id, f.aktif)}
                    style={{
                      padding: '5px 12px', borderRadius: '7px', border: 'none',
                      background: f.aktif ? '#fdecea' : '#eaf3de',
                      color: f.aktif ? '#c0392b' : '#3b6d11',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 500
                    }}>
                    {f.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Modal title="Yeni Firma Ekle" onClose={() => setModalOpen(false)}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Firma Kodu</label>
            <input
              value={firmaKodu}
              onChange={e => setFirmaKodu(e.target.value)}
              placeholder="MILL, ABC..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Firma Adı</label>
            <input
              value={firmaAdi}
              onChange={e => setFirmaAdi(e.target.value)}
              placeholder="Mill Danışmanlık..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          {msg && <div style={{ color: '#c0392b', fontSize: '12px', marginBottom: '10px' }}>{msg}</div>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '12px' }}>
              İptal
            </button>
            <button
              onClick={handleEkle}
              disabled={saving}
              style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', background: '#003cbb', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
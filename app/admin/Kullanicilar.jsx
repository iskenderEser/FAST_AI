'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div style={{
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
      {/* Admin: Firma seç / Yönetici: firma sabit */}
      {isAdmin && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Firma Seçiniz</label>
          <select
            value={seciliFirma}
            onChange={e => handleFirmaChange(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px' }}>
            <option value="">Seçiniz...</option>
            {firmalar.map(f => (
              <option key={f.id} value={f.id}>{f.firma_adi}</option>
            ))}
          </select>
        </div>
      )}

      {seciliFirma && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#888' }}>{kullanicilar.length} kullanıcı</div>
          <button
            onClick={() => { setModalOpen(true); setMsg(''); }}
            style={{
              padding: '7px 14px', borderRadius: '7px', border: 'none',
              background: '#003cbb', color: 'white', cursor: 'pointer',
              fontSize: '12px', fontWeight: 500
            }}>
            + Kullanıcı Ekle
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yükleniyor...</div>
      ) : kullanicilar.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Ad Soyad</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Tel (son 4)</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Rol</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Durum</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: '#555', fontWeight: 600 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {kullanicilar.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{k.ad_soyad}</td>
                <td style={{ padding: '10px 12px', color: '#888' }}>****{k.telefon_son4}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                    background: k.rol === 'admin' ? '#fdecea' : k.rol === 'yonetici' ? '#fff3e0' : '#f1f3f8',
                    color: k.rol === 'admin' ? '#c0392b' : k.rol === 'yonetici' ? '#e65100' : '#555',
                    fontWeight: 500
                  }}>
                    {k.rol}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}><Badge aktif={k.aktif} /></td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleToggle(k.id, k.aktif)}
                    style={{
                      padding: '5px 12px', borderRadius: '7px', border: 'none',
                      background: k.aktif ? '#fdecea' : '#eaf3de',
                      color: k.aktif ? '#c0392b' : '#3b6d11',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 500
                    }}>
                    {k.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : seciliFirma ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Bu firmaya ait kullanıcı yok.</div>
      ) : null}

      {modalOpen && (
        <Modal title="Yeni Kullanıcı Ekle" onClose={() => setModalOpen(false)}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Ad Soyad</label>
            <input
              value={adSoyad}
              onChange={e => setAdSoyad(e.target.value)}
              placeholder="Ali Yılmaz"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Telefon</label>
            <input
              type="tel"
              value={telefon}
              onChange={e => setTelefon(e.target.value)}
              placeholder="05xx xxx xx xx"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Rol</label>
            <select
              value={rol}
              onChange={e => setRol(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px' }}>
              <option value="kullanici">Kullanıcı (Mümessil)</option>
              <option value="yonetici">Yönetici</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
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
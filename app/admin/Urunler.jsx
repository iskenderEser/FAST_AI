'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid #eee', width: '100%', maxWidth: '650px',
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

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function Urunler() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.rol === 'admin';

  const [urunler, setUrunler]           = useState([]);
  const [atcKodlari, setAtcKodlari]     = useState([]);
  const [firmalar, setFirmalar]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editUrun, setEditUrun]         = useState(null);
  const [msg, setMsg]                   = useState('');

  // Form alanları
  const [seciliFirmaId, setSeciliFirmaId] = useState('');
  const [urunAdi, setUrunAdi]           = useState('');
  const [atcKodu, setAtcKodu]           = useState('');
  const [atcOneri, setAtcOneri]         = useState('');
  const [atcYukleniyor, setAtcYukleniyor] = useState(false);
  const [kullanim, setKullanim]         = useState('');
  const [pozoloji, setPozoloji]         = useState('');
  const [ozellikler, setOzellikler]     = useState('');
  const [saving, setSaving]             = useState(false);

  // Editable toggles
  const [kullanımEditable, setKullanımEditable]     = useState(false);
  const [polojiEditable, setPolojiEditable]         = useState(false);
  const [ozelliklerEditable, setOzelliklerEditable] = useState(false);

  useEffect(() => {
    loadUrunler();
    loadAtcKodlari();
    if (isAdmin) loadFirmalar();
  }, []);

  async function loadUrunler() {
    setLoading(true);
    try {
      const url = isAdmin ? '/api/urun/list' : `/api/urun/list?firma_id=${currentUser?.firma_id}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) setUrunler(data.urunler);
    } catch (e) {}
    setLoading(false);
  }

  async function loadAtcKodlari() {
    try {
      const res  = await fetch('/api/admin/atc-kodlari');
      const data = await res.json();
      if (data.success) setAtcKodlari(data.data);
    } catch (e) {}
  }

  async function loadFirmalar() {
    try {
      const res  = await fetch('/api/admin/firms');
      const data = await res.json();
      if (data.success) setFirmalar(data.data.filter(f => f.aktif));
    } catch (e) {}
  }

  async function handleAtcOner() {
    if (!urunAdi.trim()) return setAtcOneri('⚠️ Önce ürün adını girin.');
    if (!ozellikler.trim()) return setAtcOneri('⚠️ Önce ürün özelliklerini girin.');
    setAtcYukleniyor(true);
    setAtcOneri('');
    try {
      const res  = await fetch('/api/admin/atc-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urun_adi: urunAdi, ozellikler })
      });
      const data = await res.json();
      if (data.success) {
        setAtcOneri(data.oneri);
        if (data.atc_kodu) setAtcKodu(data.atc_kodu);
      } else {
        setAtcOneri('❌ Öneri alınamadı.');
      }
    } catch (e) {
      setAtcOneri('❌ Hata oluştu.');
    }
    setAtcYukleniyor(false);
  }

  async function handleKaydet() {
    const firmaId = isAdmin ? seciliFirmaId : currentUser?.firma_id;
    if (!firmaId) return setMsg('⚠️ Firma seçiniz.');
    if (!urunAdi.trim() || !atcKodu) return setMsg('⚠️ Ürün adı ve ATC kodu zorunlu.');
    setSaving(true);
    try {
      const body = {
        firma_id:                firmaId,
        urun_adi:                urunAdi.trim(),
        atc_kodu:                atcKodu,
        kullanim_sekli:          kullanim,
        pozoloji:                pozoloji.split('\n').map(s => s.trim()).filter(Boolean),
        ozellikler:              ozellikler.split('\n').map(s => s.trim()).filter(Boolean),
        kullanim_sekli_editable: kullanımEditable,
        pozoloji_editable:       polojiEditable,
        ozellikler_editable:     ozelliklerEditable,
        aktif:                   true,
      };

      const url    = editUrun ? `/api/admin/urunler?id=${editUrun.id}` : '/api/admin/urunler';
      const method = editUrun ? 'PATCH' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✅ Ürün kaydedildi.');
        setModalOpen(false);
        resetForm();
        loadUrunler();
      } else {
        setMsg('❌ ' + data.error);
      }
    } catch (e) {
      setMsg('❌ Hata oluştu.');
    }
    setSaving(false);
  }

  function resetForm() {
    setSeciliFirmaId('');
    setUrunAdi(''); setAtcKodu(''); setAtcOneri('');
    setKullanim(''); setPozoloji(''); setOzellikler('');
    setKullanımEditable(false); setPolojiEditable(false); setOzelliklerEditable(false);
    setEditUrun(null); setMsg('');
  }

  async function handleDuzenle(u) {
    try {
      const res  = await fetch(`/api/urun/detail?id=${u.id}`);
      const data = await res.json();
      if (data.success) {
        const d = data.urun;
        setEditUrun(d);
        setSeciliFirmaId(d.firma_id || '');
        setUrunAdi(d.urun_adi);
        setAtcKodu(d.atc_kodu);
        setKullanim(d.kullanim_sekli || '');
        setPozoloji((d.pozoloji || []).join('\n'));
        setOzellikler((d.ozellikler || []).join('\n'));
        setKullanımEditable(d.kullanim_sekli_editable || false);
        setPolojiEditable(d.pozoloji_editable || false);
        setOzelliklerEditable(d.ozellikler_editable || false);
        setMsg('');
        setModalOpen(true);
      }
    } catch (e) {
      setMsg('❌ Ürün detayı yüklenemedi.');
    }
  }

  // Admin için tablo başlığında firma kolonu
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#888' }}>{urunler.length} ürün kayıtlı</div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          style={{
            padding: '7px 14px', borderRadius: '7px', border: 'none',
            background: '#003cbb', color: 'white', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500
          }}>
          + Ürün Ekle
        </button>
      </div>

      {msg && (
        <div style={{ padding: '8px 12px', borderRadius: '7px', background: '#f1f3f8', fontSize: '12px', marginBottom: '12px' }}>{msg}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yükleniyor...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Ürün Adı</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>ATC Kodu</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontWeight: 600 }}>Kullanım</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: '#555', fontWeight: 600 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {urunler.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{u.urun_adi}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                    background: '#eef2ff', color: '#003cbb', fontWeight: 600
                  }}>{u.atc_kodu}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#888' }}>{u.kullanim_sekli || '—'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDuzenle(u)}
                    style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '12px' }}>
                    Düzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Modal title={editUrun ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'} onClose={() => { setModalOpen(false); resetForm(); }}>

          {/* Admin: Firma Seç */}
          {isAdmin && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Firma *</label>
              <select
                value={seciliFirmaId}
                onChange={e => setSeciliFirmaId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px' }}>
                <option value="">Seçiniz...</option>
                {firmalar.map(f => (
                  <option key={f.id} value={f.id}>{f.firma_adi}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ürün Adı */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Ürün Adı *</label>
            <input
              value={urunAdi}
              onChange={e => setUrunAdi(e.target.value)}
              placeholder="Zoramisin, Fluzon..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Özellikler */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Özellikler (her satır bir özellik)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <textarea
                value={ozellikler}
                onChange={e => setOzellikler(e.target.value)}
                placeholder={'Hızlı etki\nUzun salınım\nYan etki profili...'}
                rows={3}
                style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', resize: 'vertical' }}
              />
              <div style={{ marginTop: '4px' }}>
                <Toggle label="Düzenlenebilir" checked={ozelliklerEditable} onChange={setOzelliklerEditable} />
              </div>
            </div>
          </div>

          {/* ATC Kodu + AI Öneri */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>ATC Kodu (2. Seviye) *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={atcKodu}
                onChange={e => setAtcKodu(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px' }}>
                <option value="">Seçiniz...</option>
                {atcKodlari.map(a => (
                  <option key={a.kod} value={a.kod}>{a.kod} — {a.aciklama}</option>
                ))}
              </select>
              <button
                onClick={handleAtcOner}
                disabled={atcYukleniyor}
                style={{
                  padding: '8px 12px', borderRadius: '7px', border: '1px solid #ddd',
                  background: 'white', cursor: atcYukleniyor ? 'not-allowed' : 'pointer',
                  fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0, opacity: atcYukleniyor ? 0.6 : 1
                }}>
                {atcYukleniyor ? '⏳' : '🤖 AI Öner'}
              </button>
            </div>
            {atcOneri && (
              <div style={{
                marginTop: '6px', padding: '8px 10px', borderRadius: '7px',
                background: '#eef2ff', border: '1px solid #c7d7f9',
                fontSize: '12px', color: '#003cbb'
              }}>
                {atcOneri}
              </div>
            )}
          </div>

          {/* Farmasötik Form */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Farmasötik Form</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={kullanim}
                onChange={e => setKullanim(e.target.value)}
                placeholder="Oral, Topikal..."
                style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px' }}
              />
              <Toggle label="Düzenlenebilir" checked={kullanımEditable} onChange={setKullanımEditable} />
            </div>
          </div>

          {/* Pozoloji */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Pozoloji (her satır bir seçenek)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <textarea
                value={pozoloji}
                onChange={e => setPozoloji(e.target.value)}
                placeholder={'1x1\n2x1\n3x1'}
                rows={3}
                style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', resize: 'vertical' }}
              />
              <div style={{ marginTop: '4px' }}>
                <Toggle label="Düzenlenebilir" checked={polojiEditable} onChange={setPolojiEditable} />
              </div>
            </div>
          </div>

          {msg && <div style={{ color: '#c0392b', fontSize: '12px', marginBottom: '10px' }}>{msg}</div>}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setModalOpen(false); resetForm(); }}
              style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '12px' }}>
              İptal
            </button>
            <button
              onClick={handleKaydet}
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
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

function Toggle({ label, checked, onChange }) {
  return (
    <label className="admin-form__toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function Urunler() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.rol === 'admin';

  const [urunler, setUrunler]               = useState([]);
  const [atcKodlari, setAtcKodlari]         = useState([]);
  const [firmalar, setFirmalar]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [modalOpen, setModalOpen]           = useState(false);
  const [editUrun, setEditUrun]             = useState(null);
  const [msg, setMsg]                       = useState('');

  const [seciliFirmaId, setSeciliFirmaId]   = useState('');
  const [urunAdi, setUrunAdi]               = useState('');
  const [atcKodu, setAtcKodu]               = useState('');
  const [atcOneri, setAtcOneri]             = useState('');
  const [atcYukleniyor, setAtcYukleniyor]   = useState(false);
  const [kullanim, setKullanim]             = useState('');
  const [pozoloji, setPozoloji]             = useState('');
  const [ozellikler, setOzellikler]         = useState('');
  const [saving, setSaving]                 = useState(false);

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

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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

  return (
    <div>
      <div className="admin-panel__toolbar">
        <span className="admin-panel__count">{urunler.length} ürün kayıtlı</span>
        <Button variant="primary" size="small" onClick={() => { resetForm(); setModalOpen(true); }}>
          + Ürün Ekle
        </Button>
      </div>

      {msg && <div className="admin-panel__msg">{msg}</div>}

      {loading ? (
        <div className="admin-panel__loading">Yükleniyor...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ürün Adı</th>
              <th>ATC Kodu</th>
              <th>Kullanım</th>
              <th className="admin-table th--right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {urunler.map(u => (
              <tr key={u.id}>
                <td className="admin-table td--bold">{u.urun_adi}</td>
                <td><span className="admin-badge admin-badge--atc">{u.atc_kodu}</span></td>
                <td className="admin-table td--muted">{u.kullanim_sekli || '—'}</td>
                <td className="admin-table td--right">
                  <Button variant="ghost" size="small" onClick={() => handleDuzenle(u)}>Düzenle</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editUrun ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        size="default"
      >
        {isAdmin && (
          <div className="admin-form__group">
            <label className="admin-form__label">Firma *</label>
            <select className="admin-form__input" value={seciliFirmaId} onChange={e => setSeciliFirmaId(e.target.value)}>
              <option value="">Seçiniz...</option>
              {firmalar.map(f => <option key={f.id} value={f.id}>{f.firma_adi}</option>)}
            </select>
          </div>
        )}

        <div className="admin-form__group">
          <label className="admin-form__label">Ürün Adı *</label>
          <input className="admin-form__input" value={urunAdi} onChange={e => setUrunAdi(e.target.value)} placeholder="Zoramisin, Fluzon..." />
        </div>

        <div className="admin-form__group">
          <label className="admin-form__label">Özellikler (her satır bir özellik)</label>
          <div className="admin-form__row">
            <textarea
              className="admin-form__textarea admin-form__flex"
              value={ozellikler}
              onChange={e => setOzellikler(e.target.value)}
              placeholder={'Hızlı etki\nUzun salınım\nYan etki profili...'}
              rows={3}
            />
            <Toggle label="Düzenlenebilir" checked={ozelliklerEditable} onChange={setOzelliklerEditable} />
          </div>
        </div>

        <div className="admin-form__group">
          <label className="admin-form__label">ATC Kodu (2. Seviye) *</label>
          <div className="admin-form__row admin-form__row--center">
            <select className="admin-form__input admin-form__flex" value={atcKodu} onChange={e => setAtcKodu(e.target.value)}>
              <option value="">Seçiniz...</option>
              {atcKodlari.map(a => <option key={a.kod} value={a.kod}>{a.kod} — {a.aciklama}</option>)}
            </select>
            <Button variant="ghost" size="small" onClick={handleAtcOner} disabled={atcYukleniyor}>
              {atcYukleniyor ? '⏳' : '🤖 AI Öner'}
            </Button>
          </div>
          {atcOneri && <div className="admin-atc-oneri">{atcOneri}</div>}
        </div>

        <div className="admin-form__group">
          <label className="admin-form__label">Farmasötik Form</label>
          <div className="admin-form__row admin-form__row--center">
            <input className="admin-form__input admin-form__flex" value={kullanim} onChange={e => setKullanim(e.target.value)} placeholder="Oral, Topikal..." />
            <Toggle label="Düzenlenebilir" checked={kullanımEditable} onChange={setKullanımEditable} />
          </div>
        </div>

        <div className="admin-form__group admin-form__group--last">
          <label className="admin-form__label">Pozoloji (her satır bir seçenek)</label>
          <div className="admin-form__row">
            <textarea
              className="admin-form__textarea admin-form__flex"
              value={pozoloji}
              onChange={e => setPozoloji(e.target.value)}
              placeholder={'1x1\n2x1\n3x1'}
              rows={3}
            />
            <Toggle label="Düzenlenebilir" checked={polojiEditable} onChange={setPolojiEditable} />
          </div>
        </div>

        {msg && <div className="admin-form__error">{msg}</div>}

        <div className="admin-form__actions">
          <Button variant="ghost" size="small" onClick={() => { setModalOpen(false); resetForm(); }}>İptal</Button>
          <Button variant="primary" size="small" onClick={handleKaydet} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
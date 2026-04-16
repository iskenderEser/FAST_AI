'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFastCPR } from '../../context/FastCPRContext';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.vfs;

const STYLES = [
  { id: 'activist',   title: 'Aktivist (Değişimci)',          badgeIcon: '🔥', badgeText: 'Yeni, deneyimsel, hızlı' },
  { id: 'reflector',  title: 'Reflektör (Dikkatli Gözlemci)', badgeIcon: '👁️', badgeText: 'Önce gözlem, sonra karar' },
  { id: 'theorist',   title: 'Teorist (Sistematik Düşünen)',   badgeIcon: '📐', badgeText: 'Kılavuz, mekanizma, sebep-sonuç' },
  { id: 'pragmatist', title: 'Pragmatist (Uygulamacı)',        badgeIcon: '🛠️', badgeText: 'Pratik, uygulanabilir, "işe yarar mı?"' }
];

const NEDENLER = [
  { key: 'cpr_stile_uygun_degil', label: 'CPR stile uygun değildi' },
  { key: 'cpr_cok_uzun',          label: 'CPR çok uzundu' },
  { key: 'cpr_cok_kisa',          label: 'CPR çok kısaydı' },
  { key: 'cpr_klise',             label: 'CPR klişe geldi, özgün değildi' },
  { key: 'hasta_sesi_yansimaadi', label: "Hasta sesi CPR'a yansımadı" },
  { key: 'yanlis_urun',           label: 'Yanlış ürün seçtim' },
  { key: 'yanlis_claim',          label: 'Yanlış claim seçtim' },
  { key: 'yanlis_stil',           label: 'Yanlış stil seçtim' },
  { key: 'rakip_hatali',          label: 'Rakip bilgisini hatalı girdim' },
];

const STYLE_LABELS = {
  activist:   'DEĞİŞİMCİ (Activist)',
  reflector:  'YANSITICI (Reflector)',
  theorist:   'KURAMCI (Theorist)',
  pragmatist: 'UYGULAYICI (Pragmatist)',
};

function buildDocDefinition(pdf) {
  const stilCprlar = pdf.stil_cprlar || [];
  const content = [
    { text: 'FAST CPR KOÇU', style: 'header' },
    { text: `Tarih: ${pdf.tarih || new Date().toLocaleString('tr-TR')}`, style: 'meta' },
    { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 8, 0, 12] },
    { text: 'Ürün Bilgileri', style: 'sectionTitle' },
    { text: `Ürün: ${pdf.urun || '—'}`, style: 'field' },
    { text: `Tedavi Alanı: ${pdf.tedavi_alani || '—'}`, style: 'field' },
    { text: `Kullanım Şekli: ${pdf.kullanim_sekli || '—'}`, style: 'field' },
    { text: `Pozoloji: ${pdf.pozoloji || '—'}`, style: 'field' },
    { text: '', margin: [0, 0, 0, 8] },
    { text: 'Hekim Profili', style: 'sectionTitle' },
    { text: `Öğrenme Stili: ${pdf.ogrenme_stili || '—'}`, style: 'field' },
    { text: '', margin: [0, 0, 0, 8] },
    { text: 'Hasta Şikayeti (Claim)', style: 'sectionTitle' },
    { text: pdf.claim || '—', style: 'cprText' },
    { text: '', margin: [0, 0, 0, 8] },
  ];
  if (stilCprlar.length > 0) {
    content.push({ text: "Stil Bazlı CPR'lar", style: 'sectionTitle' });
    stilCprlar.forEach(item => {
      content.push({ text: item.stil, style: 'stilTitle' });
      content.push({ text: item.cpr || '—', style: 'cprText' });
      content.push({ text: '', margin: [0, 0, 0, 8] });
    });
  }
  return {
    content,
    styles: {
      header:       { fontSize: 18, bold: true, color: '#e30a17', margin: [0, 0, 0, 4] },
      meta:         { fontSize: 10, color: '#888888' },
      sectionTitle: { fontSize: 12, bold: true, color: '#003cbb', margin: [0, 0, 0, 4] },
      stilTitle:    { fontSize: 11, bold: true, color: '#374151', margin: [0, 4, 0, 2] },
      field:        { fontSize: 11, color: '#333333', margin: [0, 0, 0, 2] },
      cprText:      { fontSize: 11, color: '#1a1a1a', lineHeight: 1.5, margin: [0, 0, 0, 4] },
    },
    defaultStyle: { font: 'Roboto' },
    pageMargins: [40, 40, 40, 40],
  };
}

export default function Kart5StilCPR() {
  const { currentUser } = useAuth();
  const {
    learningStyles,
    selectedUrun,
    selectedClaimText,
    selectedProblem,
    usageType,
    posology,
    ozellikOptions,
    selectedRakip,
    selectedRakipEtken,
    selectedRakipDoz,
    cprTexts,
    setCprTexts,
    feedbackId,
    setFeedbackId,
  } = useFastCPR();

  const [loading, setLoading]   = useState({ activist: false, reflector: false, theorist: false, pragmatist: false });
  const [btnState, setBtnState] = useState({ activist: 'idle', reflector: 'idle', theorist: 'idle', pragmatist: 'idle' });
  const [saving, setSaving]     = useState(false);

  // Modal state
  const [modal, setModal]                   = useState({ open: false, styleId: null });
  const [seciliNedenler, setSeciliNedenler] = useState([]);
  const [modalLoading, setModalLoading]     = useState(false);

  // CPR üretilip üretilmediğini takip et
  const cprUretildi = useRef(false);
  // Manuel düzenleme takibi
  const manuelDuzenlendi = useRef({});

  const textareaRefs = useRef({});

  const kartAcik = selectedUrun && selectedClaimText && learningStyles.length > 0;

  const visibleStyles = learningStyles.length > 0
    ? STYLES.filter(s => learningStyles.includes(s.id))
    : STYLES;

  function autoResize(styleId) {
    const el = textareaRefs.current[styleId];
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }

  useEffect(() => {
    Object.keys(cprTexts).forEach(id => autoResize(id));
  }, [cprTexts]);

  // Tetikleyici: modal aç ve feedback güncelle
  const tetikle = useCallback((styleId) => {
    const herhangiCpr = Object.values(cprTexts).some(t => t && t.trim() !== '');
    if (!herhangiCpr || !feedbackId) return;
    setSeciliNedenler([]);
    setModal({ open: true, styleId });
  }, [cprTexts, feedbackId]);

  // Tetikleyici 2: Ürün değişince
  const prevUrun = useRef(selectedUrun?.id);
  useEffect(() => {
    if (prevUrun.current && prevUrun.current !== selectedUrun?.id) {
      tetikle(null);
    }
    prevUrun.current = selectedUrun?.id;
  }, [selectedUrun?.id, tetikle]);

  // Tetikleyici 3: Claim değişince
  const prevClaim = useRef(selectedClaimText);
  useEffect(() => {
    if (prevClaim.current && prevClaim.current !== selectedClaimText) {
      tetikle(null);
    }
    prevClaim.current = selectedClaimText;
  }, [selectedClaimText, tetikle]);

  // Tetikleyici 4: Stil değişince
  const prevStyles = useRef(JSON.stringify(learningStyles));
  useEffect(() => {
    const yeni = JSON.stringify(learningStyles);
    if (prevStyles.current && prevStyles.current !== yeni) {
      tetikle(null);
    }
    prevStyles.current = yeni;
  }, [learningStyles, tetikle]);

  // Tetikleyici 5: Rakip bilgisi değişince
  const prevRakip = useRef(selectedRakip);
  useEffect(() => {
    if (prevRakip.current && prevRakip.current !== selectedRakip) {
      tetikle(null);
    }
    prevRakip.current = selectedRakip;
  }, [selectedRakip, tetikle]);

  async function handleConvert(styleId) {
    if (!kartAcik) {
      alert('⚠️ Önce ürün, hasta şikayeti ve öğrenme stili seçmelisiniz!');
      return;
    }

    // Tetikleyici 1: CPR üretilmişken tekrar CPR Üret'e basılması
    if (cprUretildi.current) {
      tetikle(styleId);
    }

    setLoading(prev  => ({ ...prev, [styleId]: true }));
    setBtnState(prev => ({ ...prev, [styleId]: 'loading' }));
    try {
      const response = await fetch('/api/cpr/convert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          kullanici_id:   currentUser?.kullanici_id,
          firma_id:       currentUser?.firma_id,
          urun_id:        selectedUrun?.id,
          stil:           styleId,
          urun:           selectedUrun.urun_adi,
          ozellikler:     ozellikOptions,
          claim:          selectedClaimText,
          problem:        selectedProblem,
          kullanim_sekli: usageType,
          pozoloji:       posology,
          rakip:          selectedRakip,
          rakip_etken:    selectedRakipEtken,
          rakip_doz:      selectedRakipDoz,
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setCprTexts(prev => ({ ...prev, [styleId]: data.cpr }));
      setFeedbackId(data.feedback_id ?? null);
      cprUretildi.current = true;
      manuelDuzenlendi.current[styleId] = false;
      setBtnState(prev => ({ ...prev, [styleId]: 'success' }));
      setTimeout(() => setBtnState(prev => ({ ...prev, [styleId]: 'idle' })), 2000);
    } catch (err) {
      console.error('Dönüşüm hatası:', err);
      setBtnState(prev => ({ ...prev, [styleId]: 'error' }));
      setTimeout(() => setBtnState(prev => ({ ...prev, [styleId]: 'idle' })), 3000);
    } finally {
      setLoading(prev => ({ ...prev, [styleId]: false }));
    }
  }

  // PDF indir ve arşivle
  async function handleSaveAndDownload(styleId) {
    if (!selectedUrun) {
      alert('⚠️ Önce bir ürün seçiniz.');
      return;
    }
    const hasCpr = learningStyles.some(id => cprTexts[id]);
    if (!hasCpr) {
      alert('⚠️ En az bir CPR üretilmelidir.');
      return;
    }

    const stilCprlar = learningStyles
      .filter(id => cprTexts[id])
      .map(id => ({ stil: STYLE_LABELS[id] || id, cpr: cprTexts[id] }));

    const pdfData = {
      tarih:          new Date().toLocaleString('tr-TR'),
      urun:           selectedUrun?.urun_adi || '',
      tedavi_alani:   selectedUrun?.atc_kodu || '',
      kullanim_sekli: usageType || '',
      pozoloji:       posology || '',
      claim:          selectedClaimText || '',
      ogrenme_stili:  learningStyles.map(id => STYLE_LABELS[id] || id).join(', '),
      stil_cprlar:    stilCprlar,
    };

    // PDF indir
    const docDef  = buildDocDefinition(pdfData);
    const fileName = `FAST_CPR_${pdfData.urun || 'Rapor'}.pdf`;
    pdfMake.createPdf(docDef).download(fileName);

    // Arşive kaydet
    if (!currentUser?.kullanici_id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pdf/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          kullanici_id: currentUser.kullanici_id,
          feedback_id:  feedbackId ?? null,
          ...pdfData,
        })
      });
      const result = await res.json();
      if (result.success) {
        showNotification('✅ PDF indirildi ve arşive eklendi!', 'success');
        cprUretildi.current = false;
        manuelDuzenlendi.current = {};
      }
    } catch (err) {
      console.error('PDF kaydedilemedi:', err);
    } finally {
      setSaving(false);
    }
  }

  function showNotification(text, type) {
    const n = document.createElement('div');
    n.style.cssText = `position:fixed;bottom:20px;right:20px;z-index:10000;
      padding:12px 18px;border-radius:8px;font-size:13px;font-weight:500;
      background:${type === 'success' ? '#f0fdf4' : '#fef2f2'};
      color:${type === 'success' ? '#166534' : '#b91c1c'};
      border:1px solid ${type === 'success' ? '#86efac' : '#fecaca'};
      box-shadow:0 4px 12px rgba(0,0,0,0.1);`;
    n.textContent = text;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
  }

  // Neden toggle — max 3
  function toggleNeden(key) {
    setSeciliNedenler(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  }

  // Modal gönder
  async function handleModalGonder() {
    if (seciliNedenler.length === 0) return;
    if (!feedbackId) return;
    setModalLoading(true);
    try {
      await fetch('/api/cpr/feedback-update', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ feedback_id: feedbackId, nedenler: seciliNedenler })
      });
    } catch (err) {
      console.error('Feedback güncelleme hatası:', err);
    } finally {
      setModalLoading(false);
      setModal({ open: false, styleId: null });
      setSeciliNedenler([]);
    }
  }

  function getBtnLabel(styleId) {
    switch (btnState[styleId]) {
      case 'loading': return '⏳ Üretiliyor...';
      case 'success': return '✅ Üretildi!';
      case 'error':   return '❌ Hata!';
      default:        return 'CPR Üret';
    }
  }

  function getBtnStyle(styleId) {
    switch (btnState[styleId]) {
      case 'success': return { background: '#059669' };
      case 'error':   return { background: '#dc2626' };
      default:        return {};
    }
  }

  return (
    <>
      <details className="acc" id="acc_styles">
        <summary>
          <div className="accTitle">
            <b>
              <span className="arrow">▶</span> Stil Bazlı CPR{' '}
              <span style={{ fontWeight: 300, fontStyle: 'italic' }}>(öğrenme stiline uygun)</span>
            </b>
          </div>
          <div className="accMeta">
            <span style={{ fontSize: '11px', color: '#888' }}>{visibleStyles.length} stil</span>
          </div>
        </summary>

        <div className="accBody">
          {!kartAcik && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px',
              background: '#fff3cd', color: '#856404',
              fontSize: '13px', marginBottom: '16px'
            }}>
              ⚠ Önce ürün, hasta şikayeti ve öğrenme stili seçiniz.
            </div>
          )}
          <div className="styleGrid" id="styleGrid">
            {visibleStyles.map(style => (
              <div key={style.id} className="styleCard" data-style={style.id} id={`${style.id}Card`}>
                <div className="styleHeader">
                  <div>
                    <div className="styleTitle">{style.title}</div>
                    <div className={`styleBadge ${style.id}`}>
                      <span className="icon">{style.badgeIcon}</span>
                      <span>{style.badgeText}</span>
                    </div>
                  </div>
                  <button
                    className="btn small ghost"
                    onClick={() => handleConvert(style.id)}
                    disabled={loading[style.id] || !kartAcik}
                    style={getBtnStyle(style.id)}>
                    {getBtnLabel(style.id)}
                  </button>
                </div>

                <div className="textarea-wrapper">
                  <textarea
                    ref={el => textareaRefs.current[style.id] = el}
                    className="styled-cpr-area"
                    data-style={style.id}
                    id={`${style.id}_cpr`}
                    value={cprTexts[style.id]}
                    onChange={e => {
                      // Tetikleyici 6: Manuel düzenleme
                      if (cprUretildi.current && !manuelDuzenlendi.current[style.id]) {
                        manuelDuzenlendi.current[style.id] = true;
                      }
                      setCprTexts(prev => ({ ...prev, [style.id]: e.target.value }));
                      autoResize(style.id);
                    }}
                    placeholder="CPR Üret butonuna basın."
                    style={{ resize: 'none', overflow: 'hidden', width: '100%' }}
                  />

                  {cprTexts[style.id] && (
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end',
                      marginTop: '8px', padding: '0 4px'
                    }}>
                      <button
                        onClick={() => handleSaveAndDownload(style.id)}
                        disabled={saving}
                        style={{
                          background: '#003cbb', border: 'none',
                          borderRadius: '6px', padding: '5px 12px',
                          fontSize: '12px', color: '#fff',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.6 : 1,
                          fontWeight: 500,
                        }}>
                        {saving ? '⏳ Kaydediliyor...' : '📄 PDF İndir & Arşivle'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* MODAL */}
      {modal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '20px',
            width: '90%', maxWidth: '420px'
          }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a1a', marginBottom: '4px' }}>
              CPR arşivlememe nedenlerini paylaşır mısınız?
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              Size uygun 1-3 sebebi işaretleyebilirsiniz.
            </div>

            {NEDENLER.map(n => {
              const secili   = seciliNedenler.includes(n.key);
              const disabled = !secili && seciliNedenler.length >= 3;
              return (
                <div
                  key={n.key}
                  onClick={() => !disabled && toggleNeden(n.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px', marginBottom: '6px',
                    border: secili ? '1px solid #185FA5' : '0.5px solid #e5e7eb',
                    background: secili ? '#E6F1FB' : '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                  }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                    border: secili ? '1.5px solid #185FA5' : '1.5px solid #d1d5db',
                    background: secili ? '#185FA5' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {secili && (
                      <div style={{
                        width: '8px', height: '8px',
                        borderBottom: '2px solid #fff', borderRight: '2px solid #fff',
                        transform: 'rotate(45deg) translate(-1px, -1px)'
                      }} />
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: secili ? '#0C447C' : '#374151' }}>
                    {n.label}
                  </span>
                </div>
              );
            })}

            <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right', marginBottom: '14px', marginTop: '2px' }}>
              {seciliNedenler.length} / 3 seçildi
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setModal({ open: false, styleId: null }); setSeciliNedenler([]); }}
                style={{
                  padding: '9px 16px', borderRadius: '8px', fontSize: '13px',
                  border: '0.5px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer'
                }}>
                Vazgeç
              </button>
              <button
                onClick={handleModalGonder}
                disabled={seciliNedenler.length === 0 || modalLoading}
                style={{
                  flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer',
                  opacity: seciliNedenler.length === 0 || modalLoading ? 0.4 : 1
                }}>
                {modalLoading ? 'Gönderiliyor...' : 'Gönder ve devam et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
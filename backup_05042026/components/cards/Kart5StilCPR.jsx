'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFastCPR } from '../../context/FastCPRContext';

const STYLES = [
  {
    id:        'activist',
    title:     'Aktivist (Değişimci)',
    badgeIcon: '🔥',
    badgeText: 'Yeni, deneyimsel, hızlı'
  },
  {
    id:        'reflector',
    title:     'Reflektör (Dikkatli Gözlemci)',
    badgeIcon: '👁️',
    badgeText: 'Önce gözlem, sonra karar'
  },
  {
    id:        'theorist',
    title:     'Teorist (Sistematik Düşünen)',
    badgeIcon: '📐',
    badgeText: 'Kılavuz, mekanizma, sebep-sonuç'
  },
  {
    id:        'pragmatist',
    title:     'Pragmatist (Uygulamacı)',
    badgeIcon: '🛠️',
    badgeText: 'Pratik, uygulanabilir, "işe yarar mı?"'
  }
];

const DISLIKE_NEDENLER = [
  { key: 'A', label: 'Kelime seçimleri yanlıştı' },
  { key: 'B', label: 'Çok uzundu' },
  { key: 'C', label: 'İfadeler karışmıştı' }
];

export default function Kart5StilCPR() {
  const { currentUser } = useAuth();
  const { learningStyles, autoCPR } = useFastCPR();

  const [cprTexts, setCprTexts]   = useState({
    activist: '', reflector: '', theorist: '', pragmatist: ''
  });
  const [promptIds, setPromptIds] = useState({
    activist: null, reflector: null, theorist: null, pragmatist: null
  });
  const [loading, setLoading]     = useState({
    activist: false, reflector: false, theorist: false, pragmatist: false
  });
  const [btnState, setBtnState]   = useState({
    activist: 'idle', reflector: 'idle', theorist: 'idle', pragmatist: 'idle'
  });
  const [feedback, setFeedback]   = useState({
    activist: null, reflector: null, theorist: null, pragmatist: null
  });
  const [modal, setModal]         = useState({ open: false, styleId: null });
  const textareaRefs              = useRef({});

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

  async function handleConvert(styleId) {
    if (!autoCPR || autoCPR.trim().length === 0) {
      alert('⚠️ Önce Temel CPR oluşturmalısınız!');
      return;
    }
    setLoading(prev  => ({ ...prev, [styleId]: true }));
    setBtnState(prev => ({ ...prev, [styleId]: 'loading' }));
    try {
      const response = await fetch('/api/cpr/convert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ temel_cpr: autoCPR, stil: styleId })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setCprTexts(prev  => ({ ...prev, [styleId]: data.cpr }));
      setPromptIds(prev => ({ ...prev, [styleId]: data.prompt_id }));
      setFeedback(prev  => ({ ...prev, [styleId]: null }));
      setBtnState(prev  => ({ ...prev, [styleId]: 'success' }));
      setTimeout(() => setBtnState(prev => ({ ...prev, [styleId]: 'idle' })), 2000);
    } catch (err) {
      console.error('Dönüşüm hatası:', err);
      setBtnState(prev => ({ ...prev, [styleId]: 'error' }));
      setTimeout(() => setBtnState(prev => ({ ...prev, [styleId]: 'idle' })), 3000);
    } finally {
      setLoading(prev => ({ ...prev, [styleId]: false }));
    }
  }

  async function handleFeedback(styleId, begeni, neden = null) {
    if (!cprTexts[styleId]) return;
    try {
      await fetch('/api/cpr/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          kullanici_id: currentUser?.id,
          prompt_id:    promptIds[styleId],
          stil:         styleId,
          temel_cpr:    autoCPR,
          uretilen_cpr: cprTexts[styleId],
          begeni,
          neden
        })
      });
      setFeedback(prev => ({ ...prev, [styleId]: begeni ? 'like' : 'dislike' }));
    } catch (err) {
      console.error('Feedback hatası:', err);
    }
  }

  function handleLike(styleId) {
    handleFeedback(styleId, true);
  }

  function handleDislike(styleId) {
    setModal({ open: true, styleId });
  }

  async function handleDislikeNeden(neden) {
    await handleFeedback(modal.styleId, false, neden);
    setModal({ open: false, styleId: null });
  }

  function getBtnLabel(styleId) {
    switch (btnState[styleId]) {
      case 'loading': return '⏳ Dönüştürülüyor...';
      case 'success': return '✅ Dönüştürüldü!';
      case 'error':   return '❌ Hata!';
      default:        return 'Temel CPR\'ı Dönüştür';
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
            <span style={{ fontSize: '11px', color: '#888' }}>
              {visibleStyles.length} stil
            </span>
          </div>
        </summary>

        <div className="accBody">
          {!autoCPR && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px',
              background: '#fff3cd', color: '#856404',
              fontSize: '13px', marginBottom: '16px'
            }}>
              ⚠ Önce Temel CPR'ı oluşturun.
            </div>
          )}
          <div className="styleGrid" id="styleGrid">
            {visibleStyles.map(style => (
              <div
                key={style.id}
                className="styleCard"
                data-style={style.id}
                id={`${style.id}Card`}>
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
                    disabled={loading[style.id] || !autoCPR}
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
                      setCprTexts(prev => ({ ...prev, [style.id]: e.target.value }));
                      autoResize(style.id);
                    }}
                    placeholder="Temel CPR'ı Dönüştür butonuna basın."
                    style={{ resize: 'none', overflow: 'hidden', width: '100%' }}
                  />

                  {cprTexts[style.id] && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginTop: '8px', padding: '0 4px'
                    }}>
                      <button
                        onClick={() => handleLike(style.id)}
                        disabled={!!feedback[style.id]}
                        style={{
                          background: 'none', border: 'none',
                          cursor: feedback[style.id] ? 'default' : 'pointer',
                          fontSize: '22px',
                          opacity: feedback[style.id] && feedback[style.id] !== 'like' ? 0.3 : 1,
                          transition: 'opacity 0.2s'
                        }}
                        title="Beğendim">
                        👍
                      </button>
                      <button
                        onClick={() => handleDislike(style.id)}
                        disabled={!!feedback[style.id]}
                        style={{
                          background: 'none', border: 'none',
                          cursor: feedback[style.id] ? 'default' : 'pointer',
                          fontSize: '22px',
                          opacity: feedback[style.id] && feedback[style.id] !== 'dislike' ? 0.3 : 1,
                          transition: 'opacity 0.2s'
                        }}
                        title="Beğenmedim">
                        👎
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {modal.open && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '24px', width: '90%', maxWidth: '400px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#1a1a1a' }}>
              Bu stil için neden beğenmediniz?
            </div>
            {DISLIKE_NEDENLER.map(n => (
              <button
                key={n.key}
                onClick={() => handleDislikeNeden(n.key)}
                style={{
                  display: 'block', width: '100%',
                  textAlign: 'left', padding: '12px 16px',
                  marginBottom: '8px', borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb', cursor: 'pointer',
                  fontSize: '14px', color: '#374151',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}>
                {n.key}) {n.label}
              </button>
            ))}
            <button
              onClick={() => setModal({ open: false, styleId: null })}
              style={{
                display: 'block', width: '100%',
                textAlign: 'center', padding: '10px',
                marginTop: '4px', borderRadius: '8px',
                border: 'none', background: 'none',
                cursor: 'pointer', fontSize: '13px', color: '#9ca3af'
              }}>
              İptal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
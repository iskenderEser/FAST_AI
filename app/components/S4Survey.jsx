'use client';

import { useState, useEffect } from 'react';

const S4_STORAGE_KEY = 'fast_s4_selections';
const S4_RESULT_KEY  = 'fast_s4_result';
const S4_AXIS_CAP    = 15;

const S4_STYLE_MAP = {
  'T+C': { name: 'Yönlendirici', pill: 'Yönlendirici' },
  'A+C': { name: 'Analitik',     pill: 'Analitik'     },
  'A+E': { name: 'Canayakın',    pill: 'Canayakın'    },
  'T+E': { name: 'İfadeci',      pill: 'İfadeci'      }
};

const GROUP_LABELS = {
  T: 'Söyleyen İddiacı (T)',
  A: 'Soran İddiacı (A)',
  C: 'Düşük Tepkisel (C)',
  E: 'Yüksek Tepkisel (E)'
};

const GROUP_KEYS = ['T', 'A', 'C', 'E'];

export default function S4Survey({ onStyleCalculated }) {
  const [questions, setQuestions]   = useState({ T: [], A: [], C: [], E: [] });
  const [loading, setLoading]       = useState(true);
  const [selections, setSelections] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [limitMsg, setLimitMsg]     = useState('');

  // ============================================
  // VERİ YÜKLEME
  // ============================================
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res  = await fetch('/api/cpr/get-content?type=s4');
        const data = await res.json();
        if (data.success && data.s4) {
          setQuestions(data.s4);
        }
      } catch (err) {
        console.error('S4 soruları yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  // ============================================
  // LOCALSTORAGE
  // ============================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem(S4_STORAGE_KEY);
      if (saved) setSelections(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(S4_STORAGE_KEY, JSON.stringify(selections));
    } catch (e) {}
  }, [selections]);

  // ============================================
  // SAYIMLAR
  // ============================================
  function getCounts() {
    const counts = { T: 0, A: 0, C: 0, E: 0 };
    Object.entries(selections).forEach(([key, val]) => {
      if (val) {
        const group = key.split('_')[0];
        if (counts[group] !== undefined) counts[group]++;
      }
    });
    return counts;
  }

  const counts = getCounts();

  // ============================================
  // LİMİT KONTROLÜ
  // ============================================
  function axisTotal(group) {
    const groups = (group === 'T' || group === 'A') ? ['T', 'A'] : ['C', 'E'];
    return groups.reduce((sum, g) => sum + counts[g], 0);
  }

  function handleCheck(group, idx, checked) {
    const key = `${group}_${idx}`;

    if (checked) {
      const total = axisTotal(group);
      if (total >= S4_AXIS_CAP) {
        const axis = (group === 'T' || group === 'A') ? 'TA' : 'CE';
        const msg  = axis === 'TA'
          ? 'Limit: Söyleyen İddiacı (T) + Soran İddiacı (A) toplamı en fazla 15 olabilir.'
          : 'Limit: Düşük Tepkisel (C) + Yüksek Tepkisel (E) toplamı en fazla 15 olabilir.';
        setLimitMsg(msg);
        setTimeout(() => setLimitMsg(''), 2000);
        return;
      }
    }

    setSelections(prev => ({ ...prev, [key]: checked }));
  }

  // ============================================
  // SONUÇ HESAPLAMA
  // ============================================
  function calculateStyle() {
    const c       = getCounts();
    const totalTA = c.T + c.A;
    const totalCE = c.C + c.E;

    if (totalTA === 0 || totalCE === 0) {
      alert('⚠️ Lütfen her iki eksenden de (T/A ve C/E) en az birer ifade işaretleyiniz.');
      return;
    }

    const assertive   = c.T >= c.A ? 'T' : 'A';
    const responsive  = c.E >= c.C ? 'E' : 'C';
    const combination = `${assertive}+${responsive}`;
    const style       = S4_STYLE_MAP[combination];

    if (!style) return;

    try {
      localStorage.setItem(S4_RESULT_KEY, JSON.stringify({ ...style, combination, counts: c }));
    } catch (e) {}

    // Parent'a bildir — pill otomatik seçilecek
    if (onStyleCalculated) {
      onStyleCalculated(style.pill);
    }
  }

  // ============================================
  // NAVİGASYON
  // ============================================
  const totalPages   = 4;
  const currentGroup = GROUP_KEYS[currentPage - 1];

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="s4-test-wrapper" style={{ marginTop: '24px', padding: '20px', textAlign: 'center', color: '#666' }}>
        ⏳ S4 soruları yükleniyor...
      </div>
    );
  }

  return (
    <div className="s4-test-wrapper" style={{ marginTop: '24px' }}>
      <details className="s4-main-accordion" open>
        <summary>
          <div className="s4-main-header">
            <span className="s4-main-title">📋 FAST S4 Survey</span>
          </div>
          <div className="s4-main-meta">
            <span className="s4-main-counter">
              T: {counts.T}/15 | A: {counts.A}/15 | C: {counts.C}/15 | E: {counts.E}/15
            </span>
            <span className="s4-main-icon">▼</span>
          </div>
        </summary>

        <div className="s4-main-body">
          <p className="s4-description">
            Karşınızdakinin Sosyal Stilini belirlemek için 4 aşamalı bu testi kullanabilir ya da doğrudan seçiminizi işaretleyebilirsiniz
          </p>

          {limitMsg && (
            <div style={{
              background:     '#fff3cd',
              borderLeft:     '4px solid #ffc107',
              color:          '#856404',
              padding:        '12px 16px',
              margin:         '12px 0',
              borderRadius:   '4px',
              fontSize:       '14px'
            }}>
              ⚠️ {limitMsg}
            </div>
          )}

          <div className="s4-wrap">
            <details className="s4-cat" open>
              <summary>
                <div className="s4-cat-header">
                  <span className="s4-cat-icon-left">▶</span>
                  <span className="s4-cat-title">{GROUP_LABELS[currentGroup]}</span>
                </div>
              </summary>
              <div className="s4-content">
                {(questions[currentGroup] || []).map((soru, idx) => (
                  <div key={idx} className="s4-question">
                    <input
                      type="checkbox"
                      id={`s4_${currentGroup}_${idx}`}
                      className="s4-checkbox"
                      checked={!!selections[`${currentGroup}_${idx}`]}
                      onChange={e => handleCheck(currentGroup, idx, e.target.checked)}
                    />
                    <label htmlFor={`s4_${currentGroup}_${idx}`} className="s4-question-label">
                      {soru}
                    </label>
                  </div>
                ))}
              </div>
            </details>

            <div className="s4-nav">
              <button
                type="button"
                className="s4-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ← Geri
              </button>

              {currentPage < totalPages ? (
                <button
                  type="button"
                  className="s4-nav-btn s4-nav-btn-primary"
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  İleri →
                </button>
              ) : (
                <button
                  type="button"
                  className="s4-nav-btn s4-nav-btn-primary s4-nav-btn-result"
                  onClick={calculateStyle}
                >
                  Sonucu Göster
                </button>
              )}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
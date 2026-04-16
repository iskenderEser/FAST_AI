'use client';

import { useState, useEffect } from 'react';
import { useFastCPR } from '../../context/FastCPRContext';

const LEARNING_STYLES = [
  { id: 'activist',   label: 'DEĞİŞİMCİ' },
  { id: 'reflector',  label: 'YANSITICI' },
  { id: 'theorist',   label: 'KURAMCI'   },
  { id: 'pragmatist', label: 'UYGULAYICI' }
];

const STYLE_TO_ID = {
  Değişimci:  'activist',
  Yansıtıcı:  'reflector',
  Kuramcı:    'theorist',
  Uygulamacı: 'pragmatist'
};

const STYLE_MAP = {
  'CE+AE': 'Değişimci',
  'CE+RO': 'Yansıtıcı',
  'AC+RO': 'Kuramcı',
  'AC+AE': 'Uygulamacı'
};

function LSATestContent() {
  const { handleLSAStyleCalculated } = useFastCPR();

  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selections, setSelections] = useState({});
  const [acc1Open, setAcc1Open]     = useState(true);
  const [acc2Open, setAcc2Open]     = useState(false);
  const [uyari1, setUyari1]         = useState(false);
  const [uyari2, setUyari2]         = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/cpr/get-content?type=lsa');
        const data = await res.json();
        if (data.success && data.lsa) setQuestions(data.lsa);
      } catch (err) {
        console.error('LSA soruları yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const algılama = questions.filter(q => q.kategori === 'Algılama');
  const isleme   = questions.filter(q => q.kategori === 'İşleme');

  function handleCheck(sira) {
    const next = { ...selections, [sira]: !selections[sira] };
    setSelections(next);
    compute(next);
  }

  function compute(sel) {
    const scores = { CE: 0, AC: 0, AE: 0, RO: 0 };
    questions.forEach(q => { if (sel[q.sira]) scores[q.eksen]++; });

    const algBeraber = scores.CE > 0 && scores.CE === scores.AC;
    const islBeraber = scores.AE > 0 && scores.AE === scores.RO;

    setUyari1(algBeraber);
    setUyari2(islBeraber);

    const alg = scores.CE > scores.AC ? 'CE' : scores.AC > scores.CE ? 'AC' : null;
    const isl = scores.AE > scores.RO ? 'AE' : scores.RO > scores.AE ? 'RO' : null;

    if (alg && isl) {
      const stil = STYLE_MAP[alg + '+' + isl];
      if (stil) handleLSAStyleCalculated(stil, STYLE_TO_ID);
    }
  }

  function getCount(list) {
    return list.filter(q => !!selections[q.sira]).length;
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        ⏳ Yükleniyor...
      </div>
    );
  }

  return (
    <div>
      <details className="acc" open={acc1Open} onToggle={e => setAcc1Open(e.target.open)}
        style={{ marginBottom: '12px' }}>
        <summary>
          <div className="accTitle">
            <b><span className="arrow">▶</span> Bilgiyi Nasıl Algılıyor?</b>
          </div>
          <div className="accMeta">
            <span style={{ fontSize: '12px', color: '#666' }}>
              {getCount(algılama)} / {algılama.length}
            </span>
          </div>
        </summary>
        <div className="accBody">
          {algılama.map(q => (
            <div key={q.sira}
              onClick={() => handleCheck(q.sira)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '8px', marginBottom: '8px',
                border: selections[q.sira] ? '1px solid #003cbb' : '0.5px solid var(--border)',
                background: selections[q.sira] ? '#eef2ff' : 'white',
                cursor: 'pointer', userSelect: 'none'
              }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                border: selections[q.sira] ? 'none' : '1.5px solid #ccc',
                background: selections[q.sira] ? '#003cbb' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {selections[q.sira] && (
                  <div style={{
                    width: '10px', height: '7px',
                    borderLeft: '2px solid white', borderBottom: '2px solid white',
                    transform: 'rotate(-45deg) translateY(-1px)'
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '13px', lineHeight: '1.5',
                color: selections[q.sira] ? '#003cbb' : 'var(--text)'
              }}>
                {q.soru}
              </span>
            </div>
          ))}
          {uyari1 && (
            <div style={{
              marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
              borderLeft: '3px solid #f59e0b', background: '#fffbeb',
              fontSize: '13px', color: '#92400e', lineHeight: '1.5'
            }}>
              Eşit sayıda seçim yapıldı. Lütfen öğrenme stilini aşağıdan manuel olarak seçin.
            </div>
          )}
        </div>
      </details>

      <details className="acc" open={acc2Open} onToggle={e => setAcc2Open(e.target.open)}>
        <summary>
          <div className="accTitle">
            <b><span className="arrow">▶</span> Bilgiyi Nasıl İşliyor?</b>
          </div>
          <div className="accMeta">
            <span style={{ fontSize: '12px', color: '#666' }}>
              {getCount(isleme)} / {isleme.length}
            </span>
          </div>
        </summary>
        <div className="accBody">
          {isleme.map(q => (
            <div key={q.sira}
              onClick={() => handleCheck(q.sira)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '8px', marginBottom: '8px',
                border: selections[q.sira] ? '1px solid #003cbb' : '0.5px solid var(--border)',
                background: selections[q.sira] ? '#eef2ff' : 'white',
                cursor: 'pointer', userSelect: 'none'
              }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                border: selections[q.sira] ? 'none' : '1.5px solid #ccc',
                background: selections[q.sira] ? '#003cbb' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {selections[q.sira] && (
                  <div style={{
                    width: '10px', height: '7px',
                    borderLeft: '2px solid white', borderBottom: '2px solid white',
                    transform: 'rotate(-45deg) translateY(-1px)'
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '13px', lineHeight: '1.5',
                color: selections[q.sira] ? '#003cbb' : 'var(--text)'
              }}>
                {q.soru}
              </span>
            </div>
          ))}
          {uyari2 && (
            <div style={{
              marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
              borderLeft: '3px solid #f59e0b', background: '#fffbeb',
              fontSize: '13px', color: '#92400e', lineHeight: '1.5'
            }}>
              Eşit sayıda seçim yapıldı. Lütfen öğrenme stilini aşağıdan manuel olarak seçin.
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

export default function Kart2OgrenmStili() {
  const { learningStyles, handleLearningStyleToggle, handleToggleAll } = useFastCPR();
  const allSelected = learningStyles.length === LEARNING_STYLES.length;

  return (
    <details className="acc" id="acc_learning" style={{ marginBottom: '12px' }}>
      <summary>
        <div className="accTitle">
          <b><span className="arrow">▶</span> Öğrenme Stili</b>
          <span>Doktorun öğrenme stilini belirle</span>
        </div>
        <div className="accMeta">
          {learningStyles.length > 0 && (
            <span style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '10px',
              background: '#eaf3de', color: '#3b6d11'
            }}>
              {learningStyles.length} stil seçildi
            </span>
          )}
        </div>
      </summary>
      <div className="accBody">
        <LSATestContent />
        <div className="fieldRow" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <label>Öğrenme Stilini Seçiniz <span style={{ fontWeight: 300, fontStyle: 'italic' }}>(zorunludur)</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
            <div className="learning-style-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {LEARNING_STYLES.map(s => (
                <button key={s.id} type="button"
                  className={`learning-style-pill${learningStyles.includes(s.id) ? ' selected' : ''}`}
                  onClick={() => handleLearningStyleToggle(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
            <button className="btn small ghost" type="button"
              onClick={() => handleToggleAll(LEARNING_STYLES)}>
              {allSelected ? 'Seçimi Kaldır' : 'Hepsini Seç'}
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';

const BEHAVIORS = [
  'Duruş',
  'Ellerin Kullanımı',
  'Göz Teması',
  'İçerik',
  'Kelime Sayısı',
  'Konuşma Hızı',
  'Mimikler',
  'Sesin Hacmi'
];

const ENDPOINTS = {
  'Konuşma Hızı':      { low: 'Yavaş',      high: 'Hızlı'      },
  'Sesin Hacmi':       { low: 'Zayıf',       high: 'Güçlü'      },
  'Mimikler':          { low: 'Kontrollü',   high: 'Hareketli'  },
  'Göz Teması':        { low: 'Dolaylı',     high: 'Doğrudan'   },
  'Ellerin Kullanımı': { low: 'Az',          high: 'Çok'        },
  'Duruş':             { low: 'Çekingen',    high: 'Atak'       },
  'İçerik':            { low: 'Hikayeler',   high: 'Gerçekler'  },
  'Kelime Sayısı':     { low: 'Az',          high: 'Çok'        }
};

function ComfortZoneContent() {
  const [selections, setSelections] = useState({
    me:    Array(BEHAVIORS.length).fill(null),
    other: Array(BEHAVIORS.length).fill(null)
  });

  const [results, setResults]                   = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [chartsVisible, setChartsVisible]       = useState(false);
  const [pendingChartData, setPendingChartData] = useState(null);

  const chartMeRef       = useRef(null);
  const chartOtherRef    = useRef(null);
  const chartCompareRef  = useRef(null);
  const chartMeInst      = useRef(null);
  const chartOtherInst   = useRef(null);
  const chartCompareInst = useRef(null);

  useEffect(() => {
    if (!chartsVisible || !pendingChartData) return;
    if (typeof window === 'undefined' || !window.Chart) return;
    if (!chartMeRef.current || !chartOtherRef.current || !chartCompareRef.current) return;
    const { myVals, otherVals } = pendingChartData;
    createRadarCharts(myVals, otherVals);
    setPendingChartData(null);
  }, [chartsVisible, pendingChartData]);

  function handleSelect(prefix, idx, val) {
    const updated = {
      ...selections,
      [prefix]: selections[prefix].map((v, i) => i === idx ? val : v)
    };
    setSelections(updated);
    const meDone    = updated.me.every(v => v !== null);
    const otherDone = updated.other.every(v => v !== null);
    if (meDone && otherDone) analyzeAndSuggest(updated.me, updated.other);
  }

  function handleReset(prefix) {
    setSelections(prev => ({ ...prev, [prefix]: Array(BEHAVIORS.length).fill(null) }));
    setResults(null);
    setChartsVisible(false);
    setPendingChartData(null);
  }

  function doneCount(prefix) {
    return selections[prefix].filter(v => v !== null).length;
  }

  async function analyzeAndSuggest(myVals, otherVals) {
    const differences  = [];
    const similarities = [];

    BEHAVIORS.forEach((name, idx) => {
      const diff = Math.abs(myVals[idx] - otherVals[idx]);
      const item = {
        name,
        my:         myVals[idx],
        other:      otherVals[idx],
        diff,
        myLabel:    myVals[idx] <= 3 ? ENDPOINTS[name].low : myVals[idx] >= 7 ? ENDPOINTS[name].high : 'Orta',
        otherLabel: otherVals[idx] <= 3 ? ENDPOINTS[name].low : otherVals[idx] >= 7 ? ENDPOINTS[name].high : 'Orta'
      };
      if (diff >= 3) differences.push(item);
      else similarities.push(item);
    });

    setPendingChartData({ myVals, otherVals });
    setChartsVisible(true);
    setLoading(true);

    try {
      const response = await fetch('/api/cpr/analyze-comfort', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ differences, similarities })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const suggestionMap = {};
      const blocks = data.suggestions.split(/\n\n+/);
      blocks.forEach(block => {
        const lines     = block.trim().split('\n');
        const firstLine = lines[0];
        const match     = firstLine.match(/^\*{0,2}(.+?)\*{0,2}:\s*(.*)$/);
        if (match) {
          const behaviorName = match[1].trim();
          const restOfFirst  = match[2].trim();
          const remaining    = lines.slice(1).map(l => l.trim()).filter(Boolean).join(' ');
          suggestionMap[behaviorName] = [restOfFirst, remaining].filter(Boolean).join(' ');
        }
      });

      setResults({ differences, similarities, suggestionMap });
    } catch (err) {
      console.error('Analiz hatası:', err);
      setResults({ error: true });
    } finally {
      setLoading(false);
    }
  }

  function createRadarCharts(myVals, otherVals) {
    const labels  = BEHAVIORS;
    const options = {
      responsive:          true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 9, min: 0,
          ticks:       { stepSize: 1, font: { size: 10 }, display: true },
          pointLabels: { display: true, font: { size: 10 } }
        }
      },
      plugins: { legend: { display: false } }
    };

    if (chartMeInst.current)      chartMeInst.current.destroy();
    if (chartOtherInst.current)   chartOtherInst.current.destroy();
    if (chartCompareInst.current) chartCompareInst.current.destroy();

    if (chartMeRef.current) {
      chartMeInst.current = new window.Chart(chartMeRef.current.getContext('2d'), {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: 'Ben', data: myVals,
            backgroundColor: 'rgba(102,126,234,0.2)', borderColor: '#667eea',
            borderWidth: 2, pointBackgroundColor: '#667eea', pointBorderColor: '#fff'
          }]
        },
        options
      });
    }

    if (chartOtherRef.current) {
      chartOtherInst.current = new window.Chart(chartOtherRef.current.getContext('2d'), {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: 'Karşı Taraf', data: otherVals,
            backgroundColor: 'rgba(240,147,251,0.2)', borderColor: '#f093fb',
            borderWidth: 2, pointBackgroundColor: '#f093fb', pointBorderColor: '#fff'
          }]
        },
        options
      });
    }

    if (chartCompareRef.current) {
      chartCompareInst.current = new window.Chart(chartCompareRef.current.getContext('2d'), {
        type: 'radar',
        data: {
          labels,
          datasets: [
            {
              label: 'Ben', data: myVals,
              backgroundColor: 'rgba(102,126,234,0.2)', borderColor: '#667eea',
              borderWidth: 2, pointBackgroundColor: '#667eea', pointBorderColor: '#fff'
            },
            {
              label: 'Karşı Taraf', data: otherVals,
              backgroundColor: 'rgba(240,147,251,0.2)', borderColor: '#f093fb',
              borderWidth: 2, pointBackgroundColor: '#f093fb', pointBorderColor: '#fff'
            }
          ]
        },
        options: { ...options, plugins: { legend: { display: true, position: 'bottom' } } }
      });
    }
  }

  function BehaviorRow({ prefix, idx, name }) {
    const selected = selections[prefix][idx];
    return (
      <>
        <tr className="hint-row-compare">
          <td></td>
          <td className="label-compare">{ENDPOINTS[name]?.low}</td>
          {[2,3,4,5,6,7,8].map(v => <td key={v}></td>)}
          <td className="label-compare">{ENDPOINTS[name]?.high}</td>
        </tr>
        <tr>
          <td className={selected !== null ? 'behavior-selected-compare' : 'behavior-unselected-compare'}>
            {name}
          </td>
          {[1,2,3,4,5,6,7,8,9].map(v => (
            <td key={v}>
              <div className="rwrap-compare">
                <input
                  type="radio"
                  name={`compare_${prefix}_${idx}`}
                  value={v}
                  checked={selected === v}
                  onChange={() => handleSelect(prefix, idx, v)}
                />
              </div>
            </td>
          ))}
        </tr>
      </>
    );
  }

  return (
    <div className="compare-wrap">
      <p className="compare-description">
        Kendinizin ve karşınızdakinin davranışlarını tanımlayabilir, uyumlu iletişim fırsatları için AI önerilerini görebilirsiniz.
      </p>

      <details className="compare-cat">
        <summary>
          <div className="compare-cat-header">
            <span className="compare-cat-title">Benim Davranışlarım</span>
          </div>
          <div className="compare-cat-meta">
            <span className="compare-cat-counter">{doneCount('me')}/{BEHAVIORS.length}</span>
            <span className="compare-cat-icon">▼</span>
          </div>
        </summary>
        <div className="compare-content">
          <div className="compare-table-scroll">
            <table id="compareTableMe">
              <thead>
                <tr>
                  <th>Davranış</th>
                  {[1,2,3,4,5,6,7,8,9].map(v => <th key={v}>{v}</th>)}
                </tr>
              </thead>
              <tbody>
                {BEHAVIORS.map((name, idx) => (
                  <BehaviorRow key={idx} prefix="me" idx={idx} name={name} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="compare-actions">
            <button className="btn secondary small" onClick={() => handleReset('me')} type="button">Temizle</button>
          </div>
        </div>
      </details>

      <details className="compare-cat">
        <summary>
          <div className="compare-cat-header">
            <span className="compare-cat-title">Onun Davranışları</span>
          </div>
          <div className="compare-cat-meta">
            <span className="compare-cat-counter">{doneCount('other')}/{BEHAVIORS.length}</span>
            <span className="compare-cat-icon">▼</span>
          </div>
        </summary>
        <div className="compare-content">
          <div className="compare-table-scroll">
            <table id="compareTableOther">
              <thead>
                <tr>
                  <th>Davranış</th>
                  {[1,2,3,4,5,6,7,8,9].map(v => <th key={v}>{v}</th>)}
                </tr>
              </thead>
              <tbody>
                {BEHAVIORS.map((name, idx) => (
                  <BehaviorRow key={idx} prefix="other" idx={idx} name={name} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="compare-actions">
            <button className="btn secondary small" onClick={() => handleReset('other')} type="button">Temizle</button>
          </div>
        </div>
      </details>

      {chartsVisible && (
        <details className="compare-cat" open>
          <summary>
            <div className="compare-cat-header">
              <span className="compare-cat-title">📊 Konfor Alanı Grafikleri</span>
            </div>
            <div className="compare-cat-meta">
              <span className="compare-cat-icon">▼</span>
            </div>
          </summary>
          <div className="compare-content">
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-card-title">Benim Konfor Alanım</div>
                <div className="chart-wrapper"><canvas ref={chartMeRef}></canvas></div>
              </div>
              <div className="chart-card">
                <div className="chart-card-title">Onun Konfor Alanı</div>
                <div className="chart-wrapper"><canvas ref={chartOtherRef}></canvas></div>
              </div>
              <div className="chart-card">
                <div className="chart-card-title">Karşılaştırmalı Görünüm</div>
                <div className="chart-wrapper"><canvas ref={chartCompareRef}></canvas></div>
              </div>
            </div>
          </div>
        </details>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          ⏳ Yapay zeka analiz yapıyor...
        </div>
      )}

      {results && !loading && (
        <div id="compareResults" style={{ display: 'block', marginTop: '20px' }}>
          {results.error ? (
            <div style={{ padding: '20px', color: '#e30a17' }}>❌ Analiz yapılamadı, tekrar deneyin.</div>
          ) : (
            <div className="analysis-container">
              {results.similarities.length > 0 && (
                <div className="analysis-box similarities">
                  <div className="analysis-box-title">✅ Uyumlu Davranışlarınız</div>
                  <div className="similarities-pills">
                    {results.similarities.map(s => (
                      <div key={s.name} className="similarity-pill">✓ {s.name}</div>
                    ))}
                  </div>
                </div>
              )}
              {results.differences.length > 0 && (
                <div className="analysis-box differences">
                  <div className="analysis-box-title">🔄 Esneyeceğiniz Davranışlar ve Öneriler</div>
                  {results.differences.map(d => (
                    <div key={d.name} className="behavior-item">
                      <div className="behavior-item-name">📍 {d.name}</div>
                      <div className="behavior-item-scores">
                        <div className="behavior-item-score">
                          <span className="label">Siz:</span>
                          <span className="value">{d.my} ({d.myLabel})</span>
                        </div>
                        <div className="behavior-item-score">
                          <span className="label">Karşı Taraf:</span>
                          <span className="value other">{d.other} ({d.otherLabel})</span>
                        </div>
                        <div className="behavior-item-score">
                          <span className="label">Fark:</span>
                          <span className="value diff">{d.diff}</span>
                        </div>
                      </div>
                      <div className="behavior-item-suggestion">
                        💡 {results.suggestionMap[d.name] || 'Karşı tarafın stiline yaklaşmayı deneyin.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Kart1KonforAlani() {
  return (
    <details className="acc" id="acc_comfort" open style={{ marginBottom: '12px' }}>
      <summary>
        <div className="accTitle">
          <b><span className="arrow">▶</span> Konfor Alanı</b>
          <span>Doktorun davranış stilini belirle</span>
        </div>
      </summary>
      <div className="accBody">
        <ComfortZoneContent />
      </div>
    </details>
  );
}
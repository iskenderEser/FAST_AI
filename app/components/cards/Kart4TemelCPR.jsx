'use client';

import { useRef, useEffect } from 'react';
import { useFastCPR } from '../../context/FastCPRContext';

export default function Kart4TemelCPR() {
  const {
    atcCode,
    selectedUrun,
    ozellikOptions, ozellik, setOzellik,
    editability,
    claims,
    filteredAdvantages, filteredBenefits,
    selectedClaim, setSelectedClaim,
    selectedClaimText, setSelectedClaimText,
    handleClaimChange,
    advCategory, handleAdvCategoryChange,
    selectedAdv, selectedAdvText, handleAdvChange,
    selectedBen, selectedBenText, handleBenChange,
    recommendation, setRecommendation,
    recommendationLoading,
    autoCPR, setAutoCPR,
    cprLoading, handleGenerateCPR
  } = useFastCPR();

  const autoCPRRef = useRef(null);

  function autoResize() {
    const el = autoCPRRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }

  useEffect(() => {
    autoResize();
  }, [autoCPR]);

  return (
    <details className="acc" id="acc_base" style={{ marginBottom: '12px' }}>
      <summary>
        <div className="accTitle">
          <b><span className="arrow">▶</span> Temel CPR Geliştirme</b>
          <span>"Başarı detaylarda gizlidir"</span>
        </div>
      </summary>
      <div className="accBody">

        {/* CLAIM */}
        <details className="acc" style={{ marginBottom: '12px' }} open>
          <summary>
            <div className="accTitle">
              <b><span className="arrow">▶</span> CLAIM — İddia</b>
            </div>
          </summary>
          <div className="accBody">
            <div className="cpr-section-card" data-section="claim">
              <div className="fieldRow">
                <label>İddianızı Seçin</label>
                <select value={selectedClaim} onChange={e => handleClaimChange(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '12px' }}>
                  <option value="">{atcCode ? 'Claim seçiniz...' : 'Önce ürün seçin...'}</option>
                  {claims.map((c, i) => (
                    <option key={i} value={c.claim}>{c.claim}</option>
                  ))}
                </select>
              </div>
              <label>Seçtiğiniz İddia <span style={{ fontWeight: 300, fontStyle: 'italic' }}>(düzenleyebilirsiniz)</span></label>
              <div className="textarea-wrapper">
                <textarea id="base_claim_full" value={selectedClaimText}
                  onChange={e => setSelectedClaimText(e.target.value)}
                  placeholder="Ürün seçildiğinde otomatik dolacak."
                  style={{ minHeight: '80px' }} />
              </div>
              <div className="fieldTools">
                <button className="btn ghost small" type="button"
                  onClick={() => { setSelectedClaim(''); setSelectedClaimText(''); }}>
                  Temizle
                </button>
              </div>
            </div>
          </div>
        </details>

        {/* PROPOSITION */}
        <details className="acc" style={{ marginBottom: '12px' }}>
          <summary>
            <div className="accTitle">
              <b><span className="arrow">▶</span> PROPOSITION — Özellik, Avantaj, Fayda</b>
            </div>
          </summary>
          <div className="accBody">
            <div className="cpr-section-card" data-section="advantage">

              {/* Özellik */}
              <div className="cpr-section-card" data-section="feature" style={{ marginBottom: '12px' }}>
                <label>Özellik</label>
                {editability.ozellikler ? (
                  ozellikOptions.length > 0 ? (
                    <select value={ozellik} onChange={e => setOzellik(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '8px' }}>
                      <option value="">Özellik seçiniz...</option>
                      {ozellikOptions.map((o, i) => (
                        <option key={i} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="textarea-wrapper">
                      <textarea
                        value={ozellik}
                        onChange={e => setOzellik(e.target.value)}
                        placeholder='Örnek: "yarılanma ömrü 12 saat"'
                        style={{ minHeight: '80px' }} />
                    </div>
                  )
                ) : (
                  <div style={{
                    padding: '10px', borderRadius: '8px',
                    background: '#f1f3f8', border: '1px solid var(--border)',
                    fontSize: '13px', color: '#444'
                  }}>
                    {ozellik}
                  </div>
                )}
                <div className="fieldTools">
                  <button className="btn ghost small" type="button" onClick={() => setOzellik('')}>
                    Temizle
                  </button>
                </div>
              </div>

              {/* Avantaj */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label>Avantaj Kategorisi</label>
                  <select value={advCategory} onChange={e => handleAdvCategoryChange(e.target.value)}
                    disabled={!atcCode}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <option value="">Seçiniz...</option>
                    <option value="A1">A1 - Ölçüm/Değişim Odaklı</option>
                    <option value="A2">A2 - Mekanizma/İşleyiş Odaklı</option>
                    <option value="A3">A3 - Güvenlik ve Tolerabilite</option>
                    <option value="A4">A4 - Uygulama Kolaylığı</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Avantaj Seçiniz</label>
                  <select value={selectedAdv}
                    onChange={e => handleAdvChange(e.target.value)}
                    disabled={!advCategory || !editability.avantaj}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <option value="">{advCategory ? 'Avantaj seçiniz...' : 'Önce kategori seçin...'}</option>
                    {filteredAdvantages.map((a, i) => (
                      <option key={i} value={a.avantaj}>{a.avantaj}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label>Seçtiğiniz Avantaj <span style={{ fontWeight: 300, fontStyle: 'italic' }}>(düzenleyebilirsiniz)</span></label>
              <div className="textarea-wrapper">
                <textarea value={selectedAdvText}
                  onChange={e => handleAdvChange(e.target.value)}
                  disabled={!editability.avantaj}
                  placeholder="Avantaj seçildiğinde otomatik dolacak."
                  style={{ minHeight: '80px' }} />
              </div>
              <div className="fieldTools">
                <button className="btn ghost small" type="button"
                  onClick={() => { handleAdvChange(''); handleBenChange(''); }}>
                  Temizle
                </button>
              </div>

              {/* Fayda */}
              <div className="fieldRow" style={{ marginTop: '12px' }}>
                <label>Fayda Seçiniz</label>
                <select value={selectedBen}
                  onChange={e => handleBenChange(e.target.value)}
                  disabled={!selectedAdv || !editability.fayda}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <option value="">{selectedAdv ? 'Fayda seçiniz...' : 'Önce avantaj seçin...'}</option>
                  {filteredBenefits.map((b, i) => (
                    <option key={i} value={b.fayda}>{b.fayda}</option>
                  ))}
                </select>
              </div>

              <label>Seçtiğiniz Fayda <span style={{ fontWeight: 300, fontStyle: 'italic' }}>(düzenleyebilirsiniz)</span></label>
              <div className="textarea-wrapper">
                <textarea value={selectedBenText}
                  onChange={e => handleBenChange(e.target.value)}
                  disabled={!editability.fayda}
                  placeholder="Fayda seçildiğinde otomatik dolacak."
                  style={{ minHeight: '80px' }} />
              </div>
              <div className="fieldTools">
                <button className="btn ghost small" type="button"
                  onClick={() => handleBenChange('')}>
                  Temizle
                </button>
              </div>

            </div>
          </div>
        </details>

        {/* RECOMMENDATION */}
        <details className="acc" style={{ marginBottom: '12px' }}>
          <summary>
            <div className="accTitle">
              <b><span className="arrow">▶</span> RECOMMENDATION — Talep</b>
            </div>
          </summary>
          <div className="accBody">
            <div className="cpr-section-card" data-section="recommendation">
              {recommendationLoading && (
                <div style={{
                  padding: '8px 12px', marginBottom: '8px', borderRadius: '8px',
                  background: '#eef2ff', color: '#003cbb', fontSize: '13px'
                }}>
                  ⏳ Recommendation oluşturuluyor...
                </div>
              )}
              <div className="textarea-wrapper">
                <textarea value={recommendation}
                  onChange={e => setRecommendation(e.target.value)}
                  placeholder="Fayda seçildiğinde otomatik oluşacak."
                  disabled={recommendationLoading}
                  style={{ minHeight: '80px', opacity: recommendationLoading ? 0.5 : 1 }} />
              </div>
              <div className="fieldTools">
                <button className="btn ghost small" type="button" onClick={() => setRecommendation('')}>Temizle</button>
              </div>
            </div>
          </div>
        </details>

        {/* TEMEL CPR */}
        <div className="cpr-section-card auto-cpr-section">
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="icon">🤖</span> <b>Temel CPR</b>{' '}
              <span style={{ fontWeight: 300, fontStyle: 'italic' }}>(otomatik oluşur)</span>
            </div>
            <button onClick={handleGenerateCPR} disabled={cprLoading}
              style={{
                padding: '8px 20px', borderRadius: '8px',
                background: cprLoading ? '#ccc' : '#e30a17',
                color: 'white', border: 'none',
                fontSize: '13px', fontWeight: 500,
                cursor: cprLoading ? 'not-allowed' : 'pointer'
              }}>
              {cprLoading ? '⏳ Üretiliyor...' : '🤖 Temel CPR Üret'}
            </button>
          </div>
          <div className="textarea-wrapper" style={{ marginTop: '12px' }}>
            <textarea
              ref={autoCPRRef}
              id="autoCPR"
              value={autoCPR}
              onChange={e => {
                setAutoCPR(e.target.value);
                autoResize();
              }}
              placeholder="Claim → Özellik → Avantaj → Fayda → Recommendation bileşenlerinden yapay zeka otomatik CPR oluşturur."
              style={{ minHeight: '120px', backgroundColor: '#f8fafc', resize: 'none', overflow: 'hidden', width: '100%' }}
            />
          </div>
          {autoCPR && (
            <div className="fieldTools">
              <button className="btn ghost small" type="button" onClick={() => setAutoCPR('')}>Temizle</button>
            </div>
          )}
        </div>

      </div>
    </details>
  );
}
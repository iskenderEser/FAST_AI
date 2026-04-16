'use client';

import { useFastCPR } from '../../context/FastCPRContext';

export default function Kart3TedaviUrun() {
  const {
    urunler,
    selectedUrun,
    handleUrunSelect,
    usageType, setUsageType,
    posologyOptions, posology, setPosology,
    editability
  } = useFastCPR();

  return (
    <details className="acc" id="acc_productprep" style={{ marginBottom: '12px' }}>
      <summary>
        <div className="accTitle">
          <b><span className="arrow">▶</span> Tedavi Alanı ve Tanıtım Ürünü</b>
          <span>Ürün seçimi ve bilgileri</span>
        </div>
        <div className="accMeta">
          {selectedUrun && (
            <span style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '10px',
              background: '#eaf3de', color: '#3b6d11'
            }}>
              Hazır
            </span>
          )}
        </div>
      </summary>
      <div className="accBody">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          {/* Ürün Seçimi */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label>Ürün Seçiniz</label>
            <select
              value={selectedUrun?.id || ''}
              onChange={e => handleUrunSelect(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '12px' }}>
              <option value="">Seçiniz...</option>
              {urunler.map(u => (
                <option key={u.id} value={u.id}>{u.urun_adi}</option>
              ))}
            </select>

            {selectedUrun && (
              <div style={{
                padding: '8px 12px', borderRadius: '8px',
                background: '#f1f3f8', fontSize: '12px', color: '#666'
              }}>
                Tedavi Alanı: <strong>{selectedUrun.atc_kodu}</strong>
              </div>
            )}
          </div>

          {/* Kullanım Şekli ve Pozoloji */}
          {selectedUrun && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label>Kullanım Şekli</label>
              {editability.kullanim_sekli ? (
                <select
                  value={usageType}
                  onChange={e => setUsageType(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '12px' }}>
                  <option value="">Seçiniz...</option>
                  <option value="Oral">Oral (tablet/kapsül)</option>
                  <option value="Topikal">Topikal (krem/merhem)</option>
                  <option value="Subkutan/IM">Subkutan/IM enjeksiyon</option>
                  <option value="İV infüzyon">İV infüzyon</option>
                  <option value="İnhaler">İnhaler</option>
                  <option value="Tok karnına">Tok karnına</option>
                  <option value="Aç karnına">Aç karnına</option>
                  <option value="boş">Boş (kullanım şekli yok)</option>
                  <option value="Diğer">Diğer</option>
                </select>
              ) : (
                <div style={{
                  padding: '10px', borderRadius: '8px', marginBottom: '12px',
                  background: '#f1f3f8', border: '1px solid var(--border)',
                  fontSize: '13px', color: '#444'
                }}>
                  {usageType}
                </div>
              )}

              <label>Pozoloji</label>
              {editability.pozoloji ? (
                <select
                  value={posology}
                  onChange={e => setPosology(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <option value="">Seçiniz...</option>
                  {posologyOptions.map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: '10px', borderRadius: '8px',
                  background: '#f1f3f8', border: '1px solid var(--border)',
                  fontSize: '13px', color: '#444'
                }}>
                  {posology}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </details>
  );
}
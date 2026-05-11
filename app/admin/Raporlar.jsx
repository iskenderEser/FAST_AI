'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const FILTRELER = [
  { key: 'gunluk',   label: 'Günlük'   },
  { key: 'haftalik', label: 'Haftalık' },
  { key: 'aylik',    label: 'Aylık'    },
  { key: '3aylik',   label: '3 Aylık'  },
  { key: 'yillik',   label: 'Yıllık'   },
];

const STIL_LABELS  = ['Pragmatist', 'Activist', 'Theorist', 'Reflector'];
const STIL_RENKLER = ['#003cbb', '#ff751f', '#003cbb', '#003cbb'];

const SYS_LABELS = [
  'CPR stile uygun değildi',
  'CPR klişe geldi, özgün değildi',
  'CPR çok uzundu',
  'CPR çok kısaydı',
  "Hasta sesi CPR'a yansımadı",
];

const USR_LABELS = [
  'Yanlış claim seçtim',
  'Yanlış stil seçtim',
  'Yanlış ürün seçtim',
  'Rakip bilgisini hatalı girdim',
];

const BADGE_MAP = {
  'badge-green': 'rapor-badge--green',
  'badge-amber': 'rapor-badge--amber',
  'badge-gray':  'rapor-badge--gray',
};

// ============================================
// SUB-COMPONENTS
// ============================================

function RaporBadge({ badge, label }) {
  return (
    <span className={`rapor-badge ${BADGE_MAP[badge] || 'rapor-badge--gray'}`}>
      {label}
    </span>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rapor-metrik-card">
      <div className="rapor-metrik-card__label">{label}</div>
      <div className="rapor-metrik-card__value">{value}</div>
    </div>
  );
}

function UrunKart({ ad, adet, stilPctArr }) {
  return (
    <div className="rapor-urun-card">
      <div className="rapor-urun-card__eyebrow">CPR Tercihlerim</div>
      <div className="rapor-urun-card__adi">{ad}</div>
      <div className="rapor-urun-card__sayi">{adet} kez kullanıldı</div>
      {STIL_LABELS.map((stilAd, si) => {
        const pct = stilPctArr?.[si] ?? 0;
        return (
          <div key={stilAd} className="rapor-urun-stil-row">
            <span className="rapor-urun-stil-row__ad">{stilAd}</span>
            <div className="rapor-bar-row__track">
              {pct > 0 && (
                <div
                  className="rapor-bar-row__fill"
                  style={{ width: `${pct}%`, background: STIL_RENKLER[si] }}
                />
              )}
            </div>
            <span className="rapor-urun-stil-row__pct">
              {pct > 0 ? `${pct}%` : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function UrunGrid({ urun_adlari, urun_adet, urun_stil }) {
  if (!urun_adlari || urun_adlari.length === 0) return null;

  const count = urun_adlari.length;

  const kartlar = urun_adlari.map((ad, idx) => (
    <UrunKart
      key={ad}
      ad={ad}
      adet={urun_adet?.[idx] ?? 0}
      stilPctArr={urun_stil?.[idx]}
    />
  ));

  if (count === 1) {
    return (
      <div className="rapor-urun-grid--1">
        {kartlar}
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="rapor-urun-grid--2">
        {kartlar}
      </div>
    );
  }

  const satirlar = [];
  for (let i = 0; i < kartlar.length; i += 3) {
    satirlar.push(kartlar.slice(i, i + 3));
  }

  return (
    <>
      {satirlar.map((satir, si) => (
        <div key={si} className="rapor-urun-grid--3">
          {satir}
        </div>
      ))}
    </>
  );
}

function ClaimDetay({ claim_detay, urun_adlari }) {
  const [seciliUrun, setSeciliUrun] = useState('hepsi');

  if (!claim_detay || claim_detay.length === 0) return null;

  const filtrelenmis = seciliUrun === 'hepsi'
    ? claim_detay
    : claim_detay.filter(c => c.urun === seciliUrun);

  return (
    <div className="rapor-card">
      <div className="rapor-claim-header">
        <div className="rapor-card__title">En çok kullandığım claim'ler</div>
        <select
          className="rapor-claim-filter"
          value={seciliUrun}
          onChange={e => setSeciliUrun(e.target.value)}
        >
          <option value="hepsi">Hepsi</option>
          {(urun_adlari || []).map(ad => (
            <option key={ad} value={ad}>{ad}</option>
          ))}
        </select>
      </div>
      {filtrelenmis.map((c, i) => (
        <div key={i} className="rapor-claim-row">
          <div style={{ flex: 1 }}>
            <div className="rapor-claim-row__meta">{c.urun} · {c.stil}</div>
            <div className="rapor-claim-row__text">{c.claim}</div>
          </div>
          <div className="rapor-claim-row__sayi">{c.adet}</div>
        </div>
      ))}
    </div>
  );
}

function NedenlerCard({ fb }) {
  if (!fb) return null;
  return (
    <div className="rapor-neden-grid">
      <div className="rapor-card">
        <div className="rapor-neden-grup rapor-neden-grup--sistem">Sistem kaynaklı</div>
        {SYS_LABELS.map((lbl, i) => (
          <div key={i} className="rapor-neden-row">
            <span className="rapor-neden-row__label">{lbl}</span>
            <div className="rapor-bar-row__track" style={{ maxWidth: '80px' }}>
              {(fb.sys?.[i] ?? 0) > 0 && (
                <div className="rapor-bar-row__fill" style={{ width: `${fb.sys[i]}%`, background: '#e30a17' }} />
              )}
            </div>
            <span className="rapor-neden-row__pct">{(fb.sys?.[i] ?? 0) > 0 ? `${fb.sys[i]}%` : '—'}</span>
          </div>
        ))}
      </div>
      <div className="rapor-card">
        <div className="rapor-neden-grup rapor-neden-grup--kullanici">Kullanıcı kaynaklı</div>
        {USR_LABELS.map((lbl, i) => (
          <div key={i} className="rapor-neden-row">
            <span className="rapor-neden-row__label">{lbl}</span>
            <div className="rapor-bar-row__track" style={{ maxWidth: '80px' }}>
              {(fb.usr?.[i] ?? 0) > 0 && (
                <div className="rapor-bar-row__fill" style={{ width: `${fb.usr[i]}%`, background: '#ff751f' }} />
              )}
            </div>
            <span className="rapor-neden-row__pct">{(fb.usr?.[i] ?? 0) > 0 ? `${fb.usr[i]}%` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendCard({ trend, sub }) {
  if (!trend || !trend.labels) return null;

  const maxVal = Math.max(...trend.u, ...trend.a, 1);
  const ySteps = [maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33), 0];

  return (
    <div className="rapor-card">
      <div className="rapor-card__title">{sub}</div>
      <div className="rapor-trend-inner">
        <div className="rapor-trend-y-axis">
          {ySteps.map((v, i) => (
            <span key={i} className="rapor-trend-y-label">{v}</span>
          ))}
        </div>
        <div className="rapor-trend-chart-area">
          <div className="rapor-trend-bars-row">
            {trend.labels.map((lbl, i) => {
              const hU = maxVal > 0 ? Math.round((trend.u[i] / maxVal) * 100) : 0;
              const hA = maxVal > 0 ? Math.round((trend.a[i] / maxVal) * 100) : 0;
              return (
                <div key={i} className="rapor-trend-bar-wrap">
                  <div
                    className="rapor-trend-bar-group__bar rapor-trend-bar-group__bar--uretilen"
                    style={{ height: `${hU}%`, flex: 1, borderRadius: '2px 2px 0 0', alignSelf: 'flex-end' }}
                  />
                  <div
                    className="rapor-trend-bar-group__bar rapor-trend-bar-group__bar--arsivlenen"
                    style={{ height: `${hA}%`, flex: 1, borderRadius: '2px 2px 0 0', alignSelf: 'flex-end' }}
                  />
                </div>
              );
            })}
          </div>
          <div className="rapor-trend-x-labels">
            {trend.labels.map((lbl, i) => (
              <span key={i} className="rapor-trend-x-label">{lbl}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="rapor-legend">
        <div className="rapor-legend__item">
          <div className="rapor-legend__dot rapor-legend__dot--uretilen" />
          üretilen
        </div>
        <div className="rapor-legend__item">
          <div className="rapor-legend__dot rapor-legend__dot--arsivlenen" />
          arşivlenen
        </div>
      </div>
    </div>
  );
}

// ============================================
// RAPOR ICERIK
// ============================================

function RaporIcerik({ rol, filtre, setFiltre, data, loading }) {
  const oran = data && data.uretilen > 0
    ? Math.round(data.arsivlenen / data.uretilen * 100)
    : 0;

  return (
    <>
      <div className="rapor-filtreler">
        {FILTRELER.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className={`rapor-filtre-btn${filtre === f.key ? ' rapor-filtre-btn--active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div className="rapor-loading">⏳ Yükleniyor...</div>}

      {!loading && data && (
        <>
          {rol === 'admin' && (
            <div className="rapor-metrik-grid--4">
              <MetricCard label="Toplam firma"    value={data.firma?.length ?? 0} />
              <MetricCard label="Toplam mümessil" value={data.mumessil?.length ?? 0} />
              <MetricCard label="Üretilen CPR"    value={data.uretilen} />
              <MetricCard label="Kullanım oranı"  value={`${oran}%`} />
            </div>
          )}
          {rol === 'yonetici' && (
            <div className="rapor-metrik-grid--3">
              <MetricCard label="Üretilen CPR"   value={data.uretilen} />
              <MetricCard label="Arşivlenen CPR" value={data.arsivlenen} />
              <MetricCard label="Kullanım oranı" value={`${oran}%`} />
            </div>
          )}
          {rol === 'kullanici' && (
            <div className="rapor-metrik-grid--3">
              <MetricCard label="Ürettiğim CPR"   value={data.uretilen} />
              <MetricCard label="Arşivlediklerim" value={data.arsivlenen} />
              <MetricCard label="Kullanım oranım" value={`${oran}%`} />
            </div>
          )}

          {rol === 'admin' && (
            <div className="rapor-card">
              <div className="rapor-card__title">Firma bazlı özet</div>
              <table className="admin-table">
                <thead>
                  <tr>
                    {['Firma', 'Mümessil', 'Üretilen', 'Arşivlenen', 'Oran'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(data.firma || []).map((r, i) => (
                    <tr key={i}>
                      <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
                      <td><RaporBadge badge={r[5]} label={r[4]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rol === 'admin' && (
            <div className="rapor-card">
              <div className="rapor-card__title">Tüm mümessiller</div>
              <table className="admin-table">
                <thead>
                  <tr>
                    {['Ad soyad', 'Firma', 'Üretilen', 'Arşivlenen', 'Oran', 'Son aktivite'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(data.mumessil || []).map((r, i) => (
                    <tr key={i}>
                      <td>{r[0]}</td>
                      <td className="admin-table td--muted">{r[1]}</td>
                      <td>{r[2]}</td><td>{r[3]}</td>
                      <td><RaporBadge badge={r[5]} label={r[4]} /></td>
                      <td className="admin-table td--muted">{r[6]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rol === 'yonetici' && (
            <div className="rapor-card">
              <div className="rapor-card__title">Mümessil aktivitesi</div>
              <table className="admin-table">
                <thead>
                  <tr>
                    {['Ad soyad', 'Üretilen', 'Arşivlenen', 'Oran', 'Son aktivite'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(data.tablo || []).map((r, i) => (
                    <tr key={i}>
                      <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
                      <td><RaporBadge badge={r[4]} label={r[3]} /></td>
                      <td className="admin-table td--muted">{r[5]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rol === 'kullanici' && (
            <UrunGrid
              urun_adlari={data.urun_adlari}
              urun_adet={data.urun_adet}
              urun_stil={data.urun_stil}
            />
          )}

          {rol === 'kullanici' && (
            <ClaimDetay
              claim_detay={data.claim_detay}
              urun_adlari={data.urun_adlari}
            />
          )}

          {rol === 'kullanici' && (
            <NedenlerCard fb={data.fb} />
          )}

          {rol === 'kullanici' && (
            <TrendCard trend={data.trend} sub={data.sub} />
          )}

          {(rol === 'admin' || rol === 'yonetici') && (
            <div className="rapor-card">
              <div className="rapor-card__grid-2">
                <div>
                  <div className="rapor-card__title">Ürün bazlı kullanım</div>
                  {(data.urun_adlari || []).map((ad, i) => (
                    <div key={i} className="rapor-bar-row">
                      <div className="rapor-bar-row__label rapor-bar-row__label--sm">{ad}</div>
                      <div className="rapor-bar-row__track">
                        <div className="rapor-bar-row__fill" style={{ width: `${data.urun?.[i] ?? 0}%`, background: '#003cbb' }} />
                      </div>
                      <div className="rapor-bar-row__pct">{data.urun?.[i] ?? 0}%</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="rapor-card__title">Stil dağılımı</div>
                  {(data.stil || []).map((pct, i) => (
                    <div key={i} className="rapor-bar-row">
                      <div className="rapor-bar-row__label rapor-bar-row__label--sm">{STIL_LABELS[i]}</div>
                      <div className="rapor-bar-row__track">
                        <div className="rapor-bar-row__fill" style={{ width: `${pct}%`, background: '#1D9E75' }} />
                      </div>
                      <div className="rapor-bar-row__pct">{pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(rol === 'admin' || rol === 'yonetici') && (
            <div className="rapor-card">
              <div className="rapor-card__title">En çok kullanılan claim'ler</div>
              {(data.claim_adlari || []).map((lbl, i) => (
                <div key={i} className="rapor-bar-row">
                  <div className="rapor-bar-row__label rapor-bar-row__label--md">{lbl}</div>
                  <div className="rapor-bar-row__track">
                    <div className="rapor-bar-row__fill" style={{ width: `${data.claim?.[i] ?? 0}%`, background: '#7F77DD' }} />
                  </div>
                  <div className="rapor-bar-row__pct">{data.claim?.[i] ?? 0}%</div>
                </div>
              ))}
            </div>
          )}

          {(rol === 'admin' || rol === 'yonetici') && (
            <div className="rapor-card">
              <div className="rapor-card__title">Arşivlenmeyen CPR nedenleri</div>
              <div className="rapor-card__grid-2">
                <div>
                  <div className="rapor-neden-grup rapor-neden-grup--sistem">Sistem kaynaklı</div>
                  {SYS_LABELS.map((lbl, i) => (
                    <div key={i} className="rapor-neden-row">
                      <span className="rapor-neden-row__label">{lbl}</span>
                      <div className="rapor-bar-row__track" style={{ maxWidth: '80px' }}>
                        {(data.fb?.sys?.[i] ?? 0) > 0 && (
                          <div className="rapor-bar-row__fill" style={{ width: `${data.fb.sys[i]}%`, background: '#e30a17' }} />
                        )}
                      </div>
                      <span className="rapor-neden-row__pct">{(data.fb?.sys?.[i] ?? 0) > 0 ? `${data.fb.sys[i]}%` : '—'}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="rapor-neden-grup rapor-neden-grup--kullanici">Kullanıcı kaynaklı</div>
                  {USR_LABELS.map((lbl, i) => (
                    <div key={i} className="rapor-neden-row">
                      <span className="rapor-neden-row__label">{lbl}</span>
                      <div className="rapor-bar-row__track" style={{ maxWidth: '80px' }}>
                        {(data.fb?.usr?.[i] ?? 0) > 0 && (
                          <div className="rapor-bar-row__fill" style={{ width: `${data.fb.usr[i]}%`, background: '#ff751f' }} />
                        )}
                      </div>
                      <span className="rapor-neden-row__pct">{(data.fb?.usr?.[i] ?? 0) > 0 ? `${data.fb.usr[i]}%` : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(rol === 'admin' || rol === 'yonetici') && (
            <TrendCard trend={data.trend} sub={data.sub} />
          )}
        </>
      )}
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Raporlar() {
  const { currentUser } = useAuth();
  const rol = currentUser?.rol;

  const [filtre, setFiltre]   = useState('gunluk');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (f) => {
    if (!currentUser) return;
    setLoading(true);
    setData(null);
    try {
      let url = '';
      if (rol === 'admin') {
        url = `/api/rapor/admin?filtre=${f}`;
      } else if (rol === 'yonetici') {
        url = `/api/rapor/yonetici?filtre=${f}&firma_id=${currentUser.firma_id}`;
      } else if (rol === 'kullanici') {
        url = `/api/rapor/kullanici?filtre=${f}&kullanici_id=${currentUser.kullanici_id}`;
      }
      const res  = await fetch(url);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error('Rapor yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, rol]);

  useEffect(() => {
    fetchData(filtre);
  }, [filtre, fetchData]);

  if (!rol) return null;

  return (
    <div className="rapor-wrapper">
      <div className="rapor-inner">
        <RaporIcerik
          rol={rol}
          filtre={filtre}
          setFiltre={setFiltre}
          data={data}
          loading={loading}
        />
      </div>
    </div>
  );
}
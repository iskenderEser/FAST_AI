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

const STIL_LABELS = ['Pragmatist', 'Activist', 'Theorist', 'Reflector'];

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

const CARD = {
  background: '#eef0f3',
  border: '0.5px solid #d1d5db',
  borderRadius: 'var(--border-radius-lg)',
  padding: '16px 18px',
  marginBottom: '12px',
};

const SECTION_TITLE = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: '10px',
};

const BADGE_STYLES = {
  'badge-green': { background: '#EAF3DE', color: '#3B6D11' },
  'badge-amber': { background: '#FAEEDA', color: '#854F0B' },
  'badge-gray':  { background: '#F1EFE8', color: '#5F5E5A' },
};

function Badge({ badge, label }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '11px', padding: '2px 8px',
      borderRadius: 'var(--border-radius-md)', fontWeight: 500,
      ...(BADGE_STYLES[badge] || BADGE_STYLES['badge-gray'])
    }}>
      {label}
    </span>
  );
}

function BarRow({ label, pct, color, sm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
      <div style={{
        fontSize: '12px', color: 'var(--color-text-secondary)',
        width: sm ? '110px' : '170px', flexShrink: 0,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </div>
      <div style={{ flex: 1, height: '7px', background: '#d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '4px', background: color, width: `${pct}%`, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', width: '32px', textAlign: 'right', flexShrink: 0 }}>
        {pct}%
      </div>
    </div>
  );
}

function FbGroupTitle({ children }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)',
      padding: '3px 8px', background: '#d1d5db',
      borderRadius: 'var(--border-radius-md)', display: 'inline-block',
      marginBottom: '8px', marginTop: '6px',
    }}>
      {children}
    </div>
  );
}

function TrendChart({ data }) {
  if (!data || !data.labels || !data.u || !data.a) return null;
  const maxU = Math.max(...data.u, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', marginTop: '8px' }}>
      {data.labels.map((lbl, i) => {
        const hU = Math.round((data.u[i] / maxU) * 60);
        const hA = Math.round((data.a[i] / maxU) * 60);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px', width: '100%' }}>
              <div style={{ flex: 1, height: `${hU}px`, background: '#B5D4F4', borderRadius: '3px 3px 0 0', minWidth: 0 }} />
              <div style={{ flex: 1, height: `${hA}px`, background: '#378ADD', borderRadius: '3px 3px 0 0', minWidth: 0 }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap' }}>{lbl}</div>
          </div>
        );
      })}
    </div>
  );
}

function TrendLegend() {
  return (
    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#B5D4F4', flexShrink: 0 }} />
        üretilen
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#378ADD', flexShrink: 0 }} />
        arşivlenen
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div style={{ background: '#eef0f3', border: '0.5px solid #d1d5db', borderRadius: 'var(--border-radius-md)', padding: '12px 14px' }}>
      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{sub}</div>
    </div>
  );
}

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

  const oran = data && data.uretilen > 0
    ? Math.round(data.arsivlenen / data.uretilen * 100)
    : 0;

  const icerik = (
    <>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {FILTRELER.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            style={{
              fontSize: '11px', padding: '4px 14px', borderRadius: '99px', cursor: 'pointer',
              border: filtre === f.key ? '0.5px solid #d1d5db' : '0.5px solid #e5e7eb',
              background: filtre === f.key ? '#eef0f3' : 'white',
              color: filtre === f.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: filtre === f.key ? 500 : 400,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
          ⏳ Yükleniyor...
        </div>
      )}

      {!loading && data && (
        <>
          {rol === 'admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '12px' }}>
              <MetricCard label="Toplam firma"    value={data.firma?.length ?? 0}    sub="aktif" />
              <MetricCard label="Toplam mümessil" value={data.mumessil?.length ?? 0} sub="aktif" />
              <MetricCard label="Üretilen CPR"    value={data.uretilen}              sub={data.sub} />
              <MetricCard label="Kullanım oranı"  value={`${oran}%`}                 sub="arşiv / üretim" />
            </div>
          )}
          {rol === 'yonetici' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px', marginBottom: '12px' }}>
              <MetricCard label="Üretilen CPR"   value={data.uretilen}   sub={data.sub} />
              <MetricCard label="Arşivlenen CPR" value={data.arsivlenen} sub={data.sub} />
              <MetricCard label="Kullanım oranı" value={`${oran}%`}      sub="arşiv / üretim" />
            </div>
          )}
          {rol === 'kullanici' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px', marginBottom: '12px' }}>
              <MetricCard label="Ürettiğim CPR"   value={data.uretilen}   sub={data.sub} />
              <MetricCard label="Arşivlediklerim" value={data.arsivlenen} sub={data.sub} />
              <MetricCard label="Kullanım oranım" value={`${oran}%`}      sub="arşiv / üretim" />
            </div>
          )}

          {rol === 'admin' && (
            <div style={CARD}>
              <div style={SECTION_TITLE}>Firma bazlı özet</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr>{['Firma','Mümessil','Üretilen','Arşivlenen','Oran'].map(h=><th key={h} style={{color:'var(--color-text-tertiary)',fontWeight:500,textAlign:'left',padding:'4px 8px 8px',borderBottom:'0.5px solid #d1d5db'}}>{h}</th>)}</tr></thead>
                <tbody>{(data.firma||[]).map((r,i)=><tr key={i}><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[0]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[1]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[2]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[3]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}><Badge badge={r[5]} label={r[4]}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {rol === 'admin' && (
            <div style={CARD}>
              <div style={SECTION_TITLE}>Tüm mümessiller</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr>{['Ad soyad','Firma','Üretilen','Arşivlenen','Oran','Son aktivite'].map(h=><th key={h} style={{color:'var(--color-text-tertiary)',fontWeight:500,textAlign:'left',padding:'4px 8px 8px',borderBottom:'0.5px solid #d1d5db'}}>{h}</th>)}</tr></thead>
                <tbody>{(data.mumessil||[]).map((r,i)=><tr key={i}><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[0]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db',color:'var(--color-text-tertiary)'}}>{r[1]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[2]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[3]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}><Badge badge={r[5]} label={r[4]}/></td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db',color:'var(--color-text-tertiary)'}}>{r[6]}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {rol === 'yonetici' && (
            <div style={CARD}>
              <div style={SECTION_TITLE}>Mümessil aktivitesi</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr>{['Ad soyad','Üretilen','Arşivlenen','Oran','Son aktivite'].map(h=><th key={h} style={{color:'var(--color-text-tertiary)',fontWeight:500,textAlign:'left',padding:'4px 8px 8px',borderBottom:'0.5px solid #d1d5db'}}>{h}</th>)}</tr></thead>
                <tbody>{(data.tablo||[]).map((r,i)=><tr key={i}><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[0]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[1]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}>{r[2]}</td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db'}}><Badge badge={r[4]} label={r[3]}/></td><td style={{padding:'7px 8px',borderBottom:'0.5px solid #d1d5db',color:'var(--color-text-tertiary)'}}>{r[5]}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          <div style={CARD}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '16px' }}>
              <div>
                <div style={SECTION_TITLE}>{rol === 'kullanici' ? 'Tercih ettiğim ürün' : 'Ürün bazlı kullanım'}</div>
                {(data.urun_adlari || []).map((ad, i) => <BarRow key={i} label={ad} pct={data.urun?.[i] ?? 0} color="#378ADD" sm />)}
              </div>
              <div>
                <div style={SECTION_TITLE}>{rol === 'kullanici' ? 'Tercih ettiğim stil' : 'Stil dağılımı'}</div>
                {(data.stil || []).map((pct, i) => <BarRow key={i} label={STIL_LABELS[i]} pct={pct} color={rol === 'kullanici' ? '#EF9F27' : '#1D9E75'} sm />)}
              </div>
            </div>
          </div>

          <div style={CARD}>
            <div style={SECTION_TITLE}>{rol === 'admin' ? "En çok kullanılan claim'ler (tüm firmalar)" : rol === 'kullanici' ? "En çok kullandığım claim'ler" : "En çok kullanılan claim'ler"}</div>
            {(data.claim_adlari || []).map((lbl, i) => <BarRow key={i} label={lbl} pct={data.claim?.[i] ?? 0} color="#7F77DD" />)}
          </div>

          <div style={CARD}>
            <div style={SECTION_TITLE}>{rol === 'kullanici' ? 'Arşivlememe nedenlerim' : 'Arşivlenmeyen CPR'}</div>
            <FbGroupTitle>Sistem kaynaklı</FbGroupTitle>
            {SYS_LABELS.map((lbl, i) => <BarRow key={i} label={lbl} pct={data.fb?.sys?.[i] ?? 0} color="#7F77DD" />)}
            <FbGroupTitle>Kullanıcı kaynaklı</FbGroupTitle>
            {USR_LABELS.map((lbl, i) => <BarRow key={i} label={lbl} pct={data.fb?.usr?.[i] ?? 0} color="#EF9F27" />)}
          </div>

          <div style={CARD}>
            <div style={SECTION_TITLE}>{data.sub}</div>
            <TrendChart data={data.trend} />
            <TrendLegend />
          </div>
        </>
      )}
    </>
  );

  if (rol === 'kullanici') {
    return (
      <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '0.5px solid #eee', padding: '20px' }}>
          {icerik}
        </div>
      </div>
    );
  }

  return icerik;
}
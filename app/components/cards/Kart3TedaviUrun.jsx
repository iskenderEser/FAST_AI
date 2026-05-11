'use client';

import { useFastCPR } from '../../context/FastCPRContext';
import { Accordion } from '../ui/Accordion';

// ============================================
// SHARED STYLES
// ============================================

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#6b7280',
  marginBottom: '4px'
};

const selectStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#111827',
  background: '#fff',
  cursor: 'pointer',
  outline: 'none',
  boxSizing: 'border-box'
};

const inputStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box'
};

const readonlyStyle = {
  padding: '6px 8px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#374151',
  background: '#f9fafb',
  boxSizing: 'border-box'
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0px'
};

const previewClaimStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  fontSize: '12px',
  color: '#1d4ed8',
  marginTop: '4px'
};

const previewRakipStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  fontSize: '12px',
  color: '#c2410c',
  marginTop: '4px'
};

const dividerStyle = {
  borderTop: '1px solid #f3f4f6',
  margin: '8px 0'
};

// ============================================
// REUSABLE FORM COMPONENTS
// ============================================

function SelectField({ label, value, onChange, options, placeholder = 'Seçiniz...', disabled = false }) {
  return (
    <div style={formGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <select
        style={selectStyle}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={typeof opt === 'string' ? opt : opt.id}>
            {typeof opt === 'string' ? opt : opt.urun_adi}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div style={formGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={readonlyStyle}>{value || '—'}</div>
    </div>
  );
}

// ============================================
// PRODUCT DETAILS SECTION
// ============================================

function ProductDetailsSection({ selectedUrun, usageType, setUsageType, posologyOptions, posology, setPosology, editability }) {
  if (!selectedUrun) return null;

  return (
    <>
      <div style={dividerStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <ReadonlyField label="Tedavi Alanı" value={selectedUrun.atc_kodu} />

        <div style={formGroupStyle}>
          <label style={labelStyle}>Kullanım Şekli</label>
          {editability.kullanim_sekli ? (
            <select
              style={selectStyle}
              value={usageType}
              onChange={(e) => setUsageType(e.target.value)}
            >
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
            <div style={readonlyStyle}>{usageType}</div>
          )}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Pozoloji</label>
          {editability.pozoloji ? (
            <select
              style={selectStyle}
              value={posology}
              onChange={(e) => setPosology(e.target.value)}
            >
              <option value="">Seçiniz...</option>
              {posologyOptions.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          ) : (
            <div style={readonlyStyle}>{posology}</div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================
// CLAIM SECTION
// ============================================

function ClaimSection({ claims, selectedClaim, onClaimChange }) {
  if (!claims.length) return null;

  return (
    <>
      <div style={dividerStyle} />
      <SelectField
        label="Hasta Şikayeti"
        value={selectedClaim}
        onChange={onClaimChange}
        options={claims.map(c => c.claim)}
        placeholder="Şikayet seçiniz..."
      />
      {selectedClaim && (
        <div style={previewClaimStyle}>
          {selectedClaim}
        </div>
      )}
    </>
  );
}

// ============================================
// COMPETITOR SECTION
// ============================================

function CompetitorSection({ selectedUrun, selectedRakip, selectedRakipEtken, onRakipChange, onEtkenChange }) {
  if (!selectedUrun) return null;

  return (
    <>
      <div style={dividerStyle} />
      <label style={labelStyle}>Rakip Ürün Bilgileri</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={formGroupStyle}>
          <label style={{ ...labelStyle, fontWeight: 400 }}>Ürün Adı</label>
          <input
            type="text"
            style={inputStyle}
            value={selectedRakip}
            onChange={(e) => onRakipChange(e.target.value)}
            placeholder="Örn: Duocid"
          />
        </div>
        <div style={formGroupStyle}>
          <label style={{ ...labelStyle, fontWeight: 400 }}>Etken Madde</label>
          <input
            type="text"
            style={inputStyle}
            value={selectedRakipEtken}
            onChange={(e) => onEtkenChange(e.target.value)}
            placeholder="Örn: ampisilin+sulbaktam"
          />
        </div>
      </div>
      {selectedRakip && (
        <div style={previewRakipStyle}>
          Rakip: <strong>{selectedRakip}</strong>
          {selectedRakipEtken && ` — ${selectedRakipEtken}`}
        </div>
      )}
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Kart3TedaviUrun() {
  const {
    urunler,
    selectedUrun,
    handleUrunSelect,
    usageType, setUsageType,
    posologyOptions, posology, setPosology,
    editability,
    claims,
    selectedClaim,
    handleClaimChange,
    selectedRakip,
    handleRakipChange,
    selectedRakipEtken, setSelectedRakipEtken,
  } = useFastCPR();

  const isProductSelected = !!selectedUrun;

  return (
    <Accordion
      title="Tedavi Alanı ve Tanıtım Ürünü"
      subtitle="Ürün seçimi ve bilgileri"
      defaultOpen={true}
      counterBadge={isProductSelected ? 'Hazır' : null}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SelectField
          label="Ürün Seçiniz"
          value={selectedUrun?.id || ''}
          onChange={handleUrunSelect}
          options={urunler}
          placeholder="Seçiniz..."
        />

        <ProductDetailsSection
          selectedUrun={selectedUrun}
          usageType={usageType}
          setUsageType={setUsageType}
          posologyOptions={posologyOptions}
          posology={posology}
          setPosology={setPosology}
          editability={editability}
        />

        <ClaimSection
          claims={claims}
          selectedClaim={selectedClaim}
          onClaimChange={handleClaimChange}
        />

        <CompetitorSection
          selectedUrun={selectedUrun}
          selectedRakip={selectedRakip}
          selectedRakipEtken={selectedRakipEtken}
          onRakipChange={handleRakipChange}
          onEtkenChange={setSelectedRakipEtken}
        />
      </div>
    </Accordion>
  );
}
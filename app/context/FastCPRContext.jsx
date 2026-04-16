'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FastCPRContext = createContext(null);

export function FastCPRProvider({ children }) {

  const { currentUser } = useAuth();

  // ─── Ürün Listesi ───────────────────────────────────────────────
  const [urunler, setUrunler] = useState([]);

  // ─── Seçili Ürün ────────────────────────────────────────────────
  const [selectedUrun, setSelectedUrun] = useState(null);

  // ─── Kullanım Şekli ─────────────────────────────────────────────
  const [usageType, setUsageType] = useState('');

  // ─── Pozoloji ───────────────────────────────────────────────────
  const [posologyOptions, setPosologyOptions] = useState([]);
  const [posology, setPosology] = useState('');

  // ─── Editability ────────────────────────────────────────────────
  const [editability, setEditability] = useState({
    kullanim_sekli: false,
    pozoloji:       false,
    ozellikler:     false,
    avantaj:        false,
    fayda:          false,
  });

  // ─── Özellikler ─────────────────────────────────────────────────
  const [ozellikOptions, setOzellikOptions] = useState([]);

  // ─── Claim Listesi ──────────────────────────────────────────────
  const [claims, setClaims]     = useState([]);
  const [problems, setProblems] = useState([]);

  // ─── Seçili Claim ───────────────────────────────────────────────
  const [selectedClaim, setSelectedClaim]         = useState('');
  const [selectedClaimText, setSelectedClaimText] = useState('');
  const [selectedProblem, setSelectedProblem]     = useState('');

  // ─── Rakip ──────────────────────────────────────────────────────
  const [selectedRakip, setSelectedRakip]           = useState('');
  const [selectedRakipEtken, setSelectedRakipEtken] = useState('');
  const [selectedRakipDoz, setSelectedRakipDoz]     = useState('');

  // ─── Öğrenme Stilleri ───────────────────────────────────────────
  const [learningStyles, setLearningStyles] = useState([]);

  // ─── CPR Metinleri ──────────────────────────────────────────────
  const [cprTexts, setCprTexts] = useState({
    activist: '', reflector: '', theorist: '', pragmatist: ''
  });

  // ─── Feedback ID ────────────────────────────────────────────────
  const [feedbackId, setFeedbackId] = useState(null);

  // ────────────────────────────────────────────────────────────────
  // Uygulama açılırken ürün listesini çek
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadUrunler() {
      try {
        const firmaId = currentUser?.firma_id;
        const url = firmaId ? `/api/urun/list?firma_id=${firmaId}` : '/api/urun/list';
        const res  = await fetch(url);
        const data = await res.json();
        if (data.success) setUrunler(data.urunler);
      } catch (err) {
        console.error('Ürün listesi yüklenemedi:', err);
      }
    }
    loadUrunler();
  }, [currentUser]);

  // ────────────────────────────────────────────────────────────────
  // Ürün seçilince detay + claim + problem listesini çek
  // ────────────────────────────────────────────────────────────────
  async function handleUrunSelect(urunId) {
    if (!urunId) {
      setSelectedUrun(null);
      setUsageType('');
      setPosologyOptions([]);
      setPosology('');
      setEditability({ kullanim_sekli: false, pozoloji: false, ozellikler: false, avantaj: false, fayda: false });
      setOzellikOptions([]);
      setClaims([]);
      setProblems([]);
      setSelectedClaim('');
      setSelectedClaimText('');
      setSelectedProblem('');
      setSelectedRakip('');
      setSelectedRakipEtken('');
      setSelectedRakipDoz('');
      setCprTexts({ activist: '', reflector: '', theorist: '', pragmatist: '' });
      setFeedbackId(null);
      return;
    }

    try {
      const detayRes  = await fetch(`/api/urun/detail?id=${urunId}`);
      const detayData = await detayRes.json();

      if (detayData.success) {
        const u = detayData.urun;
        setSelectedUrun(u);
        setUsageType(u.kullanim_sekli || '');
        setPosologyOptions(u.pozoloji  || []);
        setPosology(u.pozoloji?.[0]    || '');
        setOzellikOptions(u.ozellikler || []);
        setEditability({
          kullanim_sekli: u.kullanim_sekli_editable,
          pozoloji:       u.pozoloji_editable,
          ozellikler:     u.ozellikler_editable,
          avantaj:        u.avantaj_editable,
          fayda:          u.fayda_editable,
        });

        const contentRes  = await fetch(`/api/cpr/get-content?atc=${u.atc_kodu}`);
        const contentData = await contentRes.json();
        if (contentData.success) {
          setClaims(contentData.claims   || []);
          setProblems(contentData.problems || []);
        }
      }

      setSelectedClaim('');
      setSelectedClaimText('');
      setSelectedProblem('');
      setSelectedRakip('');
      setSelectedRakipEtken('');
      setSelectedRakipDoz('');
      setCprTexts({ activist: '', reflector: '', theorist: '', pragmatist: '' });
      setFeedbackId(null);

    } catch (err) {
      console.error('Ürün detayı yüklenemedi:', err);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Claim seçilince aynı sira'daki problem bulunur
  // ────────────────────────────────────────────────────────────────
  function handleClaimChange(claimText) {
    setSelectedClaim(claimText);
    setSelectedClaimText(claimText);
    const claim   = claims.find(c => c.claim === claimText);
    const problem = problems.find(p => p.sira === claim?.sira);
    setSelectedProblem(problem?.problem || '');
  }

  // ────────────────────────────────────────────────────────────────
  // Rakip
  // ────────────────────────────────────────────────────────────────
  function handleRakipChange(value) {
    setSelectedRakip(value);
  }

  // ────────────────────────────────────────────────────────────────
  // Öğrenme Stili — manuel toggle
  // ────────────────────────────────────────────────────────────────
  function handleLearningStyleToggle(styleId) {
    setLearningStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  }

  // ────────────────────────────────────────────────────────────────
  // Öğrenme Stili — hepsini seç / kaldır
  // ────────────────────────────────────────────────────────────────
  function handleToggleAll(allStyles) {
    if (learningStyles.length === allStyles.length) {
      setLearningStyles([]);
    } else {
      setLearningStyles(allStyles.map(s => s.id));
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Öğrenme Stili — LSA testi sonucu otomatik hesaplama
  // ────────────────────────────────────────────────────────────────
  function handleLSAStyleCalculated(stilAdi, styleToId) {
    const styleId = styleToId[stilAdi];
    if (!styleId) return;
    setLearningStyles([styleId]);
  }

  // ────────────────────────────────────────────────────────────────
  // Context Value
  // ────────────────────────────────────────────────────────────────
  const value = {
    // Ürün
    urunler,
    selectedUrun,
    handleUrunSelect,

    // Kullanım & Pozoloji
    usageType,
    setUsageType,
    posologyOptions,
    posology,
    setPosology,

    // Editability & Özellikler
    editability,
    ozellikOptions,

    // Claim
    claims,
    selectedClaim,
    selectedClaimText,
    selectedProblem,
    handleClaimChange,

    // Rakip
    selectedRakip,
    handleRakipChange,
    selectedRakipEtken,
    setSelectedRakipEtken,
    selectedRakipDoz,
    setSelectedRakipDoz,

    // Öğrenme Stili
    learningStyles,
    handleLearningStyleToggle,
    handleToggleAll,
    handleLSAStyleCalculated,

    // CPR Metinleri
    cprTexts,
    setCprTexts,

    // Feedback
    feedbackId,
    setFeedbackId,
  };

  return (
    <FastCPRContext.Provider value={value}>
      {children}
    </FastCPRContext.Provider>
  );
}

export function useFastCPR() {
  const ctx = useContext(FastCPRContext);
  if (!ctx) throw new Error('useFastCPR, FastCPRProvider içinde kullanılmalıdır.');
  return ctx;
}
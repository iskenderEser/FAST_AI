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

  // ─── Claim Listesi ──────────────────────────────────────────────
  const [claims, setClaims] = useState([]);

  // ─── Problem Listesi ────────────────────────────────────────────
  const [problems, setProblems] = useState([]);

  // ─── Seçili Claim ───────────────────────────────────────────────
  const [selectedClaim, setSelectedClaim]         = useState('');
  const [selectedClaimText, setSelectedClaimText] = useState('');

  // ─── Seçili Problem ─────────────────────────────────────────────
  const [selectedProblem, setSelectedProblem] = useState('');

  // ─── Rakip ──────────────────────────────────────────────────────
  const [selectedRakip, setSelectedRakip]           = useState('');
  const [selectedRakipEtken, setSelectedRakipEtken] = useState('');

  // ─── Öğrenme Stilleri ───────────────────────────────────────────
  const [learningStyles, setLearningStyles] = useState([]);

  // ─── CPR Metinleri ──────────────────────────────────────────────
  const [cprTexts, setCprTexts] = useState({
    activist: '', reflector: '', theorist: '', pragmatist: ''
  });

  // ─── Feedback ID ────────────────────────────────────────────────
  const [feedbackId, setFeedbackId] = useState(null);

  // ─── Editability ────────────────────────────────────────────────
  const editability = {
    kullanim_sekli: false,
    pozoloji: false
  };

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
      setClaims([]);
      setProblems([]);
      setSelectedClaim('');
      setSelectedClaimText('');
      setSelectedProblem('');
      setSelectedRakip('');
      setSelectedRakipEtken('');
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
      setCprTexts({ activist: '', reflector: '', theorist: '', pragmatist: '' });
      setFeedbackId(null);

    } catch (err) {
      console.error('Ürün detayı yüklenemedi:', err);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Claim seçilince — eşleşen problem'i de bul
  // ────────────────────────────────────────────────────────────────
  function handleClaimChange(claimText) {
    setSelectedClaim(claimText);
    setSelectedClaimText(claimText);

    const claimIndex = claims.findIndex(c => c.claim === claimText);
    if (claimIndex !== -1 && problems[claimIndex]) {
      setSelectedProblem(problems[claimIndex].problem);
    } else {
      setSelectedProblem('');
    }
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

    // Editability
    editability,

    // Claim
    claims,
    selectedClaim,
    selectedClaimText,
    handleClaimChange,

    // Problem
    problems,
    selectedProblem,

    // Rakip
    selectedRakip,
    handleRakipChange,
    selectedRakipEtken,
    setSelectedRakipEtken,

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
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const FastCPRContext = createContext(null);

export function useFastCPR() {
  return useContext(FastCPRContext);
}

export function FastCPRProvider({ children }) {

  // ============================================
  // ÖĞRENME STİLİ
  // ============================================
  const [learningStyles, setLearningStyles] = useState([]);

  // ============================================
  // ÜRÜN / ATC
  // ============================================
  const [urunler, setUrunler]               = useState([]);
  const [selectedUrun, setSelectedUrun]     = useState(null);
  const [atcCode, setAtcCode]               = useState('');
  const [usageType, setUsageType]           = useState('');
  const [posologyOptions, setPosologyOptions] = useState([]);
  const [posology, setPosology]             = useState('');
  const [ozellikOptions, setOzellikOptions] = useState([]);

  // ============================================
  // EDITABILITY
  // ============================================
  const [editability, setEditability] = useState({
    kullanim_sekli: true,
    pozoloji:       true,
    ozellikler:     true,
    avantaj:        true,
    fayda:          true
  });

  // ============================================
  // CPR STATE
  // ============================================
  const [claims, setClaims]                       = useState([]);
  const [advantages, setAdvantages]               = useState([]);
  const [benefits, setBenefits]                   = useState([]);
  const [problems, setProblems]                   = useState([]);
  const [selectedClaim, setSelectedClaim]         = useState('');
  const [selectedClaimText, setSelectedClaimText] = useState('');
  const [selectedProblem, setSelectedProblem]     = useState('');
  const [advCategory, setAdvCategory]             = useState('');
  const [selectedAdv, setSelectedAdv]             = useState('');
  const [selectedAdvText, setSelectedAdvText]     = useState('');
  const [selectedBen, setSelectedBen]             = useState('');
  const [selectedBenText, setSelectedBenText]     = useState('');
  const [ozellik, setOzellik]                     = useState('');
  const [recommendation, setRecommendation]       = useState('');
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [autoCPR, setAutoCPR]                     = useState('');
  const [cprLoading, setCprLoading]               = useState(false);

  // ============================================
  // ÜRÜN LİSTESİ — sayfa açılınca yükle
  // ============================================
  useEffect(() => {
    async function loadUrunler() {
      try {
        const res  = await fetch('/api/urun/list');
        const data = await res.json();
        if (data.success) setUrunler(data.urunler || []);
      } catch (err) {
        console.error('Ürün listesi yüklenemedi:', err);
      }
    }
    loadUrunler();
  }, []);

  // ============================================
  // RECOMMENDATION — AI ile üret
  // ============================================
  async function handleGenerateRecommendation(advText, problem, urunAdi, kullanim, poz) {
    if (!advText || !problem || !urunAdi || !kullanim || !poz) {
      setRecommendation('');
      return;
    }
    setRecommendationLoading(true);
    try {
      const res  = await fetch('/api/cpr/recommendation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          urun:           urunAdi,
          avantaj:        advText,
          kullanim_sekli: kullanim,
          pozoloji:       poz,
          problem
        })
      });
      const data = await res.json();
      if (data.success) setRecommendation(data.recommendation);
    } catch (err) {
      console.error('Recommendation üretilemedi:', err);
    } finally {
      setRecommendationLoading(false);
    }
  }

  // ============================================
  // HANDLERS
  // ============================================
  function handleLearningStyleToggle(styleId) {
    setLearningStyles(prev =>
      prev.includes(styleId) ? prev.filter(s => s !== styleId) : [...prev, styleId]
    );
  }

  function handleToggleAll(allStyles) {
    setLearningStyles(prev =>
      prev.length === allStyles.length ? [] : allStyles.map(s => s.id)
    );
  }

  function handleLSAStyleCalculated(stilAdi, STYLE_TO_ID) {
    const id = STYLE_TO_ID[stilAdi];
    if (id && !learningStyles.includes(id)) setLearningStyles(prev => [...prev, id]);
  }

  async function handleUrunSelect(urunId) {
    if (!urunId) {
      setSelectedUrun(null);
      setAtcCode('');
      setUsageType('');
      setPosologyOptions([]);
      setPosology('');
      setOzellikOptions([]);
      setClaims([]); setAdvantages([]); setBenefits([]); setProblems([]);
      setSelectedClaim(''); setSelectedClaimText(''); setSelectedProblem('');
      setAdvCategory(''); setSelectedAdv(''); setSelectedAdvText('');
      setSelectedBen(''); setSelectedBenText('');
      setOzellik('');
      setRecommendation('');
      return;
    }
    try {
      const res  = await fetch(`/api/urun/detail?id=${urunId}`);
      const data = await res.json();
      if (!data.success) return;
      const urun = data.urun;
      setSelectedUrun(urun);
      setAtcCode(urun.atc_kodu);
      setUsageType(urun.kullanim_sekli);
      setPosologyOptions(urun.pozoloji || []);
      setPosology(urun.pozoloji?.[0] || '');
      setOzellikOptions(urun.ozellikler || []);
      setOzellik('');
      setEditability({
        kullanim_sekli: urun.kullanim_sekli_editable ?? true,
        pozoloji:       urun.pozoloji_editable ?? true,
        ozellikler:     urun.ozellikler_editable ?? true,
        avantaj:        urun.avantaj_editable ?? true,
        fayda:          urun.fayda_editable ?? true
      });
      setClaims([]); setAdvantages([]); setBenefits([]); setProblems([]);
      setSelectedClaim(''); setSelectedClaimText(''); setSelectedProblem('');
      setAdvCategory(''); setSelectedAdv(''); setSelectedAdvText('');
      setSelectedBen(''); setSelectedBenText('');
      setRecommendation('');
      const res2  = await fetch(`/api/cpr/get-content?atc=${urun.atc_kodu}`);
      const data2 = await res2.json();
      if (data2.success) {
        setClaims(data2.claims || []);
        setAdvantages(data2.advantages || []);
        setBenefits(data2.benefits || []);
        setProblems(data2.problems || []);
      }
    } catch (err) {
      console.error('Ürün detayı yüklenemedi:', err);
    }
  }

  function handleClaimChange(val) {
    setSelectedClaim(val);
    setSelectedClaimText(val);
    const claimObj = claims.find(c => c.claim === val);
    if (claimObj) {
      const problemObj = problems.find(p => p.sira === claimObj.sira);
      setSelectedProblem(problemObj ? problemObj.problem : '');
    } else {
      setSelectedProblem('');
    }
    setRecommendation('');
  }

  function handleAdvCategoryChange(cat) {
    setAdvCategory(cat);
    setSelectedAdv(''); setSelectedAdvText('');
    setSelectedBen(''); setSelectedBenText('');
    setRecommendation('');
  }

  function handleAdvChange(val) {
    setSelectedAdv(val);
    setSelectedAdvText(val);
    setSelectedBen(''); setSelectedBenText('');
    setRecommendation('');
  }

  function handleBenChange(val) {
    setSelectedBen(val);
    setSelectedBenText(val);
    const urunAdi = selectedUrun?.urun_adi || '';
    handleGenerateRecommendation(selectedAdvText, selectedProblem, urunAdi, usageType, posology);
  }

  async function handleGenerateCPR() {
    const urunAdi = selectedUrun?.urun_adi || '';
    if (!selectedClaimText || !ozellik || !urunAdi || !selectedAdvText || !selectedBenText || !recommendation) {
      alert('Lütfen tüm CPR alanlarını doldurun: Claim, Özellik, Ürün, Avantaj, Fayda, Recommendation');
      return;
    }
    setCprLoading(true);
    try {
      const res  = await fetch('/api/cpr/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          claim:          selectedClaimText,
          ozellik,
          urun:           urunAdi,
          avantaj:        selectedAdvText,
          fayda:          selectedBenText,
          recommendation,
          atc_kodu:       atcCode,
          kullanim_sekli: usageType,
          pozoloji:       posology,
          adv_kategori:   advCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        setAutoCPR(data.cpr);
      } else {
        alert('CPR üretilemedi: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (err) {
      alert('Bağlantı hatası: ' + err.message);
    } finally {
      setCprLoading(false);
    }
  }

  const filteredAdvantages = advantages.filter(a => a.kategori === advCategory);
  const filteredBenefits   = benefits.filter(b => b.kategori === advCategory);

  return (
    <FastCPRContext.Provider value={{
      learningStyles, setLearningStyles,
      handleLearningStyleToggle, handleToggleAll, handleLSAStyleCalculated,
      urunler,
      selectedUrun, handleUrunSelect,
      atcCode,
      usageType, setUsageType,
      posologyOptions, posology, setPosology,
      ozellikOptions, ozellik, setOzellik,
      editability,
      claims, advantages, benefits, problems,
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
    }}>
      {children}
    </FastCPRContext.Provider>
  );
}
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useFastCPR } from '../../../../context/FastCPRContext';
import { buildDocDefinition, sanitizeFilename, downloadPDF } from '../../../../utils/pdfUtils';
import { STYLES, STYLE_LABELS } from '../constants';

export function useStyleCPR() {
  const { currentUser } = useAuth();
  const {
    learningStyles,
    selectedUrun,
    selectedClaimText,
    usageType,
    posology,
    selectedRakip,
    selectedRakipEtken,
    cprTexts,
    setCprTexts,
    feedbackId,
    setFeedbackId,
  } = useFastCPR();

  const [loading, setLoading] = useState({ activist: false, reflector: false, theorist: false, pragmatist: false });
  const [btnState, setBtnState] = useState({ activist: 'idle', reflector: 'idle', theorist: 'idle', pragmatist: 'idle' });
  const [savingStyle, setSavingStyle] = useState(null);
  const [modal, setModal] = useState({ open: false, styleId: null });
  const [seciliNedenler, setSeciliNedenler] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const cprUretildi = useRef(false);
  const manuelDuzenlendi = useRef({});
  const textareaRefs = useRef({});

  const kartAcik = selectedUrun && selectedClaimText && learningStyles.length > 0;
  const visibleStyles = learningStyles.length > 0
    ? STYLES.filter(s => learningStyles.includes(s.id))
    : [];

  const tetikle = useCallback((styleId) => {
    const herhangiCpr = Object.values(cprTexts).some(t => t && t.trim() !== '');
    if (!herhangiCpr || !feedbackId) return;
    setSeciliNedenler([]);
    setModal({ open: true, styleId });
  }, [cprTexts, feedbackId]);

  const prevUrun = useRef(selectedUrun?.id);
  useEffect(() => {
    if (prevUrun.current && prevUrun.current !== selectedUrun?.id) tetikle(null);
    prevUrun.current = selectedUrun?.id;
  }, [selectedUrun?.id, tetikle]);

  const prevClaim = useRef(selectedClaimText);
  useEffect(() => {
    if (prevClaim.current && prevClaim.current !== selectedClaimText) tetikle(null);
    prevClaim.current = selectedClaimText;
  }, [selectedClaimText, tetikle]);

  const prevStyles = useRef(JSON.stringify(learningStyles));
  useEffect(() => {
    const yeni = JSON.stringify(learningStyles);
    if (prevStyles.current && prevStyles.current !== yeni) tetikle(null);
    prevStyles.current = yeni;
  }, [learningStyles, tetikle]);

  const prevRakip = useRef(selectedRakip);
  useEffect(() => {
    if (prevRakip.current && prevRakip.current !== selectedRakip) tetikle(null);
    prevRakip.current = selectedRakip;
  }, [selectedRakip, tetikle]);

  const handleConvert = useCallback(async (styleId) => {
    if (!kartAcik) {
      alert('⚠️ Önce ürün, hasta şikayeti ve öğrenme stili seçmelisiniz!');
      return;
    }

    if (cprUretildi.current) tetikle(styleId);

    setLoading(prev => ({ ...prev, [styleId]: true }));
    setBtnState(prev => ({ ...prev, [styleId]: 'loading' }));
    try {
      const response = await fetch('/api/cpr/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kullanici_id: currentUser?.kullanici_id,
          firma_id: currentUser?.firma_id,
          urun_id: selectedUrun?.id,
          stil: styleId,
          urun: selectedUrun.urun_adi,
          claim: selectedClaimText,
          kullanim_sekli: usageType,
          pozoloji: posology,
          rakip: selectedRakip,
          rakip_etken: selectedRakipEtken,
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setCprTexts(prev => ({ ...prev, [styleId]: data.cpr }));
      setFeedbackId(data.feedback_id ?? null);
      cprUretildi.current = true;
      manuelDuzenlendi.current[styleId] = false;
      setBtnState(prev => ({ ...prev, [styleId]: 'success' }));
      setTimeout(() => setBtnState(prev => ({ ...prev, [styleId]: 'idle' })), 2000);
    } catch (err) {
      console.error('Dönüşüm hatası:', err);
      setBtnState(prev => ({ ...prev, [styleId]: 'error' }));
      setTimeout(() => setBtnState(prev => ({ ...prev, [styleId]: 'idle' })), 3000);
    } finally {
      setLoading(prev => ({ ...prev, [styleId]: false }));
    }
  }, [kartAcik, currentUser, selectedUrun, selectedClaimText, usageType, posology, selectedRakip, selectedRakipEtken, setCprTexts, setFeedbackId, tetikle]);

  const handleSaveAndDownload = useCallback(async () => {
    if (!selectedUrun) {
      alert('⚠️ Önce bir ürün seçiniz.');
      return;
    }
    const hasCpr = learningStyles.some(id => cprTexts[id]);
    if (!hasCpr) {
      alert('⚠️ En az bir CPR üretilmelidir.');
      return;
    }

    const stilCprlar = learningStyles
      .filter(id => cprTexts[id])
      .map(id => ({ stil: STYLE_LABELS[id] || id, cpr: cprTexts[id] }));

    const pdfData = {
      tarih: new Date().toLocaleString('tr-TR'),
      urun: selectedUrun?.urun_adi || '',
      tedavi_alani: selectedUrun?.atc_kodu || '',
      kullanim_sekli: usageType || '',
      pozoloji: posology || '',
      claim: selectedClaimText || '',
      ogrenme_stili: learningStyles.map(id => STYLE_LABELS[id] || id).join(', '),
      stil_cprlar: stilCprlar,
    };

    const docDef = buildDocDefinition(pdfData);
    const fileName = sanitizeFilename(`FAST_CPR_${pdfData.urun || 'Rapor'}.pdf`);
    await downloadPDF(docDef, fileName);

    if (!currentUser?.kullanici_id) return;
    setSavingStyle(true);
    try {
      const res = await fetch('/api/pdf/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kullanici_id: currentUser.kullanici_id,
          feedback_id: feedbackId ?? null,
          ...pdfData,
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ PDF indirildi ve arşive eklendi!');
        cprUretildi.current = false;
        manuelDuzenlendi.current = {};
      }
    } catch (err) {
      console.error('PDF kaydedilemedi:', err);
    } finally {
      setSavingStyle(null);
    }
  }, [selectedUrun, learningStyles, cprTexts, usageType, posology, selectedClaimText, currentUser, feedbackId]);

  const toggleNeden = useCallback((key) => {
    setSeciliNedenler(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  }, []);

  const handleModalGonder = useCallback(async () => {
    if (seciliNedenler.length === 0 || !feedbackId) return;
    setModalLoading(true);
    try {
      await fetch('/api/cpr/feedback-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId, nedenler: seciliNedenler })
      });
    } catch (err) {
      console.error('Feedback güncelleme hatası:', err);
    } finally {
      setModalLoading(false);
      setModal({ open: false, styleId: null });
      setSeciliNedenler([]);
    }
  }, [seciliNedenler, feedbackId]);

  const closeModal = useCallback(() => {
    setModal({ open: false, styleId: null });
    setSeciliNedenler([]);
  }, []);

  return {
    loading,
    btnState,
    savingStyle,
    modal,
    seciliNedenler,
    modalLoading,
    cprTexts,
    kartAcik,
    visibleStyles,
    textareaRefs,
    cprUretildi,
    manuelDuzenlendi,
    setCprTexts,
    handleConvert,
    handleSaveAndDownload,
    toggleNeden,
    handleModalGonder,
    closeModal,
  };
}
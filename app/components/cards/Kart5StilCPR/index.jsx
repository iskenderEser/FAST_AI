'use client';

import { Accordion } from '../../ui/Accordion'; // import { Accordion } from '@/components/ui/Accordion';
import { StyleCard } from './StyleCard'; // import { StyleCard } from '@/components/cards/Kart5StilCPR/StyleCard.jsx'; 
import { FeedbackModal } from './FeedbackModal'; // import { FeedbackModal } from '@/components/cards/Kart5StilCPR/FeedbackModal.jsx';
import { WarningBanner } from './WarningBanner'; // import { WarningBanner } from '@/components/cards/Kart5StilCPR/WarningBanner.jsx';
import { useStyleCPR } from './hooks/useStyleCPR'; // import { useStyleCPR } from '@/components/cards/Kart5StilCPR/hooks/useStyleCPR';

function autoResize(textareaRefs, styleId) {
  const el = textareaRefs.current[styleId];
  if (el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
}

export default function Kart5StilCPR() {
  const {
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
    setCprTexts,
    handleConvert,
    handleSaveAndDownload,
    toggleNeden,
    handleModalGonder,
    closeModal,
  } = useStyleCPR();

  const handleTextChange = (styleId, value) => {
    setCprTexts(prev => ({ ...prev, [styleId]: value }));
    autoResize(textareaRefs, styleId);
  };

  const isSaving = (styleId) => savingStyle === styleId;

  return (
    <Accordion
      title="Stil Bazlı CPR"
      subtitle="(öğrenme stiline uygun)"
      defaultOpen={true}
      counterBadge={`${visibleStyles.length} stil`}
    >
      <div className="kart5-container">
        {!kartAcik && <WarningBanner message="Önce ürün, hasta şikayeti ve öğrenme stili seçiniz." />}
        
        <div className="style-grid">
          {visibleStyles.map(style => (
            <StyleCard
              key={style.id}
              style={style}
              isActive={kartAcik}
              cprText={cprTexts[style.id] || ''}
              isLoading={loading[style.id]}
              btnState={btnState[style.id]}
              onConvert={() => handleConvert(style.id)}
              onTextChange={(e) => handleTextChange(style.id, e.target.value)}
              onSave={() => handleSaveAndDownload(style.id)}
              isSaving={isSaving(style.id)}
              textareaRef={el => textareaRefs.current[style.id] = el}
            />
          ))}
        </div>
      </div>

      <FeedbackModal
        isOpen={modal.open}
        onClose={closeModal}
        onSend={handleModalGonder}
        selectedReasons={seciliNedenler}
        onToggleReason={toggleNeden}
        isLoading={modalLoading}
      />
    </Accordion>
  );
}
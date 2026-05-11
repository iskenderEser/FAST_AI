'use client';

import { useState, useEffect } from 'react';
import { useFastCPR } from '../../context/FastCPRContext';
import { Button } from '../ui/Button';
import { Accordion } from '../ui/Accordion';
import { Pill } from '../ui/Pill';

const LEARNING_STYLES = [
  { id: 'activist',   label: 'ACTIVIST'   },
  { id: 'reflector',  label: 'REFLECTOR'  },
  { id: 'theorist',   label: 'THEORIST'   },
  { id: 'pragmatist', label: 'PRAGMATIST' }
];

const STYLE_TO_ID = {
  Activist:   'activist',
  Reflector:  'reflector',
  Theorist:   'theorist',
  Pragmatist: 'pragmatist'
};

const STYLE_MAP = {
  'CE+AE': 'Activist',
  'CE+RO': 'Reflector',
  'AC+RO': 'Theorist',
  'AC+AE': 'Pragmatist'
};

// ============================================
// SELECTABLE OPTION CARD
// ============================================

function SelectableOptionCard({ question, isSelected, onClick, isEven }) {
  const cardClass = [
    'kart2__option',
    isSelected ? 'kart2__option--selected' : '',
    isEven ? 'kart2__option--even' : 'kart2__option--odd'
  ].filter(Boolean).join(' ');

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className={cardClass}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={isSelected ? 'kart2__checkbox kart2__checkbox--selected' : 'kart2__checkbox'}>
        {isSelected && (
          <svg aria-hidden="true" width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={isSelected ? 'kart2__option-text kart2__option-text--selected' : 'kart2__option-text'}>
        {question.soru}
      </span>
    </div>
  );
}

// ============================================
// WARNING MESSAGE
// ============================================

function WarningMessage({ message }) {
  if (!message) return null;
  return <div className="kart2__warning">⚠️ {message}</div>;
}

// ============================================
// SORU LİSTESİ
// ============================================

function QuestionList({ questions, selections, onCheck }) {
  return (
    <div className="kart2__list">
      {questions.map((q, i) => (
        <SelectableOptionCard
          key={q.sira}
          question={q}
          isSelected={!!selections[q.sira]}
          onClick={() => onCheck(q.sira)}
          isEven={i % 2 === 0}
        />
      ))}
    </div>
  );
}

// ============================================
// LSA TEST CONTENT (logic DEĞİŞMEDİ)
// ============================================

function LSATestContent() {
  const { handleLSAStyleCalculated } = useFastCPR();

  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selections, setSelections] = useState({});
  const [acc1Open, setAcc1Open]     = useState(true);
  const [acc2Open, setAcc2Open]     = useState(false);
  const [uyari1, setUyari1]         = useState(false);
  const [uyari2, setUyari2]         = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/cpr/get-content?type=lsa');
        const data = await res.json();
        if (data.success && data.lsa) setQuestions(data.lsa);
      } catch (err) {
        console.error('LSA soruları yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const algılama = questions.filter(q => q.kategori === 'Algılama');
  const isleme   = questions.filter(q => q.kategori === 'İşleme');

  function handleCheck(sira) {
    const next = { ...selections, [sira]: !selections[sira] };
    setSelections(next);
    compute(next);
  }

  function compute(sel) {
    const scores = { CE: 0, AC: 0, AE: 0, RO: 0 };
    questions.forEach(q => { if (sel[q.sira]) scores[q.eksen]++; });

    const algBeraber = scores.CE > 0 && scores.CE === scores.AC;
    const islBeraber = scores.AE > 0 && scores.AE === scores.RO;

    setUyari1(algBeraber);
    setUyari2(islBeraber);

    const alg = scores.CE > scores.AC ? 'CE' : scores.AC > scores.CE ? 'AC' : null;
    const isl = scores.AE > scores.RO ? 'AE' : scores.RO > scores.AE ? 'RO' : null;

    if (alg && isl) {
      const styleKey = `${alg}+${isl}`;
      const stil = STYLE_MAP[styleKey];
      if (stil) handleLSAStyleCalculated(stil, STYLE_TO_ID);
    }
  }

  function getCount(list) {
    return list.filter(q => !!selections[q.sira]).length;
  }

  if (loading) {
    return (
      <div className="kart2__loading">
        ⏳ Yükleniyor...
      </div>
    );
  }

  return (
    <div className="kart2__content">
      <Accordion
        title="Bilgiyi Nasıl Algılıyor?"
        counter={`${getCount(algılama)} / ${algılama.length}`}
        defaultOpen={acc1Open}
        onToggle={(open) => setAcc1Open(open)}
      >
        <QuestionList
          questions={algılama}
          selections={selections}
          onCheck={handleCheck}
        />
        <WarningMessage message={uyari1 && "Eşit sayıda seçim yapıldı. Lütfen öğrenme stilini aşağıdan manuel olarak seçin."} />
      </Accordion>

      <Accordion
        title="Bilgiyi Nasıl İşliyor?"
        counter={`${getCount(isleme)} / ${isleme.length}`}
        defaultOpen={acc2Open}
        onToggle={(open) => setAcc2Open(open)}
      >
        <QuestionList
          questions={isleme}
          selections={selections}
          onCheck={handleCheck}
        />
        <WarningMessage message={uyari2 && "Eşit sayıda seçim yapıldı. Lütfen öğrenme stilini aşağıdan manuel olarak seçin."} />
      </Accordion>
    </div>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

export default function Kart2OgrenmStili() {
  const { learningStyles, handleLearningStyleToggle, handleToggleAll } = useFastCPR();
  const allSelected = learningStyles.length === LEARNING_STYLES.length;

  return (
    <Accordion
      title="Öğrenme Stili"
      subtitle="Doktorun öğrenme stilini belirle"
      defaultOpen={true}
      counterBadge={learningStyles.length > 0 ? `${learningStyles.length} stil seçildi` : null}
    >
      <div className="kart2">
        <LSATestContent />

        <div className="kart2__override">
          <div className="kart2__override-label">
            Öğrenme Stilini Seçiniz <span className="kart2__required">(zorunludur)</span>
          </div>
          <div className="kart2__controls">
            <div className="kart2__pills">
              {LEARNING_STYLES.map(s => (
                <Pill
                  key={s.id}
                  variant="learning"
                  selected={learningStyles.includes(s.id)}
                  onClick={() => handleLearningStyleToggle(s.id)}
                >
                  {s.label}
                </Pill>
              ))}
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={() => handleToggleAll(LEARNING_STYLES)}
            >
              {allSelected ? 'Seçimi Kaldır' : 'Hepsini Seç'}
            </Button>
          </div>
        </div>
      </div>
    </Accordion>
  );
}
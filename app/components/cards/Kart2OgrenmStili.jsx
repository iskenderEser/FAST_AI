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

const ANA_MAX = 16;
const ALT_MAX = 8;

// ============================================
// SELECTABLE OPTION CARD
// ============================================

function SelectableOptionCard({ question, isSelected, onClick, isEven, disabled }) {
  const cardClass = [
    'kart2__option',
    isSelected ? 'kart2__option--selected' : '',
    isEven ? 'kart2__option--even' : 'kart2__option--odd',
    disabled && !isSelected ? 'kart2__locked' : ''
  ].filter(Boolean).join(' ');

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled || isSelected) onClick();
    }
  }

  return (
    <div
      className={cardClass}
      onClick={() => { if (!disabled || isSelected) onClick(); }}
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

function QuestionList({ questions, selections, onCheck, anaKilitli }) {
  return (
    <div className="kart2__list">
      {questions.map((q, i) => {
        const isSelected = !!selections[q.sira];
        const disabled = anaKilitli && !isSelected;
        return (
          <SelectableOptionCard
            key={q.sira}
            question={q}
            isSelected={isSelected}
            onClick={() => onCheck(q.sira)}
            isEven={i % 2 === 0}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}

// ============================================
// LSA TEST CONTENT
// ============================================

function LSATestContent() {
  const { handleLSAStyleCalculated } = useFastCPR();

  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selections, setSelections] = useState({});

  // Hangi accordion açık: 'algilama' | 'isleme' | null
  const [acikAna, setAcikAna] = useState('algilama');
  // Hangi alt accordion açık: 'CE' | 'AC' | 'RO' | 'AE' | null
  const [acikAlt, setAcikAlt] = useState('CE');

  const [uyariAlg, setUyariAlg] = useState('');
  const [uyariIsl, setUyariIsl] = useState('');

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

  const ce = questions.filter(q => q.eksen === 'CE');
  const ac = questions.filter(q => q.eksen === 'AC');
  const ro = questions.filter(q => q.eksen === 'RO');
  const ae = questions.filter(q => q.eksen === 'AE');

  function getCount(list) {
    return list.filter(q => !!selections[q.sira]).length;
  }

  const ceCount  = getCount(ce);
  const acCount  = getCount(ac);
  const roCount  = getCount(ro);
  const aeCount  = getCount(ae);
  const algCount = ceCount + acCount;
  const islCount = roCount + aeCount;

  const algKilitli = algCount >= ANA_MAX;
  const islKilitli = islCount >= ANA_MAX;

  function handleCheck(sira) {
    const next = { ...selections, [sira]: !selections[sira] };
    setSelections(next);
    compute(next);
  }

  function compute(sel) {
    const scores = { CE: 0, AC: 0, AE: 0, RO: 0 };
    questions.forEach(q => { if (sel[q.sira]) scores[q.eksen]++; });

    const algEsit = scores.CE > 0 && scores.CE === scores.AC;
    const islEsit = scores.AE > 0 && scores.AE === scores.RO;

    setUyariAlg(algEsit
      ? `Yaşayarak (CE: ${scores.CE}) ve Kavramsallaştırarak (AC: ${scores.AC}) eşit. Birini öne çıkaracak şekilde seçimlerinizi gözden geçirin.`
      : '');
    setUyariIsl(islEsit
      ? `Gözlemleyerek (RO: ${scores.RO}) ve Yaparak (AE: ${scores.AE}) eşit. Birini öne çıkaracak şekilde seçimlerinizi gözden geçirin.`
      : '');

    const alg = scores.CE > scores.AC ? 'CE' : scores.AC > scores.CE ? 'AC' : null;
    const isl = scores.AE > scores.RO ? 'AE' : scores.RO > scores.AE ? 'RO' : null;

    if (alg && isl) {
      const styleKey = `${alg}+${isl}`;
      const stil = STYLE_MAP[styleKey];
      if (stil) handleLSAStyleCalculated(stil, STYLE_TO_ID);
    }
  }

  function toggleAna(key) {
    setAcikAna(prev => prev === key ? null : key);
    setAcikAlt(key === 'algilama' ? 'CE' : 'RO');
  }

  function toggleAlt(key) {
    setAcikAlt(prev => prev === key ? null : key);
  }

  if (loading) {
    return <div className="kart2__loading">⏳ Yükleniyor...</div>;
  }

  return (
    <div className="kart2__content">

      {/* ANA ACCORDION 1 — BİLGİYİ NASIL ALGILIYOR? */}
      <Accordion
        title="Bilgiyi Nasıl Algılıyor?"
        counter={`${algCount} / ${ANA_MAX}`}
        defaultOpen={acikAna === 'algilama'}
        onToggle={() => toggleAna('algilama')}
        variant={algKilitli ? 'compare' : 'default'}
      >
        {uyariAlg && <WarningMessage message={uyariAlg} />}

        {/* ALT ACCORDION — YAŞAYARAK (CE) */}
        <Accordion
          title={`Yaşayarak`}
          counter={`${ceCount} / ${ALT_MAX}`}
          defaultOpen={acikAlt === 'CE'}
          onToggle={() => toggleAlt('CE')}
          variant="s4-cat"
        >
          <QuestionList
            questions={ce}
            selections={selections}
            onCheck={handleCheck}
            anaKilitli={algKilitli}
          />
        </Accordion>

        {/* ALT ACCORDION — KAVRAMSALLAŞTIRARAK (AC) */}
        <Accordion
          title={`Kavramsallaştırarak`}
          counter={`${acCount} / ${ALT_MAX}`}
          defaultOpen={acikAlt === 'AC'}
          onToggle={() => toggleAlt('AC')}
          variant="s4-cat"
        >
          <QuestionList
            questions={ac}
            selections={selections}
            onCheck={handleCheck}
            anaKilitli={algKilitli}
          />
        </Accordion>
      </Accordion>

      {/* ANA ACCORDION 2 — BİLGİYİ NASIL İŞLİYOR? */}
      <Accordion
        title="Bilgiyi Nasıl İşliyor?"
        counter={`${islCount} / ${ANA_MAX}`}
        defaultOpen={acikAna === 'isleme'}
        onToggle={() => toggleAna('isleme')}
        variant={islKilitli ? 'compare' : 'default'}
      >
        {uyariIsl && <WarningMessage message={uyariIsl} />}

        {/* ALT ACCORDION — GÖZLEMLEYEREK (RO) */}
        <Accordion
          title={`Gözlemleyerek`}
          counter={`${roCount} / ${ALT_MAX}`}
          defaultOpen={acikAlt === 'RO'}
          onToggle={() => toggleAlt('RO')}
          variant="s4-cat"
        >
          <QuestionList
            questions={ro}
            selections={selections}
            onCheck={handleCheck}
            anaKilitli={islKilitli}
          />
        </Accordion>

        {/* ALT ACCORDION — YAPARAK (AE) */}
        <Accordion
          title={`Yaparak`}
          counter={`${aeCount} / ${ALT_MAX}`}
          defaultOpen={acikAlt === 'AE'}
          onToggle={() => toggleAlt('AE')}
          variant="s4-cat"
        >
          <QuestionList
            questions={ae}
            selections={selections}
            onCheck={handleCheck}
            anaKilitli={islKilitli}
          />
        </Accordion>
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
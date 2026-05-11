'use client';

import React, { useState } from 'react';
import { Accordion } from '../ui/Accordion';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { BehaviorRow } from './Kart1KonforAlani/BehaviorRow';

// ============================================
// CONSTANTS
// ============================================

const BEHAVIORS = [
  'Duruş',
  'Ellerin Kullanımı',
  'Göz Teması',
  'İçerik',
  'Kelime Sayısı',
  'Konuşma Hızı',
  'Mimikler',
  'Sesin Hacmi'
];

// ============================================
// HELPERS
// ============================================

function calculateBehaviorAnalysis(myVals, otherVals) {
  const differences = [];
  const similarities = [];

  BEHAVIORS.forEach((name, idx) => {
    const diff = Math.abs(myVals[idx] - otherVals[idx]);
    const item = {
      name,
      my: myVals[idx],
      other: otherVals[idx],
      diff,
      myLabel: myVals[idx] <= 3 ? 'Düşük' : myVals[idx] >= 7 ? 'Yüksek' : 'Orta',
      otherLabel: otherVals[idx] <= 3 ? 'Düşük' : otherVals[idx] >= 7 ? 'Yüksek' : 'Orta'
    };
    if (diff >= 3) differences.push(item);
    else similarities.push(item);
  });

  return { differences, similarities };
}

function parseSuggestions(suggestionsText) {
  const suggestionMap = {};

  function normalizeName(raw) {
    return raw
      .replace(/^#{1,6}\s*/, '')   // ## başlıklar
      .replace(/\*{1,2}/g, '')      // bold işaretleri
      .replace(/^[-•]\s*/, '')      // bullet işaretleri
      .replace(/:$/, '')            // trailing colon
      .trim();
  }

  function findBehavior(text) {
    const normalized = normalizeName(text);
    return BEHAVIORS.find(
      b => b.localeCompare(normalized, 'tr', { sensitivity: 'accent' }) === 0
    ) || null;
  }

  const blocks = suggestionsText.split(/\n\n+/);

  blocks.forEach(block => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const firstLine = lines[0];

    // Case 1: "**Duruş:** Açıklama..." veya "Duruş: Açıklama..." — isim ve içerik aynı satırda
    const inlineMatch = firstLine.match(/^(#{1,6}\s*)?(\*{1,2})?(.+?)(\*{1,2})?:\s*(.+)$/);
    if (inlineMatch) {
      const candidateName = normalizeName(inlineMatch[3]);
      const behavior = findBehavior(candidateName);
      if (behavior) {
        const inlineText = inlineMatch[5].trim();
        const rest = lines.slice(1).join(' ').trim();
        const full = [inlineText, rest].filter(Boolean).join(' ').trim();
        if (full.length > 0) suggestionMap[behavior] = full;
        return;
      }
    }

    // Case 2: "**Duruş**\nAçıklama..." — isim tek satır, içerik alt satırlarda
    const behavior = findBehavior(firstLine);
    if (behavior) {
      const rest = lines.slice(1).join(' ').trim();
      if (rest.length > 0) suggestionMap[behavior] = rest;
    }
  });

  return suggestionMap;
}

// ============================================
// BEHAVIOR TABLE
// ============================================

function BehaviorTable({ prefix, selections, onSelect }) {
  return (
    <div className="compare-table-scroll">
      <table className="compare-table">
        <thead>
          <tr>
            <th className="behavior-th behavior-th--left">Davranış</th>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => (
              <th key={v} className="behavior-th">{v}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BEHAVIORS.map((name, idx) => (
            <BehaviorRow
              key={idx}
              prefix={prefix}
              idx={idx}
              name={name}
              selected={selections[idx]}
              onSelect={(val) => onSelect(idx, val)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// BEHAVIOR ANALYSIS CARD
// ============================================

function BehaviorAnalysisCard({ behavior, suggestion }) {
  const badgeClass = behavior.diff >= 5
    ? 'diff-badge diff-badge--high'
    : behavior.diff >= 3
      ? 'diff-badge diff-badge--mid'
      : 'diff-badge diff-badge--low';

  return (
    <div className="behavior-card">
      <div className="behavior-card__header">
        <span className="behavior-card__name">{behavior.name}</span>
        <span className={badgeClass}>Δ {behavior.diff}</span>
      </div>
      <div className="behavior-card__scores">
        <span>Siz: <strong>{behavior.my} ({behavior.myLabel})</strong></span>
        <span>Karşı: <strong>{behavior.other} ({behavior.otherLabel})</strong></span>
      </div>
      <div className="behavior-card__suggestion">
        💡 {suggestion || 'Karşı tarafın stiline yaklaşmayı deneyin.'}
      </div>
    </div>
  );
}

// ============================================
// LOADING STATE
// ============================================

function LoadingState() {
  return (
    <div className="kart1-loading">
      ⏳ Yapay zeka analiz yapıyor...
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

function ComfortZoneContent() {
  const [selections, setSelections] = useState({
    me: Array(BEHAVIORS.length).fill(null),
    other: Array(BEHAVIORS.length).fill(null)
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleSelect(prefix, idx, val) {
    const updated = {
      ...selections,
      [prefix]: selections[prefix].map((v, i) => i === idx ? val : v)
    };
    setSelections(updated);

    const meDone = updated.me.every(v => v !== null);
    const otherDone = updated.other.every(v => v !== null);

    if (meDone && otherDone) analyzeAndSuggest(updated.me, updated.other);
  }

  function handleReset(prefix) {
    setSelections(prev => ({ ...prev, [prefix]: Array(BEHAVIORS.length).fill(null) }));
    setResults(null);
  }

  function doneCount(prefix) {
    return selections[prefix].filter(v => v !== null).length;
  }

  async function analyzeAndSuggest(myVals, otherVals) {
    const { differences, similarities } = calculateBehaviorAnalysis(myVals, otherVals);
    setLoading(true);

    try {
      const response = await fetch('/api/cpr/analyze-comfort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ differences, similarities })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const suggestionMap = parseSuggestions(data.suggestions);
      setResults({ differences, similarities, suggestionMap });
    } catch (err) {
      console.error('Analiz hatası:', err);
      setResults({ error: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kart1-wrap">
      <p className="kart1-description">
        Kendinizin ve karşınızdakinin davranışlarını tanımlayabilir, uyumlu iletişim fırsatları için AI önerilerini görebilirsiniz.
      </p>

      <div className="kart1-tables">
        <Accordion
          title="Benim Davranışlarım"
          counter={`${doneCount('me')}/${BEHAVIORS.length}`}
          variant="compare"
        >
          <BehaviorTable
            prefix="me"
            selections={selections.me}
            onSelect={(idx, val) => handleSelect('me', idx, val)}
          />
          <div className="kart1-table-actions">
            <Button variant="secondary" size="small" onClick={() => handleReset('me')}>
              Temizle
            </Button>
          </div>
        </Accordion>

        <Accordion
          title="Onun Davranışları"
          counter={`${doneCount('other')}/${BEHAVIORS.length}`}
          variant="compare"
        >
          <BehaviorTable
            prefix="other"
            selections={selections.other}
            onSelect={(idx, val) => handleSelect('other', idx, val)}
          />
          <div className="kart1-table-actions">
            <Button variant="secondary" size="small" onClick={() => handleReset('other')}>
              Temizle
            </Button>
          </div>
        </Accordion>
      </div>

      {loading && <LoadingState />}

      {results && !loading && (
        <div className="analysis-results">
          {results.error ? (
            <div className="kart1-error">❌ Analiz yapılamadı, tekrar deneyin.</div>
          ) : (
            <>
              {results.similarities.length > 0 && (
                <div className="analysis-block">
                  <div className="analysis-block__title">✅ Uyumlu Davranışlarınız</div>
                  <div className="analysis-block__pills">
                    {results.similarities.map(s => (
                      <Pill key={s.name} variant="similarity">✓ {s.name}</Pill>
                    ))}
                  </div>
                </div>
              )}

              {results.differences.length > 0 && (
                <div className="analysis-block">
                  <div className="analysis-block__title">🔄 Esneyeceğiniz Davranışlar ve Öneriler</div>
                  {results.differences.map(d => (
                    <BehaviorAnalysisCard
                      key={d.name}
                      behavior={d}
                      suggestion={results.suggestionMap[d.name]}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Kart1KonforAlani() {
  return (
    <Accordion
      title="Konfor Alanı"
      subtitle="Doktorun davranış stilini belirle"
      defaultOpen={true}
    >
      <ComfortZoneContent />
    </Accordion>
  );
}
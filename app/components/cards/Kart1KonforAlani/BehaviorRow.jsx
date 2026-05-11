'use client';

import React from 'react';

const ENDPOINTS = {
  'Konuşma Hızı':      { low: 'Yavaş',      high: 'Hızlı'      },
  'Sesin Hacmi':       { low: 'Zayıf',      high: 'Güçlü'      },
  'Mimikler':          { low: 'Kontrollü',  high: 'Hareketli'  },
  'Göz Teması':        { low: 'Dolaylı',    high: 'Doğrudan'   },
  'Ellerin Kullanımı': { low: 'Az',         high: 'Çok'        },
  'Duruş':             { low: 'Çekingen',   high: 'Atak'       },
  'İçerik':            { low: 'Hikayeler',  high: 'Gerçekler'  },
  'Kelime Sayısı':     { low: 'Az',         high: 'Çok'        }
};

export function BehaviorRow({ prefix, idx, name, selected, onSelect }) {
  const ep = ENDPOINTS[name];
  const isEven = idx % 2 === 0;
  const rowClass = isEven ? 'behavior-row behavior-row--even' : 'behavior-row behavior-row--odd';
  const nameClass = selected !== null
    ? 'behavior-row__name behavior-row__name--selected'
    : 'behavior-row__name';

  return (
    <tr className={rowClass}>
      <td className={nameClass}>
        <span className="behavior-row__label">{name}</span>
        {ep && (
          <span className="behavior-row__hint">
            <span className="behavior-row__hint-low">{ep.low}</span>
            <span className="behavior-row__hint-arrow">←→</span>
            <span className="behavior-row__hint-high">{ep.high}</span>
          </span>
        )}
      </td>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => (
        <td key={v} className="behavior-row__radio-cell">
          <input
            type="radio"
            className="behavior-row__radio"
            name={`compare_${prefix}_${idx}`}
            value={v}
            checked={selected === v}
            onChange={() => onSelect(v)}
          />
        </td>
      ))}
    </tr>
  );
}
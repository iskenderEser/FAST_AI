'use client';
import { useState } from 'react';
export function Accordion({ children, title, subtitle, counter, counterBadge, defaultOpen = false, variant = 'default', onToggle }) {
  const [open, setOpen] = useState(defaultOpen);
  const handleToggle = () => { const newOpen = !open; setOpen(newOpen); if (onToggle) onToggle(newOpen); };
  return (
    <details className={`shared-accordion shared-accordion--${variant}`} open={open}>
      <summary onClick={(e) => { e.preventDefault(); handleToggle(); }}>
        <div className="shared-accordion-header">
          <div className="shared-accordion-title">
            <span className="shared-accordion-arrow">{open ? '▼' : '▶'}</span>
            <b>{title}</b>
            {subtitle && <span className="shared-accordion-subtitle">{subtitle}</span>}
          </div>
          {counter !== undefined && <span className="shared-accordion-counter">{counter}</span>}
          {counterBadge && <span className="shared-accordion-badge">{counterBadge}</span>}
        </div>
      </summary>
      <div className="shared-accordion-body">{children}</div>
    </details>
  );
}

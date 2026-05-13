'use client';
import { useState } from 'react';

export function Accordion({
  children,
  title,
  subtitle,
  counter,
  counterBadge,
  defaultOpen = false,
  open,
  variant = 'default',
  onToggle,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onToggle?.(next);
  };

  return (
    <details className={`shared-accordion shared-accordion--${variant}`} open={isOpen}>
      <summary
        onClick={(e) => { e.preventDefault(); handleToggle(); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={isOpen}
      >
        <div className="shared-accordion-header">
          <div className="shared-accordion-title">
            <span className="shared-accordion-arrow">{isOpen ? '▼' : '▶'}</span>
            <b>{title}</b>
            {subtitle && <span className="shared-accordion-subtitle">{subtitle}</span>}
          </div>
          {counter !== undefined && <span className="shared-accordion-counter">{counter}</span>}
          {counterBadge && <span className="shared-accordion-badge">{counterBadge}</span>}
        </div>
      </summary>
      {isOpen && <div className="shared-accordion-body">{children}</div>}
    </details>
  );
}
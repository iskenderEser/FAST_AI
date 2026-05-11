'use client';

import { Button } from '../../ui/Button'; // import { Button } from '@/components/ui/Button';
import { NEDENLER } from './constants';

export function FeedbackModal({ isOpen, onClose, onSend, selectedReasons, onToggleReason, isLoading }) {
  if (!isOpen) return null;

  const maxSelections = 3;

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <div className="feedback-modal-header">
          <div className="feedback-modal-title">CPR arşivlememe nedenlerini paylaşır mısınız?</div>
          <div className="feedback-modal-subtitle">Size uygun 1-3 sebebi işaretleyebilirsiniz.</div>
        </div>

        <div className="feedback-modal-body">
          {NEDENLER.map(n => {
            const isSelected = selectedReasons.includes(n.key);
            const isDisabled = !isSelected && selectedReasons.length >= maxSelections;
            return (
              <div
                key={n.key}
                className={`feedback-option ${isSelected ? 'feedback-option--selected' : ''} ${isDisabled ? 'feedback-option--disabled' : ''}`}
                onClick={() => !isDisabled && onToggleReason(n.key)}
              >
                <div className={`feedback-checkbox ${isSelected ? 'feedback-checkbox--selected' : ''}`}>
                  {isSelected && <div className="feedback-checkmark" />}
                </div>
                <span className="feedback-option-label">{n.label}</span>
              </div>
            );
          })}
        </div>

        <div className="feedback-modal-footer">
          <div className="feedback-selection-counter">{selectedReasons.length} / {maxSelections} seçildi</div>
          <div className="feedback-actions">
            <Button variant="ghost" size="small" onClick={onClose}>Vazgeç</Button>
            <Button 
              variant="primary" 
              size="small" 
              onClick={onSend} 
              disabled={selectedReasons.length === 0 || isLoading}
            >
              {isLoading ? 'Gönderiliyor...' : 'Gönder ve devam et'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
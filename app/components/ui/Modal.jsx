'use client';
import { useEffect, useCallback } from 'react';
export function Modal({ isOpen, onClose, title, children, size = 'default', showCloseButton = true, closeOnOverlayClick = true, closeOnEscape = true, className = '' }) {
  useEffect(() => { if (isOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { if (!closeOnEscape || !isOpen) return; const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [isOpen, closeOnEscape, onClose]);
  const handleOverlayClick = useCallback((e) => { if (closeOnOverlayClick && e.target === e.currentTarget) onClose(); }, [closeOnOverlayClick, onClose]);
  if (!isOpen) return null;
  const sizeClasses = { small: 'modal--small', default: 'modal--default', large: 'modal--large' };
  const modalSizeClass = sizeClasses[size] || sizeClasses.default;
  return (<div className="modal-overlay" onClick={handleOverlayClick}><div className={`modal ${modalSizeClass} ${className}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><div className="modal-title">{title}</div>{showCloseButton && <button type="button" className="modal-close" onClick={onClose} aria-label="Kapat">✕</button>}</div><div className="modal-body">{children}</div></div></div>);
}

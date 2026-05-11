'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui/Modal'; // import { Modal } from '@/components/ui/Modal';
import { Button } from './ui/Button'; // import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardActions } from './ui/Card'; // import { Card, CardHeader, CardTitle, CardContent, CardActions } from '@/components/ui/Card';
import { buildDocDefinition, sanitizeFilename, downloadPDF } from '../utils/pdfUtils';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.vfs;

// ============================================
// HELPER FUNCTIONS
// ============================================

function truncateText(text, maxLength = 150) {
  if (!text) return 'Claim girilmemiş';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ============================================
// REUSABLE STATE CONTAINER COMPONENT
// ============================================

function StateContainer({ 
  icon, 
  title, 
  description, 
  variant = 'default', // 'default' | 'loading' | 'error' | 'empty'
  onRetry 
}) {
  const getIcon = () => {
    if (variant === 'loading') return '⏳';
    if (variant === 'error') return '⚠️';
    if (variant === 'empty') return '📄';
    return icon || '📦';
  };

  const getTitle = () => {
    if (variant === 'loading') return 'Yükleniyor...';
    if (variant === 'error') return 'Bir Hata Oluştu';
    if (variant === 'empty') return 'Arşiv Boş';
    return title;
  };

  const getDescription = () => {
    if (variant === 'loading') return 'Arşiv listesi hazırlanıyor';
    if (variant === 'error') return description || 'Liste yüklenirken bir sorun oluştu';
    if (variant === 'empty') return 'Henüz arşivlenmiş CPR bulunmuyor';
    return description;
  };

  return (
    <Card variant="default" hoverable={false}>
      <CardContent>
        <div className="state-container">
          {variant === 'loading' ? (
            <div className="loading-spinner" />
          ) : (
            <div className="state-icon">{getIcon()}</div>
          )}
          <div className={`state-title ${variant === 'error' ? 'error-state-title' : ''}`}>
            {getTitle()}
          </div>
          <div className="state-description">{getDescription()}</div>
          {variant === 'error' && onRetry && (
            <Button variant="primary" size="small" onClick={onRetry} className="mt-3">
              Tekrar Dene
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// PDF CARD COMPONENT (Memoized)
// ============================================

const PDFCard = memo(function PDFCard({ pdf, onDelete, onDownload, isDownloading }) {
  return (
    <Card variant="pdf" hoverable={true} className="relative">
      <button
        type="button"
        className="pdf-card-delete"
        onClick={() => onDelete(pdf.id)}
        title="Sil"
      >
        ×
      </button>
      <CardHeader>
        <div>
          <CardTitle>📅 {formatDate(pdf.created_at)}</CardTitle>
          <div className="pdf-card-product">🎯 {pdf.urun || 'Ürün belirtilmemiş'}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="pdf-card-meta">
          <div className="pdf-card-meta-item">
            <span className="pdf-card-meta-label">Öğrenme Stili:</span>
            <span>{pdf.ogrenme_stili || '—'}</span>
          </div>
        </div>
        <div className="pdf-card-preview">
          <div className="pdf-card-preview-label">Claim Önizleme</div>
          <div className="pdf-card-preview-text">
            {truncateText(pdf.claim, 150)}
          </div>
        </div>
      </CardContent>
      <CardActions>
        <Button
          variant="primary"
          size="small"
          onClick={() => onDownload(pdf)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <span>⏳</span>
              <span>Hazırlanıyor...</span>
            </>
          ) : (
            <>
              <span>⬇️</span>
              <span>PDF İndir</span>
            </>
          )}
        </Button>
      </CardActions>
    </Card>
  );
});

PDFCard.displayName = 'PDFCard';

// ============================================
// MAIN PDF STOCK COMPONENT
// ============================================

export default function PDFStock() {
  const { currentUser } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [arsivList, setArsivList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Race condition prevention
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const arsivCount = arsivList.length;

  const loadPDFList = useCallback(async (force = false) => {
    if (!currentUser?.kullanici_id) return;
    
    if (isDataLoaded && !force) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const currentRequestId = ++requestIdRef.current;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `/api/pdf/list?kullanici_id=${currentUser.kullanici_id}`,
        { signal: abortController.signal }
      );
      
      // Ignore if this is not the latest request
      if (currentRequestId !== requestIdRef.current) return;
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Liste alınamadı');
      
      setArsivList(data.data || []);
      setIsDataLoaded(true);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('PDF listesi alınamadı:', err);
      if (currentRequestId === requestIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [currentUser, isDataLoaded]);

  const deletePDF = useCallback(async (id) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    if (!currentUser?.kullanici_id) return;

    // Local backup (no state)
    const currentList = [...arsivList];
    
    // Optimistic update
    setArsivList(prev => prev.filter(item => item.id !== id));

    try {
      const res = await fetch(`/api/pdf/delete?id=${id}&kullanici_id=${currentUser.kullanici_id}`, { 
        method: 'DELETE' 
      });
      if (!res.ok) throw new Error('Silme işlemi başarısız');
    } catch (err) {
      console.error('PDF silinemedi:', err);
      // Rollback using local backup
      setArsivList(currentList);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  }, [currentUser, arsivList]);

  const handleDownload = useCallback(async (pdf) => {
    setDownloadingId(pdf.id);
    try {
      const docDef = buildDocDefinition(pdf);
      const fileName = sanitizeFilename(`FAST_CPR_${pdf.urun || 'Rapor'}.pdf`);
      await downloadPDF(docDef, fileName);
    } catch (err) {
      console.error('PDF indirilemedi:', err);
      setError('PDF indirilemedi');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const openModal = useCallback(() => {
    setModalOpen(true);
    loadPDFList();
  }, [loadPDFList]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setError(null);
    // Cancel any pending request on close
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const retryLoad = useCallback(() => {
    setIsDataLoaded(false);
    loadPDFList(true);
  }, [loadPDFList]);

  useEffect(() => {
    if (!modalOpen) {
      setIsDataLoaded(false);
      // Cancel pending requests when modal closes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [modalOpen]);

  return (
    <>
      <div className="pdf-button-container">
        <Button
          variant="secondary"
          className="pdf-stock-badge"
          onClick={openModal}
        >
          <span>📦</span>
          <span>CPR Arşivi</span>
          {arsivCount > 0 && (
            <span className="pdf-count">{arsivCount}</span>
          )}
        </Button>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="📦 CPR Arşivi"
        size="large"
      >
        <div className="modal-content-wrapper">
          {loading ? (
            <StateContainer variant="loading" />
          ) : error ? (
            <StateContainer variant="error" description={error} onRetry={retryLoad} />
          ) : arsivList.length === 0 ? (
            <StateContainer variant="empty" />
          ) : (
            arsivList.map(pdf => (
              <PDFCard
                key={pdf.id}
                pdf={pdf}
                onDelete={deletePDF}
                onDownload={handleDownload}
                isDownloading={downloadingId === pdf.id}
              />
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
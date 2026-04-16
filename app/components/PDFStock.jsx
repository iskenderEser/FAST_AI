'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFastCPR } from '../context/FastCPRContext';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.vfs;

function buildDocDefinition(pdf) {
  const stilCprlar = pdf.stil_cprlar || [];
  const content = [
    { text: 'FAST CPR KOÇU', style: 'header' },
    { text: `Tarih: ${pdf.tarih || new Date().toLocaleString('tr-TR')}`, style: 'meta' },
    { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 8, 0, 12] },
    { text: 'Ürün Bilgileri', style: 'sectionTitle' },
    { text: `Ürün: ${pdf.urun || '—'}`, style: 'field' },
    { text: `Tedavi Alanı: ${pdf.tedavi_alani || '—'}`, style: 'field' },
    { text: `Kullanım Şekli: ${pdf.kullanim_sekli || '—'}`, style: 'field' },
    { text: `Pozoloji: ${pdf.pozoloji || '—'}`, style: 'field' },
    { text: '', margin: [0, 0, 0, 8] },
    { text: 'Hekim Profili', style: 'sectionTitle' },
    { text: `Öğrenme Stili: ${pdf.ogrenme_stili || '—'}`, style: 'field' },
    { text: '', margin: [0, 0, 0, 8] },
    { text: 'Hasta Şikayeti (Claim)', style: 'sectionTitle' },
    { text: pdf.claim || '—', style: 'cprText' },
    { text: '', margin: [0, 0, 0, 8] },
  ];
  if (stilCprlar.length > 0) {
    content.push({ text: "Stil Bazlı CPR'lar", style: 'sectionTitle' });
    stilCprlar.forEach(item => {
      content.push({ text: item.stil, style: 'stilTitle' });
      content.push({ text: item.cpr || '—', style: 'cprText' });
      content.push({ text: '', margin: [0, 0, 0, 8] });
    });
  }
  return {
    content,
    styles: {
      header:       { fontSize: 18, bold: true, color: '#e30a17', margin: [0, 0, 0, 4] },
      meta:         { fontSize: 10, color: '#888888' },
      sectionTitle: { fontSize: 12, bold: true, color: '#003cbb', margin: [0, 0, 0, 4] },
      stilTitle:    { fontSize: 11, bold: true, color: '#374151', margin: [0, 4, 0, 2] },
      field:        { fontSize: 11, color: '#333333', margin: [0, 0, 0, 2] },
      cprText:      { fontSize: 11, color: '#1a1a1a', lineHeight: 1.5, margin: [0, 0, 0, 4] },
    },
    defaultStyle: { font: 'Roboto' },
    pageMargins: [40, 40, 40, 40],
  };
}

export default function PDFStock() {
  const { currentUser } = useAuth();

  const [modalOpen, setModalOpen]   = useState(false);
  const [arsivList, setArsivList]   = useState([]);
  const [arsivCount, setArsivCount] = useState(0);
  const [loading, setLoading]       = useState(false);

  const updateArsivCount = useCallback(async () => {
    if (!currentUser?.kullanici_id) return;
    try {
      const res  = await fetch(`/api/pdf/list?kullanici_id=${currentUser.kullanici_id}`);
      const data = await res.json();
      setArsivCount(data.data ? data.data.length : 0);
    } catch (err) {
      console.error('Arşiv sayısı alınamadı:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    updateArsivCount();
  }, [updateArsivCount]);

  function openModal() {
    setModalOpen(true);
    loadPDFList();
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function loadPDFList() {
    if (!currentUser?.kullanici_id) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/pdf/list?kullanici_id=${currentUser.kullanici_id}`);
      const data = await res.json();
      setArsivList(data.data || []);
    } catch (err) {
      console.error('PDF listesi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deletePDF(id) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    if (!currentUser?.kullanici_id) return;
    try {
      await fetch(`/api/pdf/delete?id=${id}&kullanici_id=${currentUser.kullanici_id}`, { method: 'DELETE' });
      loadPDFList();
      updateArsivCount();
    } catch (err) {
      console.error('PDF silinemedi:', err);
    }
  }

  function downloadFromArsiv(pdf) {
    const docDef   = buildDocDefinition(pdf);
    const fileName = `FAST_CPR_${pdf.urun || 'Rapor'}.pdf`;
    pdfMake.createPdf(docDef).download(fileName);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <>
      <div className="pdf-button-container" style={{ display: 'flex', gap: '12px' }}>
        <button
          className="btn secondary pdf-stock-badge"
          title="Arşivlenmiş CPR'ları görüntüle"
          onClick={openModal}
        >
          <span className="icon">📦</span>
          <span>CPR Arşivi</span>
          {arsivCount > 0 && (
            <span className="pdf-count">{arsivCount}</span>
          )}
        </button>
      </div>

      {modalOpen && (
        <div
          className="pdf-modal-overlay active"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="pdf-modal">
            <div className="pdf-modal-header">
              <div className="pdf-modal-title">
                <span>📦</span>
                <span>CPR Arşivi</span>
              </div>
              <button className="pdf-modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="pdf-modal-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  ⏳ Yükleniyor...
                </div>
              ) : arsivList.length === 0 ? (
                <div className="pdf-list-empty">
                  <div className="pdf-list-empty-icon">📄</div>
                  <div className="pdf-list-empty-text">Henüz arşivlenmiş CPR yok</div>
                </div>
              ) : (
                arsivList.map(pdf => (
                  <div key={pdf.id} className="pdf-card">
                    <button
                      className="pdf-card-delete"
                      onClick={() => deletePDF(pdf.id)}
                      title="Sil"
                    >
                      ×
                    </button>
                    <div className="pdf-card-header">
                      <div>
                        <div className="pdf-card-date">📅 {formatDate(pdf.created_at)}</div>
                        <div className="pdf-card-product">🎯 {pdf.urun || 'Ürün belirtilmemiş'}</div>
                      </div>
                    </div>
                    <div className="pdf-card-meta">
                      <div className="pdf-card-meta-item">
                        <span className="pdf-card-meta-label">Öğrenme Stili:</span>
                        <span>{pdf.ogrenme_stili || '—'}</span>
                      </div>
                    </div>
                    <div className="pdf-card-preview">
                      <div className="pdf-card-preview-label">Claim Önizleme</div>
                      <div className="pdf-card-preview-text">
                        {pdf.claim
                          ? pdf.claim.substring(0, 150) + (pdf.claim.length > 150 ? '...' : '')
                          : 'Claim girilmemiş'}
                      </div>
                    </div>
                    <div className="pdf-card-actions">
                      <button
                        className="btn primary small"
                        onClick={() => downloadFromArsiv(pdf)}
                      >
                        <span>⬇️</span>
                        <span>PDF İndir</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
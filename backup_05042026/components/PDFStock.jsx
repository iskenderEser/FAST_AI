'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PDFStock() {
  const { currentUser } = useAuth();

  const [modalOpen, setModalOpen]   = useState(false);
  const [stockList, setStockList]   = useState([]);
  const [stockCount, setStockCount] = useState(0);
  const [loading, setLoading]       = useState(false);

  // ============================================
  // STOK SAYISI
  // ============================================
  const updateStockCount = useCallback(async () => {
    if (!currentUser?.kullanici_id) return;
    try {
      const res  = await fetch(`/api/pdf/list?kullanici_id=${currentUser.kullanici_id}`);
      const data = await res.json();
      setStockCount(data.data ? data.data.length : 0);
    } catch (err) {
      console.error('Stok sayısı alınamadı:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    updateStockCount();
  }, [updateStockCount]);

  // Global erişim için expose
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.updateStockCount = updateStockCount;
      window.PDFStorage = {
        save: async (pdfData) => {
          if (!currentUser?.kullanici_id) return false;
          try {
            const res  = await fetch('/api/pdf/save', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ kullanici_id: currentUser.kullanici_id, ...pdfData })
            });
            const data = await res.json();
            if (data.success) updateStockCount();
            return data.success;
          } catch (err) {
            console.error('PDF kaydedilemedi:', err);
            return false;
          }
        }
      };
    }
  }, [currentUser, updateStockCount]);

  // ============================================
  // MODAL AÇ / KAPAT
  // ============================================
  function openModal() {
    setModalOpen(true);
    loadPDFList();
  }

  function closeModal() {
    setModalOpen(false);
  }

  // ============================================
  // PDF LİSTESİ
  // ============================================
  async function loadPDFList() {
    if (!currentUser?.kullanici_id) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/pdf/list?kullanici_id=${currentUser.kullanici_id}`);
      const data = await res.json();
      setStockList(data.data || []);
    } catch (err) {
      console.error('PDF listesi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // PDF SİL
  // ============================================
  async function deletePDF(id) {
    if (!confirm('Bu PDF\'i silmek istediğinize emin misiniz?')) return;
    if (!currentUser?.kullanici_id) return;
    try {
      await fetch(`/api/pdf/delete?id=${id}&kullanici_id=${currentUser.kullanici_id}`, {
        method: 'DELETE'
      });
      loadPDFList();
      updateStockCount();
    } catch (err) {
      console.error('PDF silinemedi:', err);
    }
  }

  // ============================================
  // PDF İNDİR
  // ============================================
  async function downloadPDF(id) {
    if (!currentUser?.kullanici_id) return;
    try {
      const res  = await fetch(`/api/pdf/list?kullanici_id=${currentUser.kullanici_id}`);
      const data = await res.json();
      const pdf  = data.data?.find(p => p.id === id);
      if (!pdf) return;

      if (typeof window !== 'undefined' && window.createDocDefinition && window.pdfMake) {
        const docDefinition = window.createDocDefinition(pdf);
        const fileName      = `FAST_CPR_${pdf.urun || 'Rapor'}.pdf`;
        window.pdfMake.createPdf(docDefinition).download(fileName);
      }
    } catch (err) {
      console.error('PDF indirilemedi:', err);
    }
  }

  // ============================================
  // TARİH FORMAT
  // ============================================
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit'
    });
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {/* PDF Butonları — Header'da */}
      <div className="pdf-button-container" style={{ display: 'flex', gap: '12px' }}>
        <button
          className="btn secondary pdf-stock-badge"
          id="pdfStockBtn"
          title="Stoklanmış PDF'leri görüntüle"
          onClick={openModal}
        >
          <span className="icon">📦</span>
          <span>PDF Stok</span>
          {stockCount > 0 && (
            <span className="pdf-count" id="pdfStockCount">{stockCount}</span>
          )}
        </button>

        <button
          className="btn primary"
          id="fullReportPDF"
          title="Tüm çalışmayı PDF olarak indir"
          onClick={handleGeneratePDF}
        >
          <span className="icon">📄</span>
          <span>Tüm Raporu PDF'e Aktar</span>
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="pdf-modal-overlay active"
          id="pdfStockModal"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="pdf-modal">
            <div className="pdf-modal-header">
              <div className="pdf-modal-title">
                <span>📦</span>
                <span>Stoklanmış PDF'ler</span>
              </div>
              <button className="pdf-modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="pdf-modal-body" id="pdfModalBody">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  ⏳ Yükleniyor...
                </div>
              ) : stockList.length === 0 ? (
                <div className="pdf-list-empty">
                  <div className="pdf-list-empty-icon">📄</div>
                  <div className="pdf-list-empty-text">Henüz stoklanmış PDF yok</div>
                </div>
              ) : (
                stockList.map(pdf => (
                  <div key={pdf.id} className="pdf-card">
                    <button
                      className="pdf-card-delete"
                      onClick={() => deletePDF(pdf.id)}
                      title="PDF'i Sil"
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
                        <span className="pdf-card-meta-label">Sosyal Stil:</span>
                        <span>{pdf.sosyal_stil || 'Seçilmedi'}</span>
                      </div>
                    </div>
                    <div className="pdf-card-preview">
                      <div className="pdf-card-preview-label">Temel CPR Önizleme</div>
                      <div className="pdf-card-preview-text">
                        {pdf.temel_cpr
                          ? pdf.temel_cpr.substring(0, 150) + (pdf.temel_cpr.length > 150 ? '...' : '')
                          : 'CPR oluşturulmamış'}
                      </div>
                    </div>
                    <div className="pdf-card-actions">
                      <button
                        className="btn primary small"
                        onClick={() => downloadPDF(pdf.id)}
                      >
                        <span>⬇️</span>
                        <span>İndir</span>
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

// ============================================
// PDF OLUŞTURMA
// ============================================
function handleGeneratePDF() {
  try {
    const data = collectPDFData();
    if (typeof window !== 'undefined' && window.createDocDefinition && window.pdfMake) {
      const docDefinition = window.createDocDefinition(data);
      window.pdfMake.createPdf(docDefinition).download('FAST_CPR_RAPORU.pdf');
    }

    if (window.PDFStorage) {
      window.PDFStorage.save(data).then(saved => {
        if (saved) {
          const n         = document.createElement('div');
          n.className     = 'mobile-notification success';
          n.innerHTML     = '<span>✅</span><span>PDF stoğa eklendi!</span>';
          n.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:10000;';
          document.body.appendChild(n);
          setTimeout(() => n.remove(), 3000);
        }
      });
    }
  } catch (err) {
    console.error('PDF hatası:', err);
    alert('❌ PDF oluşturulurken hata: ' + err.message);
  }
}

// ============================================
// VERİ TOPLAMA
// ============================================
function collectPDFData() {
  const data = {
    tarih:         new Date().toLocaleString('tr-TR'),
    sosyal_stil:   '',
    konfor_alani:  { uyumlu: [], esneyecek: [] },
    ogrenme_stili: '',
    tedavi_alani:  '',
    urun:          '',
    kullanim_sekli:'',
    pozoloji:      '',
    temel_cpr:     '',
    stil_cprlar:   []
  };

  // Sosyal Stil
  const promoContext = document.getElementById('promoContext');
  data.sosyal_stil   = promoContext?.value || 'Seçilmedi';

  // Konfor Alanı — JSONB array olarak
  const compareResults = document.getElementById('compareResults');
  if (compareResults && compareResults.style.display !== 'none') {
    const similarityPills = compareResults.querySelectorAll('.similarity-pill');
    data.konfor_alani.uyumlu = similarityPills.length > 0
      ? Array.from(similarityPills).map(p => p.textContent.replace('✓', '').trim())
      : [];

    const behaviorItems = compareResults.querySelectorAll('.behavior-item');
    data.konfor_alani.esneyecek = behaviorItems.length > 0
      ? Array.from(behaviorItems).map(item => ({
          davranis: item.querySelector('.behavior-item-name')?.textContent.replace('📍', '').trim(),
          oneri:    item.querySelector('.behavior-item-suggestion')?.textContent.replace('💡', '').trim()
        }))
      : [];
  } else {
    data.konfor_alani.uyumlu    = [];
    data.konfor_alani.esneyecek = [];
  }

  // Öğrenme Stili
  const learningStyleInput = document.getElementById('learningStyle');
  if (learningStyleInput?.value) {
    const styleNames = {
      activist:   'DEĞİŞİMCİ (Activist)',
      reflector:  'YANSITICI (Reflector)',
      theorist:   'KURAMCI (Theorist)',
      pragmatist: 'UYGULAYICI (Pragmatist)'
    };
    const ids          = learningStyleInput.value.split(',').filter(Boolean);
    data.ogrenme_stili = ids.map(id => styleNames[id] || id).join(', ');
  } else {
    data.ogrenme_stili = 'Seçilmedi';
  }

  // Tedavi Alanı
  const atcSelect    = document.getElementById('atc_select_card2');
  data.tedavi_alani  = atcSelect?.options[atcSelect.selectedIndex]?.text || 'Seçilmedi';

  // Ürün
  const productPills = document.getElementById('productPills');
  if (productPills) {
    const pills = productPills.querySelectorAll('.pill.active');
    data.urun   = Array.from(pills)
      .map(p => p.querySelector('span:not(.x)')?.textContent.trim())
      .filter(Boolean).join(', ') || 'Seçilmedi';
  } else {
    data.urun = 'Seçilmedi';
  }

  // Kullanım Şekli
  const usageType      = document.getElementById('usage_type');
  data.kullanim_sekli  = usageType?.value || 'Seçilmedi';

  // Pozoloji
  const posology = document.getElementById('posology');
  data.pozoloji  = posology?.value || 'Seçilmedi';

  // Temel CPR
  const autoCPR  = document.getElementById('autoCPR');
  data.temel_cpr = autoCPR?.value || 'Henüz oluşturulmamış';

  // Stil CPR'lar — JSONB array olarak
  if (learningStyleInput?.value) {
    const styleNames = {
      activist:   'DEĞİŞİMCİ (Activist)',
      reflector:  'YANSITICI (Reflector)',
      theorist:   'KURAMCI (Theorist)',
      pragmatist: 'UYGULAYICI (Pragmatist)'
    };
    learningStyleInput.value.split(',').filter(Boolean).forEach(id => {
      const textarea = document.getElementById(`${id}_cpr`);
      if (textarea?.value?.trim()) {
        data.stil_cprlar.push({
          stil: styleNames[id] || id,
          cpr:  textarea.value
        });
      }
    });
  }

  return data;
}
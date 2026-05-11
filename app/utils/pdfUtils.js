// ============================================
// PDF STYLES (Constant)
// ============================================

const PDF_STYLES = {
  header: {
    fontSize: 18,
    bold: true,
    color: '#e30a17',
    margin: [0, 0, 0, 4]
  },
  meta: {
    fontSize: 10,
    color: '#888888'
  },
  sectionTitle: {
    fontSize: 12,
    bold: true,
    color: '#003cbb',
    margin: [0, 0, 0, 4]
  },
  stilTitle: {
    fontSize: 11,
    bold: true,
    color: '#374151',
    margin: [0, 4, 0, 2]
  },
  field: {
    fontSize: 11,
    color: '#333333',
    margin: [0, 0, 0, 2]
  },
  cprText: {
    fontSize: 11,
    color: '#1a1a1a',
    lineHeight: 1.5,
    margin: [0, 0, 0, 4]
  }
};

// ============================================
// HELPER: Dynamic Section Builder
// ============================================

function addTextField(content, label, value, style = 'field') {
  if (value && value !== '—') {
    content.push({ text: `${label}: ${value}`, style });
  } else {
    content.push({ text: `${label}: —`, style });
  }
  return content;
}

function addSectionTitle(content, title) {
  content.push({ text: title, style: 'sectionTitle' });
  return content;
}

function addSpacer(content, margin = [0, 0, 0, 8]) {
  content.push({ text: '', margin });
  return content;
}

function addSeparator(content) {
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 0.5, lineColor: '#cccccc' }],
    margin: [0, 8, 0, 12]
  });
  return content;
}

// ============================================
// MAIN: Build Document Definition
// ============================================

export function buildDocDefinition(pdf) {
  const stilCprlar = pdf.stil_cprlar || [];
  const currentDate = pdf.tarih || new Date().toLocaleString('tr-TR');
  const content = [];

  // Header
  content.push({ text: 'FAST CPR KOÇU', style: 'header' });
  content.push({ text: `Tarih: ${currentDate}`, style: 'meta' });
  addSeparator(content);

  // Product Information Section
  addSectionTitle(content, 'Ürün Bilgileri');
  addTextField(content, 'Ürün', pdf.urun);
  addTextField(content, 'Tedavi Alanı', pdf.tedavi_alani);
  addTextField(content, 'Kullanım Şekli', pdf.kullanim_sekli);
  addTextField(content, 'Pozoloji', pdf.pozoloji);
  addSpacer(content);

  // Doctor Profile Section
  addSectionTitle(content, 'Hekim Profili');
  addTextField(content, 'Öğrenme Stili', pdf.ogrenme_stili);
  addSpacer(content);

  // Patient Claim Section
  addSectionTitle(content, 'Hasta Şikayeti (Claim)');
  content.push({ text: pdf.claim || '—', style: 'cprText' });
  addSpacer(content);

  // Style-Based CPRs Section
  if (stilCprlar.length > 0) {
    addSectionTitle(content, "Stil Bazlı CPR'lar");
    stilCprlar.forEach(item => {
      content.push({ text: item.stil, style: 'stilTitle' });
      content.push({ text: item.cpr || '—', style: 'cprText' });
      addSpacer(content);
    });
  }

  return {
    content,
    styles: PDF_STYLES,
    defaultStyle: { font: 'Roboto' },
    pageMargins: [40, 40, 40, 40],
    info: {
      title: `FAST_CPR_${pdf.urun || 'Rapor'}_${new Date().toISOString().split('T')[0]}`,
      author: 'FAST AI CPR Koçu',
      subject: 'Hekim İletişim Stili Analizi ve CPR Önerileri',
      keywords: `FAST, CPR, İletişim, ${pdf.urun || ''}, ${pdf.ogrenme_stili || ''}`,
      creator: 'FAST AI System',
      producer: 'pdfmake'
    }
  };
}

// ============================================
// HELPER: Sanitize Filename (Enhanced)
// ============================================

export function sanitizeFilename(filename, maxLength = 100) {
  if (!filename || typeof filename !== 'string') {
    return 'FAST_CPR_Rapor.pdf';
  }

  let sanitized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\.\-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (sanitized.length > maxLength) {
    const extension = sanitized.includes('.') ? sanitized.slice(sanitized.lastIndexOf('.')) : '';
    const nameWithoutExt = extension ? sanitized.slice(0, sanitized.lastIndexOf('.')) : sanitized;
    const maxNameLength = maxLength - extension.length;
    sanitized = nameWithoutExt.slice(0, maxNameLength) + extension;
  }

  if (!sanitized.includes('.pdf')) {
    sanitized += '.pdf';
  }

  return sanitized || 'FAST_CPR_Rapor.pdf';
}

// ============================================
// HELPER: Download PDF
// ============================================

export function downloadPDF(docDefinition, fileName) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(fileName);
      setTimeout(resolve, 100);
    } catch (err) {
      reject(err);
    }
  });
}
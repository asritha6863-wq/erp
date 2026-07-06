const PDFDocument = require('pdfkit');

// ── Helper: draw a horizontal line ─────────────────────────────────────────
const hLine = (doc, y) => {
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#dee2e6').lineWidth(0.5).stroke();
};

// ── Helper: section header ──────────────────────────────────────────────────
const sectionHeader = (doc, text, y) => {
  doc.rect(50, y, 495, 20).fill('#e8f0fe');
  doc.fillColor('#1a1f2e').fontSize(10).font('Helvetica-Bold')
     .text(text, 56, y + 5);
  doc.fillColor('#343a40').font('Helvetica');
  return y + 28;
};

// ── Helper: key-value row ────────────────────────────────────────────────────
const kvRow = (doc, label, value, x1, x2, y) => {
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#6c757d').text(label, x1, y);
  doc.fontSize(9).font('Helvetica').fillColor('#1a1f2e').text(value || '—', x2, y);
};

// ── ERP Header ────────────────────────────────────────────────────────────────
const drawHeader = (doc, title, subtitle) => {
  // Blue header bar
  doc.rect(0, 0, 595, 80).fill('#0d6efd');
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
     .text('ERP Payment Workflow System', 50, 20);
  doc.fontSize(11).font('Helvetica').text(title, 50, 44);
  if (subtitle) doc.fontSize(9).text(subtitle, 50, 60);

  // Date
  doc.fontSize(8).fillColor('rgba(255,255,255,0.8)')
     .text(`Generated: ${new Date().toLocaleString()}`, 400, 60, { align: 'right', width: 145 });

  doc.fillColor('#343a40');
  return 100;
};

// ──────────────────────────────────────────────────────────────────────────────
// GENERATE PURCHASE ORDER PDF
// ──────────────────────────────────────────────────────────────────────────────
const generatePOPdf = (pr) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end',  ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = drawHeader(doc, 'PURCHASE ORDER', `PO Number: ${pr.purchaseOrder?.poNumber || 'N/A'}`);

    // PO Number badge
    doc.rect(50, y, 495, 30).fill('#f0f4ff');
    doc.fillColor('#0d6efd').fontSize(14).font('Helvetica-Bold')
       .text(`Purchase Order: ${pr.purchaseOrder?.poNumber || 'N/A'}`, 56, y + 8);
    doc.fillColor('#343a40').font('Helvetica');
    y += 40;

    // PO Details + Vendor side by side
    y = sectionHeader(doc, 'PO DETAILS', y);
    kvRow(doc, 'Request Number:',  pr.requestNumber,                   56, 180, y);     y += 16;
    kvRow(doc, 'Request Title:',   pr.title,                           56, 180, y);     y += 16;
    kvRow(doc, 'PO Date:',         pr.purchaseOrder?.poDate ? new Date(pr.purchaseOrder.poDate).toLocaleDateString() : '—', 56, 180, y); y += 16;
    kvRow(doc, 'Delivery Date:',   pr.purchaseOrder?.deliveryDate ? new Date(pr.purchaseOrder.deliveryDate).toLocaleDateString() : '—', 56, 180, y); y += 16;
    kvRow(doc, 'Payment Terms:',   pr.purchaseOrder?.paymentTerms,     56, 180, y);     y += 16;
    kvRow(doc, 'Delivery Terms:',  pr.purchaseOrder?.deliveryTerms,    56, 180, y);     y += 16;
    kvRow(doc, 'Department:',      pr.department?.name,                56, 180, y);     y += 16;
    kvRow(doc, 'Cost Center:',     pr.costCenter,                      56, 180, y);     y += 20;

    y = sectionHeader(doc, 'VENDOR INFORMATION', y);
    kvRow(doc, 'Vendor Name:',     pr.vendor?.vendorName,    56, 180, y);    y += 16;
    kvRow(doc, 'Vendor Code:',     pr.vendor?.vendorCode,    56, 180, y);    y += 16;
    kvRow(doc, 'Contact Person:',  pr.vendor?.contactPerson, 56, 180, y);    y += 16;
    kvRow(doc, 'Email:',           pr.vendor?.email,         56, 180, y);    y += 16;
    kvRow(doc, 'Phone:',           pr.vendor?.phone,         56, 180, y);    y += 16;
    kvRow(doc, 'Address:',         pr.vendor?.address,       56, 180, y);    y += 16;
    kvRow(doc, 'Bank Name:',       pr.vendor?.bankName,      56, 180, y);    y += 16;
    kvRow(doc, 'Bank Account:',    pr.vendor?.bankAccount,   56, 180, y);    y += 16;
    kvRow(doc, 'Tax Number:',      pr.vendor?.taxNumber,     56, 180, y);    y += 24;

    // Items table
    y = sectionHeader(doc, 'ORDERED ITEMS', y);
    const cols = [56, 200, 310, 360, 420, 480];
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#6c757d');
    doc.text('#',          cols[0], y); doc.text('Item Name',   cols[1], y);
    doc.text('Qty',        cols[2], y); doc.text('Unit',        cols[3], y);
    doc.text('Unit Price', cols[4], y); doc.text('Total',       cols[5], y);
    y += 14; hLine(doc, y); y += 6;

    doc.font('Helvetica').fillColor('#1a1f2e').fontSize(9);
    (pr.items || []).forEach((item, i) => {
      doc.text(String(i + 1),              cols[0], y);
      doc.text(item.itemName,              cols[1], y, { width: 100 });
      doc.text(String(item.quantity),      cols[2], y);
      doc.text(item.unit || 'pcs',         cols[3], y);
      doc.text(`${pr.currency} ${Number(item.unitPrice).toFixed(2)}`,  cols[4], y);
      doc.text(`${pr.currency} ${Number(item.totalPrice).toFixed(2)}`, cols[5], y);
      y += 16;
    });

    hLine(doc, y); y += 8;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0d6efd')
       .text(`Total Amount: ${pr.currency} ${Number(pr.totalAmount).toLocaleString()}`, 0, y, { align: 'right', width: 545 });
    y += 30;

    if (pr.purchaseOrder?.notes) {
      y = sectionHeader(doc, 'NOTES', y);
      doc.fontSize(9).font('Helvetica').fillColor('#343a40').text(pr.purchaseOrder.notes, 56, y, { width: 483 });
    }

    doc.end();
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// GENERATE QUOTATION PDF
// ──────────────────────────────────────────────────────────────────────────────
const generateQuotationPdf = (pr) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end',  ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const q = pr.quotation || {};
    let y = drawHeader(doc, 'QUOTATION', `Quotation Number: ${q.quotationNumber || 'N/A'}`);

    doc.rect(50, y, 495, 30).fill('#f0fff4');
    doc.fillColor('#198754').fontSize(14).font('Helvetica-Bold')
       .text(`Quotation: ${q.quotationNumber || 'N/A'}`, 56, y + 8);
    doc.fillColor('#343a40').font('Helvetica'); y += 40;

    y = sectionHeader(doc, 'QUOTATION DETAILS', y);
    kvRow(doc, 'Quotation Date:',  q.quotationDate ? new Date(q.quotationDate).toLocaleDateString() : '—', 56, 200, y); y += 16;
    kvRow(doc, 'Valid Until:',     q.validUntil    ? new Date(q.validUntil).toLocaleDateString()    : '—', 56, 200, y); y += 16;
    kvRow(doc, 'Reference PO:',    pr.purchaseOrder?.poNumber || '—', 56, 200, y);  y += 16;
    kvRow(doc, 'Request Title:',   pr.title,  56, 200, y);  y += 16;
    kvRow(doc, 'Vendor:',          pr.vendor?.vendorName, 56, 200, y); y += 24;

    // Items
    y = sectionHeader(doc, 'QUOTATION ITEMS', y);
    const cols = [56, 210, 320, 380, 462];
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#6c757d');
    doc.text('#', cols[0], y); doc.text('Item Name', cols[1], y);
    doc.text('Qty', cols[2], y); doc.text('Unit Price', cols[3], y); doc.text('Total', cols[4], y);
    y += 14; hLine(doc, y); y += 6;

    doc.font('Helvetica').fillColor('#1a1f2e').fontSize(9);
    (q.items || []).forEach((item, i) => {
      doc.text(String(i + 1),   cols[0], y);
      doc.text(item.itemName,   cols[1], y, { width: 100 });
      doc.text(String(item.quantity), cols[2], y);
      doc.text(`${pr.currency} ${Number(item.unitPrice || 0).toFixed(2)}`,  cols[3], y);
      doc.text(`${pr.currency} ${Number(item.totalPrice || 0).toFixed(2)}`, cols[4], y);
      y += 16;
    });

    hLine(doc, y); y += 10;
    const rightX = 350;
    doc.fontSize(9);
    kvRow(doc, 'Subtotal:',   `${pr.currency} ${Number(q.subtotal  || 0).toFixed(2)}`, rightX, 460, y);   y += 16;
    kvRow(doc, `Tax (${q.taxRate || 0}%):`, `${pr.currency} ${Number(q.taxAmount || 0).toFixed(2)}`, rightX, 460, y); y += 16;
    hLine(doc, y); y += 8;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#0d6efd');
    kvRow(doc, 'Grand Total:', `${pr.currency} ${Number(q.grandTotal || 0).toFixed(2)}`, rightX, 460, y); y += 30;
    doc.fillColor('#343a40').font('Helvetica');

    if (q.terms) {
      y = sectionHeader(doc, 'TERMS & CONDITIONS', y);
      doc.fontSize(9).text(q.terms, 56, y, { width: 483 });
    }

    doc.end();
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// GENERATE PAYMENT ADVICE PDF
// ──────────────────────────────────────────────────────────────────────────────
const generatePaymentAdvicePdf = (pr, payment) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end',  ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = drawHeader(doc, 'PAYMENT ADVICE', `Advice Number: ${payment?.paymentAdviceNo || 'N/A'}`);

    // Paid stamp
    doc.rect(390, y, 155, 36).fill('#d1fae5').stroke('#198754');
    doc.fillColor('#065f46').fontSize(14).font('Helvetica-Bold')
       .text('✓  PAID', 400, y + 10);
    doc.fillColor('#343a40').font('Helvetica'); y += 50;

    y = sectionHeader(doc, 'PAYMENT DETAILS', y);
    kvRow(doc, 'Payment Advice #:',  payment?.paymentAdviceNo,  56, 230, y); y += 16;
    kvRow(doc, 'Request Number:',    pr.requestNumber,           56, 230, y); y += 16;
    kvRow(doc, 'Request Title:',     pr.title,                   56, 230, y); y += 16;
    kvRow(doc, 'Payment Method:',    payment?.paymentMethod,     56, 230, y); y += 16;
    kvRow(doc, 'Bank Name:',         payment?.bankName,          56, 230, y); y += 16;
    kvRow(doc, 'Transaction Ref:',   payment?.transactionRef,    56, 230, y); y += 16;
    kvRow(doc, 'Payment Date:',      payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '—', 56, 230, y); y += 16;
    kvRow(doc, 'Status:',            (payment?.status || '').toUpperCase(), 56, 230, y); y += 24;

    y = sectionHeader(doc, 'VENDOR & REQUEST DETAILS', y);
    kvRow(doc, 'Vendor Name:',  pr.vendor?.vendorName,    56, 230, y); y += 16;
    kvRow(doc, 'Vendor Code:',  pr.vendor?.vendorCode,    56, 230, y); y += 16;
    kvRow(doc, 'Bank Account:', pr.vendor?.bankAccount,   56, 230, y); y += 16;
    kvRow(doc, 'Department:',   pr.department?.name,      56, 230, y); y += 16;
    kvRow(doc, 'Cost Center:',  pr.costCenter,            56, 230, y); y += 16;
    kvRow(doc, 'PO Number:',    pr.purchaseOrder?.poNumber, 56, 230, y); y += 24;

    // Amount box
    doc.rect(50, y, 495, 60).fill('#f0f4ff').stroke('#c7d7fe');
    doc.fillColor('#6c757d').fontSize(10).font('Helvetica').text('TOTAL AMOUNT PAID', 56, y + 10);
    doc.fillColor('#0d6efd').fontSize(22).font('Helvetica-Bold')
       .text(`${payment?.currency || pr.currency} ${Number(payment?.amount || pr.totalAmount || 0).toLocaleString()}`, 56, y + 26);
    doc.fillColor('#343a40').font('Helvetica'); y += 80;

    // Items summary
    y = sectionHeader(doc, 'ITEMS SUMMARY', y);
    (pr.items || []).forEach((item) => {
      doc.fontSize(9).font('Helvetica').fillColor('#343a40')
         .text(`• ${item.itemName} × ${item.quantity} ${item.unit} @ ${pr.currency} ${item.unitPrice}`, 56, y,
           { width: 380, continued: true })
         .font('Helvetica-Bold')
         .text(`${pr.currency} ${Number(item.totalPrice).toFixed(2)}`, { align: 'right', width: 100 });
      y += 16;
    });

    // Approval chain
    y += 10;
    y = sectionHeader(doc, 'AUTHORIZED BY', y);
    doc.fontSize(8).fillColor('#6c757d')
       .text('This payment has been approved through the full 8-step ERP workflow authorization process.', 56, y, { width: 483 });

    doc.end();
  });
};

module.exports = { generatePOPdf, generateQuotationPdf, generatePaymentAdvicePdf };

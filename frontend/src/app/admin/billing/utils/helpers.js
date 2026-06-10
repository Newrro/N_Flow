import * as XLSX from 'xlsx';
import JSZip from 'jszip';

/* ---------- Profit math (now driven by per-invoice profitPct) ---------- */
export function getMargin(invoice) {
  return typeof invoice.profitPct === 'number' ? invoice.profitPct : 0;
}
export function calcProfit(invoice) {
  return Math.round((invoice.amount || 0) * getMargin(invoice) / 100);
}
export function calcCost(invoice) {
  return (invoice.amount || 0) - calcProfit(invoice);
}

/* ---------- Date helpers ---------- */
export function getYears(items) {
  const years = new Set((items || []).filter(i => i.date).map(i => i.date.split('-')[0]));
  return Array.from(years).sort((a, b) => b - a);
}
export function filterByYear(items, year) {
  if (!year || year === 'all') return items;
  return items.filter(i => i.date && i.date.startsWith(year));
}
export function sortByDate(items) {
  return [...items].sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* ---------- P&L summary ---------- */
export function getPLSummary(invoices, expenses = []) {
  const byType = (t) => invoices.filter(i => i.type === t);
  const sum = (arr, fn) => arr.reduce((s, i) => s + fn(i), 0);
  const block = (arr) => {
    const revenue = sum(arr, i => i.amount);
    const profit = sum(arr, calcProfit);
    return { revenue, profit, cost: revenue - profit, count: arr.length };
  };
  const oemB = block(byType('OEM'));
  const procB = block(byType('Procurement'));
  const svcB = block(byType('Service'));
  const totalRevenue = oemB.revenue + procB.revenue + svcB.revenue;
  const grossProfit = oemB.profit + procB.profit + svcB.profit;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  return {
    oem: oemB, procurement: procB, service: svcB,
    total: { revenue: totalRevenue, profit: grossProfit, cost: totalRevenue - grossProfit, count: invoices.length },
    expenses: { total: totalExpenses, count: expenses.length },
    netProfit: grossProfit - totalExpenses,
  };
}

export function getMonthlyData(invoices, expenses = []) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const map = {};
  const ensure = (label) => {
    if (!map[label]) map[label] = { month: label, revenue: 0, profit: 0, expenses: 0 };
    return map[label];
  };
  invoices.forEach(inv => {
    const m = parseInt(inv.date.split('-')[1]) - 1;
    const row = ensure(months[m]);
    row.revenue += inv.amount;
    row.profit += calcProfit(inv);
  });
  expenses.forEach(exp => {
    const m = parseInt(exp.date.split('-')[1]) - 1;
    ensure(months[m]).expenses += exp.amount || 0;
  });
  return months.map(m => map[m] || { month: m, revenue: 0, profit: 0, expenses: 0 });
}

export function getVendorSummary(invoices, expenses, parties) {
  return parties.map(v => {
    const vInvs = invoices.filter(i => i.customerId === v.id);
    const vExps = expenses.filter(e => e.vendorId === v.id);
    return {
      ...v,
      invoiceCount: vInvs.length,
      expenseCount: vExps.length,
      totalSales: vInvs.reduce((s, i) => s + i.amount, 0),
      totalSpend: vExps.reduce((s, e) => s + (e.amount || 0), 0),
    };
  }).sort((a, b) => (b.totalSales + b.totalSpend) - (a.totalSales + a.totalSpend));
}

/* ---------- Formatting ---------- */
export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const PAYMENT_MODES = ['UPI', 'Cash', 'Card', 'Net Banking', 'Cheque', 'EMI', 'TDS'];

/* Days a pending invoice has been outstanding */
export function daysSince(dateStr) {
  if (!dateStr) return 0;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

/* ---------- Excel + PDF zip export ---------- */
function dataUrlToBase64(dataUrl) {
  if (!dataUrl) return null;
  const idx = dataUrl.indexOf('base64,');
  return idx >= 0 ? dataUrl.slice(idx + 7) : null;
}
function safeName(s) {
  return String(s || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function patchAttachmentLinks(ws, rows, attachCol) {
  rows.forEach((r, i) => {
    if (!r.__attachPath) return;
    const addr = XLSX.utils.encode_cell({ c: attachCol, r: i + 1 }); // +1 for header
    if (!ws[addr]) ws[addr] = { t: 's', v: r.__attachName };
    ws[addr].l = { Target: r.__attachPath, Tooltip: 'Open invoice PDF' };
    ws[addr].v = r.__attachName;
  });
}

function buildInvoiceRows(invoices, zip) {
  return sortByDate(invoices).map(inv => {
    let attachName = '', attachPath = '';
    const b64 = dataUrlToBase64(inv.pdfData);
    if (b64 && inv.pdfName) {
      attachName = `INV_${safeName(inv.invoiceNo)}_${safeName(inv.pdfName)}`;
      attachPath = `attachments/${attachName}`;
      if (zip) zip.file(attachPath, b64, { base64: true });
    }
    return {
      'Date': formatDate(inv.date),
      'Amount (₹)': inv.amount,
      'Profit (₹)': calcProfit(inv),
      'Description': inv.description,
      'Customer': inv.customerName,
      'Invoice No': inv.invoiceNo,
      'Type': inv.type,
      'Profit %': getMargin(inv),
      'GST Rate (%)': inv.gstRate || 0,
      'CGST (₹)': inv.cgst || 0,
      'SGST (₹)': inv.sgst || 0,
      'IGST (₹)': inv.igst || 0,
      'Total w/ GST (₹)': inv.totalWithGst || inv.amount,
      'Status': inv.status,
      'Mode of Payment': inv.modeOfPayment || '',
      'Notes': inv.notes || '',
      'Attachment': attachName || '—',
      __attachName: attachName, __attachPath: attachPath,
    };
  });
}

function buildExpenseRows(expenses, zip) {
  return sortByDate(expenses).map(exp => {
    let attachName = '', attachPath = '';
    const b64 = dataUrlToBase64(exp.pdfData);
    if (b64 && exp.pdfName) {
      attachName = `EXP_${safeName(exp.vendorName)}_${safeName(exp.pdfName)}`;
      attachPath = `attachments/${attachName}`;
      if (zip) zip.file(attachPath, b64, { base64: true });
    }
    return {
      'Date': formatDate(exp.date),
      'Amount (₹)': exp.amount,
      'Description': exp.description,
      'Vendor': exp.vendorName,
      'Category': exp.category || '',
      'GST Rate (%)': exp.gstRate || 0,
      'GST Amount (₹)': exp.gstAmount || 0,
      'Total w/ GST (₹)': exp.totalWithGst || exp.amount,
      'Attachment': attachName || '—',
      __attachName: attachName, __attachPath: attachPath,
    };
  });
}

function stripMeta(rows) {
  return rows.map(({ __attachName, __attachPath, ...rest }) => rest);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function finalizeWorkbook(wb, zip, baseName) {
  const hasAttachments = Object.keys(zip.files).some(f => f.startsWith('attachments/'));
  const xlsxArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const stamp = new Date().toISOString().split('T')[0];
  if (!hasAttachments) {
    triggerDownload(new Blob([xlsxArray], { type: 'application/octet-stream' }), `${baseName}_${stamp}.xlsx`);
    return;
  }
  zip.file(`${baseName}_${stamp}.xlsx`, xlsxArray);
  const content = await zip.generateAsync({ type: 'blob' });
  triggerDownload(content, `${baseName}_${stamp}.zip`);
}

export async function exportInvoices(invoices, expenses, year) {
  const zip = new JSZip();
  const invRows = buildInvoiceRows(invoices, zip);
  const ws = XLSX.utils.json_to_sheet(stripMeta(invRows));
  ws['!cols'] = [14,14,13,34,22,16,12,9,11,11,11,11,15,10,16,28,30].map(w => ({ wch: w }));
  patchAttachmentLinks(ws, invRows, 16);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Invoices ${year || 'All'}`);

  const pl = getPLSummary(invoices, expenses);
  const summaryRows = [
    { Category: 'OEM', Revenue: pl.oem.revenue, Cost: pl.oem.cost, Profit: pl.oem.profit, Invoices: pl.oem.count },
    { Category: 'Procurement', Revenue: pl.procurement.revenue, Cost: pl.procurement.cost, Profit: pl.procurement.profit, Invoices: pl.procurement.count },
    { Category: 'Service', Revenue: pl.service.revenue, Cost: pl.service.cost, Profit: pl.service.profit, Invoices: pl.service.count },
    { Category: 'GROSS TOTAL', Revenue: pl.total.revenue, Cost: pl.total.cost, Profit: pl.total.profit, Invoices: pl.total.count },
    { Category: 'Expenses', Revenue: '', Cost: pl.expenses.total, Profit: '', Invoices: pl.expenses.count },
    { Category: 'NET PROFIT', Revenue: '', Cost: '', Profit: pl.netProfit, Invoices: '' },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws2['!cols'] = [18,16,16,16,12].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws2, 'P&L Summary');

  await finalizeWorkbook(wb, zip, `Newrro_Invoices_${year || 'All'}`);
}

export async function exportExpenses(expenses, year) {
  const zip = new JSZip();
  const rows = buildExpenseRows(expenses, zip);
  const ws = XLSX.utils.json_to_sheet(stripMeta(rows));
  ws['!cols'] = [14,13,34,22,16,11,14,15,30].map(w => ({ wch: w }));
  patchAttachmentLinks(ws, rows, 8);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Expenses ${year || 'All'}`);
  await finalizeWorkbook(wb, zip, `Newrro_Expenses_${year || 'All'}`);
}

export async function exportAll(invoices, expenses, year) {
  const zip = new JSZip();
  const invRows = buildInvoiceRows(invoices, zip);
  const expRows = buildExpenseRows(expenses, zip);
  const wb = XLSX.utils.book_new();

  const wsI = XLSX.utils.json_to_sheet(stripMeta(invRows));
  wsI['!cols'] = [14,14,13,34,22,16,12,9,11,11,11,11,15,10,16,28,30].map(w => ({ wch: w }));
  patchAttachmentLinks(wsI, invRows, 16);
  XLSX.utils.book_append_sheet(wb, wsI, `Invoices ${year || 'All'}`);

  const wsE = XLSX.utils.json_to_sheet(stripMeta(expRows));
  wsE['!cols'] = [14,13,34,22,16,11,14,15,30].map(w => ({ wch: w }));
  patchAttachmentLinks(wsE, expRows, 8);
  XLSX.utils.book_append_sheet(wb, wsE, `Expenses ${year || 'All'}`);

  const pl = getPLSummary(invoices, expenses);
  const summaryRows = [
    { Category: 'OEM', Revenue: pl.oem.revenue, Cost: pl.oem.cost, Profit: pl.oem.profit },
    { Category: 'Procurement', Revenue: pl.procurement.revenue, Cost: pl.procurement.cost, Profit: pl.procurement.profit },
    { Category: 'Service', Revenue: pl.service.revenue, Cost: pl.service.cost, Profit: pl.service.profit },
    { Category: 'GROSS TOTAL', Revenue: pl.total.revenue, Cost: pl.total.cost, Profit: pl.total.profit },
    { Category: 'Total Expenses', Revenue: '', Cost: pl.expenses.total, Profit: '' },
    { Category: 'NET PROFIT', Revenue: '', Cost: '', Profit: pl.netProfit },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws2['!cols'] = [18,16,16,16].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws2, 'P&L Summary');

  await finalizeWorkbook(wb, zip, `Newrro_Finance_${year || 'All'}`);
}

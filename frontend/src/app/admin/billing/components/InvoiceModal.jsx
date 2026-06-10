import { useState, useEffect } from 'react';
import { X, Upload, FileText, Plus, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calcProfit, formatINR, PAYMENT_MODES } from '../utils/helpers';

const EMPTY = {
  date: new Date().toISOString().split('T')[0],
  invoiceNo: '',
  customerId: '',
  customerName: '',
  type: 'OEM',
  description: '',
  amount: '',
  profitPct: 50,
  gstRate: 18,
  cgst: 0, sgst: 0, igst: 0, totalWithGst: 0,
  status: 'paid',
  modeOfPayment: 'Net Banking',
  notes: '',
  pdfName: null,
  pdfData: null,
};

function calcGST(amount, rate, isInterstate) {
  const base = parseFloat(amount) || 0;
  const gstAmt = Math.round(base * rate / 100);
  if (isInterstate) return { cgst: 0, sgst: 0, igst: gstAmt, totalWithGst: base + gstAmt };
  const half = Math.round(gstAmt / 2);
  return { cgst: half, sgst: half, igst: 0, totalWithGst: base + gstAmt };
}

export default function InvoiceModal({ onClose, editInvoice }) {
  const { parties, settings, addInvoice, updateInvoice, addParty } = useData();
  const [form, setForm] = useState(editInvoice ? { ...editInvoice } : { ...EMPTY, profitPct: settings.margins.OEM });
  const [isInterstate, setIsInterstate] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(editInvoice ? (editInvoice.gstRate > 0) : true);
  const [newCustomer, setNewCustomer] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-generate invoice number
  useEffect(() => {
    if (!editInvoice) {
      const year = new Date().getFullYear();
      const ts = Date.now().toString().slice(-4);
      set('invoiceNo', `NEWRRO-${year}-${ts}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill customer name
  useEffect(() => {
    if (form.customerId) {
      const v = parties.find(v => v.id === form.customerId);
      if (v) set('customerName', v.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.customerId]);

  // Recalculate GST
  useEffect(() => {
    if (gstEnabled && form.amount && form.gstRate) {
      setForm(f => ({ ...f, ...calcGST(form.amount, form.gstRate, isInterstate) }));
    } else {
      setForm(f => ({ ...f, cgst: 0, sgst: 0, igst: 0, totalWithGst: parseFloat(f.amount) || 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.amount, form.gstRate, isInterstate, gstEnabled]);

  // When type changes (and not editing an existing value), prefill the adjustable default margin
  const onTypeChange = (t) => {
    setForm(f => ({ ...f, type: t, profitPct: settings.margins[t] ?? f.profitPct }));
  };

  const handlePDF = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { set('pdfData', ev.target.result); set('pdfName', file.name); };
    reader.readAsDataURL(file);
  };

  const commitNewCustomer = () => {
    const name = newCustomer.trim();
    if (!name) return;
    const created = addParty({ name, type: 'customer', gstin: '', contact: '', phone: '', address: '' });
    setForm(f => ({ ...f, customerId: created.id, customerName: created.name }));
    setNewCustomer('');
    setAddingCustomer(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      amount: parseFloat(form.amount),
      profitPct: parseFloat(form.profitPct) || 0,
      gstRate: gstEnabled ? parseFloat(form.gstRate) : 0,
    };
    if (editInvoice) updateInvoice(editInvoice.id, data);
    else addInvoice(data);
    onClose();
  };

  const previewProfit = calcProfit({ amount: parseFloat(form.amount) || 0, profitPct: parseFloat(form.profitPct) || 0 });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{editInvoice ? 'Edit Invoice' : 'New Invoice'}</h3>
          <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Invoice No *</label>
                <input className="form-input" value={form.invoiceNo} onChange={e => set('invoiceNo', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
            </div>

            {/* Type is captured here but stays hidden in the invoice table */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type (hidden in table)</label>
                <select className="form-select" value={form.type} onChange={e => onTypeChange(e.target.value)}>
                  <option value="OEM">OEM Product</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Service">Service</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mode of Payment</label>
                <select className="form-select" value={form.modeOfPayment} onChange={e => set('modeOfPayment', e.target.value)}>
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Customer with inline add */}
            <div className="form-group">
              <label className="form-label">Customer *</label>
              {!addingCustomer ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="form-select" value={form.customerId} onChange={e => set('customerId', e.target.value)} required style={{ flex: 1 }}>
                    <option value="">Select customer…</option>
                    {parties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddingCustomer(true)}>
                    <Plus size={13} /> New
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="New customer name" value={newCustomer} onChange={e => setNewCustomer(e.target.value)} autoFocus style={{ flex: 1 }} />
                  <button type="button" className="btn btn-primary btn-sm" onClick={commitNewCustomer}><Check size={13} /></button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAddingCustomer(false); setNewCustomer(''); }}><X size={13} /></button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Product / service description" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label className="form-label">Profit %</label>
                <input className="form-input" type="number" min="0" max="100" step="0.5" value={form.profitPct} onChange={e => set('profitPct', e.target.value)} placeholder="50" required />
              </div>
            </div>

            {/* Profit preview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Profit at {form.profitPct || 0}%</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'Syne' }}>{formatINR(previewProfit)}</span>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* GST Section */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
              <div className="flex-between mb-16" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>GST Details (Optional)</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                  <input type="checkbox" checked={gstEnabled} onChange={e => setGstEnabled(e.target.checked)} />
                  Enable GST
                </label>
              </div>

              {gstEnabled && (
                <>
                  <div className="form-row" style={{ marginBottom: 8 }}>
                    <div>
                      <label className="form-label">GST Rate (%)</label>
                      <select className="form-select" value={form.gstRate} onChange={e => set('gstRate', e.target.value)}>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5 }}>
                        <input type="checkbox" checked={isInterstate} onChange={e => setIsInterstate(e.target.checked)} />
                        Interstate (IGST)
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                    {[['CGST', form.cgst], ['SGST', form.sgst], ['IGST', form.igst], ['Total w/GST', form.totalWithGst]].map(([k, v]) => (
                      <div key={k} style={{ background: 'var(--bg-card)', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ color: 'var(--text-muted2)', fontSize: 10.5, marginBottom: 2 }}>{k}</div>
                        <div style={{ fontWeight: 600 }}>₹{(v || 0).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" style={{ minHeight: 60 }} />
            </div>

            {/* PDF Upload */}
            <div className="form-group">
              <label className="form-label">Invoice PDF (Optional)</label>
              {form.pdfName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <FileText size={16} color="var(--accent)" />
                  <span style={{ fontSize: 13, flex: 1 }} className="truncate">{form.pdfName}</span>
                  <button type="button" className="btn-ghost btn-icon" onClick={() => { set('pdfName', null); set('pdfData', null); }}><X size={14} /></button>
                </div>
              ) : (
                <div className="file-upload-area">
                  <input type="file" accept="application/pdf" onChange={handlePDF} />
                  <Upload size={20} />
                  <p>Click or drag PDF invoice here</p>
                  <p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-muted2)' }}>Saved locally · included in Excel export</p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editInvoice ? 'Save Changes' : 'Add Invoice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

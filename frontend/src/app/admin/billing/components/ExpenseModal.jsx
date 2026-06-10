import { useState, useEffect } from 'react';
import { X, Upload, FileText, Plus, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatINR } from '../utils/helpers';

const EMPTY = {
  date: new Date().toISOString().split('T')[0],
  vendorId: '',
  vendorName: '',
  category: 'Components',
  description: '',
  amount: '',
  gstRate: 18,
  gstAmount: 0,
  totalWithGst: 0,
  pdfName: null,
  pdfData: null,
};

const CATEGORIES = ['Components', 'Tools & Equipment', 'Services', 'Logistics', 'Software', 'Office', 'Other'];

export default function ExpenseModal({ onClose, editExpense }) {
  const { parties, addExpense, updateExpense, addParty } = useData();
  const [form, setForm] = useState(editExpense ? { ...editExpense } : { ...EMPTY });
  const [gstEnabled, setGstEnabled] = useState(editExpense ? (editExpense.gstRate > 0) : true);
  const [newVendor, setNewVendor] = useState('');
  const [addingVendor, setAddingVendor] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.vendorId) {
      const v = parties.find(p => p.id === form.vendorId);
      if (v) set('vendorName', v.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vendorId]);

  useEffect(() => {
    const base = parseFloat(form.amount) || 0;
    if (gstEnabled && form.gstRate) {
      const gstAmt = Math.round(base * form.gstRate / 100);
      setForm(f => ({ ...f, gstAmount: gstAmt, totalWithGst: base + gstAmt }));
    } else {
      setForm(f => ({ ...f, gstAmount: 0, totalWithGst: base }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.amount, form.gstRate, gstEnabled]);

  const handlePDF = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { set('pdfData', ev.target.result); set('pdfName', file.name); };
    reader.readAsDataURL(file);
  };

  const commitNewVendor = () => {
    const name = newVendor.trim();
    if (!name) return;
    const created = addParty({ name, type: 'supplier', gstin: '', contact: '', phone: '', address: '' });
    setForm(f => ({ ...f, vendorId: created.id, vendorName: created.name }));
    setNewVendor('');
    setAddingVendor(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      amount: parseFloat(form.amount) || 0,
      gstRate: gstEnabled ? parseFloat(form.gstRate) : 0,
    };
    if (editExpense) updateExpense(editExpense.id, data);
    else addExpense(data);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{editExpense ? 'Edit Expense' : 'New Expense'}</h3>
          <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Vendor with inline add */}
            <div className="form-group">
              <label className="form-label">Vendor *</label>
              {!addingVendor ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="form-select" value={form.vendorId} onChange={e => set('vendorId', e.target.value)} required style={{ flex: 1 }}>
                    <option value="">Select vendor…</option>
                    {parties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddingVendor(true)}>
                    <Plus size={13} /> New
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="New vendor name" value={newVendor} onChange={e => setNewVendor(e.target.value)} autoFocus style={{ flex: 1 }} />
                  <button type="button" className="btn btn-primary btn-sm" onClick={commitNewVendor}><Check size={13} /></button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAddingVendor(false); setNewVendor(''); }}><X size={13} /></button>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was this payment for?" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label className="form-label">GST Rate (%)</label>
                <select className="form-select" value={form.gstRate} onChange={e => set('gstRate', e.target.value)} disabled={!gstEnabled}>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div className="flex-between" style={{ marginBottom: gstEnabled ? 10 : 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={gstEnabled} onChange={e => setGstEnabled(e.target.checked)} />
                  Include GST
                </label>
              </div>
              {gstEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ color: 'var(--text-muted2)', fontSize: 10.5, marginBottom: 2 }}>GST Amount</div>
                    <div style={{ fontWeight: 600 }}>{formatINR(form.gstAmount)}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ color: 'var(--text-muted2)', fontSize: 10.5, marginBottom: 2 }}>Total w/ GST</div>
                    <div style={{ fontWeight: 600 }}>{formatINR(form.totalWithGst)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* PDF Upload */}
            <div className="form-group">
              <label className="form-label">Invoice PDF (for records)</label>
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
            <button type="submit" className="btn btn-primary">{editExpense ? 'Save Changes' : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

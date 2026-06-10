import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { getVendorSummary, formatINR, formatDate, filterByYear } from '../utils/helpers';
import { Plus, X, Edit2, Trash2, Building2, Phone, Mail, Hash } from 'lucide-react';

const COLORS = ['#8b5cf6','#9d7bff','#c06bff','#b794ff','#5fe3b0','#6d3df5','#a779ff','#ffc266'];

function PartyModal({ party, onClose, onSave }) {
  const [form, setForm] = useState(party || { name: '', gstin: '', contact: '', phone: '', type: 'supplier', address: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{party ? 'Edit Contact' : 'Add Vendor / Customer'}</h3>
          <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Company name" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="supplier">Supplier / Vendor</option>
                  <option value="customer">Customer</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input className="form-input" value={form.gstin} onChange={e => set('gstin', e.target.value)} placeholder="29AABCU9603R1ZM" maxLength={15} style={{ fontFamily: 'monospace' }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="contact@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Business address" style={{ minHeight: 60 }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{party ? 'Save Changes' : 'Add Contact'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PartyDetail({ party, invoices, expenses, onClose, onEdit }) {
  const pInvs = invoices.filter(i => i.customerId === party.id);
  const pExps = expenses.filter(e => e.vendorId === party.id);
  const totalSales = pInvs.reduce((s, i) => s + i.amount, 0);
  const totalSpend = pExps.reduce((s, e) => s + (e.amount || 0), 0);
  const color = COLORS[party.name.charCodeAt(0) % COLORS.length];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="vendor-avatar" style={{ background: color + '22', color, width: 36, height: 36, fontSize: 14, margin: 0 }}>
              {party.name[0]}
            </div>
            <div>
              <h3 style={{ fontSize: 16 }}>{party.name}</h3>
              <span className={`badge badge-${party.type}`} style={{ marginTop: 2, fontSize: 10.5, padding: '1px 7px' }}>{party.type}</span>
            </div>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Sales (Invoices)', val: formatINR(totalSales), color: 'var(--accent-glow)' },
              { label: 'Spend (Expenses)', val: formatINR(totalSpend), color: 'var(--accent-amber)' },
              { label: 'GST Registered', val: party.gstin ? 'Yes' : 'No', color: party.gstin ? 'var(--accent-green)' : 'var(--text-secondary)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted2)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 18 }}>
            {party.contact && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Mail size={14} color="var(--text-muted2)" />{party.contact}</div>}
            {party.phone && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Phone size={14} color="var(--text-muted2)" />{party.phone}</div>}
            {party.gstin && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Hash size={14} color="var(--text-muted2)" /><span style={{ fontFamily: 'monospace' }}>{party.gstin}</span></div>}
            {party.address && <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: 12 }}><Building2 size={14} color="var(--text-muted2)" style={{ marginTop: 2 }} />{party.address}</div>}
          </div>

          {pInvs.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom: 10 }}>Sales Invoices</div>
              <div className="table-wrap" style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr><th>Date</th><th>Invoice No</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {pInvs.sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 10).map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontSize: 12 }}>{formatDate(inv.date)}</td>
                        <td style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{inv.invoiceNo}</td>
                        <td style={{ fontWeight: 600, fontSize: 12.5 }}>{formatINR(inv.amount)}</td>
                        <td><span className={`badge badge-${inv.status}`} style={{ fontSize: 10 }}>{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {pExps.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom: 10 }}>Expenses</div>
              <div className="table-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {pExps.sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 10).map(exp => (
                      <tr key={exp.id}>
                        <td style={{ fontSize: 12 }}>{formatDate(exp.date)}</td>
                        <td style={{ fontSize: 12 }} className="truncate">{exp.description}</td>
                        <td style={{ fontWeight: 600, fontSize: 12.5 }}>{formatINR(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => { onClose(); onEdit(party); }}>
            <Edit2 size={13} /> Edit
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Vendors({ year, searchQ }) {
  const { invoices, expenses, parties, addParty, updateParty, deleteParty } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editV, setEditV] = useState(null);
  const [detailV, setDetailV] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const summary = useMemo(() => {
    const yInv = filterByYear(invoices, year);
    const yExp = filterByYear(expenses, year);
    return getVendorSummary(yInv, yExp, parties);
  }, [invoices, expenses, parties, year]);

  const filtered = useMemo(() => {
    let list = summary;
    if (typeFilter !== 'all') list = list.filter(v => v.type === typeFilter || v.type === 'both');
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(q) || (v.gstin || '').toLowerCase().includes(q));
    }
    return list;
  }, [summary, searchQ, typeFilter]);

  const openAdd = () => { setEditV(null); setShowModal(true); };
  const openEdit = (v) => { setEditV(v); setShowModal(true); };

  const handleSave = (form) => {
    if (editV) updateParty(editV.id, form);
    else addParty(form);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Vendors &amp; Customers</h1>
          <p>{parties.length} contacts · suppliers &amp; customers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Contact</button>
      </div>

      <div className="filter-bar">
        {['all', 'supplier', 'customer', 'both'].map(t => (
          <button key={t} className={`filter-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <Building2 size={36} />
          <h3>No contacts yet</h3>
          <p>Add your first vendor or customer to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openAdd}><Plus size={14} /> Add Contact</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filtered.map((v) => {
            const color = COLORS[v.name.charCodeAt(0) % COLORS.length];
            return (
              <div key={v.id} className="vendor-card" onClick={() => setDetailV(v)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div className="vendor-avatar" style={{ background: color + '22', color }}>
                    {v.name[0]}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-ghost btn-icon" style={{ padding: 5 }} onClick={e => { e.stopPropagation(); openEdit(v); }}>
                      <Edit2 size={12} />
                    </button>
                    <button className="btn-ghost btn-icon" style={{ padding: 5, color: 'var(--accent-red)' }}
                      onClick={e => { e.stopPropagation(); if (confirm('Delete contact?')) deleteParty(v.id); }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{v.name}</div>
                <div style={{ marginBottom: 10 }}>
                  <span className={`badge badge-${v.type}`} style={{ fontSize: 10 }}>{v.type}</span>
                </div>

                {v.gstin && (
                  <div style={{ fontSize: 10.5, fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: 8, background: 'var(--bg-elevated)', padding: '3px 7px', borderRadius: 4 }}>
                    {v.gstin}
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted2)', marginBottom: 2 }}>Sales</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent-glow)' }}>{formatINR(v.totalSales)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted2)', marginBottom: 2 }}>Spend</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent-amber)' }}>{formatINR(v.totalSpend)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <PartyModal party={editV} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      {detailV && (
        <PartyDetail
          party={detailV}
          invoices={invoices}
          expenses={expenses}
          onClose={() => setDetailV(null)}
          onEdit={(v) => { setDetailV(null); openEdit(v); }}
        />
      )}
    </div>
  );
}

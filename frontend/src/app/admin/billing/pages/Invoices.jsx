import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { filterByYear, formatINR, formatDate, calcProfit, getMargin, sortByDate, daysSince } from '../utils/helpers';
import InvoiceModal from '../components/InvoiceModal';
import RecordPaymentModal from '../components/RecordPaymentModal';
import { Plus, Edit2, Trash2, FileText, ChevronLeft, ChevronRight, RefreshCw, Bell } from 'lucide-react';

const PAGE_SIZE = 15;

export default function Invoices({ year, searchQ }) {
  const { invoices, deleteInvoice, updateInvoice } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [payInv, setPayInv] = useState(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = filterByYear(invoices, year);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(i =>
        (i.description || '').toLowerCase().includes(q) ||
        (i.customerName || '').toLowerCase().includes(q) ||
        (i.invoiceNo || '').toLowerCase().includes(q) ||
        (i.modeOfPayment || '').toLowerCase().includes(q)
      );
    }
    return sortByDate(list).reverse();
  }, [invoices, year, searchQ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (inv) => { setEditInv(inv); setShowModal(true); };
  const openAdd = () => { setEditInv(null); setShowModal(true); };

  const totalAmt = filtered.reduce((s, i) => s + i.amount, 0);
  const totalProfit = filtered.reduce((s, i) => s + calcProfit(i), 0);
  const avgMargin = totalAmt > 0 ? (totalProfit / totalAmt * 100).toFixed(1) : 0;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>{filtered.length} invoices · {formatINR(totalAmt)} revenue · {avgMargin}% avg margin</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Invoice
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <FileText size={36} />
          <h3>No invoices found</h3>
          <p>Add your company's sales invoices to start tracking profit.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openAdd}><Plus size={14} /> Add Invoice</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Profit %</th>
                <th>Status</th>
                <th>Mode of Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(inv => (
                <tr key={inv.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{formatDate(inv.date)}</td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{inv.customerName || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(inv.amount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="margin-pill">{getMargin(inv)}%</span>
                  </td>
                  <td>
                    {inv.status === 'paid' ? (
                      <span
                        className="badge badge-paid"
                        style={{ cursor: 'pointer' }}
                        title="Click to mark as pending"
                        onClick={() => { if (confirm('Mark this invoice as pending again?')) updateInvoice(inv.id, { status: 'pending', modeOfPayment: '' }); }}
                      >paid</span>
                    ) : (
                      <div className="status-cell">
                        <div className="status-row">
                          <span className="badge badge-pending">pending</span>
                          <Bell size={13} color="var(--accent-red)" />
                          <button
                            className="record-pay-btn"
                            title="Record payment"
                            onClick={() => setPayInv(inv)}
                          >
                            <RefreshCw size={13} />
                          </button>
                        </div>
                        <span className="status-sub">since {daysSince(inv.date)} days</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {inv.status === 'paid' && inv.modeOfPayment
                      ? <span className="mode-chip">{inv.modeOfPayment}</span>
                      : <span style={{ color: 'var(--text-muted2)', fontSize: 12.5 }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost btn-icon" onClick={() => openEdit(inv)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-ghost btn-icon" style={{ color: 'var(--accent-red)' }}
                        onClick={() => { if (confirm('Delete this invoice?')) deleteInvoice(inv.id); }} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <span>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</span>
              <div className="pagination-btns">
                <button className="page-btn" onClick={() => setPage(p => p-1)} disabled={page === 1}><ChevronLeft size={13} /></button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
                })}
                <button className="page-btn" onClick={() => setPage(p => p+1)} disabled={page === totalPages}><ChevronRight size={13} /></button>
              </div>
            </div>
          )}

          <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 32, fontSize: 13, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total:</span>
            <span><strong>{formatINR(totalAmt)}</strong> revenue</span>
            <span className="text-green"><strong>{formatINR(totalProfit)}</strong> profit</span>
            <span style={{ color: 'var(--text-secondary)' }}>Avg margin: {avgMargin}%</span>
          </div>
        </div>
      )}

      {showModal && (
        <InvoiceModal onClose={() => setShowModal(false)} editInvoice={editInv} />
      )}

      {payInv && (
        <RecordPaymentModal invoice={payInv} onClose={() => setPayInv(null)} />
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { filterByYear, formatINR, formatDate, sortByDate } from '../utils/helpers';
import ExpenseModal from '../components/ExpenseModal';
import { Plus, Edit2, Trash2, Receipt, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

export default function Expenses({ year, searchQ }) {
  const { expenses, deleteExpense } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editExp, setEditExp] = useState(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = filterByYear(expenses, year);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(e =>
        (e.description || '').toLowerCase().includes(q) ||
        (e.vendorName || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      );
    }
    return sortByDate(list).reverse();
  }, [expenses, year, searchQ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (exp) => { setEditExp(exp); setShowModal(true); };
  const openAdd = () => { setEditExp(null); setShowModal(true); };

  const totalAmt = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const totalWithGst = filtered.reduce((s, e) => s + (e.totalWithGst || e.amount || 0), 0);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p>{filtered.length} records · {formatINR(totalAmt)} spent · {formatINR(totalWithGst)} incl. GST</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <Receipt size={36} />
          <h3>No expenses recorded</h3>
          <p>Track payments made for components, services and more.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openAdd}><Plus size={14} /> Add Expense</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>GST</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>PDF</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(exp => (
                <tr key={exp.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{formatDate(exp.date)}</td>
                  <td style={{ fontSize: 13 }}>{exp.vendorName}</td>
                  <td>
                    <div className="truncate" style={{ maxWidth: 240, fontSize: 12.5 }}>{exp.description}</div>
                    {exp.category && <div style={{ fontSize: 11, color: 'var(--text-muted2)', marginTop: 1 }}>{exp.category}</div>}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: 12 }}>
                    {exp.gstRate > 0 ? (
                      <div>
                        <div style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{exp.gstRate}%</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted2)' }}>{formatINR(exp.gstAmount)}</div>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted2)', fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(exp.amount)}</td>
                  <td style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--text-secondary)' }}>{formatINR(exp.totalWithGst || exp.amount)}</td>
                  <td>
                    {exp.pdfData ? (
                      <a href={exp.pdfData} download={exp.pdfName} style={{ color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileText size={13} /> PDF
                      </a>
                    ) : <span style={{ color: 'var(--text-muted2)', fontSize: 11 }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost btn-icon" onClick={() => openEdit(exp)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-ghost btn-icon" style={{ color: 'var(--accent-red)' }}
                        onClick={() => { if (confirm('Delete this expense?')) deleteExpense(exp.id); }} title="Delete">
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
            <span><strong>{formatINR(totalAmt)}</strong> spent</span>
            <span style={{ color: 'var(--accent-amber)' }}><strong>{formatINR(totalWithGst)}</strong> incl. GST</span>
          </div>
        </div>
      )}

      {showModal && (
        <ExpenseModal onClose={() => setShowModal(false)} editExpense={editExp} />
      )}
    </div>
  );
}

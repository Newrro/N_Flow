import { useState } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatINR, PAYMENT_MODES } from '../utils/helpers';

export default function RecordPaymentModal({ invoice, onClose }) {
  const { updateInvoice } = useData();
  const [mode, setMode] = useState(invoice.modeOfPayment && PAYMENT_MODES.includes(invoice.modeOfPayment) ? invoice.modeOfPayment : 'Net Banking');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  const total = invoice.totalWithGst || invoice.amount;

  const handleUpdate = () => {
    updateInvoice(invoice.id, { status: 'paid', modeOfPayment: mode, paidDate: payDate });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="record-pay-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
            <div>
              <h3 style={{ fontSize: 17 }}>Record Payment for <span style={{ color: 'var(--accent-violet)' }}>{invoice.invoiceNo}</span></h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted2)', marginTop: 2 }}>{invoice.customerName}</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleUpdate}>
            Update Payment <ArrowRight size={15} />
          </button>
        </div>

        <div className="modal-body">
          <div className="record-pay-balance">
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted2)', marginBottom: 3 }}>Payment Info</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{invoice.customerName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted2)', marginBottom: 3 }}>Balance</div>
              <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'Syne', color: 'var(--accent-green)' }}>{formatINR(total)}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount to be Recorded</label>
            <input className="form-input" value={formatINR(total)} disabled style={{ opacity: 0.85 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted2)', marginTop: 5 }}>
              <span>Total Amount {formatINR(total)}</span>
              <span>Amount Pending {formatINR(total)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Date</label>
            <input className="form-input" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Type</label>
            <div className="pay-type-grid">
              {PAYMENT_MODES.map(m => (
                <button
                  type="button"
                  key={m}
                  className={`pay-type-chip ${mode === m ? 'active' : ''}`}
                  onClick={() => setMode(m)}
                >
                  {mode === m && <Check size={13} />} {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleUpdate}>
            Update Payment <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

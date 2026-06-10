import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Save, Percent, Building2, Check } from 'lucide-react';

export default function Settings() {
  const { settings, updateMargins, updateSettings } = useData();
  const [margins, setMargins] = useState({ ...settings.margins });
  const [company, setCompany] = useState({ ...settings.company });
  const [savedMsg, setSavedMsg] = useState('');

  const setM = (k, v) => setMargins(m => ({ ...m, [k]: v }));
  const setC = (k, v) => setCompany(c => ({ ...c, [k]: v }));

  const flash = (msg) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 2000); };

  const saveMargins = () => {
    updateMargins({
      OEM: parseFloat(margins.OEM) || 0,
      Procurement: parseFloat(margins.Procurement) || 0,
      Service: parseFloat(margins.Service) || 0,
    });
    flash('Default margins saved');
  };

  const saveCompany = () => {
    updateSettings({ company });
    flash('Company details saved');
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Adjustable profit margins &amp; company information</p>
        </div>
        {savedMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-green)', fontSize: 13, fontWeight: 600 }}>
            <Check size={15} /> {savedMsg}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Default margins */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Percent size={16} color="var(--accent)" />
            <div className="section-title" style={{ margin: 0 }}>Default Profit Margins</div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted2)', marginBottom: 18 }}>
            These pre-fill the profit % when you pick an invoice type. You can still override the % on any individual invoice.
          </p>

          {[
            { key: 'OEM', label: 'OEM Products' },
            { key: 'Procurement', label: 'Procurement' },
            { key: 'Service', label: 'Service' },
          ].map(({ key, label }) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className="form-input"
                  type="number" min="0" max="100" step="0.5"
                  value={margins[key]}
                  onChange={e => setM(key, e.target.value)}
                  style={{ maxWidth: 120 }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>%</span>
              </div>
            </div>
          ))}

          <button className="btn btn-primary" onClick={saveMargins} style={{ marginTop: 6 }}>
            <Save size={14} /> Save Margins
          </button>
        </div>

        {/* Company info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Building2 size={16} color="var(--accent)" />
            <div className="section-title" style={{ margin: 0 }}>Company Information</div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted2)', marginBottom: 18 }}>
            Used across the app and exported reports.
          </p>

          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" value={company.name} onChange={e => setC('name', e.target.value)} placeholder="Newrro" />
          </div>
          <div className="form-group">
            <label className="form-label">GSTIN</label>
            <input className="form-input" value={company.gstin} onChange={e => setC('gstin', e.target.value)} placeholder="29NEWRRO0000X1Z9" maxLength={15} style={{ fontFamily: 'monospace' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" value={company.address} onChange={e => setC('address', e.target.value)} placeholder="Business address" style={{ minHeight: 70 }} />
          </div>

          <button className="btn btn-primary" onClick={saveCompany} style={{ marginTop: 6 }}>
            <Save size={14} /> Save Company
          </button>
        </div>
      </div>
    </div>
  );
}

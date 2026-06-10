import { Search, Bell, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TITLES = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  expenses: 'Expenses',
  vendors: 'Vendors & Customers',
  pnl: 'Profit & Loss',
  settings: 'Settings',
};

export default function Topbar({ page, year, setYear, years, onExport, exportLabel, searchQ, setSearchQ, showSearch }) {
  const { user } = useAuth();

  return (
    <div className="topbar">
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.2px' }}>
          Hi, <span style={{ background: 'linear-gradient(135deg, var(--accent-glow), var(--accent-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name}!</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted2)', marginTop: 1 }}>{TITLES[page]}</div>
      </div>

      {showSearch && (
        <div className="topbar-search">
          <Search size={14} />
          <input
            placeholder="Search…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>
      )}

      <div className="topbar-right">
        {page !== 'settings' && (
          <select className="year-selector" value={year} onChange={e => setYear(e.target.value)}>
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {onExport && (
          <button className="btn btn-secondary btn-sm" onClick={onExport}>
            <Download size={13} /> {exportLabel || 'Export Excel'}
          </button>
        )}

        <button className="notif-btn">
          <Bell size={15} />
          <span className="notif-dot" />
        </button>

        <div className="avatar-btn">{user?.name?.[0] || 'A'}</div>
      </div>
    </div>
  );
}

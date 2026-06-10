import { LayoutDashboard, FileText, Users, TrendingUp, LogOut, Receipt, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout as serverLogout } from '@/app/auth/actions/logout';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'GENERAL' },
  { id: 'invoices', label: 'Invoices', icon: FileText, section: 'GENERAL' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, section: 'GENERAL' },
  { id: 'vendors', label: 'Vendors & Customers', icon: Users, section: 'GENERAL' },
  { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp, section: 'REPORTS' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'REPORTS' },
];

export default function Sidebar({ active, onChange }) {
  const { user, logout } = useAuth();
  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>NEWRRO Billing</h2>
        <p>Finance Suite</p>
      </div>

      {sections.map(section => (
        <div key={section}>
          <div className="sidebar-section-label">{section}</div>
          {NAV.filter(n => n.section === section).map(item => (
            <div
              key={item.id}
              className={`sidebar-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
            >
              <item.icon size={15} />
              {item.label}
            </div>
          ))}
        </div>
      ))}

      <div className="sidebar-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px', marginBottom: 12 }}>
          <div className="avatar-btn" style={{ width: 30, height: 30, fontSize: 11 }}>
            {user?.name?.[0] || 'A'}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted2)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <a 
          href="/admin/choose" 
          className="upgrade-btn" 
          style={{ marginBottom: 8, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          Switch Portal
        </a>
        <button 
          className="upgrade-btn" 
          onClick={async () => {
            logout();
            await serverLogout();
          }}
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

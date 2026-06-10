import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { getPLSummary, getMonthlyData, filterByYear, formatINR, formatDate, calcProfit, getMargin } from '../utils/helpers';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Receipt, Wallet } from 'lucide-react';

const C_REVENUE = '#a779ff';
const C_PROFIT = '#5fe3b0';
const C_EXPENSE = '#ffc266';
const TYPE_COLORS = ['#8b5cf6', '#9d7bff', '#c06bff'];

function StatCard({ label, value, sub, icon: Icon, color, glow }) {
  return (
    <div className="stat-card">
      <div className="stat-card-glow" style={{ background: glow || color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color }}>{value}</div>
          {sub && <div className="stat-change change-neutral">{sub}</div>}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatINR(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ year }) {
  const { invoices, expenses, parties } = useData();
  const filtered = useMemo(() => filterByYear(invoices, year), [invoices, year]);
  const filteredExp = useMemo(() => filterByYear(expenses, year), [expenses, year]);
  const pl = useMemo(() => getPLSummary(filtered, filteredExp), [filtered, filteredExp]);
  const monthly = useMemo(() => getMonthlyData(filtered, filteredExp), [filtered, filteredExp]);

  const pieData = [
    { name: 'OEM', value: pl.oem.revenue },
    { name: 'Procurement', value: pl.procurement.revenue },
    { name: 'Service', value: pl.service.revenue },
  ].filter(d => d.value > 0);

  const recentInvoices = [...filtered]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const pendingCount = filtered.filter(i => i.status === 'pending').length;
  const paidCount = filtered.filter(i => i.status === 'paid').length;

  const marginPct = pl.total.revenue > 0
    ? ((pl.total.profit / pl.total.revenue) * 100).toFixed(1)
    : 0;

  return (
    <div className="page-body">
      {/* Hero greeting */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(46,216,232,0.15) 0%, rgba(63,229,168,0.07) 100%)',
        border: '1px solid rgba(46,216,232,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 28px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, fontFamily: 'Syne, sans-serif' }}>
            Newrro Finance Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {year === 'all' ? 'All time' : year} · {filtered.length} invoices · {filteredExp.length} expenses · {parties.length} contacts
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted2)', marginBottom: 2 }}>Net Profit</div>
          <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: pl.netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{formatINR(pl.netProfit)}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Revenue" value={formatINR(pl.total.revenue)} sub={`${filtered.length} invoices`} icon={DollarSign} color="var(--accent)" glow="#2ed8e8" />
        <StatCard label="Gross Profit" value={formatINR(pl.total.profit)} sub={`${marginPct}% margin`} icon={TrendingUp} color="var(--accent-green)" glow="#3fe5a8" />
        <StatCard label="Expenses" value={formatINR(pl.expenses.total)} sub={`${filteredExp.length} records`} icon={Receipt} color="var(--accent-amber)" glow="#f4b740" />
        <StatCard label="Net Profit" value={formatINR(pl.netProfit)} sub="after expenses" icon={Wallet} color={pl.netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} glow="#3fe5a8" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Monthly Revenue/Profit/Expenses */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 2 }}>Monthly Trend</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted2)' }}>Revenue, profit &amp; expenses</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              {[['Revenue', C_REVENUE], ['Profit', C_PROFIT], ['Expenses', C_EXPENSE]].map(([l, c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_REVENUE} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C_REVENUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_PROFIT} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C_PROFIT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C_REVENUE} fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" name="Profit" stroke={C_PROFIT} fill="url(#profGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke={C_EXPENSE} fill="none" strokeWidth={2} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie + status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Revenue by Type</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={d.name} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted2)', fontSize: 12 }}>No data</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 11, flexWrap: 'wrap', gap: 8 }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ textAlign: 'center' }}>
                  <div style={{ color: TYPE_COLORS[i % TYPE_COLORS.length], fontWeight: 700, fontSize: 13 }}>{formatINR(d.value)}</div>
                  <div style={{ color: 'var(--text-muted2)' }}>{d.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted2)', marginBottom: 10 }}>Invoice Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Paid', count: paidCount, color: 'var(--accent-green)' },
                { label: 'Pending', count: pendingCount, color: 'var(--accent-amber)' },
                { label: 'OEM', count: pl.oem.count, color: 'var(--accent)' },
                { label: 'Procurement', count: pl.procurement.count, color: 'var(--accent-teal)' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Syne, sans-serif' }}>{count}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted2)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 14 }}>Recent Invoices</div>
        {recentInvoices.length === 0 ? (
          <div className="empty-state"><p>No invoices yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Customer</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Profit %</th><th style={{ textAlign: 'right' }}>Profit</th><th>Status</th><th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{formatDate(inv.date)}</td>
                    <td style={{ fontSize: 13 }}>{inv.customerName}</td>
                    <td className="fw-600" style={{ textAlign: 'right' }}>{formatINR(inv.amount)}</td>
                    <td style={{ textAlign: 'right' }}><span className="margin-pill">{getMargin(inv)}%</span></td>
                    <td className="amount-positive" style={{ textAlign: 'right' }}>{formatINR(calcProfit(inv))}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inv.modeOfPayment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

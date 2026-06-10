import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { filterByYear, formatINR, formatDate, calcProfit, calcCost, getMargin, getPLSummary, getMonthlyData, sortByDate } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';

const TYPE_COLORS = { OEM: '#8b5cf6', Procurement: '#9d7bff', Service: '#c06bff' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {formatINR(p.value)}</div>)}
    </div>
  );
};

function PLTable({ invoices, color }) {
  const sorted = sortByDate(invoices).reverse();

  if (sorted.length === 0) return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted2)', fontSize: 13 }}>No invoices in this category.</div>
  );

  const totalRev = sorted.reduce((s, i) => s + i.amount, 0);
  const totalProfit = sorted.reduce((s, i) => s + calcProfit(i), 0);
  const totalCost = totalRev - totalProfit;

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Revenue</th>
              <th style={{ textAlign: 'right' }}>Cost</th>
              <th style={{ textAlign: 'right' }}>Profit</th>
              <th style={{ textAlign: 'right' }}>Margin</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(inv => {
              const profit = calcProfit(inv);
              const cost = calcCost(inv);
              const margin = getMargin(inv);
              return (
                <tr key={inv.id}>
                  <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(inv.date)}</td>
                  <td style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{inv.invoiceNo}</td>
                  <td style={{ fontSize: 13 }}>{inv.customerName}</td>
                  <td><span className="truncate" style={{ display: 'block', maxWidth: 220, fontSize: 12.5 }}>{inv.description}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(inv.amount)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent-red)', fontWeight: 500, fontSize: 13 }}>{formatINR(cost)}</td>
                  <td style={{ textAlign: 'right' }} className="amount-positive">{formatINR(profit)}</td>
                  <td style={{ textAlign: 'right', fontSize: 12.5 }}>
                    <span style={{ color, fontWeight: 600 }}>{margin}%</span>
                  </td>
                  <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{
        padding: '14px 18px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
      }}>
        {[
          { label: 'Total Revenue', val: totalRev, color: 'var(--text-primary)' },
          { label: 'Total Cost', val: totalCost, color: 'var(--accent-red)' },
          { label: 'Total Profit', val: totalProfit, color: 'var(--accent-green)' },
          { label: 'Avg Margin', val: `${totalRev > 0 ? (totalProfit/totalRev*100).toFixed(1) : 0}%`, isText: true, color },
        ].map(({ label, val, color: c, isText }) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: 'var(--text-muted2)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: c, fontFamily: 'Syne, sans-serif' }}>
              {isText ? val : formatINR(val)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeSection({ label, type, invoices, summary, color }) {
  const list = invoices.filter(i => i.type === type);
  if (list.length === 0) return null;
  const avgMargin = summary.revenue > 0 ? (summary.profit / summary.revenue * 100).toFixed(1) : 0;
  return (
    <div className="pl-section" style={{ marginBottom: 16 }}>
      <div className="pl-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
          <h3>{label} — {avgMargin}% avg margin</h3>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12.5 }}>
          <span>Revenue: <strong>{formatINR(summary.revenue)}</strong></span>
          <span style={{ color: 'var(--accent-green)' }}>Profit: <strong>{formatINR(summary.profit)}</strong></span>
        </div>
      </div>
      <PLTable invoices={list} color={color} />
    </div>
  );
}

export default function ProfitLoss({ year, searchQ }) {
  const { invoices, expenses } = useData();

  const filtered = useMemo(() => {
    let list = filterByYear(invoices, year);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(i =>
        (i.description || '').toLowerCase().includes(q) ||
        (i.customerName || '').toLowerCase().includes(q) ||
        (i.invoiceNo || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, year, searchQ]);

  const filteredExp = useMemo(() => filterByYear(expenses, year), [expenses, year]);
  const pl = useMemo(() => getPLSummary(filtered, filteredExp), [filtered, filteredExp]);
  const monthly = useMemo(() => getMonthlyData(filtered, filteredExp), [filtered, filteredExp]);

  const overallMargin = pl.total.revenue > 0 ? (pl.total.profit / pl.total.revenue * 100).toFixed(1) : 0;

  const cards = [
    { label: 'OEM Products', ...pl.oem, color: TYPE_COLORS.OEM },
    { label: 'Procurement', ...pl.procurement, color: TYPE_COLORS.Procurement },
    { label: 'Service', ...pl.service, color: TYPE_COLORS.Service },
  ];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Profit &amp; Loss</h1>
          <p>Profit by type · expenses &amp; net profit · {year === 'all' ? 'All time' : year}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {cards.map(row => {
          const margin = row.revenue > 0 ? (row.profit / row.revenue * 100) : 0;
          return (
            <div key={row.label} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted2)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)' }}>
                  {row.count} invoices
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted2)', marginBottom: 3 }}>Revenue</div>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Syne, sans-serif' }}>{formatINR(row.revenue)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted2)', marginBottom: 3 }}>Profit</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: row.color, fontFamily: 'Syne, sans-serif' }}>{formatINR(row.profit)}</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(margin, 100)}%`, background: row.color, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted2)', marginTop: 4 }}>{margin.toFixed(1)}% avg margin</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Monthly Revenue · Profit · Expenses</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthly} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: 'var(--text-secondary)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#a779ff" radius={[3,3,0,0]} />
            <Bar dataKey="profit" name="Profit" fill="#5fe3b0" radius={[3,3,0,0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ffc266" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <TypeSection label="OEM Products" type="OEM" invoices={filtered} summary={pl.oem} color={TYPE_COLORS.OEM} />
      <TypeSection label="Procurement" type="Procurement" invoices={filtered} summary={pl.procurement} color={TYPE_COLORS.Procurement} />
      <TypeSection label="Service" type="Service" invoices={filtered} summary={pl.service} color={TYPE_COLORS.Service} />

      {/* Grand total with expenses + net profit */}
      <div className="card" style={{ marginTop: 16, background: 'linear-gradient(135deg, rgba(46,216,232,0.08) 0%, rgba(63,229,168,0.06) 100%)', border: '1px solid rgba(46,216,232,0.2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Revenue', val: formatINR(pl.total.revenue) },
            { label: 'Gross Profit', val: formatINR(pl.total.profit), color: 'var(--accent-glow)' },
            { label: 'Expenses', val: formatINR(pl.expenses.total), color: 'var(--accent-amber)' },
            { label: 'Net Profit', val: formatINR(pl.netProfit), color: pl.netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
            { label: 'Blended Margin', val: `${overallMargin}%`, color: 'var(--accent)' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted2)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: color || 'var(--text-primary)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

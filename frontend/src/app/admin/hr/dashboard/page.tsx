'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { DashboardData } from '@/types/config';
import { formatCurrency, formatDate } from '@/lib/format';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error: {error || 'Failed to load data'}</p>
        <Button onClick={fetchDashboard}>Retry</Button>
      </div>
    );
  }

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'PROMOTION':
        return <Badge variant="success">Promotion</Badge>;
      case 'DEMOTION':
        return <Badge variant="danger">Demotion</Badge>;
      case 'INCREMENT':
        return <Badge variant="info">Increment</Badge>;
      case 'DECREMENT':
        return <Badge variant="warning">Decrement</Badge>;
      case 'INITIAL':
        return <Badge variant="neutral">Initial</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Overview of your payroll system</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card
          title="Active Employees"
          value={data.active_employees.toString()}
          subtitle={`${data.total_employees} total`}
          accentColor={data.active_employees < 20 ? 'var(--color-success-500)' : 'var(--color-warning-500)'}
          icon="👥"
        />
        <Card
          title="Total Monthly CTC"
          value={formatCurrency(data.total_monthly_ctc)}
          accentColor="var(--color-primary-500)"
          icon="💰"
        />
        <Card
          title="PF Status"
          value={
            data.active_employees >= 20
              ? 'MANDATORY'
              : data.pf_threshold_warning
              ? 'THRESHOLD MET'
              : 'OPTIONAL'
          }
          subtitle={data.pf_threshold_warning ? '20+ employees require PF' : undefined}
          accentColor={
            data.pf_threshold_warning
              ? 'var(--color-danger-500)'
              : 'var(--color-gray-400)'
          }
          icon="🏦"
        />
        <Card
          title="ESIC Status"
          value={
            data.esic_threshold_warning
              ? 'THRESHOLD MET'
              : 'OPTIONAL'
          }
          subtitle={data.esic_threshold_warning ? '10+ employees: consider enabling' : undefined}
          accentColor={
            data.esic_threshold_warning
              ? 'var(--color-warning-500)'
              : 'var(--color-gray-400)'
          }
          icon="🏥"
        />
      </div>

      {/* Compliance Warnings */}
      {(data.pf_threshold_warning || data.esic_threshold_warning) && (
        <div className={styles.warningsCard}>
          <h3 className={styles.warningsTitle}>⚠️ Compliance Alerts</h3>
          <ul className={styles.warningsList}>
            {data.active_employees >= 18 && data.active_employees < 20 && (
              <li>Approaching PF threshold! ({data.active_employees}/20 employees)</li>
            )}
            {data.pf_threshold_warning && (
              <li className={styles.warningDanger}>
                PF is MANDATORY for 20+ employees! Enable in Settings NOW.
              </li>
            )}
            {data.esic_threshold_warning && (
              <li>
                ESIC threshold met ({data.active_employees} employees). Consider enabling.
              </li>
            )}
          </ul>
        </div>
      )}

      {!data.pf_threshold_warning && !data.esic_threshold_warning && (
        <div className={styles.successCard}>
          <h3 className={styles.successTitle}>✅ Compliance Status</h3>
          <p>All clear. No statutory compliance issues detected.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Button
            variant="primary"
            onClick={() => router.push('/admin/hr/employees/new')}
            className={styles.actionButton}
          >
            ➕ Add Employee
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/hr/payroll')}
            className={styles.actionButton}
            style={{ backgroundColor: 'var(--color-success-500)', color: 'white' }}
          >
            💰 Run Payroll
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/hr/employees')}
            className={styles.actionButton}
            style={{ backgroundColor: 'var(--color-purple-500)', color: 'white' }}
          >
            👥 Manage Employees
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/hr/payroll/history')}
            className={styles.actionButton}
            style={{ backgroundColor: 'var(--color-warning-500)', color: 'white' }}
          >
            📋 Payroll History
          </Button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Financial Summary (Current Estimates)</h2>
        <div className={styles.financeGrid}>
          <Card
            title="Avg CTC"
            value={formatCurrency(data.avg_ctc)}
            accentColor="var(--color-purple-500)"
            icon="📊"
          />
          <Card
            title="TDS Filing"
            value={formatCurrency(data.total_tds)}
            accentColor="var(--color-danger-500)"
            icon="📄"
          />
          <Card
            title="PF Filing"
            value={formatCurrency(data.total_pf)}
            accentColor="var(--color-primary-500)"
            icon="🏦"
          />
          <Card
            title="PT Filing"
            value={formatCurrency(data.total_pt)}
            accentColor="var(--color-teal-500)"
            icon="🏛️"
          />
          <Card
            title="ESIC Filing"
            value={formatCurrency(data.total_esic)}
            accentColor="var(--color-warning-600)"
            icon="🏥"
          />
          <Card
            title="Total Deductions"
            value={formatCurrency(data.total_pt + data.total_tds + data.total_pf + data.total_esic)}
            accentColor="var(--color-danger-600)"
            icon="📉"
          />
        </div>
      </div>

      {/* Recent Changes */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Salary Changes</h2>
        {data.recent_changes.length > 0 ? (
          <div className={styles.changesTable}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Effective Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_changes.map((change, idx) => (
                  <tr key={`${change.emp_id}-${idx}`}>
                    <td>{change.name}</td>
                    <td>{getChangeTypeBadge(change.change_type)}</td>
                    <td>{formatDate(change.effective_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.noData}>No recent salary changes.</p>
        )}
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/hr/employees/changes')}
          style={{ marginTop: 'var(--space-3)' }}
        >
          View All Changes →
        </Button>
      </div>
    </div>
  );
}

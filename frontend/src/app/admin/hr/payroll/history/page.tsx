'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Table, { Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';
import styles from './page.module.css';

interface PayrollMonth {
  month: string;
  status: string;
  employee_count: number;
  total_net_pay: number;
  created_at: string;
}

export default function PayrollHistoryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [months, setMonths] = useState<PayrollMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonths = useCallback(async () => {
    try {
      const res = await fetch('/api/payroll');
      if (!res.ok) throw new Error('Failed to fetch payroll history');
      const data = await res.json();
      setMonths(data.months);
    } catch {
      showToast('Failed to load payroll history', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);

  const viewMonth = (month: string) => {
    router.push(`/admin/hr/payroll/history/${encodeURIComponent(month)}`);
  };

  const exportCSV = async (month: string) => {
    try {
      const res = await fetch(`/api/payroll/export-csv?month=${encodeURIComponent(month)}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to export CSV');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_${month.replace(' ', '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      showToast('CSV exported successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to export CSV', 'error');
    }
  };

  const columns: Column<PayrollMonth>[] = [
    {
      header: 'Month',
      accessor: 'month',
      sortable: true
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'FINAL' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Employees',
      accessor: 'employee_count'
    },
    {
      header: 'Total Net Pay',
      accessor: 'total_net_pay',
      render: (row) => formatCurrency(row.total_net_pay)
    },
    {
      header: 'Actions',
      accessor: 'created_at',
      render: (row) => (
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              viewMonth(row.month);
            }}
          >
            👁️ View Details
          </Button>
          {row.status === 'FINAL' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                exportCSV(row.month);
              }}
            >
              📥 Export
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payroll History</h1>
          <p className={styles.subtitle}>View and manage past payroll runs</p>
        </div>
        <Button onClick={() => router.push('/admin/hr/payroll')}>
          💰 Run Payroll
        </Button>
      </div>

      <Table
        data={months}
        columns={columns}
        loading={loading}
        onRowClick={(row) => viewMonth(row.month)}
        emptyMessage="No payroll history found. Run your first payroll to see data here."
      />
    </div>
  );
}

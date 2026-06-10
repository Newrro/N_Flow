'use client';

import { useEffect, useState, useCallback } from 'react';
import Table, { Column } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/format';
import styles from './page.module.css';

interface SalaryChange {
  history_id: number;
  emp_id: string;
  employee_name: string;
  change_type: string;
  old_salary: number | null;
  new_salary: number | null;
  old_designation: string | null;
  new_designation: string | null;
  old_role: string | null;
  new_role: string | null;
  reason: string | null;
  effective_date: string;
  created_at: string;
}

export default function EmployeeChangesPage() {
  const { showToast } = useToast();
  const [changes, setChanges] = useState<SalaryChange[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChanges = useCallback(async () => {
    try {
      const res = await fetch('/api/employees/changes');
      if (!res.ok) throw new Error('Failed to fetch changes');
      const data = await res.json();
      setChanges(data.changes);
    } catch {
      showToast('Failed to load salary changes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

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

  const columns: Column<SalaryChange>[] = [
    {
      header: 'Employee',
      accessor: 'employee_name',
      sortable: true
    },
    {
      header: 'Type',
      accessor: 'change_type',
      render: (row) => getChangeTypeBadge(row.change_type)
    },
    {
      header: 'Old Salary',
      accessor: 'old_salary',
      render: (row) => row.old_salary ? formatCurrency(row.old_salary) : '-'
    },
    {
      header: 'New Salary',
      accessor: 'new_salary',
      render: (row) => row.new_salary ? formatCurrency(row.new_salary) : '-'
    },
    {
      header: 'Old Designation',
      accessor: 'old_designation',
      render: (row) => row.old_designation || '-'
    },
    {
      header: 'New Designation',
      accessor: 'new_designation',
      render: (row) => row.new_designation || '-'
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => row.reason || '-'
    },
    {
      header: 'Effective Date',
      accessor: 'effective_date',
      sortable: true,
      render: (row) => formatDate(row.effective_date)
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Promotions & Salary Changes</h1>
        <p className={styles.subtitle}>Complete history of all salary and designation changes</p>
      </div>

      <Table
        data={changes}
        columns={columns}
        loading={loading}
        searchable
        emptyMessage="No salary changes found"
      />
    </div>
  );
}

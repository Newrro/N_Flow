'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Table, { Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';
import { generateSalarySlipPDF } from '@/lib/pdf';
import styles from './page.module.css';

interface PayrollDetail {
  run_id: number;
  emp_id: string;
  month: string;
  annual_ctc: number;
  monthly_gross: number;
  lop_days: number;
  lop_deduction: number;
  lop_reason: string;
  bonus_amount: number;
  bonus_reason: string;
  adjusted_gross: number;
  pt: number;
  tds: number;
  pf: number;
  esic: number;
  net_pay: number;
  status: string;
  pf_applicable: boolean;
  esic_applicable: boolean;
  employee: {
    name: string;
    designation: string | null;
    role: string | null;
    department: string | null;
    bank_account: string;
    ifsc: string;
    pan: string;
  };
}

interface PayrollSummary {
  employee_count: number;
  total_gross: number;
  total_lop: number;
  total_bonus: number;
  total_adjusted: number;
  total_pt: number;
  total_tds: number;
  total_pf: number;
  total_esic: number;
  total_net_pay: number;
}

export default function PayrollMonthDetailPage({ 
  params 
}: { 
  params: Promise<{ month: string }> 
}) {
  const resolvedParams = use(params);
  const month = decodeURIComponent(resolvedParams.month);
  const router = useRouter();
  const { showToast } = useToast();
  
  const [payrollRuns, setPayrollRuns] = useState<PayrollDetail[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Newrro Tech LLP');

  const fetchPayrollDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/payroll?month=${encodeURIComponent(month)}`);
      if (!res.ok) throw new Error('Failed to fetch payroll details');
      const data = await res.json();
      setPayrollRuns(data.payroll_runs);
      setSummary(data.summary);
      setStatus(data.status);
    } catch {
      showToast('Failed to load payroll details', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, showToast]);

  useEffect(() => {
    fetchPayrollDetails();
    
    // Fetch company name
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.config?.company_name) {
          setCompanyName(data.config.company_name);
        }
      })
      .catch(() => {});
  }, [fetchPayrollDetails]);

  const exportCSV = async () => {
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

  const generateSalarySlip = async (emp: PayrollDetail) => {
    try {
      await generateSalarySlipPDF({
        companyName,
        month,
        employee: {
          emp_id: emp.emp_id,
          name: emp.employee.name,
          designation: emp.employee.designation || emp.employee.role || 'Employee',
          pan: emp.employee.pan || '',
          bank_account: emp.employee.bank_account || '',
          ifsc: emp.employee.ifsc || '',
          department: emp.employee.department || undefined
        },
        earnings: {
          basic: emp.monthly_gross,
          bonus: emp.bonus_amount
        },
        deductions: {
          lop_days: emp.lop_days,
          lop_amount: emp.lop_deduction,
          pt: emp.pt,
          tds: emp.tds,
          pf: emp.pf,
          esic: emp.esic
        },
        summary: {
          gross: emp.adjusted_gross,
          total_deductions: emp.pt + emp.tds + emp.pf + emp.esic,
          net_pay: emp.net_pay
        }
      });
      showToast(`Salary slip generated for ${emp.employee.name}`, 'success');
    } catch {
      showToast('Failed to generate salary slip', 'error');
    }
  };

  const generateAllSalarySlips = async () => {
    for (const emp of payrollRuns) {
      await generateSalarySlip(emp);
    }
    showToast(`Generated ${payrollRuns.length} salary slips`, 'success');
  };

  const columns: Column<PayrollDetail>[] = [
    {
      header: 'Employee',
      accessor: 'emp_id',
      render: (row) => (
        <div>
          <div className={styles.employeeName}>{row.employee.name}</div>
          <div className={styles.employeeMeta}>
            {row.employee.designation || row.employee.role}
            {row.employee.department && ` • ${row.employee.department}`}
          </div>
          <div className={styles.employeeId}>{row.emp_id}</div>
        </div>
      )
    },
    {
      header: 'Monthly Gross',
      accessor: 'monthly_gross',
      render: (row) => formatCurrency(row.monthly_gross)
    },
    {
      header: 'LOP',
      accessor: 'lop_days',
      render: (row) => (
        row.lop_days > 0 ? (
          <div className={styles.adjustmentCell}>
            <div className={styles.adjustmentValue}>
              <span className={styles.lopDays}>{row.lop_days} days</span>
              <span className={styles.lopAmount}>-{formatCurrency(row.lop_deduction)}</span>
            </div>
            {row.lop_reason && (
              <div className={styles.reasonBadge}>
                <Badge variant="danger">{row.lop_reason}</Badge>
              </div>
            )}
          </div>
        ) : <span className={styles.noValue}>-</span>
      )
    },
    {
      header: 'Bonus/OT',
      accessor: 'bonus_amount',
      render: (row) => (
        row.bonus_amount > 0 ? (
          <div className={styles.adjustmentCell}>
            <span className={styles.bonusAmount}>+{formatCurrency(row.bonus_amount)}</span>
            {row.bonus_reason && (
              <div className={styles.reasonBadge}>
                <Badge variant="success">{row.bonus_reason}</Badge>
              </div>
            )}
          </div>
        ) : <span className={styles.noValue}>-</span>
      )
    },
    {
      header: 'Adjusted Gross',
      accessor: 'adjusted_gross',
      render: (row) => formatCurrency(row.adjusted_gross)
    },
    {
      header: 'PT',
      accessor: 'pt',
      render: (row) => formatCurrency(row.pt)
    },
    {
      header: 'TDS',
      accessor: 'tds',
      render: (row) => formatCurrency(row.tds)
    },
    {
      header: 'PF',
      accessor: 'pf',
      render: (row) => (
        <span>
          {formatCurrency(row.pf)}
          {row.pf_applicable && <Badge variant="info" style={{ marginLeft: 4, fontSize: '0.6rem' }}>✓</Badge>}
        </span>
      )
    },
    {
      header: 'ESIC',
      accessor: 'esic',
      render: (row) => (
        <span>
          {formatCurrency(row.esic)}
          {row.esic_applicable && <Badge variant="info" style={{ marginLeft: 4, fontSize: '0.6rem' }}>✓</Badge>}
        </span>
      )
    },
    {
      header: 'Net Pay',
      accessor: 'net_pay',
      render: (row) => <strong className={styles.netPay}>{formatCurrency(row.net_pay)}</strong>
    },
    {
      header: 'Slip',
      accessor: 'run_id',
      render: (row) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            generateSalarySlip(row);
          }}
        >
          📄
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Button variant="ghost" onClick={() => router.push('/admin/hr/payroll/history')} className={styles.backButton}>
            ← Back to History
          </Button>
          <h1 className={styles.title}>Payroll - {month}</h1>
          <div className={styles.statusBadge}>
            <Badge variant={status === 'FINAL' ? 'success' : 'warning'}>
              {status || 'N/A'}
            </Badge>
          </div>
        </div>
        <div className={styles.headerActions}>
          {status === 'FINAL' && (
            <>
              <Button variant="secondary" onClick={exportCSV}>
                📥 Export CSV
              </Button>
              <Button variant="secondary" onClick={generateAllSalarySlips}>
                📄 All Salary Slips
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className={styles.summaryGrid}>
          <Card title="Employees" value={summary.employee_count.toString()} accentColor="var(--color-primary-500)" />
          <Card title="Total Gross" value={formatCurrency(summary.total_gross)} accentColor="var(--color-gray-500)" />
          <Card title="LOP Deductions" value={formatCurrency(summary.total_lop || 0)} accentColor="var(--color-danger-500)" />
          <Card title="Bonus/OT" value={formatCurrency(summary.total_bonus || 0)} accentColor="var(--color-success-500)" />
          <Card title="Total Deductions" value={formatCurrency(summary.total_pt + summary.total_tds + summary.total_pf + summary.total_esic)} accentColor="var(--color-warning-500)" />
          <Card title="Total Net Pay" value={formatCurrency(summary.total_net_pay)} accentColor="var(--color-purple-500)" />
        </div>
      )}

      {/* Payroll Table */}
      <div className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>Employee Payroll Details</h2>
        <Table
          data={payrollRuns}
          columns={columns}
          emptyMessage="No payroll data found"
          searchable
          searchPlaceholder="Search by employee name..."
        />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Table, { Column } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';
import { generateSalarySlipPDF } from '@/lib/pdf';
import styles from './page.module.css';

interface PayrollResult {
  emp_id: string;
  name: string;
  role: string | null;
  designation: string | null;
  department: string | null;
  pan: string | null;
  bank_account: string | null;
  ifsc: string | null;
  date_of_joining: string | null;
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
  pf_applicable: boolean;
  esic_applicable: boolean;
}

interface EmployeeBasic {
  emp_id: string;
  name: string;
  designation: string | null;
  monthly_gross: number;
}

interface EmployeeAdjustment {
  emp_id: string;
  lop_days: number;
  lop_reason: string;
  bonus_amount: number;
  bonus_reason: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 7 }, (_, i) => (2024 + i).toString());

export default function PayrollPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const currentDate = new Date();
  const [month, setMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  
  const [results, setResults] = useState<PayrollResult[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'calculated' | 'finalized'>('idle');
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  
  // Modal for LOP/Bonus entry
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [employees, setEmployees] = useState<EmployeeBasic[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, EmployeeAdjustment>>({});
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Company name for salary slips
  const [companyName, setCompanyName] = useState('Newrro Tech LLP');

  const monthYear = `${month} ${year}`;

  // Fetch config
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.config?.company_name) {
          setCompanyName(data.config.company_name);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch employees for adjustment modal
  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch('/api/employees?active=true');
      const data = await res.json();
      
      const emps: EmployeeBasic[] = data.employees
        .filter((e: { no_ctc: boolean }) => !e.no_ctc)
        .map((e: { emp_id: string; name: string; designation: string | null; monthly_gross: number }) => ({
          emp_id: e.emp_id,
          name: e.name,
          designation: e.designation,
          monthly_gross: e.monthly_gross
        }));
      
      setEmployees(emps);
      
      // Initialize adjustments
      const adjMap: Record<string, EmployeeAdjustment> = {};
      for (const e of emps) {
        adjMap[e.emp_id] = {
          emp_id: e.emp_id,
          lop_days: 0,
          lop_reason: '',
          bonus_amount: 0,
          bonus_reason: ''
        };
      }
      setAdjustments(adjMap);
    } catch {
      showToast('Failed to fetch employees', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  }, [showToast]);

  const openAdjustmentModal = async () => {
    await fetchEmployees();
    setShowAdjustmentModal(true);
  };

  const updateAdjustment = (
    empId: string, 
    field: 'lop_days' | 'lop_reason' | 'bonus_amount' | 'bonus_reason', 
    value: number | string
  ) => {
    setAdjustments(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value
      }
    }));
  };

  const calculatePayroll = async () => {
    setShowAdjustmentModal(false);
    setLoading(true);
    setResults([]);
    setWarnings([]);
    
    try {
      // Convert adjustments to array format
      const adjustmentArray = Object.values(adjustments);
      
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, adjustments: adjustmentArray })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate payroll');
      }
      
      setResults(data.results);
      setWarnings(data.warnings || []);
      setStatus('calculated');
      showToast(`Payroll calculated for ${data.employee_count} employees`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to calculate payroll', 'error');
    } finally {
      setLoading(false);
    }
  };

  const finalizePayroll = async () => {
    setFinalizing(true);
    
    try {
      const res = await fetch('/api/payroll/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthYear })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to finalize payroll');
      }
      
      setStatus('finalized');
      showToast(`Payroll finalized for ${monthYear}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to finalize payroll', 'error');
    } finally {
      setFinalizing(false);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await fetch(`/api/payroll/export-csv?month=${encodeURIComponent(monthYear)}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to export CSV');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_${monthYear.replace(' ', '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      showToast('CSV exported successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to export CSV', 'error');
    }
  };

  // Generate individual salary slip
  const generateSalarySlip = async (employee: PayrollResult) => {
    try {
      await generateSalarySlipPDF({
        companyName,
        month: monthYear,
        employee: {
          emp_id: employee.emp_id,
          name: employee.name,
          designation: employee.designation || employee.role || 'Employee',
          pan: employee.pan || '',
          bank_account: employee.bank_account || '',
          ifsc: employee.ifsc || '',
          department: employee.department || undefined,
          date_of_joining: employee.date_of_joining || undefined
        },
        earnings: {
          basic: employee.monthly_gross,
          bonus: employee.bonus_amount
        },
        deductions: {
          lop_days: employee.lop_days,
          lop_amount: employee.lop_deduction,
          pt: employee.pt,
          tds: employee.tds,
          pf: employee.pf,
          esic: employee.esic
        },
        summary: {
          gross: employee.adjusted_gross,
          total_deductions: employee.pt + employee.tds + employee.pf + employee.esic,
          net_pay: employee.net_pay
        }
      });
      showToast(`Salary slip generated for ${employee.name}`, 'success');
    } catch {
      showToast('Failed to generate salary slip', 'error');
    }
  };

  // Generate all salary slips
  const generateAllSalarySlips = async () => {
    for (const emp of results) {
      await generateSalarySlip(emp);
    }
    showToast(`Generated ${results.length} salary slips`, 'success');
  };

  // Calculate totals
  const totals = results.reduce(
    (acc, r) => ({
      gross: acc.gross + r.monthly_gross,
      lop: acc.lop + r.lop_deduction,
      bonus: acc.bonus + r.bonus_amount,
      adjusted: acc.adjusted + r.adjusted_gross,
      pt: acc.pt + r.pt,
      tds: acc.tds + r.tds,
      pf: acc.pf + r.pf,
      esic: acc.esic + r.esic,
      net: acc.net + r.net_pay
    }),
    { gross: 0, lop: 0, bonus: 0, adjusted: 0, pt: 0, tds: 0, pf: 0, esic: 0, net: 0 }
  );

  const columns: Column<PayrollResult>[] = [
    {
      header: 'Employee',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className={styles.employeeName}>{row.name}</div>
          <div className={styles.employeeMeta}>{row.designation || row.role}</div>
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
        <span>
          {row.lop_days > 0 ? (
            <div>
              <span className={styles.lopDays}>{row.lop_days}d</span>
              <span className={styles.lopAmount}>-{formatCurrency(row.lop_deduction)}</span>
              {row.lop_reason && <div className={styles.reasonText}>{row.lop_reason}</div>}
            </div>
          ) : '-'}
        </span>
      )
    },
    {
      header: 'Bonus/OT',
      accessor: 'bonus_amount',
      render: (row) => row.bonus_amount > 0 ? (
        <div>
          <span className={styles.bonusAmount}>+{formatCurrency(row.bonus_amount)}</span>
          {row.bonus_reason && <div className={styles.reasonText}>{row.bonus_reason}</div>}
        </div>
      ) : '-'
    },
    {
      header: 'Adj. Gross',
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
      render: (row) => <strong>{formatCurrency(row.net_pay)}</strong>
    },
    {
      header: 'Slip',
      accessor: 'emp_id',
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Monthly Payroll Processing</h1>
          <p className={styles.subtitle}>Calculate and finalize employee payroll</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/admin/hr/payroll/history')}>
          📋 View History
        </Button>
      </div>

      {/* Month Selection */}
      <div className={styles.monthSelection}>
        <Select
          label="Month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setStatus('idle');
            setResults([]);
          }}
          options={MONTHS.map((m) => ({ value: m, label: m }))}
        />
        <Select
          label="Year"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setStatus('idle');
            setResults([]);
          }}
          options={YEARS.map((y) => ({ value: y, label: y }))}
        />
        <Button onClick={openAdjustmentModal} loading={loading} className={styles.calcButton}>
          🔢 Calculate Payroll
        </Button>
      </div>

      {/* Status Badge */}
      {status !== 'idle' && (
        <div className={styles.statusBar}>
          <span>Status for {monthYear}:</span>
          <Badge variant={status === 'finalized' ? 'success' : 'warning'}>
            {status === 'finalized' ? 'FINALIZED' : 'DRAFT'}
          </Badge>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className={styles.warnings}>
          <h3>📋 Notes & Adjustments</h3>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <>
          <Table
            data={results}
            columns={columns}
            emptyMessage="No payroll data"
          />

          {/* Totals */}
          <div className={styles.totalsGrid}>
            <Card title="Total Gross" value={formatCurrency(totals.gross)} accentColor="var(--color-primary-500)" />
            <Card title="LOP Deductions" value={formatCurrency(totals.lop)} accentColor="var(--color-danger-500)" />
            <Card title="Bonus/OT" value={formatCurrency(totals.bonus)} accentColor="var(--color-success-500)" />
            <Card title="Adjusted Gross" value={formatCurrency(totals.adjusted)} accentColor="var(--color-teal-500)" />
            <Card title="Total Deductions" value={formatCurrency(totals.pt + totals.tds + totals.pf + totals.esic)} accentColor="var(--color-warning-500)" />
            <Card title="Total Net Pay" value={formatCurrency(totals.net)} accentColor="var(--color-purple-500)" />
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            {status === 'calculated' && (
              <Button onClick={finalizePayroll} loading={finalizing}>
                ✅ Finalize Payroll
              </Button>
            )}
            {status === 'finalized' && (
              <>
                <Button variant="secondary" onClick={exportCSV}>
                  📥 Export Bank CSV
                </Button>
                <Button variant="secondary" onClick={generateAllSalarySlips}>
                  📄 Generate All Salary Slips
                </Button>
              </>
            )}
          </div>
        </>
      )}

      {/* LOP/Bonus Adjustment Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        title={`Enter LOP & Bonus for ${monthYear}`}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowAdjustmentModal(false)}>
              Cancel
            </Button>
            <Button onClick={calculatePayroll} loading={loading}>
              Calculate Payroll
            </Button>
          </div>
        }
      >
        {loadingEmployees ? (
          <p>Loading employees...</p>
        ) : (
          <div className={styles.adjustmentTable}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Monthly Gross</th>
                  <th>LOP Days</th>
                  <th>LOP Reason</th>
                  <th>OT/Bonus (₹)</th>
                  <th>Bonus Reason</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.emp_id}>
                    <td>
                      <div className={styles.empCell}>
                        <strong>{emp.name}</strong>
                        <span>{emp.designation}</span>
                      </div>
                    </td>
                    <td>{formatCurrency(emp.monthly_gross)}</td>
                    <td>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={adjustments[emp.emp_id]?.lop_days || 0}
                        onChange={(e) => updateAdjustment(emp.emp_id, 'lop_days', parseFloat(e.target.value) || 0)}
                        style={{ width: '70px' }}
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        placeholder="Reason..."
                        value={adjustments[emp.emp_id]?.lop_reason || ''}
                        onChange={(e) => updateAdjustment(emp.emp_id, 'lop_reason', e.target.value)}
                        style={{ width: '120px' }}
                        disabled={!adjustments[emp.emp_id]?.lop_days}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        min={0}
                        value={adjustments[emp.emp_id]?.bonus_amount || 0}
                        onChange={(e) => updateAdjustment(emp.emp_id, 'bonus_amount', parseFloat(e.target.value) || 0)}
                        style={{ width: '90px' }}
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        placeholder="Reason..."
                        value={adjustments[emp.emp_id]?.bonus_reason || ''}
                        onChange={(e) => updateAdjustment(emp.emp_id, 'bonus_reason', e.target.value)}
                        style={{ width: '120px' }}
                        disabled={!adjustments[emp.emp_id]?.bonus_amount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

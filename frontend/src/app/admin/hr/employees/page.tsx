'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Table, { Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/context/ToastContext';
import { Employee, EMPLOYEE_TYPES } from '@/types/employee';
import { formatCurrency } from '@/lib/format';
import { downloadOfferLetter } from '@/lib/pdf';
import styles from './page.module.css';

export default function EmployeesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [showDecrementModal, setShowDecrementModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Form states
  const [newRole, setNewRole] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [salaryPercent, setSalaryPercent] = useState('10');
  const [reason, setReason] = useState('');
  const [salaryHistory, setSalaryHistory] = useState<Array<{
    change_type: string;
    old_salary: number | null;
    new_salary: number | null;
    old_designation: string | null;
    new_designation: string | null;
    reason: string | null;
    effective_date: string;
  }>>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [offerLetterLoading, setOfferLetterLoading] = useState(false);
  const [pfEnabled, setPfEnabled] = useState(false);
  const [esicEnabled, setEsicEnabled] = useState(false);
  const [companyName, setCompanyName] = useState('Newrro Tech LLP');

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) return;
      const data = await res.json();
      setPfEnabled(data.config?.pf_enabled === '1' || data.config?.pf_enabled === true);
      setEsicEnabled(data.config?.esic_enabled === '1' || data.config?.esic_enabled === true);
      if (data.config?.company_name) setCompanyName(data.config.company_name);
    } catch {
      // Use defaults
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data.employees);
    } catch {
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEmployees();
    fetchConfig();
  }, [fetchEmployees, fetchConfig]);

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.emp_id.toLowerCase().includes(term) ||
      emp.pan.toLowerCase().includes(term) ||
      (emp.email && emp.email.toLowerCase().includes(term))
    );
  });

  const openActionModal = (emp: Employee, action: string) => {
    setSelectedEmployee(emp);
    setNewRole(emp.role || 'Employee');
    setNewDesignation(emp.designation || '');
    setSalaryPercent('10');
    setReason('');
    
    switch (action) {
      case 'promote':
        setShowPromoteModal(true);
        break;
      case 'demote':
        setShowDemoteModal(true);
        break;
      case 'increment':
        setShowIncrementModal(true);
        break;
      case 'decrement':
        setShowDecrementModal(true);
        break;
      case 'deactivate':
        setShowDeactivateModal(true);
        break;
      case 'history':
        fetchHistory(emp.emp_id);
        setShowHistoryModal(true);
        break;
    }
  };

  const fetchHistory = async (empId: string) => {
    try {
      const res = await fetch(`/api/employees/${empId}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setSalaryHistory(data.history);
    } catch {
      showToast('Failed to load history', 'error');
    }
  };

  const handlePromote = async () => {
    if (!selectedEmployee) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.emp_id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_role: newRole,
          new_designation: newDesignation,
          salary_increase_percent: parseFloat(salaryPercent),
          reason: reason || 'Promotion'
        })
      });
      if (!res.ok) throw new Error('Failed to promote employee');
      showToast('Employee promoted successfully', 'success');
      setShowPromoteModal(false);
      fetchEmployees();
    } catch {
      showToast('Failed to promote employee', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemote = async () => {
    if (!selectedEmployee) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.emp_id}/demote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_role: newRole,
          new_designation: newDesignation,
          salary_decrease_percent: parseFloat(salaryPercent),
          reason: reason || 'Demotion'
        })
      });
      if (!res.ok) throw new Error('Failed to demote employee');
      showToast('Employee demoted', 'success');
      setShowDemoteModal(false);
      fetchEmployees();
    } catch {
      showToast('Failed to demote employee', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIncrement = async () => {
    if (!selectedEmployee) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.emp_id}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          increment_percent: parseFloat(salaryPercent),
          reason: reason || 'Salary increment'
        })
      });
      if (!res.ok) throw new Error('Failed to increment salary');
      showToast('Salary incremented successfully', 'success');
      setShowIncrementModal(false);
      fetchEmployees();
    } catch {
      showToast('Failed to increment salary', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecrement = async () => {
    if (!selectedEmployee) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.emp_id}/decrement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decrement_percent: parseFloat(salaryPercent),
          reason: reason || 'Salary decrement'
        })
      });
      if (!res.ok) throw new Error('Failed to decrement salary');
      showToast('Salary decremented', 'success');
      setShowDecrementModal(false);
      fetchEmployees();
    } catch {
      showToast('Failed to decrement salary', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedEmployee) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.emp_id}/deactivate`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to deactivate employee');
      showToast('Employee deactivated', 'success');
      setShowDeactivateModal(false);
      fetchEmployees();
    } catch {
      showToast('Failed to deactivate employee', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadOfferLetter = async () => {
    if (!selectedEmployee) return;
    setOfferLetterLoading(true);
    try {
      const emp = selectedEmployee;
      const isIntern = emp.employee_type === 'IN';
      await downloadOfferLetter({
        companyName,
        data: {
          name: emp.name,
          address: emp.address || '',
          position: emp.designation || emp.role || 'Employee',
          department: emp.department || 'General',
          joining_date: emp.date_of_joining || '',
          end_date: emp.end_date || undefined,
          annual_ctc: emp.no_ctc ? 0 : emp.annual_ctc,
          reporting_to: emp.manager_name || 'Manager',
          responsibilities: emp.roles_responsibilities || 'As defined by your manager.',
          terms: '',
          is_intern: isIntern,
          pf_enabled: pfEnabled,
          esic_enabled: esicEnabled,
        }
      });
      showToast(`Offer letter generated for ${emp.name}`, 'success');
    } catch {
      showToast('Failed to generate offer letter', 'error');
    } finally {
      setOfferLetterLoading(false);
    }
  };

  const calculateNewSalary = (current: number, percent: number, increase: boolean) => {
    const multiplier = increase ? (1 + percent / 100) : (1 - percent / 100);
    return Math.round(current * multiplier * 100) / 100;
  };

  const columns: Column<Employee>[] = [
    {
      header: 'ID',
      accessor: 'emp_id',
      sortable: true
    },
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (emp) => (
        <div className={styles.employeeCell}>
          <span className={styles.employeeName}>{emp.name}</span>
          {!emp.active && <Badge variant="danger">Inactive</Badge>}
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'employee_type',
      render: (emp) => (
        <Badge variant={
          emp.employee_type === 'EM' ? 'info' :
          emp.employee_type === 'IN' ? 'purple' :
          emp.employee_type === 'DR' ? 'success' : 'neutral'
        }>
          {EMPLOYEE_TYPES[emp.employee_type]}
        </Badge>
      )
    },
    {
      header: 'Designation',
      accessor: 'designation',
      sortable: true
    },
    {
      header: 'Department',
      accessor: 'department'
    },
    {
      header: 'Annual CTC',
      accessor: 'annual_ctc',
      sortable: true,
      render: (emp) => emp.no_ctc ? '-' : formatCurrency(emp.annual_ctc)
    },
    {
      header: 'Actions',
      accessor: 'emp_id',
      render: (emp) => (
        <div className={styles.actionButtons}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/hr/employees/${emp.emp_id}`);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openActionModal(emp, 'history');
            }}
          >
            History
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Employee Management</h1>
          <p className={styles.subtitle}>Manage your workforce</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={() => router.push('/admin/hr/pending-candidates')}>
            ⏳ Pending
          </Button>
          <Button onClick={() => router.push('/admin/hr/employees/new')}>
            ➕ Add Employee
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <Input
          placeholder="Search by name, ID, PAN, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.actionBar}>
          {selectedEmployee && (
            <>
              <Button variant="secondary" size="sm" onClick={() => openActionModal(selectedEmployee, 'promote')}>
                ⬆️ Promote
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openActionModal(selectedEmployee, 'demote')}>
                ⬇️ Demote
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openActionModal(selectedEmployee, 'increment')}>
                💰 Increment
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openActionModal(selectedEmployee, 'decrement')}>
                📉 Decrement
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadOfferLetter} loading={offerLetterLoading}>
                📄 Offer Letter
              </Button>
              <Button variant="danger" size="sm" onClick={() => openActionModal(selectedEmployee, 'deactivate')}>
                ❌ Deactivate
              </Button>
            </>
          )}
        </div>
      </div>

      <Table
        data={filteredEmployees}
        columns={columns}
        loading={loading}
        onRowClick={(emp) => setSelectedEmployee(emp)}
        isRowSelected={(emp) => emp.emp_id === selectedEmployee?.emp_id}
        emptyMessage="No employees found"
        searchable={false}
      />

      {/* Promote Modal */}
      <Modal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        title={`Promote ${selectedEmployee?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPromoteModal(false)}>Cancel</Button>
            <Button onClick={handlePromote} loading={actionLoading}>Confirm Promotion</Button>
          </>
        }
      >
        {selectedEmployee && (
          <div className={styles.modalForm}>
            <Select
              label="New Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={[
                { value: 'Employee', label: 'Employee' },
                { value: 'Senior Employee', label: 'Senior Employee' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Director', label: 'Director' },
                { value: 'Executive', label: 'Executive' }
              ]}
            />
            <Input
              label="New Designation"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
              placeholder="e.g., Senior Developer"
            />
            <Input
              label="Salary Increase %"
              type="number"
              value={salaryPercent}
              onChange={(e) => setSalaryPercent(e.target.value)}
              min="0"
              max="100"
            />
            <p className={styles.salaryPreview}>
              Current: {formatCurrency(selectedEmployee.annual_ctc)} →{' '}
              New: {formatCurrency(calculateNewSalary(selectedEmployee.annual_ctc, parseFloat(salaryPercent) || 0, true))}
            </p>
            <Input
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Promotion reason..."
            />
          </div>
        )}
      </Modal>

      {/* Demote Modal */}
      <Modal
        isOpen={showDemoteModal}
        onClose={() => setShowDemoteModal(false)}
        title={`Demote ${selectedEmployee?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDemoteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDemote} loading={actionLoading}>Confirm Demotion</Button>
          </>
        }
      >
        {selectedEmployee && (
          <div className={styles.modalForm}>
            <Select
              label="New Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={[
                { value: 'Employee', label: 'Employee' },
                { value: 'Senior Employee', label: 'Senior Employee' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Director', label: 'Director' },
                { value: 'Executive', label: 'Executive' }
              ]}
            />
            <Input
              label="New Designation"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
            />
            <Input
              label="Salary Decrease %"
              type="number"
              value={salaryPercent}
              onChange={(e) => setSalaryPercent(e.target.value)}
              min="0"
              max="50"
            />
            <p className={styles.salaryPreview}>
              Current: {formatCurrency(selectedEmployee.annual_ctc)} →{' '}
              New: {formatCurrency(calculateNewSalary(selectedEmployee.annual_ctc, parseFloat(salaryPercent) || 0, false))}
            </p>
            <Input
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Demotion reason..."
            />
          </div>
        )}
      </Modal>

      {/* Increment Modal */}
      <Modal
        isOpen={showIncrementModal}
        onClose={() => setShowIncrementModal(false)}
        title={`Salary Increment - ${selectedEmployee?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowIncrementModal(false)}>Cancel</Button>
            <Button onClick={handleIncrement} loading={actionLoading}>Confirm Increment</Button>
          </>
        }
      >
        {selectedEmployee && (
          <div className={styles.modalForm}>
            <p>Current Annual CTC: <strong>{formatCurrency(selectedEmployee.annual_ctc)}</strong></p>
            <Input
              label="Increment %"
              type="number"
              value={salaryPercent}
              onChange={(e) => setSalaryPercent(e.target.value)}
              min="0.1"
              max="100"
              step="0.1"
            />
            <p className={styles.salaryPreview}>
              New CTC: {formatCurrency(calculateNewSalary(selectedEmployee.annual_ctc, parseFloat(salaryPercent) || 0, true))}
            </p>
            <Input
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual review, Performance bonus"
            />
          </div>
        )}
      </Modal>

      {/* Decrement Modal */}
      <Modal
        isOpen={showDecrementModal}
        onClose={() => setShowDecrementModal(false)}
        title={`Salary Decrement - ${selectedEmployee?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDecrementModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDecrement} loading={actionLoading}>Confirm Decrement</Button>
          </>
        }
      >
        {selectedEmployee && (
          <div className={styles.modalForm}>
            <p>Current Annual CTC: <strong>{formatCurrency(selectedEmployee.annual_ctc)}</strong></p>
            <Input
              label="Decrement %"
              type="number"
              value={salaryPercent}
              onChange={(e) => setSalaryPercent(e.target.value)}
              min="0.1"
              max="50"
              step="0.1"
            />
            <p className={styles.salaryPreview}>
              New CTC: {formatCurrency(calculateNewSalary(selectedEmployee.annual_ctc, parseFloat(salaryPercent) || 0, false))}
            </p>
            <Input
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Decrement reason..."
            />
          </div>
        )}
      </Modal>

      {/* Deactivate Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title={`Deactivate ${selectedEmployee?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeactivateModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeactivate} loading={actionLoading}>Deactivate</Button>
          </>
        }
      >
        <p>Are you sure you want to deactivate <strong>{selectedEmployee?.name}</strong>?</p>
        <p className={styles.warningText}>They will not appear in future payroll runs.</p>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Salary History - ${selectedEmployee?.name}`}
      >
        {salaryHistory.length > 0 ? (
          <div className={styles.historyTable}>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Old Salary</th>
                  <th>New Salary</th>
                  <th>Date</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {salaryHistory.map((h, idx) => (
                  <tr key={idx}>
                    <td>
                      <Badge variant={
                        h.change_type === 'PROMOTION' ? 'success' :
                        h.change_type === 'DEMOTION' ? 'danger' :
                        h.change_type === 'INCREMENT' ? 'info' :
                        h.change_type === 'DECREMENT' ? 'warning' : 'neutral'
                      }>
                        {h.change_type}
                      </Badge>
                    </td>
                    <td>{h.old_salary ? formatCurrency(h.old_salary) : '-'}</td>
                    <td>{h.new_salary ? formatCurrency(h.new_salary) : '-'}</td>
                    <td>{h.effective_date}</td>
                    <td>{h.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No salary history found.</p>
        )}
      </Modal>
    </div>
  );
}

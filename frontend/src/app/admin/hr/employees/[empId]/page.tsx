'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';
import { Employee, STATES } from '@/types/employee';
import { formatCurrency } from '@/lib/format';
import styles from '../new/page.module.css';

interface PageProps {
  params: Promise<{ empId: string }>;
}

export default function EditEmployeePage({ params }: PageProps) {
  const { empId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pan: '',
    bank_account: '',
    ifsc: '',
    state: 'Karnataka',
    date_of_joining: '',
    annual_ctc: '',
    tax_regime: 'NEW',
    role: 'Employee',
    designation: '',
    department: '',
    address: '',
    manager_name: '',
    roles_responsibilities: '',
    employee_type: 'EM',
    end_date: '',
    no_ctc: false
  });

  const fetchEmployee = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees/${empId}`);
      if (!res.ok) throw new Error('Employee not found');
      const data = await res.json();
      const emp: Employee = data.employee;
      
      setFormData({
        name: emp.name,
        email: emp.email || '',
        phone: emp.phone || '',
        pan: emp.pan,
        bank_account: emp.bank_account,
        ifsc: emp.ifsc,
        state: emp.state,
        date_of_joining: emp.date_of_joining,
        annual_ctc: emp.annual_ctc.toString(),
        tax_regime: emp.tax_regime,
        role: emp.role || 'Employee',
        designation: emp.designation || '',
        department: emp.department || '',
        address: emp.address || '',
        manager_name: emp.manager_name || '',
        roles_responsibilities: emp.roles_responsibilities || '',
        employee_type: emp.employee_type,
        end_date: emp.end_date || '',
        no_ctc: emp.no_ctc
      });
    } catch {
      showToast('Failed to load employee', 'error');
      router.push('/admin/hr/employees');
    } finally {
      setLoading(false);
    }
  }, [empId, showToast, router]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const monthlyGross = formData.no_ctc || !formData.annual_ctc 
    ? 0 
    : parseFloat(formData.annual_ctc) / 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.pan || !formData.bank_account || !formData.ifsc || !formData.designation) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    if (!formData.no_ctc && (!formData.annual_ctc || parseFloat(formData.annual_ctc) <= 0)) {
      showToast('Annual CTC is required and must be positive', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          annual_ctc: formData.no_ctc ? 0 : parseFloat(formData.annual_ctc)
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }
      
      showToast('Employee updated successfully!', 'success');
      router.push('/admin/hr/employees');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update employee', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const isIntern = formData.employee_type === 'IN';
  const isVolunteer = formData.employee_type === 'VL';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Employee</h1>
        <p className={styles.subtitle}>Employee ID: {empId}</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Personal Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>👤 Personal Information</h2>
          <div className={styles.grid}>
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="employee@company.com"
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="10 digit mobile number"
            />
          </div>
          <Textarea
            label="Address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Full residential address"
            rows={2}
          />
        </section>

        {/* Document Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📄 Document Information</h2>
          <div className={styles.grid}>
            <Input
              label="PAN Number"
              value={formData.pan}
              onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
              placeholder="AAAPL1234C"
              required
            />
            <Input
              label="Bank Account Number"
              value={formData.bank_account}
              onChange={(e) => handleChange('bank_account', e.target.value)}
              required
            />
            <Input
              label="IFSC Code"
              value={formData.ifsc}
              onChange={(e) => handleChange('ifsc', e.target.value.toUpperCase())}
              placeholder="SBIN0001234"
              required
            />
          </div>
        </section>

        {/* Employment Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>💼 Employment Information</h2>
          <div className={styles.grid}>
            <Select
              label="Employee Type"
              value={formData.employee_type}
              onChange={(e) => handleChange('employee_type', e.target.value)}
              options={[
                { value: 'EM', label: 'EM - Employee' },
                { value: 'IN', label: 'IN - Intern' },
                { value: 'DR', label: 'DR - Director' },
                { value: 'VL', label: 'VL - Volunteer' }
              ]}
            />
            <Input
              label="Designation"
              value={formData.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              placeholder="e.g., Software Developer"
              required
            />
            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              options={[
                { value: 'Employee', label: 'Employee' },
                { value: 'Senior Employee', label: 'Senior Employee' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Director', label: 'Director' },
                { value: 'Executive', label: 'Executive' }
              ]}
            />
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="e.g., Engineering"
            />
            <Input
              label="Manager Name"
              value={formData.manager_name}
              onChange={(e) => handleChange('manager_name', e.target.value)}
            />
            <Select
              label="State"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              options={STATES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          
          {isIntern && (
            <div className={styles.inlineField}>
              <Input
                label="Internship End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
              />
            </div>
          )}
          
          <Textarea
            label="Roles & Responsibilities"
            value={formData.roles_responsibilities}
            onChange={(e) => handleChange('roles_responsibilities', e.target.value)}
            placeholder="Enter key responsibilities and duties for this position"
            rows={3}
          />
        </section>

        {/* Salary Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>💰 Salary Information</h2>
          <div className={styles.grid}>
            <Input
              label="Date of Joining"
              type="date"
              value={formData.date_of_joining}
              onChange={(e) => handleChange('date_of_joining', e.target.value)}
              required
            />
            <Select
              label="Tax Regime"
              value={formData.tax_regime}
              onChange={(e) => handleChange('tax_regime', e.target.value)}
              options={[
                { value: 'NEW', label: 'NEW (FY 2024-25)' },
                { value: 'OLD', label: 'OLD' }
              ]}
            />
          </div>
          
          <div className={styles.ctcSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.no_ctc}
                onChange={(e) => handleChange('no_ctc', e.target.checked)}
              />
              <span>{isIntern ? 'No Stipend' : isVolunteer ? 'No CTC (Volunteer)' : 'No CTC'}</span>
            </label>
            
            {!formData.no_ctc && (
              <div className={styles.ctcFields}>
                <Input
                  label={isIntern ? 'Annual Stipend' : 'Annual CTC'}
                  type="number"
                  value={formData.annual_ctc}
                  onChange={(e) => handleChange('annual_ctc', e.target.value)}
                  placeholder="e.g., 600000"
                  required={!formData.no_ctc}
                />
                <div className={styles.monthlyGross}>
                  <label>Monthly Gross (Auto-calculated)</label>
                  <p>{formatCurrency(monthlyGross)}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            💾 Update Employee
          </Button>
        </div>
      </form>
    </div>
  );
}

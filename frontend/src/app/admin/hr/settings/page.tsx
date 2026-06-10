'use client';

import { useEffect, useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';
import styles from './page.module.css';

interface Config {
  pf_enabled: boolean;
  esic_enabled: boolean;
  company_name: string;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<Config>({
    pf_enabled: false,
    esic_enabled: false,
    company_name: 'Newrro Tech LLP'
  });
  
  const [employeeCount, setEmployeeCount] = useState(0);

  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, dashboardRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/dashboard')
      ]);
      
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig({
          pf_enabled: configData.config.pf_enabled || false,
          esic_enabled: configData.config.esic_enabled || false,
          company_name: configData.config.company_name || 'Newrro Tech LLP'
        });
      }
      
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setEmployeeCount(dashboardData.active_employees || 0);
      }
    } catch {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!res.ok) throw new Error('Failed to save settings');
      
      showToast('Settings saved successfully', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
        <p>Loading settings...</p>
      </div>
    );
  }

  // Statutory thresholds as per Indian Labour Law
  const ESIC_THRESHOLD = 10; // ESIC mandatory for 10+ paid employees
  const PF_THRESHOLD = 20; // PF mandatory for 20+ employees
  
  // Check if thresholds are reached
  const esicMandatory = employeeCount >= ESIC_THRESHOLD;
  const pfMandatory = employeeCount >= PF_THRESHOLD;
  
  // Show warning if approaching threshold (within 2 employees)
  const esicApproaching = employeeCount >= ESIC_THRESHOLD - 2 && employeeCount < ESIC_THRESHOLD;
  const pfApproaching = employeeCount >= PF_THRESHOLD - 2 && employeeCount < PF_THRESHOLD;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Configure your payroll system</p>
      </div>

      {/* Company Settings */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🏢 Company Information</h2>
        <div className={styles.formGroup}>
          <Input
            label="Company Name"
            value={config.company_name}
            onChange={(e) => setConfig((prev) => ({ ...prev, company_name: e.target.value }))}
            placeholder="Enter company name"
          />
        </div>
      </section>

      {/* Statutory Compliance */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📋 Statutory Compliance (Indian Labour Law)</h2>
        
        <div className={styles.complianceCards}>
          {/* PF Card */}
          <div className={styles.complianceCard}>
            <div className={styles.complianceHeader}>
              <h3>🏦 Provident Fund (PF)</h3>
              {pfMandatory && (
                <span className={styles.mandatoryBadge}>MANDATORY</span>
              )}
              {pfApproaching && (
                <span className={styles.warningBadge}>APPROACHING</span>
              )}
            </div>
            <p className={styles.complianceDesc}>
              Employee Provident Fund - 12% deduction from basic salary. 
              Mandatory for establishments with {PF_THRESHOLD}+ employees as per Employees' Provident Funds and Miscellaneous Provisions Act, 1952.
            </p>
            <div className={styles.complianceStatus}>
              <span>Current employees: <strong>{employeeCount}</strong></span>
              <span className={pfMandatory ? styles.warning : styles.info}>
                {pfMandatory 
                  ? `⚠️ PF is mandatory (${PF_THRESHOLD}+ employees)` 
                  : pfApproaching
                    ? `⚠️ Approaching threshold (${PF_THRESHOLD - employeeCount} more needed)`
                    : `✓ Below threshold (${PF_THRESHOLD} employees needed)`}
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.pf_enabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, pf_enabled: e.target.checked }))}
                disabled={pfMandatory}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>
                {config.pf_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
            {pfMandatory && (
              <p className={styles.mandatoryNote}>
                ⚠️ Cannot be disabled - PF is mandatory for organizations with {PF_THRESHOLD}+ employees as per Indian Labour Law
              </p>
            )}
          </div>

          {/* ESIC Card */}
          <div className={styles.complianceCard}>
            <div className={styles.complianceHeader}>
              <h3>🏥 Employee State Insurance (ESIC)</h3>
              {esicMandatory && (
                <span className={styles.mandatoryBadge}>MANDATORY</span>
              )}
              {esicApproaching && (
                <span className={styles.warningBadge}>APPROACHING</span>
              )}
            </div>
            <p className={styles.complianceDesc}>
              Employee State Insurance - 0.75% deduction from employee, 3.25% from employer.
              Mandatory for establishments with {ESIC_THRESHOLD}+ employees having wages ≤ ₹21,000/month as per ESI Act, 1948.
            </p>
            <div className={styles.complianceStatus}>
              <span>Current employees: <strong>{employeeCount}</strong></span>
              <span className={esicMandatory ? styles.warning : styles.info}>
                {esicMandatory 
                  ? `⚠️ ESIC is mandatory (${ESIC_THRESHOLD}+ employees)` 
                  : esicApproaching
                    ? `⚠️ Approaching threshold (${ESIC_THRESHOLD - employeeCount} more needed)`
                    : `✓ Below threshold (${ESIC_THRESHOLD} employees needed)`}
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.esic_enabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, esic_enabled: e.target.checked }))}
                disabled={esicMandatory}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>
                {config.esic_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
            {esicMandatory && (
              <p className={styles.mandatoryNote}>
                ⚠️ Cannot be disabled - ESIC is mandatory for organizations with {ESIC_THRESHOLD}+ employees as per Indian Labour Law
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Info Cards - Deduction Rules */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📊 Statutory Deduction Rules (India)</h2>
        <div className={styles.infoGrid}>
          <Card
            title="Professional Tax (PT)"
            value="₹200/month"
            subtitle="Applicable when monthly gross > ₹25,000 (varies by state)"
            accentColor="var(--color-teal-500)"
          />
          <Card
            title="TDS (Income Tax)"
            value="Slab-based"
            subtitle="New/Old regime with 4% cess as per Income Tax Act"
            accentColor="var(--color-danger-500)"
          />
          <Card
            title="PF Deduction"
            value="12% of Salary"
            subtitle="For employees with salary ≤ ₹15,000/month"
            accentColor="var(--color-primary-500)"
          />
          <Card
            title="ESIC Deduction"
            value="0.75% of Salary"
            subtitle="For employees with salary ≤ ₹21,000/month"
            accentColor="var(--color-warning-500)"
          />
        </div>
      </section>

      {/* Legal References */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📜 Legal References</h2>
        <div className={styles.legalInfo}>
          <ul>
            <li><strong>Employees' Provident Funds and Miscellaneous Provisions Act, 1952</strong> - PF for 20+ employees</li>
            <li><strong>Employee State Insurance Act, 1948</strong> - ESIC for 10+ employees with wages ≤ ₹21,000</li>
            <li><strong>Professional Tax</strong> - State-specific, varies by state</li>
            <li><strong>Income Tax Act, 1961</strong> - TDS as per tax slabs</li>
          </ul>
        </div>
      </section>

      {/* Save Button */}
      <div className={styles.actions}>
        <Button onClick={handleSave} loading={saving}>
          💾 Save Settings
        </Button>
      </div>
    </div>
  );
}


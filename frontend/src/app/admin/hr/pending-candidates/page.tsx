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
import { PendingCandidate, EMPLOYEE_TYPES } from '@/types/employee';
import { STATES } from '@/types/employee';
import { formatCurrency } from '@/lib/format';
import { downloadOfferLetter } from '@/lib/pdf';
import styles from './page.module.css';

export default function PendingCandidatesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<PendingCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  
  // Selection
  const [selectedCandidate, setSelectedCandidate] = useState<PendingCandidate | null>(null);
  
  // Form states for accept modal
  const [acceptForm, setAcceptForm] = useState({
    pan: '',
    bank_account: '',
    ifsc: '',
    state: 'Maharashtra',
    date_of_joining: '',
    role: '',
    designation: '',
    manager_name: '',
    tax_regime: 'NEW' as 'NEW' | 'OLD',
    end_date: '',
    no_ctc: false
  });
  const [annualCtc, setAnnualCtc] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Config states for PDF generation
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

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch('/api/pending-candidates?status=pending');
      if (!res.ok) throw new Error('Failed to fetch pending candidates');
      const data = await res.json();
      setCandidates(data.candidates);
    } catch {
      showToast('Failed to load pending candidates', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCandidates();
    fetchConfig();
  }, [fetchCandidates, fetchConfig]);

  const filteredCandidates = candidates.filter((cand) => {
    const term = searchTerm.toLowerCase();
    return (
      cand.name.toLowerCase().includes(term) ||
      cand.position.toLowerCase().includes(term) ||
      (cand.email && cand.email.toLowerCase().includes(term))
    );
  });

  const openAcceptModal = (candidate: PendingCandidate) => {
    setSelectedCandidate(candidate);
    setAcceptForm({
      pan: '',
      bank_account: '',
      ifsc: '',
      state: 'Maharashtra',
      date_of_joining: candidate.joining_date || '',
      role: candidate.position,
      designation: candidate.position,
      manager_name: candidate.reporting_to || '',
      tax_regime: 'NEW',
      end_date: '',
      no_ctc: candidate.no_ctc || false
    });
    setAnnualCtc(candidate.annual_ctc?.toString() || '');
    setShowAcceptModal(true);
  };

  const openRejectConfirm = (candidate: PendingCandidate) => {
    setSelectedCandidate(candidate);
    setShowRejectConfirm(true);
  };

  const handleAccept = async () => {
    if (!selectedCandidate) return;
    
    // Validate required fields
    if (!acceptForm.pan || !acceptForm.bank_account || !acceptForm.ifsc || !acceptForm.designation || !acceptForm.date_of_joining) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!acceptForm.no_ctc && (!annualCtc || parseFloat(annualCtc) <= 0)) {
      showToast('Please enter a valid annual CTC', 'error');
      return;
    }

    setActionLoading(true);
    
    try {
      const res = await fetch(`/api/pending-candidates/${selectedCandidate.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan: acceptForm.pan,
          bank_account: acceptForm.bank_account,
          ifsc: acceptForm.ifsc,
          state: acceptForm.state,
          date_of_joining: acceptForm.date_of_joining,
          role: acceptForm.role,
          designation: acceptForm.designation,
          manager_name: acceptForm.manager_name,
          tax_regime: acceptForm.tax_regime,
          end_date: acceptForm.end_date || undefined,
          no_ctc: acceptForm.no_ctc,
          annual_ctc: acceptForm.no_ctc ? 0 : parseFloat(annualCtc)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to accept candidate');
      }

      const data = await res.json();
      showToast(data.message, 'success');
      setShowAcceptModal(false);
      fetchCandidates();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to accept candidate', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCandidate) return;
    
    setActionLoading(true);
    
    try {
      const res = await fetch(`/api/pending-candidates/${selectedCandidate.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to reject candidate');

      showToast(`Candidate ${selectedCandidate.name} has been rejected`, 'success');
      setShowRejectConfirm(false);
      fetchCandidates();
    } catch {
      showToast('Failed to reject candidate', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadOfferLetter = async (candidate: PendingCandidate) => {
    try {
      const isIntern = candidate.employee_type === 'IN';
      await downloadOfferLetter({
        companyName,
        data: {
          name: candidate.name,
          address: candidate.address || '',
          position: candidate.position,
          department: candidate.department || 'General',
          joining_date: candidate.joining_date || '',
          annual_ctc: candidate.annual_ctc,
          reporting_to: candidate.reporting_to || 'Manager',
          responsibilities: candidate.responsibilities || 'As defined by your manager.',
          terms: '',
          is_intern: isIntern,
          pf_enabled: pfEnabled,
          esic_enabled: esicEnabled,
        }
      });
      showToast(`Offer letter generated for ${candidate.name}`, 'success');
    } catch {
      showToast('Failed to generate offer letter', 'error');
    }
  };

  const columns: Column<PendingCandidate>[] = [
    {
      header: 'ID',
      accessor: 'id',
      render: (cand) => <span className={styles.candidateId}>#{cand.id}</span>
    },
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (cand) => (
        <div className={styles.candidateCell}>
          <span className={styles.candidateName}>{cand.name}</span>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'employee_type',
      render: (cand) => (
        <Badge variant={
          cand.employee_type === 'EM' ? 'info' :
          cand.employee_type === 'IN' ? 'purple' :
          cand.employee_type === 'DR' ? 'success' : 'neutral'
        }>
          {EMPLOYEE_TYPES[cand.employee_type]}
        </Badge>
      )
    },
    {
      header: 'Position',
      accessor: 'position'
    },
    {
      header: 'Department',
      accessor: 'department'
    },
    {
      header: 'Annual CTC',
      accessor: 'annual_ctc',
      sortable: true,
      render: (cand) => cand.no_ctc ? '-' : formatCurrency(cand.annual_ctc)
    },
    {
      header: 'Joining Date',
      accessor: 'joining_date',
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (cand) => (
        <div className={styles.actionButtons}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadOfferLetter(cand);
            }}
          >
            📄 Letter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openAcceptModal(cand);
            }}
          >
            ✓ Accept
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openRejectConfirm(cand);
            }}
          >
            ✗ Reject
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pending Candidates</h1>
          <p className={styles.subtitle}>Candidates with offer letters - awaiting acceptance</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/admin/hr/offer-letter')}>
          ➕ New Offer Letter
        </Button>
      </div>

      <div className={styles.toolbar}>
        <Input
          placeholder="Search by name, position, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.actionBar}>
          {selectedCandidate && (
            <>
              <Button onClick={() => openAcceptModal(selectedCandidate)}>
                ✓ Accept Selected
              </Button>
              <Button variant="danger" onClick={() => openRejectConfirm(selectedCandidate)}>
                ✗ Reject Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedCandidate && (
        <div className={styles.selectionInfo}>
          <span className={styles.badge}>1</span>
          <span>Selected: <strong>{selectedCandidate.name}</strong> ({selectedCandidate.position})</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedCandidate(null)}
          >
            Clear
          </Button>
        </div>
      )}

      <Table
        data={filteredCandidates}
        columns={columns}
        loading={loading}
        onRowClick={(cand) => setSelectedCandidate(cand)}
        isRowSelected={(cand) => cand.id === selectedCandidate?.id}
        emptyMessage="No pending candidates found"
        searchable={false}
      />

      {/* Accept Modal */}
      <Modal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        title={`Accept Candidate: ${selectedCandidate?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAcceptModal(false)}>Cancel</Button>
            <Button onClick={handleAccept} loading={actionLoading}>Accept & Add to Employees</Button>
          </>
        }
      >
        {selectedCandidate && (
          <div className={styles.modalForm}>
            {/* Existing Info */}
            <div className={styles.infoBox}>
              <h4>Offer Letter Details</h4>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Position:</span>
                <span className={styles.infoValue}>{selectedCandidate.position}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Department:</span>
                <span className={styles.infoValue}>{selectedCandidate.department || 'N/A'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Joining Date:</span>
                <span className={styles.infoValue}>{selectedCandidate.joining_date}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>CTC:</span>
                <span className={styles.infoValue}>
                  {selectedCandidate.no_ctc ? 'No CTC' : formatCurrency(selectedCandidate.annual_ctc)}
                </span>
              </div>
            </div>

            {/* Required Fields */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Required Details (for Employee Creation)</h3>
              <div className={styles.formGrid}>
                <Input
                  label="PAN Number *"
                  value={acceptForm.pan}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F"
                  required
                />
                <Input
                  label="Bank Account *"
                  value={acceptForm.bank_account}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, bank_account: e.target.value }))}
                  placeholder="1234567890"
                  required
                />
                <Input
                  label="IFSC Code *"
                  value={acceptForm.ifsc}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                  placeholder="SBIN0001234"
                  required
                />
                <Select
                  label="State *"
                  value={acceptForm.state}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, state: e.target.value }))}
                  options={STATES.map(s => ({ value: s, label: s }))}
                />
                <Input
                  label="Joining Date *"
                  type="date"
                  value={acceptForm.date_of_joining}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, date_of_joining: e.target.value }))}
                  required
                />
                <Input
                  label="Designation *"
                  value={acceptForm.designation}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="e.g., Software Developer"
                  required
                />
              </div>
            </div>

            {/* Additional Fields */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Additional Details</h3>
              <div className={styles.formGrid}>
                <Input
                  label="Role"
                  value={acceptForm.role}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Employee, Senior Employee"
                />
                <Input
                  label="Reports To"
                  value={acceptForm.manager_name}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, manager_name: e.target.value }))}
                  placeholder="e.g., Manager Name"
                />
                <Select
                  label="Tax Regime"
                  value={acceptForm.tax_regime}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, tax_regime: e.target.value as 'NEW' | 'OLD' }))}
                  options={[
                    { value: 'NEW', label: 'New Tax Regime' },
                    { value: 'OLD', label: 'Old Tax Regime' }
                  ]}
                />
                {selectedCandidate.employee_type === 'IN' && (
                  <Input
                    label="End Date"
                    type="date"
                    value={acceptForm.end_date}
                    onChange={(e) => setAcceptForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                )}
              </div>
            </div>

            {/* CTC Section */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Compensation</h3>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={acceptForm.no_ctc}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, no_ctc: e.target.checked }))}
                />
                <span>{selectedCandidate.employee_type === 'IN' ? 'No Stipend (Unpaid)' : 'No CTC'}</span>
              </label>
              {!acceptForm.no_ctc && (
                <Input
                  label={selectedCandidate.employee_type === 'IN' ? 'Annual Stipend' : 'Annual CTC'}
                  type="number"
                  value={annualCtc}
                  onChange={(e) => setAnnualCtc(e.target.value)}
                  placeholder="e.g., 600000"
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        title={`Reject Candidate: ${selectedCandidate?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRejectConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={actionLoading}>Reject</Button>
          </>
        }
      >
        <p>Are you sure you want to reject <strong>{selectedCandidate?.name}</strong>?</p>
        <p className={styles.warningText}>This will permanently remove them from the pending list.</p>
      </Modal>
    </div>
  );
}


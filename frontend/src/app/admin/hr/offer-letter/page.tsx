'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';
import { downloadOfferLetter } from '@/lib/pdf';
import styles from './page.module.css';

const DEFAULT_RESPONSIBILITIES = `• Design and develop software solutions
• Collaborate with team members on project requirements
• Participate in code reviews and quality assurance
• Document technical specifications and processes`;

const DEFAULT_TERMS = `As per standard company policy, all employees are expected to maintain confidentiality regarding company information and intellectual property.

Working hours are 9:00 AM to 6:00 PM, Monday to Friday, with flexibility based on project requirements.

Employees are entitled to leave as per company policy and applicable labor laws.`;

export default function OfferLetterPage() {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    address: 'Bangalore, India',
    position: '',
    department: 'Engineering',
    joining_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    annual_ctc: '',
    no_ctc: false,
    reporting_to: 'Manager',
    employee_type: 'EM'
  });
  
  const [responsibilities, setResponsibilities] = useState(DEFAULT_RESPONSIBILITIES);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [companyName, setCompanyName] = useState('Newrro Tech LLP');
  const [pfEnabled, setPfEnabled] = useState(false);
  const [esicEnabled, setEsicEnabled] = useState(false);
  
  const [generating, setGenerating] = useState(false);

  // TipTap Editor for responsibilities
  const responsibilitiesEditor = useEditor({
    extensions: [StarterKit, Underline],
    content: responsibilities,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setResponsibilities(editor.getText());
    }
  });
  
  // TipTap Editor for terms
  const termsEditor = useEditor({
    extensions: [StarterKit, Underline],
    content: terms,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setTerms(editor.getText());
    }
  });

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setCompanyName(data.config.company_name || 'Newrro Tech LLP');
        setPfEnabled(data.config.pf_enabled || false);
        setEsicEnabled(data.config.esic_enabled || false);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isIntern = formData.employee_type === 'IN';
  
  const getPreviewContent = () => {
    const roleTerms = isIntern ? { term: 'Intern', upper: 'INTERN' } : { term: 'Employee', upper: 'EMPLOYEE' };
    const offerSubject = isIntern ? 'Internship Offer' : 'Employment Offer';
    const ctc = formData.no_ctc ? 0 : parseFloat(formData.annual_ctc) || 0;
    
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <h1 style="text-align: center; color: #003366;">${companyName.toUpperCase()}</h1>
        
        <p><strong>To:</strong><br/>${formData.name || '[Candidate Name]'}<br/>${formData.address}</p>
        
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        
        <p><strong>Subject:</strong> ${offerSubject} – ${formData.position || '[Position]'}</p>
        
        <p>Dear ${formData.name || '[Candidate]'},</p>
        
        <p>We are pleased to offer you the position of <strong>${formData.position || '[Position]'}</strong> in the <strong>${formData.department}</strong> Team at ${companyName.toUpperCase()}, starting from <strong>${formData.joining_date}</strong> at our NMIT Campus, Bengaluru.</p>
        
        <p><strong>Key Responsibilities:</strong></p>
        <div style="margin-left: 20px; white-space: pre-line;">${responsibilities}</div>
        
        <p>This letter confirms your acceptance of the ${offerSubject} and the Agreement, including:</p>
        <ul>
          <li>Engagement: ${isIntern ? 'Internship' : 'Full-Time Employment'}</li>
          ${isIntern && formData.end_date ? `<li>End Date: ${formData.end_date}</li>` : ''}
        </ul>
        
        <p><strong>Reporting Details:</strong><br/>You will report to: ${formData.reporting_to}</p>
        
        <p><strong>${isIntern ? 'Stipend' : 'Compensation / CTC'} details:</strong><br/>
        ${ctc === 0 
          ? (isIntern ? 'No Stipend (Unpaid Internship)' : 'Compensation as per contract terms.')
          : `Annual CTC: ${formatCurrency(ctc)}`
        }
        </p>
        
        ${!isIntern && ctc > 0 ? `
          <p style="font-size: 0.9em; font-style: italic; color: #666;">
            ${!pfEnabled && !esicEnabled 
              ? 'Note: No PF and ESIC is deducted for now but can be in future once we are eligible. Professional Tax (PT) of ₹200 per month will be deducted.'
              : `Note: Statutory deductions including ${[pfEnabled ? 'PF' : '', esicEnabled ? 'ESIC' : '', 'PT', 'TDS'].filter(Boolean).join(', ')} will be applicable as per government norms.`
            }
          </p>
        ` : ''}
        
        <p><strong>Venue:</strong> ${companyName.toUpperCase()}, NMIT Campus, Bengaluru</p>
        
        <p><strong>Terms and conditions:</strong></p>
        <div style="white-space: pre-line;">${terms}</div>
        
        <p style="font-style: italic;">This offer is valid for a period of 7 days from the date mentioned above.</p>
        
        <p><strong>What to Bring:</strong> Signed copy of this letter, NDA Agreement, ID documents copy (for records).</p>
        
        <p>Please sign and return the duplicate copy of this letter as confirmation of your acceptance.</p>
        
        <p>We are excited to have you onboard and look forward to your valuable contributions to our research and development initiatives.</p>
        
        <p>Warm regards,</p>
        <p><strong>For ${companyName.toUpperCase()}</strong></p>
        <p style="margin-top: 40px;">__________________________<br/><strong>Nikhil U (Founding Partner)</strong></p>
        
        <hr style="margin-top: 40px;"/>
        
        <p><strong>Acknowledgement by ${roleTerms.term}</strong></p>
        <p>Signature: __________________________</p>
        <p><strong>Name:</strong> ${formData.name || '[Candidate Name]'}</p>
        <p>Date: __________________________</p>
      </div>
    `;
  };

  const handleGeneratePDF = async () => {
    if (!formData.name || !formData.position) {
      showToast('Please fill in candidate name and position', 'error');
      return;
    }

    setGenerating(true);

    try {
      // Save candidate to pending list first
      const saveRes = await fetch('/api/pending-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          position: formData.position,
          department: formData.department,
          joining_date: formData.joining_date,
          end_date: formData.end_date || undefined,
          annual_ctc: formData.no_ctc ? 0 : parseFloat(formData.annual_ctc) || 0,
          reporting_to: formData.reporting_to,
          responsibilities,
          employee_type: formData.employee_type,
          no_ctc: formData.no_ctc
        })
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save candidate to pending list');
      }

      const saveData = await saveRes.json();
      showToast(`Candidate ${formData.name} added to pending list`, 'success');

      // Then generate the PDF
      await downloadOfferLetter({
        companyName,
        data: {
          name: formData.name,
          address: formData.address,
          position: formData.position,
          department: formData.department,
          joining_date: formData.joining_date,
          end_date: formData.end_date || undefined,
          annual_ctc: formData.no_ctc ? 0 : parseFloat(formData.annual_ctc) || 0,
          reporting_to: formData.reporting_to,
          responsibilities,
          terms,
          is_intern: isIntern,
          pf_enabled: pfEnabled,
          esic_enabled: esicEnabled
        }
      });

      showToast('Offer letter PDF generated successfully', 'success');
    } catch {
      showToast('Failed to save candidate or generate PDF', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Offer Letter Generator</h1>
        <p className={styles.subtitle}>Create professional offer letters with live preview</p>
      </div>

      <div className={styles.splitView}>
        {/* Form Panel */}
        <div className={styles.formPanel}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>👤 Candidate Details</h2>
            <div className={styles.formGrid}>
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <Select
                label="Employee Type"
                value={formData.employee_type}
                onChange={(e) => handleChange('employee_type', e.target.value)}
                options={[
                  { value: 'EM', label: 'Employee' },
                  { value: 'IN', label: 'Intern' },
                  { value: 'DR', label: 'Director' },
                  { value: 'VL', label: 'Volunteer' }
                ]}
              />
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
              <Input
                label="Position/Designation"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="e.g., Software Developer"
                required
              />
              <Input
                label="Department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
              />
              <Input
                label="Reports To"
                value={formData.reporting_to}
                onChange={(e) => handleChange('reporting_to', e.target.value)}
              />
              <Input
                label="Joining Date"
                type="date"
                value={formData.joining_date}
                onChange={(e) => handleChange('joining_date', e.target.value)}
              />
              {isIntern && (
                <Input
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                />
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>💰 Compensation</h2>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.no_ctc}
                onChange={(e) => handleChange('no_ctc', e.target.checked)}
              />
              <span>{isIntern ? 'No Stipend (Unpaid)' : 'No CTC'}</span>
            </label>
            {!formData.no_ctc && (
              <Input
                label={isIntern ? 'Annual Stipend' : 'Annual CTC'}
                type="number"
                value={formData.annual_ctc}
                onChange={(e) => handleChange('annual_ctc', e.target.value)}
                placeholder="e.g., 600000"
              />
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📋 Responsibilities</h2>
            <div className={styles.editorToolbar}>
              <button onClick={() => responsibilitiesEditor?.chain().focus().toggleBold().run()}>B</button>
              <button onClick={() => responsibilitiesEditor?.chain().focus().toggleItalic().run()}>I</button>
              <button onClick={() => responsibilitiesEditor?.chain().focus().toggleBulletList().run()}>•</button>
            </div>
            <div className={styles.editorWrapper}>
              <EditorContent editor={responsibilitiesEditor} />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📜 Terms & Conditions</h2>
            <div className={styles.editorToolbar}>
              <button onClick={() => termsEditor?.chain().focus().toggleBold().run()}>B</button>
              <button onClick={() => termsEditor?.chain().focus().toggleItalic().run()}>I</button>
            </div>
            <div className={styles.editorWrapper}>
              <EditorContent editor={termsEditor} />
            </div>
          </section>

          <div className={styles.actions}>
            <Button onClick={handleGeneratePDF} loading={generating}>
              📄 Generate PDF
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className={styles.previewPanel}>
          <h2 className={styles.previewTitle}>Live Preview</h2>
          <div 
            className={styles.preview}
            dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
          />
        </div>
      </div>
    </div>
  );
}

import jsPDF from 'jspdf';

interface OfferLetterData {
  name: string;
  address: string;
  date?: string;
  position: string;
  department: string;
  joining_date: string;
  end_date?: string;
  annual_ctc: number;
  reporting_to: string;
  responsibilities: string;
  terms: string;
  is_intern: boolean;
  pf_enabled: boolean;
  esic_enabled: boolean;
}

interface GenerateOfferLetterOptions {
  companyName: string;
  data: OfferLetterData;
}

// Load image as HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function generateOfferLetterPDF(options: GenerateOfferLetterOptions): Promise<jsPDF> {
  const { data } = options;
  const doc = new jsPDF();

  // Professional color palette
  const BLACK: [number, number, number] = [0, 0, 0];

  // Layout constants (A4: 210 x 297mm)
  const PAGE_W = 210;
  const LEFT = 20;
  const WIDTH = 170;
  const CONTENT_TOP = 57;
  const CONTENT_BOTTOM = 268;
  const LINE_H_11 = 5;
  const LINE_H_10 = 4.5;

  // Load letterhead background
  let bgImage: HTMLImageElement | null = null;
  try {
    bgImage = await loadImage('/letterheads/offer_letterhead.jpg');
    doc.addImage(bgImage, 'JPEG', 0, 0, PAGE_W, 297);
  } catch {
    // Continue without background
  }

  let y = CONTENT_TOP + 3;

  
  // Helper: ensure enough space, add new page with background if needed
  const ensureSpace = (needed: number) => {
    if (y + needed > CONTENT_BOTTOM) {
      doc.addPage();
      if (bgImage) doc.addImage(bgImage, 'JPEG', 0, 0, PAGE_W, 297);
      y = CONTENT_TOP;
    }
  };

  // Helper: add wrapped text with auto page breaks
  const addText = (text: string, fontSize: number, style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal', indent = 0) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.setTextColor(...BLACK);
    const maxW = WIDTH - indent;
    const lines = doc.splitTextToSize(text, maxW);
    const lineH = fontSize === 11 ? LINE_H_11 : (fontSize === 10 ? LINE_H_10 : 4);
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, LEFT + indent, y);
      y += lineH;
    }
  };

  
  const addInlineText = (segments: { text: string, style?: 'normal' | 'bold' | 'italic', fontSize?: number }[], fontSize: number = 11, indent = 0) => {
    const lineH = fontSize === 11 ? LINE_H_11 : (fontSize === 10 ? LINE_H_10 : 4);
    const maxW = WIDTH - indent;
    
    // Ensure we have space for the start
    ensureSpace(lineH);
    
    let currentX = LEFT + indent;

    segments.forEach(({ text, style = 'normal', fontSize: segFontSize }) => {
      // Apply segment specific styles
      doc.setFontSize(segFontSize || fontSize);
      doc.setFont('helvetica', style);
      doc.setTextColor(...BLACK);

      // Split by words/spaces to handle wrapping safely
      const words = text.split(/(\s+)/); 

      words.forEach((word) => {
        const wordWidth = doc.getTextWidth(word);

        // Check if this word pushes past the right margin
        if (currentX + wordWidth > LEFT + maxW) {
          y += lineH;           // Move to next line
          ensureSpace(lineH);   // Check for page break
          currentX = LEFT + indent; // Reset X to left margin
        }

        doc.text(word, currentX, y);
        currentX += wordWidth;
      });
    });

    // Advance Y for the next block of content
    y += lineH;
  };

  // Helper: add spacing
  const addSpace = (mm: number) => {
    y += mm;
  };

  // Helper: force new page with letterhead
  const newPage = () => {
    doc.addPage();
    if (bgImage) doc.addImage(bgImage, 'JPEG', 0, 0, PAGE_W, 297);
    y = CONTENT_TOP;
  };


  // ================= PAGE 1: THE OFFER LETTER =================

  // --- Logic to distinguish Intern vs Employee ---
  const jobTitle = (data.position || '').toLowerCase();
  const isIntern = jobTitle.includes('intern');
  const roleTerm = isIntern ? "Intern" : "Employee";
  const roleTermUpper = isIntern ? "INTERN" : "EMPLOYEE";
  const offerSubject = isIntern ? "Internship Offer" : "Employment Offer";
  
  // 1. TO SECTION
  addText('To:', 11, 'bold');
  addText(data.name || 'Candidate Name', 11, 'bold');
  addText(data.address || 'Bangalore, India', 11);
  addSpace(4);

  // 2. DATE
  // Define main date once
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  addText(`Date: ${data.date || today}`, 11);
  addSpace(4);

  // 3. SUBJECT
  addText(`Subject: ${offerSubject} \u2013 ${data.position || ''}`, 11, 'bold');
  addSpace(4);

  // 4. SALUTATION
  addText(`Dear ${data.name || 'Candidate'},`, 11);
  addSpace(4);

  // 5. OPENING PARAGRAPH
  const startDate = new Date(data.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const dept = data.department || 'General';
  const pos = data.position || '';
  
  const opening = `We are pleased to offer you the position of ${pos} in the ${dept} Team at NEWRRO TECH LLP, starting from ${startDate} at our NMIT Campus, Bengaluru.`;
  addText(opening, 11);
  addSpace(4);

  // 6. KEY RESPONSIBILITIES
  const rawResp = data.responsibilities;
  if (rawResp && rawResp !== 'As defined by your manager.') {
    ensureSpace(20);
    addText('Key Responsibilities:', 11, 'bold');
    
    const respList = rawResp.split('\n').filter((line: string) => line.trim());
    for (const item of respList) {
      ensureSpace(10);
      const bullet = (!item.startsWith("•") && !item.startsWith("-")) ? "\u2022 " : "";
      addText(`${bullet}${item.trim()}`, 11, 'normal', 8); // Indent 8
      addSpace(2);
    }
    addSpace(4);
  }

  // 7. CONFIRMATION
  ensureSpace(15);
  addText(`This letter confirms your acceptance of the ${offerSubject} and the Agreement, including:`, 11);
  
  const engagementType = isIntern ? "Internship" : "Full-Time Employment";
  addText(`\u2022 Engagement: ${engagementType}`, 11, 'normal', 8);
  
  if (isIntern && data.end_date) {
      const endDate = new Date(data.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      addText(`\u2022 End Date: ${endDate}`, 11, 'normal', 8);
  }
  addSpace(4);

  // 8. REPORTING DETAILS
  ensureSpace(15);
  addText('Reporting Details:', 11, 'bold');
  addText(`You will report to: ${data.reporting_to || 'Manager'}`, 11, 'normal', 8);
  addSpace(4);

  // 9. PAYMENT / CTC DETAILS
  ensureSpace(20);
  const label = isIntern ? "Stipend details:" : "Compensation / CTC details:";
  addText(label, 11, 'bold');

  if (data.annual_ctc === 0) {
    const payText = isIntern ? "No Stipend (Unpaid Internship)" : "Compensation as per contract terms.";
    addText(payText, 11, 'normal', 8);
  } else {
    // Standard CTC/Stipend case
    addText(`Annual CTC: Rs. ${data.annual_ctc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/-`, 11, 'normal', 8);
    
    // Monthly gross calculation for thresholds
    const monthlyGross = data.annual_ctc / 12;
    
    // --- DEDUCTION LOGIC ---
    if (!isIntern) {
        // Employees Only
        let note = "";
        
        // Deduction logic - as per Indian Labour Law
        const anyDeductions = data.pf_enabled || data.esic_enabled || monthlyGross > 25000;
        
        if (!anyDeductions) {
             note = "Note: No PF and ESIC is deducted for now but can be in future once we are eligible. Professional Tax (PT) of Rs. 200/- per month will be deducted as applicable.";
        } else {
            const deductions: string[] = [];
            
            // PF is applicable only if salary ≤ ₹15,000/month
            if (data.pf_enabled && monthlyGross <= 15000) {
              deductions.push("Provident Fund (PF)");
            }
            
            // ESIC is applicable only if salary ≤ ₹21,000/month
            if (data.esic_enabled && monthlyGross <= 21000) {
              deductions.push("Employee State Insurance (ESIC)");
            }
            
            // Professional Tax is applicable if monthly gross > ₹25,000
            if (monthlyGross > 25000) {
              deductions.push("Professional Tax (PT)");
            }
            
            deductions.push("TDS (Income Tax)");
            
            if (deductions.length > 1) {
              note = `Note: Statutory deductions including ${deductions.join(', ')} will be applicable as per government norms.`;
            } else {
              note = `Note: ${deductions[0]} deduction will be applicable as per government norms.`;
            }
        }
        
        // Render note in smaller italic font
        addText(note, 10, 'italic', 8);
    }
  }
  addSpace(6);

  // 10. VENUE
  ensureSpace(10);
  addInlineText([
    { text: 'Venue: ', style: 'bold' },
    { text: 'NEWRRO TECH LLP, NMIT Campus, Bengaluru' }
  ]);
  addSpace(6);

  // 11. TERMS AND CONDITIONS
  ensureSpace(20);
  addText('Terms and conditions:', 11, 'bold');
  
  const rawTerms = data.terms;
  if (rawTerms) {
    const termsList = rawTerms.split('\n\n').filter((line: string) => line.trim());
    for (const item of termsList) {
      ensureSpace(10);
      // Plain text, no bullets
      addText(item.trim(), 11);
      addSpace(4);
    }
  } else {
    addText("As per standard company policy.", 11);
  }

  // --- VALIDITY LINE (ITALIC) ---
  ensureSpace(10);
  addText("This offer is valid for a period of 7 days from the date mentioned above.", 11, 'italic');
  addSpace(6);

  // 12. WHAT TO BRING
  ensureSpace(15);
  addInlineText([
    { text: 'What to Bring: ', style: 'bold' },
    { text: 'Signed copy of this letter, NDA Agreement, ID documents copy (for records).' }
  ]);
  addSpace(6);

  // 13. CLOSING
  ensureSpace(20);
  addText('Please sign and return the duplicate copy of this letter as confirmation of your acceptance.', 11);
  addSpace(2);
  addText('We are excited to have you onboard and look forward to your valuable contributions to our research and development initiatives.', 11);
  addSpace(8);

  // 14. SIGNATURES (Company)
  ensureSpace(45);
  addText('Warm regards,', 11);
  addSpace(4);
  addText('For NEWRRO TECH LLP', 11, 'bold');
  addSpace(15);
  addText('__________________________', 11);
  addSpace(2);
  addText('Nikhil U (Founding Partner)', 11, 'bold');
  addSpace(10);

  // 15. ACKNOWLEDGEMENT (Candidate)
  ensureSpace(35);
  addText(`Acknowledgement by ${roleTerm}`, 11, 'bold');
  addSpace(6);
  addText('Signature: __________________________', 11);
  addSpace(4);
  addText(`Name: ${data.name || ''}`, 11, 'bold');
  addSpace(4);
  addText('Date: __________________________', 11);


  // =================== PAGE 2: NDA AGREEMENT ===================
  newPage();

  // --- NDA TITLE ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('NON-DISCLOSURE AND NON-COMPETE AGREEMENT', PAGE_W / 2, y, { align: 'center' });
  y += 12;

  // --- PREAMBLE ---
  addText('This Agreement is made and entered into as of the Effective Date (defined below) by and between:', 11);
  addSpace(6);

  // --- PARTIES: COMPANY ---
  addText('NEWRRO TECH LLP', 11, 'bold');
  addSpace(1);

  addInlineText([
    { text: ', a limited liability partnership registered under the laws of India, having its principal place of business at ' },
    { text: '6429, NITTE Meenakshi College Rd, BSF Campus, Yelahanka, Bengaluru, Govindapura, Karnataka 560064, India. GSTIN: 29AAWFN0005A1ZK', style: 'bold' },
    { text: ' (hereinafter referred to as the "Company").' }
  ]);

  addSpace(6);

  // --- AND ---
  ensureSpace(10);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('AND', PAGE_W / 2, y, { align: 'center' });
  y += LINE_H_11;
  addSpace(4);

  // --- PARTIES: CANDIDATE ---
  ensureSpace(10);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text(data.name || '_____________', LEFT, y);
  y += LINE_H_11;
  
  const candidateAddress = data.address || 'Bangalore, India';
  addSpace(1);

  addInlineText([
    { text: ', residing at ' },
    { text: candidateAddress, style: 'bold' },
    { text: ` hereinafter referred to as the "${roleTerm}".` }
  ]);

  addSpace(6);

  // --- WHEREAS CLAUSES ---
  ensureSpace(10);
  addText('WHEREAS:', 11, 'bold');
  addSpace(3);

  const isPaid = data.annual_ctc > 0;
  const whereasPoints = [
    `The ${roleTerm} has been offered an ${!isPaid && isIntern ? 'unpaid ' : ''}${roleTerm.toLowerCase()}ship opportunity by the Company to gain experience in robotics, automation, and related fields.`,
    `During the course of the ${roleTerm.toLowerCase()}ship, the ${roleTerm} will have access to confidential and proprietary information of the Company.`,
    'The Company wishes to protect its trade secrets, proprietary technologies, intellectual property, and business interests.',
    `The ${roleTerm} acknowledges that the Company's business operations, clients, partners, and projects involve sensitive and proprietary information.`
  ];
  
  for (const point of whereasPoints) {
    ensureSpace(10);
    addText(`\u2022 ${point}`, 11, 'normal', 8); 
    addSpace(2);
  }
  addSpace(4);

  addText(`NOW, THEREFORE, in consideration of the ${roleTerm.toLowerCase()}ship opportunity and access to confidential information, the Parties agree as follows:`, 11);
  addSpace(8);

  // --- 1. DEFINITIONS ---
  ensureSpace(10);
  addText('1. DEFINITIONS', 11, 'bold');
  addSpace(4);

  // 1.1 Confidential Information
  ensureSpace(10);
  addText('1.1 "Confidential Information"', 11, 'bold');
  addSpace(2);
  addText('Confidential Information includes, but is not limited to:', 11);
  addSpace(2);

  const confList = [
    'Business plans, marketing strategies, and financial information;',
    'Technical knowledge, inventions, designs, algorithms, software, hardware, prototypes, and research data;',
    'Client details, vendor contracts, and business relationships;',
    'Unpublished patents, copyrights, and trade secrets;',
    'Any non-public discussions, presentations, reports, or documentation shared by the Company;',
    'Any information marked as confidential or reasonably understood to be confidential in nature.'
  ];
  for (const item of confList) {
    ensureSpace(8);
    addText(`\u2022 ${item}`, 11, 'normal', 8);
    addSpace(1);
  }
  addSpace(4);

  // 1.2 Non-Compete Activities
  ensureSpace(10);
  addText('1.2 "Non-Compete Activities"', 11, 'bold');
  addSpace(2);
  addText('The term "Non-Compete Activities" includes:', 11);
  addSpace(2);

  const nonCompeteList = [
    `Working, ${roleTerm.toLowerCase()}ing, consulting, advising, or engaging in any capacity with a competitor of the Company in the fields of robotics, automation, artificial intelligence, or any other field in which the Company operates, during and after the ${roleTerm.toLowerCase()}ship period.`,
    'Developing or attempting to develop products, services, or intellectual property that compete with the Company\'s work.',
    'Soliciting or attempting to solicit the Company\'s clients, employees, interns, or business partners.'
  ];
  for (const item of nonCompeteList) {
    ensureSpace(10);
    addText(`\u2022 ${item}`, 11, 'normal', 8);
    addSpace(2);
  }
  addSpace(4);

  // 1.3 Period
  ensureSpace(10);
  addText(`1.3 "${roleTerm}ship Period"`, 11, 'bold');
  addSpace(2);
  addText(`The duration of the ${roleTerm.toLowerCase()}ship as mutually agreed upon in the offer letter. If the ${roleTerm} voluntarily terminates the engagement before the agreed period, the confidentiality, intellectual property, and non-compete obligations shall remain enforceable.`, 11);
  addSpace(4);

  // 1.4 Effective Date
  ensureSpace(10);
  addText('1.4 "Effective Date"', 11, 'bold');
  addSpace(2);
  addText(`The date on which the ${roleTerm} signs this Agreement.`, 11);
  addSpace(8);

  // --- 2. NON-DISCLOSURE OBLIGATIONS ---
  ensureSpace(10);
  addText('2. NON-DISCLOSURE OBLIGATIONS', 11, 'bold');
  addSpace(4);

  // 2.1
  ensureSpace(10);
  addText('2.1 Obligation to Maintain Confidentiality', 11, 'bold');
  addSpace(2);
  addText(`The ${roleTerm} agrees to:`, 11);
  addSpace(2);

  const obligations = [
    'Keep all confidential information strictly confidential and not disclose it to any third party without prior written consent.',
    `Use the confidential information solely for the purpose of the ${roleTerm.toLowerCase()}ship and not for personal or commercial benefit.`,
    'Take all reasonable measures to prevent unauthorized access, disclosure, or use.'
  ];
  for (const ob of obligations) {
    ensureSpace(8);
    addText(`\u2022 ${ob}`, 11, 'normal', 8);
    addSpace(2);
  }
  addSpace(3);

  // 2.2
  ensureSpace(10);
  addText('2.2 Exceptions to Confidentiality', 11, 'bold');
  addSpace(2);
  addText('The obligations shall not apply to information that is publicly available, lawfully obtained from a third party, or required to be disclosed by law.', 11);
  addSpace(4);

  // 2.3
  ensureSpace(10);
  addText('2.3 Return or Destruction of Materials', 11, 'bold');
  addSpace(2);
  addText(`Upon termination or completion, the ${roleTerm} shall return all materials, delete electronic copies, and provide written confirmation if requested.`, 11);
  addSpace(8);

  // --- 3. NON-COMPETE OBLIGATIONS ---
  ensureSpace(10);
  addText('3. NON-COMPETE OBLIGATIONS', 11, 'bold');
  addSpace(4);

  // 3.1
  ensureSpace(10);
  addText(`3.1 Restrictions During the ${roleTerm}ship`, 11, 'bold');
  addSpace(2);
  addText(`During the period, the ${roleTerm} agrees not to engage in competing business, develop competing products, or accept offers from competitors without approval.`, 11);
  addSpace(4);

  // 3.2
  ensureSpace(10);
  addText(`3.2 Post-${roleTerm}ship Non-Compete`, 11, 'bold');
  addSpace(2);
  addText(`For a period of 12 months after completion/termination, the ${roleTerm} agrees not to work with competitors in robotics/AI, develop competing technology, or solicit Company clients/staff.`, 11);
  addSpace(4);

  // 3.3
  ensureSpace(10);
  addText('3.3 Geographic Scope', 11, 'bold');
  addSpace(2);
  addText('The restrictions apply globally due to the nature of the business.', 11);
  addSpace(8);

  // --- 4. INTELLECTUAL PROPERTY RIGHTS ---
  ensureSpace(10);
  addText('4. INTELLECTUAL PROPERTY RIGHTS', 11, 'bold');
  addSpace(3);
  addText(`Any IP created by the ${roleTerm} during the ${roleTerm.toLowerCase()}ship relating to Company business is the sole property of the Company. The ${roleTerm} agrees to assign all rights to the Company.`, 11);
  addSpace(8);

  // --- 5. DISPUTE RESOLUTION ---
  ensureSpace(10);
  addText('5. DISPUTE RESOLUTION & GOVERNING LAW', 11, 'bold');
  addSpace(3);
  addText('Governed by laws of India. Exclusive jurisdiction of courts in Bengaluru, Karnataka. Disputes resolved via Arbitration in Bengaluru.', 11);
  addSpace(8);

  // --- 6. CONSEQUENCES OF BREACH ---
  ensureSpace(10);
  addText('6. CONSEQUENCES OF BREACH', 11, 'bold');
  addSpace(3);
  addText(`Any breach makes the ${roleTerm} liable for damages, legal costs, and injunctive relief. Obligations survive termination.`, 11);
  addSpace(8);

  // --- 7. SIGNATURES ---
  ensureSpace(10);
  addText('7. SIGNATURES', 11, 'bold');
  addSpace(3);
  addText(`By signing below, the ${roleTerm} acknowledges that they have read, understood, and agreed to the terms.`, 11);
  addSpace(8);

  // -- COMPANY SIGNATURE BLOCK --
  ensureSpace(50); 
  addText('FOR THE COMPANY:', 11, 'bold');
  addSpace(3);
  addText('Authorized Representative: Nikhil U', 11);
  addSpace(2);
  addText('Title: Founding Partner', 11);
  addSpace(15);
  addText('Signature: ______________________', 11);
  addSpace(3);
  const ndaSignatureDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  addText(`Date: ${ndaSignatureDate}`, 11);
  addSpace(10);

  // -- CANDIDATE SIGNATURE BLOCK --
  ensureSpace(50);
  addText(`FOR THE ${roleTermUpper}:`, 11, 'bold');
  addSpace(3);
  addText(`${roleTerm}'s Full Name: ${data.name || ''}`, 11, 'bold');
  addSpace(15);
  addText('Signature: ______________________', 11);
  addSpace(3);
  addText('Date: ______________________', 11);

  // -- INTERN FOOTER NOTE --
  if (isIntern) {
    addSpace(6);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text('* Internship End Date to be filled if not specified in Terms.', PAGE_W / 2, y, { align: 'center' });
    y += 4;
  }

  // -- GENERATED TIMESTAMP --
  addSpace(6);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  const timestamp = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Generated: ${timestamp}`, PAGE_W / 2, y, { align: 'center' });

  return doc;
}

export async function downloadOfferLetter(options: GenerateOfferLetterOptions): Promise<void> {
  const doc = await generateOfferLetterPDF(options);
  const filename = `offer_letter_${options.data.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

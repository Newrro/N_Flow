import jsPDF from 'jspdf';

interface EmployeeInfo {
  emp_id: string;
  name: string;
  designation: string;
  pan: string;
  bank_account: string;
  ifsc: string;
  department?: string;
  date_of_joining?: string;
}

interface Earnings {
  basic: number;
  bonus: number;
}

interface Deductions {
  lop_days: number;
  lop_amount: number;
  pt: number;
  tds: number;
  pf: number;
  esic: number;
}

interface Summary {
  gross: number;
  total_deductions: number;
  net_pay: number;
}

export interface SalarySlipOptions {
  companyName: string;
  month: string;
  employee: EmployeeInfo;
  earnings: Earnings;
  deductions: Deductions;
  summary: Summary;
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

// Number to words (Indian format)
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanHundred = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  };

  const convertLessThanThousand = (n: number): string => {
    if (n < 100) return convertLessThanHundred(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanHundred(n % 100) : '');
  };

  let result = '';

  if (num >= 10000000) {
    result += convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertLessThanHundred(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertLessThanHundred(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertLessThanThousand(num);
  }

  return result.trim();
}

export async function generateSalarySlipPDF(options: SalarySlipOptions): Promise<void> {
  const { month, employee, earnings, deductions, summary } = options;
  const doc = new jsPDF();

  // Professional color palette (matching main.py)
  const DARK_BLUE: [number, number, number] = [0, 51, 102];
  const BLACK: [number, number, number] = [0, 0, 0];
  const WHITE: [number, number, number] = [255, 255, 255];
  const GRAY: [number, number, number] = [100, 100, 100];
  const BORDER: [number, number, number] = [180, 180, 180];

  // Layout constants (A4: 210 x 297mm)
  const PAGE_W = 210;
  const LEFT = 20;
  const WIDTH = 170; // 190 - 20
  const CONTENT_TOP = 57;
  const ROW_H = 8;

  // Load letterhead background
  try {
    const bgImage = await loadImage('/letterheads/salary_letterhead.jpg');
    doc.addImage(bgImage, 'JPEG', 0, 0, PAGE_W, 297);
  } catch {
    // Continue without letterhead background
  }

  // Format number in Indian format
  const fmtNum = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let y = CONTENT_TOP + 3;

  // ========== 1. TITLE ==========
  doc.setFontSize(16);
  doc.setTextColor(...DARK_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', PAGE_W / 2, y, { align: 'center' });
  y += 10;

  // ========== 2. PERIOD ==========
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'normal');
  doc.text(`For the period of: ${month}`, PAGE_W / 2, y, { align: 'center' });
  y += 10;

  // ========== 3. EMPLOYEE SUMMARY TABLE (4 rows x 4 cols) ==========
  const SUMMARY_COLS = [35, 50, 35, 50];

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  // Mask bank account: show last 3 digits, star the rest
  const maskBankAccount = (acc: string): string => {
    if (!acc) return '';
    if (acc.length <= 3) return acc;
    return '*'.repeat(acc.length - 3) + acc.slice(-3);
  };

  const summaryRows = [
    ['Employee Name', employee.name, 'Employee ID', employee.emp_id],
    ['Designation', employee.designation, 'Department', employee.department || ''],
    ['Date of Joining', employee.date_of_joining || '', 'PAN Number', employee.pan || ''],
    ['Bank Account', maskBankAccount(employee.bank_account), 'Generated On', today],
  ];

  doc.setDrawColor(...BORDER);
  for (let r = 0; r < summaryRows.length; r++) {
    let x = LEFT;
    for (let c = 0; c < 4; c++) {
      const w = SUMMARY_COLS[c];
      const cellY = y + r * ROW_H;

      doc.rect(x, cellY, w, ROW_H);

      doc.setFontSize(10);
      doc.setTextColor(...BLACK);
      if (c === 0 || c === 2) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      doc.text(summaryRows[r][c], x + 3, cellY + 5.5);
      x += w;
    }
  }
  y += summaryRows.length * ROW_H + 8;

  // ========== 4. FINANCIALS TABLE (Earnings vs Deductions) ==========
  const FIN_COLS = [50, 35, 50, 35];

  // Build earnings list
  const earnItems = [
    { label: 'Basic & Allowances', value: earnings.basic },
  ];
  if (earnings.bonus > 0) {
    earnItems.push({ label: 'OT / Bonus', value: earnings.bonus });
  }

  // Build deductions list
  const dedItems: { label: string; value: number }[] = [];
  if (deductions.lop_days > 0) {
    dedItems.push({ label: `LOP (${deductions.lop_days} days)`, value: deductions.lop_amount });
  }
  if (deductions.pt > 0) {
    dedItems.push({ label: 'Professional Tax', value: deductions.pt });
  }
  if (deductions.tds > 0) {
    dedItems.push({ label: 'TDS (Income Tax)', value: deductions.tds });
  }
  if (deductions.pf > 0) {
    dedItems.push({ label: 'Provident Fund', value: deductions.pf });
  }
  if (deductions.esic > 0) {
    dedItems.push({ label: 'ESIC', value: deductions.esic });
  }

  const totalEarn = earnings.basic + earnings.bonus;
  const totalDed = deductions.lop_amount + deductions.pt + deductions.tds + deductions.pf + deductions.esic;

  // Header row (dark blue background, white text)
  const hdrs = ['EARNINGS', 'AMOUNT (Rs. )', 'DEDUCTIONS', 'AMOUNT (Rs. )'];
  let x = LEFT;
  for (let c = 0; c < 4; c++) {
    doc.setFillColor(...DARK_BLUE);
    doc.rect(x, y, FIN_COLS[c], ROW_H, 'F');
    doc.setDrawColor(...DARK_BLUE);
    doc.rect(x, y, FIN_COLS[c], ROW_H);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);

    if (c === 1 || c === 3) {
      doc.text(hdrs[c], x + FIN_COLS[c] - 3, y + 5.5, { align: 'right' });
    } else {
      doc.text(hdrs[c], x + 3, y + 5.5);
    }
    x += FIN_COLS[c];
  }
  y += ROW_H;

  // Data rows
  const maxDataRows = Math.max(earnItems.length, dedItems.length, 4);
  for (let i = 0; i < maxDataRows; i++) {
    x = LEFT;
    doc.setDrawColor(...BORDER);
    for (let c = 0; c < 4; c++) {
      doc.rect(x, y, FIN_COLS[c], ROW_H);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...BLACK);

      if (c === 0 && earnItems[i]) {
        // Column 0: Earnings Label
        doc.text(earnItems[i].label, x + 3, y + 5.5);
      } else if (c === 1 && earnItems[i]) {
        // Column 1: Earnings Amount (Added '/-')
        doc.text(fmtNum(earnItems[i].value) + '/-', x + FIN_COLS[c] - 3, y + 5.5, { align: 'right' });
      } else if (c === 2 && dedItems[i]) {
        // Column 2: Deductions Label
        doc.text(dedItems[i].label, x + 3, y + 5.5);
      } else if (c === 3 && dedItems[i]) {
        // Column 3: Deductions Amount (Added '/-')
        doc.text(fmtNum(dedItems[i].value) + '/-', x + FIN_COLS[c] - 3, y + 5.5, { align: 'right' });
      }
      x += FIN_COLS[c];
    }
    y += ROW_H;
  }

  // Totals row (bold)
  x = LEFT;
  doc.setDrawColor(...BORDER);
  for (let c = 0; c < 4; c++) {
    doc.rect(x, y, FIN_COLS[c], ROW_H);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);

    if (c === 0) doc.text('Total Earnings', x + 3, y + 5.5);
    else if (c === 1) doc.text(`Rs.  ${fmtNum(totalEarn)}/-`, x + FIN_COLS[c] - 3, y + 5.5, { align: 'right' });
    else if (c === 2) doc.text('Total Deductions', x + 3, y + 5.5);
    else if (c === 3) doc.text(`Rs.  ${fmtNum(totalDed)}/-`, x + FIN_COLS[c] - 3, y + 5.5, { align: 'right' });

    x += FIN_COLS[c];
  }
  y += ROW_H + 10;

  // ========== 5. NET PAY SECTION ==========
  const halfW = WIDTH / 2;

  doc.setDrawColor(...BORDER);
  doc.rect(LEFT, y, halfW, 12);
  doc.rect(LEFT + halfW, y, halfW, 12);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('NET SALARY PAYABLE', LEFT + halfW / 2, y + 8, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(...DARK_BLUE);
  doc.text(`Rs.  ${fmtNum(summary.net_pay)}/-`, LEFT + halfW + halfW / 2, y + 8, { align: 'center' });
  y += 20;

  // ========== 6. AMOUNT IN WORDS ==========
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text(
    `Amount in words: ${numberToWords(Math.round(summary.net_pay))} Rupees Only`,
    PAGE_W / 2, y, { align: 'center' }
  );
  y += 12;

  // ========== 7. FOOTER NOTE ==========
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text(
    '* This is a system-generated payslip and does not require a physical signature.',
    PAGE_W / 2, y, { align: 'center' }
  );

  // Download
  const filename = `salary_slip_${employee.emp_id}_${month.replace(' ', '_')}.pdf`;
  doc.save(filename);
}

// Legacy interface support
interface LegacySalarySlipData {
  emp_id: string;
  name: string;
  designation: string | null;
  department: string | null;
  date_of_joining: string;
  pan: string;
  month: string;
  gross: number;
  pt: number;
  tds: number;
  pf: number;
  esic: number;
  net_pay: number;
  generated_date: string;
}

interface LegacyGenerateSalarySlipOptions {
  companyName: string;
  data: LegacySalarySlipData;
}

export async function downloadSalarySlip(options: LegacyGenerateSalarySlipOptions): Promise<void> {
  const { companyName, data } = options;

  await generateSalarySlipPDF({
    companyName,
    month: data.month,
    employee: {
      emp_id: data.emp_id,
      name: data.name,
      designation: data.designation || 'Employee',
      pan: data.pan,
      bank_account: '',
      ifsc: '',
      department: data.department || undefined,
      date_of_joining: data.date_of_joining,
    },
    earnings: {
      basic: data.gross,
      bonus: 0
    },
    deductions: {
      lop_days: 0,
      lop_amount: 0,
      pt: data.pt,
      tds: data.tds,
      pf: data.pf,
      esic: data.esic
    },
    summary: {
      gross: data.gross,
      total_deductions: data.pt + data.tds + data.pf + data.esic,
      net_pay: data.net_pay
    }
  });
}

export async function downloadAllSalarySlips(companyName: string, slips: LegacySalarySlipData[]): Promise<void> {
  for (const slip of slips) {
    await downloadSalarySlip({ companyName, data: slip });
  }
}

/**
 * Payroll calculation functions - exact port from Python main.py
 * All rounding uses Math.round(x * 100) / 100 to match Python's round(x, 2)
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Professional Tax calculation - State specific with salary thresholds
 * As per Indian Labour Law:
 * - Maharashtra: ₹0 if ≤₹7500, ₹175 if ₹7501-10000, ₹200 if >₹10000
 * - Karnataka: ₹0 if ≤₹25000, ₹200 if >₹25000
 * - Tamil Nadu: ₹0 if ≤₹21000, ₹200 if >₹21000
 * - Delhi: ₹0 (No Professional Tax)
 * - Gujarat: ₹0 if ≤₹10000, ₹200 if >₹10000
 * - West Bengal: ₹0 if ≤₹15000, ₹200 if >₹15000
 * 
 * Note: ₹25,000 threshold is used for some states as a common threshold
 * PT is deducted only if monthly gross > ₹25,000 for certain states
 */
export function calculatePT(state: string, gross: number): number {
  // PT is not applicable if gross is ≤ ₹25,000 (as per user requirement)
  if (gross <= 25000) {
    return 0;
  }
  
  // For salaries above ₹25,000, apply state-specific rules
  if (state === 'Maharashtra') {
    // Maharashtra has its own slabs, apply ₹200 for >₹10,000
    // But since gross > ₹25,000, PT = ₹200
    return 200;
  } else if (state === 'Karnataka') {
    return 200;
  } else if (state === 'Tamil Nadu') {
    return 200;
  } else if (state === 'Delhi') {
    return 0;
  } else if (state === 'Gujarat') {
    return 200;
  } else if (state === 'West Bengal') {
    return 200;
  }

  // For any other state: No PT or ₹200 if gross > ₹25,000
  return 200;
}

/**
 * Full TDS calculation with new/old regime based on Annual CTC
 * Port of calculate_tds() from main.py lines 1360-1402
 */
export function calculateTDS(annualCtc: number, regime: 'NEW' | 'OLD'): number {
  // Standard deduction based on regime
  const stdDeduction = regime === 'NEW' ? 75000 : 50000;

  // Calculate taxable income
  const taxable = Math.max(annualCtc - stdDeduction, 0);

  let annualTax = 0;

  if (regime === 'NEW') {
    // FY 2024-25 New Tax Regime (7 slabs)
    if (taxable <= 400000) {
      annualTax = 0;
    } else if (taxable <= 800000) {
      annualTax = (taxable - 400000) * 0.05;
    } else if (taxable <= 1200000) {
      annualTax = 20000 + (taxable - 800000) * 0.10;
    } else if (taxable <= 1600000) {
      annualTax = 60000 + (taxable - 1200000) * 0.15;
    } else if (taxable <= 2000000) {
      annualTax = 120000 + (taxable - 1600000) * 0.20;
    } else if (taxable <= 2400000) {
      annualTax = 200000 + (taxable - 2000000) * 0.25;
    } else {
      annualTax = 300000 + (taxable - 2400000) * 0.30;
    }
  } else {
    // Old Tax Regime (5 slabs)
    if (taxable <= 250000) {
      annualTax = 0;
    } else if (taxable <= 500000) {
      annualTax = (taxable - 250000) * 0.05;
    } else if (taxable <= 1000000) {
      annualTax = 12500 + (taxable - 500000) * 0.20;
    } else if (taxable <= 1500000) {
      annualTax = 112500 + (taxable - 1000000) * 0.30;
    } else {
      annualTax = 262500 + (taxable - 1500000) * 0.45;
    }
  }

  // Add 4% health and education cess
  annualTax = annualTax * 1.04;

  // Return monthly TDS (divide by 12)
  const monthlyTds = round2(annualTax / 12);
  return monthlyTds;
}

/**
 * Calculate PF (Provident Fund)
 * PF = gross * 12% when (pfEnabled OR activeCount >= 20) AND gross <= 15000
 */
export function calculatePF(
  gross: number,
  pfEnabled: boolean,
  activeEmployeeCount: number
): number {
  const pfApplicable = (pfEnabled || activeEmployeeCount >= 20) && gross <= 15000;
  if (!pfApplicable) return 0;
  return round2(gross * 0.12);
}

/**
 * Check if PF is applicable
 */
export function isPFApplicable(
  gross: number,
  pfEnabled: boolean,
  activeEmployeeCount: number
): boolean {
  return (pfEnabled || activeEmployeeCount >= 20) && gross <= 15000;
}

/**
 * Calculate ESIC (Employee State Insurance Corporation)
 * ESIC = gross * 0.75% when esicEnabled AND gross <= 21000
 */
export function calculateESIC(
  gross: number,
  esicEnabled: boolean
): number {
  if (!esicEnabled || gross > 21000) return 0;
  return round2(gross * 0.0075);
}

/**
 * Check if ESIC is applicable
 */
export function isESICApplicable(
  gross: number,
  esicEnabled: boolean
): boolean {
  return esicEnabled && gross <= 21000;
}

/**
 * Calculate net pay
 * Net Pay = Gross - PT - TDS - PF - ESIC
 */
export function calculateNetPay(
  gross: number,
  pt: number,
  tds: number,
  pf: number,
  esic: number
): number {
  return round2(gross - pt - tds - pf - esic);
}

/**
 * Calculate LOP (Loss of Pay) deduction
 * LOP Deduction = LOP days × (monthly salary / 30)
 */
export function calculateLOPDeduction(monthlyGross: number, lopDays: number): number {
  if (lopDays <= 0) return 0;
  const perDaySalary = monthlyGross / 30;
  return round2(lopDays * perDaySalary);
}

/**
 * Full payroll calculation for a single employee
 */
export function calculateEmployeePayroll(params: {
  annualCtc: number;
  state: string;
  taxRegime: 'NEW' | 'OLD';
  pfEnabled: boolean;
  esicEnabled: boolean;
  activeEmployeeCount: number;
  lopDays?: number;
  bonusAmount?: number;
}) {
  const { 
    annualCtc, state, taxRegime, pfEnabled, esicEnabled, activeEmployeeCount,
    lopDays = 0, bonusAmount = 0
  } = params;

  const monthlyGross = round2(annualCtc / 12);
  
  // Calculate LOP deduction
  const lopDeduction = calculateLOPDeduction(monthlyGross, lopDays);
  
  // Adjusted gross = Monthly Gross - LOP Deduction + Bonus
  const adjustedGross = round2(monthlyGross - lopDeduction + bonusAmount);
  
  // Calculate deductions based on adjusted gross
  const pt = calculatePT(state, adjustedGross);
  const tds = calculateTDS(annualCtc, taxRegime); // TDS is based on annual CTC
  const pf = calculatePF(adjustedGross, pfEnabled, activeEmployeeCount);
  const esic = calculateESIC(adjustedGross, esicEnabled);
  
  // Net Pay = Adjusted Gross - Deductions
  const netPay = calculateNetPay(adjustedGross, pt, tds, pf, esic);

  return {
    monthlyGross,
    lopDays,
    lopDeduction,
    bonusAmount,
    adjustedGross,
    pt,
    tds,
    pf,
    esic,
    netPay,
    pfApplicable: isPFApplicable(adjustedGross, pfEnabled, activeEmployeeCount),
    esicApplicable: isESICApplicable(adjustedGross, esicEnabled),
  };
}

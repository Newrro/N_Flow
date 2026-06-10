import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';
import { calculateEmployeePayroll } from '@/lib/calculations';

interface EmployeeAdjustment {
  emp_id: string;
  lop_days: number;
  lop_reason: string;
  bonus_amount: number;
  bonus_reason: string;
}

// POST /api/payroll/calculate - Calculate payroll for a month
export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();
    
    const { month, year, adjustments } = body as {
      month: string;
      year: string;
      adjustments?: EmployeeAdjustment[];
    };
    
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }
    
    const monthYear = `${month} ${year}`;
    
    // Create adjustment map for quick lookup
    const adjustmentMap = new Map<string, { 
      lopDays: number; 
      lopReason: string;
      bonusAmount: number;
      bonusReason: string;
    }>();
    if (adjustments) {
      for (const adj of adjustments) {
        adjustmentMap.set(adj.emp_id, {
          lopDays: adj.lop_days || 0,
          lopReason: adj.lop_reason || '',
          bonusAmount: adj.bonus_amount || 0,
          bonusReason: adj.bonus_reason || ''
        });
      }
    }
    
    // Get active employee count
    const countResult = await db.execute(
      'SELECT COUNT(*) as count FROM employees WHERE active = 1'
    );
    const activeCount = Number(countResult.rows[0].count);
    
    if (activeCount === 0) {
      return NextResponse.json(
        { error: 'No active employees found' },
        { status: 400 }
      );
    }
    
    // Get config
    const configResult = await db.execute('SELECT key, value FROM config');
    const config: Record<string, string> = {};
    for (const row of configResult.rows) {
      config[row.key as string] = row.value as string;
    }
    const pfEnabled = config['pf_enabled'] === '1';
    const esicEnabled = config['esic_enabled'] === '1';
    
    // Delete ALL existing records for this month (allows recalculation even if finalized)
    await db.execute({
      sql: 'DELETE FROM payroll_runs WHERE month = ?',
      args: [monthYear]
    });
    
    // Get all active employees
    const employeesResult = await db.execute(
      `SELECT emp_id, name, email, phone, pan, bank_account, ifsc, state,
              date_of_joining, annual_ctc, monthly_gross, tax_regime, role,
              designation, department, no_ctc
       FROM employees WHERE active = 1`
    );
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const results: Array<{
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
    }> = [];
    const warnings: string[] = [];
    
    for (const emp of employeesResult.rows) {
      const empId = emp.emp_id as string;
      const name = emp.name as string;
      const state = emp.state as string;
      const annualCtc = Number(emp.annual_ctc);
      const taxRegime = (emp.tax_regime as string) === 'OLD' ? 'OLD' : 'NEW';
      const pan = emp.pan as string;
      const noCTC = Number(emp.no_ctc) === 1;
      
      // Skip calculation for employees with no CTC
      if (noCTC) {
        continue;
      }
      
      // Get adjustments for this employee
      const adj = adjustmentMap.get(empId) || { 
        lopDays: 0, 
        lopReason: '',
        bonusAmount: 0,
        bonusReason: ''
      };
      
      // Calculate payroll with LOP and bonus
      const calc = calculateEmployeePayroll({
        annualCtc,
        state,
        taxRegime,
        pfEnabled,
        esicEnabled,
        activeEmployeeCount: activeCount,
        lopDays: adj.lopDays,
        bonusAmount: adj.bonusAmount
      });
      
      // Check for warnings
      if (!pan && calc.tds > 0) {
        warnings.push(`⚠️ ${name}: PAN missing but TDS applicable!`);
      }
      
      if (adj.lopDays > 0) {
        const reasonText = adj.lopReason ? ` (${adj.lopReason})` : '';
        warnings.push(`📅 ${name}: ${adj.lopDays} LOP day(s)${reasonText} - Deduction: ₹${calc.lopDeduction.toLocaleString('en-IN')}`);
      }
      
      if (adj.bonusAmount > 0) {
        const reasonText = adj.bonusReason ? ` (${adj.bonusReason})` : '';
        warnings.push(`🎁 ${name}: OT/Bonus${reasonText} - ₹${adj.bonusAmount.toLocaleString('en-IN')}`);
      }
      
      // Insert payroll run
      await db.execute({
        sql: `INSERT INTO payroll_runs 
              (emp_id, month, annual_ctc, monthly_gross, lop_days, lop_deduction, lop_reason,
               bonus_amount, bonus_reason, adjusted_gross, pt, tds, pf, esic, net_pay, 
               status, pf_applicable, esic_applicable, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          empId,
          monthYear,
          annualCtc,
          calc.monthlyGross,
          calc.lopDays,
          calc.lopDeduction,
          adj.lopReason,
          calc.bonusAmount,
          adj.bonusReason,
          calc.adjustedGross,
          calc.pt,
          calc.tds,
          calc.pf,
          calc.esic,
          calc.netPay,
          'DRAFT',
          calc.pfApplicable ? 1 : 0,
          calc.esicApplicable ? 1 : 0,
          now
        ]
      });
      
      results.push({
        emp_id: empId,
        name,
        role: emp.role as string | null,
        designation: emp.designation as string | null,
        department: emp.department as string | null,
        pan: emp.pan as string | null,
        bank_account: emp.bank_account as string | null,
        ifsc: emp.ifsc as string | null,
        date_of_joining: emp.date_of_joining as string | null,
        annual_ctc: annualCtc,
        monthly_gross: calc.monthlyGross,
        lop_days: calc.lopDays,
        lop_deduction: calc.lopDeduction,
        lop_reason: adj.lopReason,
        bonus_amount: calc.bonusAmount,
        bonus_reason: adj.bonusReason,
        adjusted_gross: calc.adjustedGross,
        pt: calc.pt,
        tds: calc.tds,
        pf: calc.pf,
        esic: calc.esic,
        net_pay: calc.netPay,
        pf_applicable: calc.pfApplicable,
        esic_applicable: calc.esicApplicable
      });
    }
    
    return NextResponse.json({
      success: true,
      month: monthYear,
      employee_count: results.length,
      status: 'DRAFT',
      results,
      warnings
    });
  } catch (error) {
    console.error('Error calculating payroll:', error);
    return NextResponse.json(
      { error: 'Failed to calculate payroll' },
      { status: 500 }
    );
  }
}

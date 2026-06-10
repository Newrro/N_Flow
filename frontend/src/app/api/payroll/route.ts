import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// GET /api/payroll - Get payroll history (list of months)
export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    
    if (month) {
      // Get detailed payroll for a specific month
      const result = await db.execute({
        sql: `SELECT 
                p.run_id, p.emp_id, p.month, p.annual_ctc, p.monthly_gross,
                p.lop_days, p.lop_deduction, p.lop_reason, p.bonus_amount, p.bonus_reason, p.adjusted_gross,
                p.pt, p.tds, p.pf, p.esic, p.net_pay, p.status,
                p.pf_applicable, p.esic_applicable, p.created_at,
                e.name, e.designation, e.role, e.department, e.bank_account, e.ifsc, e.pan
              FROM payroll_runs p
              JOIN employees e ON p.emp_id = e.emp_id
              WHERE p.month = ?
              ORDER BY e.name`,
        args: [month]
      });
      
      const payrollRuns = result.rows.map((row) => ({
        run_id: Number(row.run_id),
        emp_id: row.emp_id as string,
        month: row.month as string,
        annual_ctc: Number(row.annual_ctc),
        monthly_gross: Number(row.monthly_gross),
        lop_days: Number(row.lop_days) || 0,
        lop_deduction: Number(row.lop_deduction) || 0,
        lop_reason: (row.lop_reason as string) || '',
        bonus_amount: Number(row.bonus_amount) || 0,
        bonus_reason: (row.bonus_reason as string) || '',
        adjusted_gross: Number(row.adjusted_gross) || Number(row.monthly_gross),
        pt: Number(row.pt),
        tds: Number(row.tds),
        pf: Number(row.pf),
        esic: Number(row.esic),
        net_pay: Number(row.net_pay),
        status: row.status as string,
        pf_applicable: Number(row.pf_applicable) === 1,
        esic_applicable: Number(row.esic_applicable) === 1,
        created_at: row.created_at as string,
        employee: {
          name: row.name as string,
          designation: row.designation as string | null,
          role: row.role as string | null,
          department: row.department as string | null,
          bank_account: row.bank_account as string,
          ifsc: row.ifsc as string,
          pan: row.pan as string
        }
      }));
      
      // Get totals
      const totalsResult = await db.execute({
        sql: `SELECT 
                COALESCE(SUM(monthly_gross), 0) as total_gross,
                COALESCE(SUM(lop_deduction), 0) as total_lop,
                COALESCE(SUM(bonus_amount), 0) as total_bonus,
                COALESCE(SUM(adjusted_gross), 0) as total_adjusted,
                COALESCE(SUM(pt), 0) as total_pt,
                COALESCE(SUM(tds), 0) as total_tds,
                COALESCE(SUM(pf), 0) as total_pf,
                COALESCE(SUM(esic), 0) as total_esic,
                COALESCE(SUM(net_pay), 0) as total_net_pay
              FROM payroll_runs WHERE month = ?`,
        args: [month]
      });
      
      const totals = totalsResult.rows[0];
      
      return NextResponse.json({
        month,
        status: payrollRuns.length > 0 ? payrollRuns[0].status : null,
        payroll_runs: payrollRuns,
        summary: {
          employee_count: payrollRuns.length,
          total_gross: Math.round(Number(totals.total_gross) * 100) / 100,
          total_lop: Math.round(Number(totals.total_lop) * 100) / 100,
          total_bonus: Math.round(Number(totals.total_bonus) * 100) / 100,
          total_adjusted: Math.round(Number(totals.total_adjusted) * 100) / 100,
          total_pt: Math.round(Number(totals.total_pt) * 100) / 100,
          total_tds: Math.round(Number(totals.total_tds) * 100) / 100,
          total_pf: Math.round(Number(totals.total_pf) * 100) / 100,
          total_esic: Math.round(Number(totals.total_esic) * 100) / 100,
          total_net_pay: Math.round(Number(totals.total_net_pay) * 100) / 100
        }
      });
    }
    
    // Get list of all months with payroll
    const monthsResult = await db.execute(`
      SELECT DISTINCT month, status, 
             COUNT(*) as employee_count,
             COALESCE(SUM(net_pay), 0) as total_net_pay,
             MIN(created_at) as created_at
      FROM payroll_runs
      GROUP BY month, status
      ORDER BY created_at DESC
    `);
    
    const months = monthsResult.rows.map((row) => ({
      month: row.month as string,
      status: row.status as string,
      employee_count: Number(row.employee_count),
      total_net_pay: Math.round(Number(row.total_net_pay) * 100) / 100,
      created_at: row.created_at as string
    }));
    
    return NextResponse.json({ months });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll' },
      { status: 500 }
    );
  }
}

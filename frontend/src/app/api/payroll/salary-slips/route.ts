import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// GET /api/payroll/salary-slips?month=<month> - Get salary slip data for a month
export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const empId = searchParams.get('emp_id');
    
    if (!month) {
      return NextResponse.json(
        { error: 'Month is required' },
        { status: 400 }
      );
    }
    
    let query = `
      SELECT 
        p.run_id, p.emp_id, p.month, p.annual_ctc, p.monthly_gross,
        p.pt, p.tds, p.pf, p.esic, p.net_pay, p.status,
        p.pf_applicable, p.esic_applicable, p.created_at,
        e.name, e.designation, e.department, e.date_of_joining, e.pan,
        e.bank_account, e.ifsc, e.employee_type
      FROM payroll_runs p
      JOIN employees e ON p.emp_id = e.emp_id
      WHERE p.month = ? AND p.status = 'FINAL'
    `;
    
    const args: (string | number)[] = [month];
    
    if (empId) {
      query += ' AND p.emp_id = ?';
      args.push(empId);
    }
    
    query += ' ORDER BY e.name';
    
    const result = await db.execute({ sql: query, args });
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No finalized payroll found for this month' },
        { status: 404 }
      );
    }
    
    // Get company name from config
    const configResult = await db.execute(
      "SELECT value FROM config WHERE key = 'company_name'"
    );
    const companyName = configResult.rows.length > 0 
      ? configResult.rows[0].value as string 
      : 'Newrro Tech LLP';
    
    const salarySlips = result.rows.map((row) => ({
      emp_id: row.emp_id as string,
      name: row.name as string,
      designation: row.designation as string | null,
      department: row.department as string | null,
      date_of_joining: row.date_of_joining as string,
      pan: row.pan as string,
      employee_type: row.employee_type as string,
      month: row.month as string,
      gross: Number(row.monthly_gross),
      pt: Number(row.pt),
      tds: Number(row.tds),
      pf: Number(row.pf),
      esic: Number(row.esic),
      net_pay: Number(row.net_pay),
      generated_date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }));
    
    return NextResponse.json({
      month,
      company_name: companyName,
      salary_slips: salarySlips
    });
  } catch (error) {
    console.error('Error fetching salary slips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary slips' },
      { status: 500 }
    );
  }
}

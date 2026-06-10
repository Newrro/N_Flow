import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// POST /api/payroll/finalize - Finalize payroll for a month
export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();
    
    const { month } = body;
    if (!month) {
      return NextResponse.json(
        { error: 'Month is required' },
        { status: 400 }
      );
    }
    
    // Check for existing DRAFT records
    const draftResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM payroll_runs WHERE month = ? AND status = 'DRAFT'",
      args: [month]
    });
    
    if (Number(draftResult.rows[0].count) === 0) {
      return NextResponse.json(
        { error: 'No draft payroll found for this month. Please calculate first.' },
        { status: 400 }
      );
    }
    
    // Update all DRAFT records to FINAL
    await db.execute({
      sql: "UPDATE payroll_runs SET status = 'FINAL' WHERE month = ? AND status = 'DRAFT'",
      args: [month]
    });
    
    // Get totals
    const totalsResult = await db.execute({
      sql: `SELECT 
              COUNT(*) as employee_count,
              COALESCE(SUM(monthly_gross), 0) as total_gross,
              COALESCE(SUM(pt), 0) as total_pt,
              COALESCE(SUM(tds), 0) as total_tds,
              COALESCE(SUM(pf), 0) as total_pf,
              COALESCE(SUM(esic), 0) as total_esic,
              COALESCE(SUM(net_pay), 0) as total_net_pay
            FROM payroll_runs WHERE month = ? AND status = 'FINAL'`,
      args: [month]
    });
    
    const totals = totalsResult.rows[0];
    
    return NextResponse.json({
      success: true,
      message: `Payroll finalized for ${month}`,
      month,
      summary: {
        employee_count: Number(totals.employee_count),
        total_gross: Math.round(Number(totals.total_gross) * 100) / 100,
        total_pt: Math.round(Number(totals.total_pt) * 100) / 100,
        total_tds: Math.round(Number(totals.total_tds) * 100) / 100,
        total_pf: Math.round(Number(totals.total_pf) * 100) / 100,
        total_esic: Math.round(Number(totals.total_esic) * 100) / 100,
        total_net_pay: Math.round(Number(totals.total_net_pay) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error finalizing payroll:', error);
    return NextResponse.json(
      { error: 'Failed to finalize payroll' },
      { status: 500 }
    );
  }
}

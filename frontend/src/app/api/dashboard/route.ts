import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

export async function GET() {
  try {
    await initDb();
    const db = getDb();

    // Active employees count
    const activeResult = await db.execute(
      'SELECT COUNT(*) as count FROM employees WHERE active = 1'
    );
    const activeEmployees = Number(activeResult.rows[0].count);

    // Total employees count
    const totalResult = await db.execute('SELECT COUNT(*) as count FROM employees');
    const totalEmployees = Number(totalResult.rows[0].count);

    // Total monthly CTC and avg CTC
    const ctcResult = await db.execute(
      'SELECT COALESCE(SUM(monthly_gross), 0) as total_monthly, COALESCE(AVG(annual_ctc), 0) as avg_ctc FROM employees WHERE active = 1 AND no_ctc = 0'
    );
    const totalMonthlyCTC = Number(ctcResult.rows[0].total_monthly);
    const avgCTC = Number(ctcResult.rows[0].avg_ctc);

    // Config
    const configResult = await db.execute('SELECT key, value FROM config');
    const config: Record<string, string> = {};
    for (const row of configResult.rows) {
      config[row.key as string] = row.value as string;
    }
    const pfEnabled = config['pf_enabled'] === '1';
    const esicEnabled = config['esic_enabled'] === '1';

    // Calculate aggregate deductions for active employees
    const employeesResult = await db.execute(
      'SELECT state, annual_ctc, monthly_gross, tax_regime FROM employees WHERE active = 1 AND no_ctc = 0 AND monthly_gross IS NOT NULL'
    );

    let totalPT = 0;
    let totalTDS = 0;
    let totalPF = 0;
    let totalESIC = 0;

    // Import calculations
    const { calculatePT, calculateTDS, calculatePF, calculateESIC } = await import('@/lib/calculations');

    for (const emp of employeesResult.rows) {
      const gross = Number(emp.monthly_gross) || 0;
      const annualCtc = Number(emp.annual_ctc) || 0;
      const state = (emp.state as string) || 'Maharashtra';
      const regime = (emp.tax_regime as string) === 'OLD' ? 'OLD' : 'NEW';

      totalPT += calculatePT(state, gross);
      totalTDS += calculateTDS(annualCtc, regime);
      totalPF += calculatePF(gross, pfEnabled, activeEmployees);
      totalESIC += calculateESIC(gross, esicEnabled);
    }

    // PF threshold warning (20+ employees)
    const pfThresholdWarning = activeEmployees >= 20 && !pfEnabled;
    // ESIC threshold warning (10+ employees)
    const esicThresholdWarning = activeEmployees >= 10 && !esicEnabled;

    // Recent salary changes
    const changesResult = await db.execute(
      `SELECT sh.emp_id, e.name, sh.change_type, sh.effective_date, sh.created_at
       FROM salary_history sh
       JOIN employees e ON sh.emp_id = e.emp_id
       ORDER BY sh.created_at DESC
       LIMIT 5`
    );

    const recentChanges = changesResult.rows.map((row) => ({
      emp_id: row.emp_id as string,
      name: row.name as string,
      change_type: row.change_type as string,
      effective_date: row.effective_date as string,
      created_at: row.created_at as string,
    }));

    return NextResponse.json({
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      total_monthly_ctc: Math.round(totalMonthlyCTC * 100) / 100,
      avg_ctc: Math.round(avgCTC * 100) / 100,
      total_pf: Math.round(totalPF * 100) / 100,
      total_esic: Math.round(totalESIC * 100) / 100,
      total_pt: Math.round(totalPT * 100) / 100,
      total_tds: Math.round(totalTDS * 100) / 100,
      pf_threshold_warning: pfThresholdWarning,
      esic_threshold_warning: esicThresholdWarning,
      recent_changes: recentChanges,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}

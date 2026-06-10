import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';
import { SalaryHistory } from '@/types/employee';

// GET /api/employees/[empId]/history - Get salary history for an employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    await initDb();
    const db = getDb();
    const { empId } = await params;
    
    const result = await db.execute({
      sql: `
        SELECT history_id, emp_id, change_type, old_salary, new_salary,
               old_designation, new_designation, old_role, new_role,
               reason, effective_date, created_by, created_at
        FROM salary_history
        WHERE emp_id = ?
        ORDER BY created_at DESC
      `,
      args: [empId]
    });
    
    const history: SalaryHistory[] = result.rows.map((row) => ({
      history_id: Number(row.history_id),
      emp_id: row.emp_id as string,
      change_type: row.change_type as 'PROMOTION' | 'DEMOTION' | 'INCREMENT' | 'DECREMENT' | 'INITIAL',
      old_salary: row.old_salary ? Number(row.old_salary) : null,
      new_salary: row.new_salary ? Number(row.new_salary) : null,
      old_designation: row.old_designation as string | null,
      new_designation: row.new_designation as string | null,
      old_role: row.old_role as string | null,
      new_role: row.new_role as string | null,
      reason: row.reason as string | null,
      effective_date: row.effective_date as string,
      created_by: row.created_by as string | null,
      created_at: row.created_at as string,
    }));
    
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching salary history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary history' },
      { status: 500 }
    );
  }
}

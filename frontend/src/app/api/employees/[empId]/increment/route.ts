import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// POST /api/employees/[empId]/increment - Increment employee salary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    await initDb();
    const db = getDb();
    const { empId } = await params;
    const body = await request.json();
    
    // Get current employee data
    const existing = await db.execute({
      sql: 'SELECT annual_ctc FROM employees WHERE emp_id = ?',
      args: [empId]
    });
    
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    const current = existing.rows[0];
    const oldSalary = Number(current.annual_ctc);
    
    // Calculate new salary based on percentage increase
    const increasePercent = body.increment_percent || 5;
    const newSalary = Math.round(oldSalary * (1 + increasePercent / 100) * 100) / 100;
    const newMonthlyGross = Math.round((newSalary / 12) * 100) / 100;
    
    const reason = body.reason || 'Salary increment';
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const effectiveDate = body.effective_date || now.slice(0, 10);
    
    // Update employee
    await db.execute({
      sql: `UPDATE employees SET annual_ctc = ?, monthly_gross = ?, updated_at = ? WHERE emp_id = ?`,
      args: [newSalary, newMonthlyGross, now, empId]
    });
    
    // Add to salary history
    await db.execute({
      sql: `INSERT INTO salary_history (
        emp_id, change_type, old_salary, new_salary, reason, effective_date, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        empId,
        'INCREMENT',
        oldSalary,
        newSalary,
        reason,
        effectiveDate,
        'Admin',
        now
      ]
    });
    
    return NextResponse.json({
      success: true,
      message: 'Salary incremented successfully',
      old_salary: oldSalary,
      new_salary: newSalary
    });
  } catch (error) {
    console.error('Error incrementing salary:', error);
    return NextResponse.json(
      { error: 'Failed to increment salary' },
      { status: 500 }
    );
  }
}

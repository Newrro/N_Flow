import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// POST /api/employees/[empId]/demote - Demote employee
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
      sql: 'SELECT annual_ctc, designation, role FROM employees WHERE emp_id = ?',
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
    const oldDesignation = current.designation as string;
    const oldRole = current.role as string;
    
    // Calculate new salary based on percentage decrease
    const decreasePercent = body.salary_decrease_percent || 10;
    const newSalary = Math.round(oldSalary * (1 - decreasePercent / 100) * 100) / 100;
    const newMonthlyGross = Math.round((newSalary / 12) * 100) / 100;
    
    const newRole = body.new_role || oldRole;
    const newDesignation = body.new_designation || oldDesignation;
    const reason = body.reason || 'Demotion';
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const effectiveDate = body.effective_date || now.slice(0, 10);
    
    // Update employee
    await db.execute({
      sql: `UPDATE employees SET
        role = ?, designation = ?, annual_ctc = ?, monthly_gross = ?, updated_at = ?
        WHERE emp_id = ?`,
      args: [newRole, newDesignation, newSalary, newMonthlyGross, now, empId]
    });
    
    // Add to salary history
    await db.execute({
      sql: `INSERT INTO salary_history (
        emp_id, change_type, old_salary, new_salary, old_designation, new_designation,
        old_role, new_role, reason, effective_date, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        empId,
        'DEMOTION',
        oldSalary,
        newSalary,
        oldDesignation,
        newDesignation,
        oldRole,
        newRole,
        reason,
        effectiveDate,
        'Admin',
        now
      ]
    });
    
    return NextResponse.json({
      success: true,
      message: 'Employee demoted successfully',
      old_salary: oldSalary,
      new_salary: newSalary,
      new_designation: newDesignation,
      new_role: newRole
    });
  } catch (error) {
    console.error('Error demoting employee:', error);
    return NextResponse.json(
      { error: 'Failed to demote employee' },
      { status: 500 }
    );
  }
}

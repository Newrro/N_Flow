import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// GET /api/employees/changes - Get all salary changes
export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    
    let query = `
      SELECT sh.history_id, sh.emp_id, e.name as employee_name,
             sh.change_type, sh.old_salary, sh.new_salary,
             sh.old_designation, sh.new_designation,
             sh.old_role, sh.new_role,
             sh.reason, sh.effective_date, sh.created_at
      FROM salary_history sh
      JOIN employees e ON sh.emp_id = e.emp_id
      ORDER BY sh.created_at DESC
    `;
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const result = await db.execute(query);
    
    const changes = result.rows.map((row) => ({
      history_id: Number(row.history_id),
      emp_id: row.emp_id as string,
      employee_name: row.employee_name as string,
      change_type: row.change_type as string,
      old_salary: row.old_salary ? Number(row.old_salary) : null,
      new_salary: row.new_salary ? Number(row.new_salary) : null,
      old_designation: row.old_designation as string | null,
      new_designation: row.new_designation as string | null,
      old_role: row.old_role as string | null,
      new_role: row.new_role as string | null,
      reason: row.reason as string | null,
      effective_date: row.effective_date as string,
      created_at: row.created_at as string,
    }));
    
    return NextResponse.json({ changes });
  } catch (error) {
    console.error('Error fetching salary changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary changes' },
      { status: 500 }
    );
  }
}

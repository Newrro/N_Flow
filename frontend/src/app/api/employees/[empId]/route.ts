import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';
import { Employee } from '@/types/employee';

// GET /api/employees/[empId] - Get single employee
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
        SELECT emp_id, name, email, phone, pan, bank_account, ifsc, state,
               date_of_joining, annual_ctc, monthly_gross, tax_regime, role,
               designation, department, address, manager_name, roles_responsibilities,
               employee_type, end_date, no_ctc, active, created_at, updated_at
        FROM employees WHERE emp_id = ?
      `,
      args: [empId]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    const row = result.rows[0];
    const employee: Employee = {
      emp_id: row.emp_id as string,
      name: row.name as string,
      email: row.email as string | null,
      phone: row.phone as string | null,
      pan: (row.pan as string) || '',
      bank_account: (row.bank_account as string) || '',
      ifsc: (row.ifsc as string) || '',
      state: (row.state as string) || 'Maharashtra',
      date_of_joining: (row.date_of_joining as string) || '',
      annual_ctc: Number(row.annual_ctc) || 0,
      monthly_gross: Number(row.monthly_gross) || 0,
      tax_regime: row.tax_regime as 'NEW' | 'OLD',
      role: row.role as string | null,
      designation: row.designation as string | null,
      department: row.department as string | null,
      address: row.address as string | null,
      manager_name: row.manager_name as string | null,
      roles_responsibilities: row.roles_responsibilities as string | null,
      employee_type: (row.employee_type as 'EM' | 'IN' | 'DR' | 'VL') || 'EM',
      end_date: row.end_date as string | null,
      no_ctc: Number(row.no_ctc) === 1,
      active: Number(row.active) === 1,
      created_at: row.created_at as string | null,
      updated_at: row.updated_at as string | null,
    };
    
    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[empId] - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    await initDb();
    const db = getDb();
    const { empId } = await params;
    const body = await request.json();
    
    // Check if employee exists
    const existing = await db.execute({
      sql: 'SELECT emp_id FROM employees WHERE emp_id = ?',
      args: [empId]
    });
    
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Calculate monthly gross from annual CTC
    const annualCtc = body.no_ctc ? 0 : Number(body.annual_ctc);
    const monthlyGross = Math.round((annualCtc / 12) * 100) / 100;
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await db.execute({
      sql: `UPDATE employees SET
        name = ?, email = ?, phone = ?, pan = ?, bank_account = ?, ifsc = ?,
        state = ?, date_of_joining = ?, annual_ctc = ?, monthly_gross = ?,
        tax_regime = ?, role = ?, designation = ?, department = ?,
        address = ?, manager_name = ?, roles_responsibilities = ?, employee_type = ?,
        end_date = ?, no_ctc = ?, updated_at = ?
        WHERE emp_id = ?`,
      args: [
        body.name,
        body.email || null,
        body.phone || null,
        body.pan.toUpperCase(),
        body.bank_account,
        body.ifsc.toUpperCase(),
        body.state || 'Maharashtra',
        body.date_of_joining,
        annualCtc,
        monthlyGross,
        body.tax_regime || 'NEW',
        body.role || null,
        body.designation,
        body.department || null,
        body.address || null,
        body.manager_name || null,
        body.roles_responsibilities || null,
        body.employee_type || 'EM',
        body.end_date || null,
        body.no_ctc ? 1 : 0,
        now,
        empId
      ]
    });
    
    return NextResponse.json({
      success: true,
      message: `Employee ${body.name} updated successfully`
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('UNIQUE constraint failed') && errorMessage.includes('pan')) {
      return NextResponse.json(
        { error: 'PAN number already exists for another employee' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[empId] - Delete employee (soft delete - deactivate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    await initDb();
    const db = getDb();
    const { empId } = await params;
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const result = await db.execute({
      sql: 'UPDATE employees SET active = 0, updated_at = ? WHERE emp_id = ?',
      args: [now, empId]
    });
    
    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate employee' },
      { status: 500 }
    );
  }
}

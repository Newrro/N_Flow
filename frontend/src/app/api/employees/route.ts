import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';
import { generateEmployeeId } from '@/lib/employee-id';
import { Employee } from '@/types/employee';

// GET /api/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    
    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    
    let query = `
      SELECT emp_id, name, email, phone, pan, bank_account, ifsc, state,
             date_of_joining, annual_ctc, monthly_gross, tax_regime, role,
             designation, department, address, manager_name, roles_responsibilities,
             employee_type, end_date, no_ctc, active, created_at, updated_at
      FROM employees
    `;
    
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    
    if (active !== null) {
      conditions.push('active = ?');
      params.push(active === 'true' ? 1 : 0);
    }
    
    if (search) {
      conditions.push('(name LIKE ? OR pan LIKE ? OR email LIKE ? OR emp_id LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY active DESC, name ASC';
    
    const result = await db.execute({ sql: query, args: params });
    
    const employees: Employee[] = result.rows.map((row) => ({
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
    }));
    
    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'pan', 'bank_account', 'ifsc', 'designation', 'date_of_joining'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate CTC unless no_ctc is true
    if (!body.no_ctc && (!body.annual_ctc || body.annual_ctc <= 0)) {
      return NextResponse.json(
        { error: 'Annual CTC is required and must be positive' },
        { status: 400 }
      );
    }
    
    // Generate employee ID
    const employeeType = body.employee_type || 'EM';
    const empId = await generateEmployeeId(employeeType, body.date_of_joining);
    
    // Calculate monthly gross from annual CTC
    const annualCtc = body.no_ctc ? 0 : Number(body.annual_ctc);
    const monthlyGross = Math.round((annualCtc / 12) * 100) / 100;
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await db.execute({
      sql: `INSERT INTO employees (
        emp_id, name, email, phone, pan, bank_account, ifsc, state,
        date_of_joining, annual_ctc, monthly_gross, tax_regime, role,
        designation, department, address, manager_name, roles_responsibilities,
        employee_type, end_date, no_ctc, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        empId,
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
        employeeType,
        body.end_date || null,
        body.no_ctc ? 1 : 0,
        1, // active
        now,
        now
      ]
    });
    
    // Add initial salary record to history
    await db.execute({
      sql: `INSERT INTO salary_history (
        emp_id, change_type, old_salary, new_salary, old_designation, new_designation,
        old_role, new_role, reason, effective_date, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        empId,
        'INITIAL',
        0,
        annualCtc,
        null,
        body.designation,
        null,
        body.role || null,
        'Initial hiring',
        body.date_of_joining,
        'System',
        now
      ]
    });
    
    return NextResponse.json({
      success: true,
      emp_id: empId,
      message: `Employee ${body.name} created successfully with ID: ${empId}`
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('UNIQUE constraint failed') && errorMessage.includes('pan')) {
      return NextResponse.json(
        { error: 'PAN number already exists for another employee' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}

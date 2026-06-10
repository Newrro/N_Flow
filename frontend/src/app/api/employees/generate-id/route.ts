import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/schema';
import { generateEmployeeId } from '@/lib/employee-id';

// POST /api/employees/generate-id - Generate employee ID
export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();
    
    const employeeType = body.employee_type || 'EM';
    const dateOfJoining = body.date_of_joining;
    
    const empId = await generateEmployeeId(employeeType, dateOfJoining);
    
    return NextResponse.json({
      emp_id: empId
    });
  } catch (error) {
    console.error('Error generating employee ID:', error);
    return NextResponse.json(
      { error: 'Failed to generate employee ID' },
      { status: 500 }
    );
  }
}

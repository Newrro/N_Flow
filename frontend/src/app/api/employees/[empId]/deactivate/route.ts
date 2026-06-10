import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// POST /api/employees/[empId]/deactivate - Deactivate employee
export async function POST(
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

// POST to reactivate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    await initDb();
    const db = getDb();
    const { empId } = await params;
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const result = await db.execute({
      sql: 'UPDATE employees SET active = 1, updated_at = ? WHERE emp_id = ?',
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
      message: 'Employee reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating employee:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate employee' },
      { status: 500 }
    );
  }
}

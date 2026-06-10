import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';
import { PendingCandidate } from '@/types/employee';

// GET /api/pending-candidates - List all pending candidates
export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    let query = 'SELECT * FROM pending_candidates';
    const params: string[] = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.execute({ sql: query, args: params });
    
    const candidates: PendingCandidate[] = result.rows.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      email: row.email as string | null,
      phone: row.phone as string | null,
      address: row.address as string | null,
      position: row.position as string,
      department: row.department as string | null,
      joining_date: row.joining_date as string,
      annual_ctc: Number(row.annual_ctc) || 0,
      reporting_to: row.reporting_to as string | null,
      responsibilities: row.responsibilities as string | null,
      employee_type: (row.employee_type as 'EM' | 'IN' | 'DR' | 'VL') || 'EM',
      created_at: row.created_at as string | null,
      status: row.status as 'pending' | 'accepted' | 'rejected',
      pan: row.pan as string | null,
      bank_account: row.bank_account as string | null,
      ifsc: row.ifsc as string | null,
      state: row.state as string | null || undefined,
      role: row.role as string | null,
      designation: row.designation as string | null,
      manager_name: row.manager_name as string | null,
      roles_responsibilities: row.roles_responsibilities as string | null,
      no_ctc: Number(row.no_ctc) === 1,
    }));
    
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Error fetching pending candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending candidates' },
      { status: 500 }
    );
  }
}

// POST /api/pending-candidates - Create new pending candidate
export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.position) {
      return NextResponse.json(
        { error: 'Name and position are required' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await db.execute({
      sql: `INSERT INTO pending_candidates (
        name, email, phone, address, position, department, joining_date,
        annual_ctc, reporting_to, responsibilities, employee_type, 
        created_at, status, no_ctc, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      args: [
        body.name,
        body.email || null,
        body.phone || null,
        body.address || null,
        body.position,
        body.department || null,
        body.joining_date || null,
        body.annual_ctc || 0,
        body.reporting_to || null,
        body.responsibilities || null,
        body.employee_type || 'EM',
        now,
        body.no_ctc ? 1 : 0,
        body.end_date || null
      ]
    });
    
    const result = await db.execute({ 
      sql: 'SELECT last_insert_rowid() as id', 
      args: [] 
    });
    
    const candidateId = (result.rows[0] as unknown as { id: number }).id;
    
    return NextResponse.json({
      success: true,
      id: candidateId,
      message: `Candidate ${body.name} added to pending list`
    });
  } catch (error) {
    console.error('Error creating pending candidate:', error);
    return NextResponse.json(
      { error: 'Failed to create pending candidate' },
      { status: 500 }
    );
  }
}


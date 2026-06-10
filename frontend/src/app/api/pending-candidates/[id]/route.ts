import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// DELETE /api/pending-candidates/[id] - Reject/delete pending candidate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await initDb();
    const db = getDb();
    
    // Get the candidate first to show name in response
    const candidateResult = await db.execute({
      sql: 'SELECT name FROM pending_candidates WHERE id = ?',
      args: [id]
    });
    
    if (candidateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pending candidate not found' },
        { status: 404 }
      );
    }
    
    const candidateName = (candidateResult.rows[0] as unknown as { name: string }).name;
    
    // Delete the pending candidate
    await db.execute({
      sql: 'DELETE FROM pending_candidates WHERE id = ?',
      args: [id]
    });
    
    return NextResponse.json({
      success: true,
      message: `Candidate ${candidateName} has been rejected and removed from the pending list`
    });
  } catch (error) {
    console.error('Error deleting pending candidate:', error);
    return NextResponse.json(
      { error: 'Failed to delete pending candidate' },
      { status: 500 }
    );
  }
}


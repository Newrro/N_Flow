import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// GET /api/payroll/export-csv?month=<month> - Export payroll to CSV for bank transfer
export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    
    if (!month) {
      return NextResponse.json(
        { error: 'Month is required' },
        { status: 400 }
      );
    }
    
    // Get finalized payroll data with employee details
    const result = await db.execute({
      sql: `SELECT 
              e.name, e.bank_account, e.ifsc, e.email,
              p.net_pay
            FROM payroll_runs p
            JOIN employees e ON p.emp_id = e.emp_id
            WHERE p.month = ? AND p.status = 'FINAL'
            ORDER BY e.name`,
      args: [month]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No finalized payroll found for this month' },
        { status: 404 }
      );
    }
    
    // Build CSV content
    const headers = ['Beneficiary Name', 'Account Number', 'IFSC Code', 'Amount', 'Email'];
    const rows = result.rows.map((row) => [
      row.name as string,
      row.bank_account as string,
      row.ifsc as string,
      Number(row.net_pay).toFixed(2),
      (row.email as string) || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');
    
    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payroll_${month.replace(' ', '_')}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting payroll CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export payroll' },
      { status: 500 }
    );
  }
}

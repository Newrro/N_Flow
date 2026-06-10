import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/schema';

// GET /api/config - Get all config
export async function GET() {
  try {
    await initDb();
    const db = getDb();
    
    const result = await db.execute('SELECT key, value FROM config');
    
    const config: Record<string, string | boolean> = {};
    for (const row of result.rows) {
      const key = row.key as string;
      const value = row.value as string;
      
      // Convert boolean strings
      if (key === 'pf_enabled' || key === 'esic_enabled') {
        config[key] = value === '1';
      } else {
        config[key] = value;
      }
    }
    
    // Ensure defaults
    if (!('pf_enabled' in config)) config.pf_enabled = false;
    if (!('esic_enabled' in config)) config.esic_enabled = false;
    if (!('company_name' in config)) config.company_name = 'Newrro Tech LLP';
    
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

// PUT /api/config - Update config
export async function PUT(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();
    
    const updates: { key: string; value: string }[] = [];
    
    if ('pf_enabled' in body) {
      updates.push({ key: 'pf_enabled', value: body.pf_enabled ? '1' : '0' });
    }
    
    if ('esic_enabled' in body) {
      updates.push({ key: 'esic_enabled', value: body.esic_enabled ? '1' : '0' });
    }
    
    if ('company_name' in body) {
      updates.push({ key: 'company_name', value: body.company_name });
    }
    
    for (const update of updates) {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
        args: [update.key, update.value]
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}

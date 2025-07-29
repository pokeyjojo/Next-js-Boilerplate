import { NextResponse } from 'next/server';
import { isAdmin } from '@/libs/AdminUtils';
import { getDb } from '@/libs/DB';
import { courtPhotoReportSchema, reportSchema } from '@/models/Schema';

export async function DELETE() {
  try {
    // Only allow admins to clear reports
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = await getDb();

    // Delete all review reports
    await db.delete(reportSchema);

    // Delete all court photo reports
    await db.delete(courtPhotoReportSchema);

    return NextResponse.json({
      success: true,
      message: 'All reports cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing reports:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear reports',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

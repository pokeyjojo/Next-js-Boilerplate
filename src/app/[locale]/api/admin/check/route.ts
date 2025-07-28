import { NextResponse } from 'next/server';
import { isAdmin } from '@/libs/AdminUtils';

export async function GET() {
  try {
    const adminStatus = await isAdmin();
    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
}

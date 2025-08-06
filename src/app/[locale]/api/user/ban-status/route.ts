import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isUserBanned } from '@/libs/AdminUtils';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ isBanned: false });
    }

    const banned = await isUserBanned(user.id);
    
    return NextResponse.json({ 
      isBanned: banned,
      userId: user.id 
    });
  } catch (error) {
    console.error('Error checking user ban status:', error);
    return NextResponse.json({ isBanned: false }, { status: 500 });
  }
}
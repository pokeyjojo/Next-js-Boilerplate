import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userDetails = null;
    try {
      const user = await currentUser();
      userDetails = {
        id: user?.id,
        email: user?.primaryEmailAddress?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
      };
    } catch (error) {
      console.warn('Could not get user details:', error);
    }

    return NextResponse.json({
      userId,
      userDetails,
      message: 'Add this userId to ADMIN_USER_IDS in src/libs/AdminUtils.ts to make this user an admin'
    });

  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
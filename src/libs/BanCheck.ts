import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isUserBanned, type BanType } from '@/libs/AdminUtils';

export async function checkUserBan(banType?: BanType): Promise<{ banned: boolean; user?: any; response?: NextResponse }> {
  try {
    const user = await currentUser();
    
    if (!user) {
      return {
        banned: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }

    // Check for any active ban first (site-wide check)
    const banned = await isUserBanned(user.id);
    
    if (banned) {
      return {
        banned: true,
        user,
        response: NextResponse.json(
          { error: 'You are banned from submitting content. Contact an administrator if you believe this is a mistake.' },
          { status: 403 }
        )
      };
    }

    return { banned: false, user };
  } catch (error) {
    console.error('Error checking user ban status:', error);
    return {
      banned: false,
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    };
  }
}

export function createBanCheckMiddleware(banType?: BanType) {
  return async (req: NextRequest) => {
    const banCheck = await checkUserBan(banType);
    
    if (banCheck.response) {
      return banCheck.response;
    }
    
    return null; // No ban, continue with the request
  };
}
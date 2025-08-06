import { NextRequest, NextResponse } from 'next/server';
import { checkUserBan } from '@/libs/BanCheck';
import { isAdmin } from '@/libs/AdminUtils';
import { createClerkClient } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Check if user is banned
    const banCheck = await checkUserBan();
    if (banCheck.response) {
      return banCheck.response;
    }

    // Check if user is admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const searchType = searchParams.get('type'); // 'id', 'email', or 'name'

    if (!query || !searchType) {
      return NextResponse.json({ error: 'Query and type parameters are required' }, { status: 400 });
    }

    // Create Clerk client instance
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    let users: any[] = [];

    try {
      switch (searchType) {
        case 'id':
          // Search by user ID
          try {
            const user = await clerkClient.users.getUser(query);
            users = user ? [user] : [];
          } catch (error) {
            users = [];
          }
          break;

        case 'email':
          // Search by email address
          try {
            const emailUsers = await clerkClient.users.getUserList({
              emailAddress: [query],
              limit: 10
            });
            users = emailUsers.data || emailUsers || [];
          } catch (error) {
            users = [];
          }
          break;

        case 'name':
          // Search by name (first name or last name)
          try {
            const nameUsers = await clerkClient.users.getUserList({
              query: query,
              limit: 10
            });
            users = nameUsers.data || nameUsers || [];
          } catch (error) {
            users = [];
          }
          break;

        default:
          return NextResponse.json({ error: 'Invalid search type. Use id, email, or name' }, { status: 400 });
      }

      // Format the response data
      const formattedUsers = users.map(user => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
        username: user.username || '',
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        imageUrl: user.imageUrl || ''
      }));

      return NextResponse.json({ 
        users: formattedUsers,
        query,
        searchType,
        count: formattedUsers.length
      });

    } catch (clerkError) {
      console.error('User lookup error:', clerkError);
      return NextResponse.json({ 
        error: 'Failed to search users'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('User lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
# Clerk API Setup Guide

## Current Status

The user lookup feature has been implemented but requires additional Clerk API configuration to enable full search functionality by email and name.

## What's Working Now

- ✅ **User Ban Management UI** - Complete interface for searching and banning users
- ✅ **API Endpoint** - `/api/admin/user-lookup` ready for Clerk integration
- ✅ **Error Handling** - Graceful degradation with helpful messages
- ✅ **Manual Entry** - Admins can still manually enter user information

## What Needs Configuration

- ❌ **Clerk Secret Key** - Environment variable not configured
- ❌ **Clerk Client Access** - `clerkClient` not properly accessible
- ❌ **User Search API** - Requires Clerk Management API access

## How to Enable Full Search Functionality

### Step 1: Set Up Environment Variables

Create or update your `.env.local` file with:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Get these from your Clerk Dashboard > API Keys
```

### Step 2: Verify Clerk Client Access

Test the Clerk client by creating a simple test endpoint:

```typescript
// src/app/api/test-clerk/route.ts
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const userCount = await clerkClient.users.getCount();
    return NextResponse.json({ success: true, userCount });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 3: Update the User Lookup API

Once Clerk is properly configured, update `/api/admin/user-lookup/route.ts`:

```typescript
// Replace the current implementation with:
import { clerkClient } from '@clerk/nextjs/server';

// In the switch statement:
case 'email':
  const emailUsers = await clerkClient.users.getUserList({
    emailAddress: [query],
    limit: 10
  });
  users = emailUsers.data || [];
  break;

case 'name':
  const nameUsers = await clerkClient.users.getUserList({
    query: query,
    limit: 10
  });
  users = nameUsers.data || [];
  break;

case 'id':
  try {
    const user = await clerkClient.users.getUser(query);
    users = user ? [user] : [];
  } catch (error) {
    users = [];
  }
  break;
```

### Step 4: Test the Functionality

1. Restart your development server
2. Go to `/dashboard/admin/user-bans`
3. Click "Ban User" → "Search Users"
4. Try searching by email, name, or user ID

## Troubleshooting

### Common Issues

1. **"clerkClient is undefined"**
   - Check that `CLERK_SECRET_KEY` is properly set
   - Verify Clerk package version compatibility

2. **"Cannot read properties of undefined"**
   - Ensure Clerk is properly initialized in your app
   - Check that you're using the correct import path

3. **API Rate Limits**
   - Clerk has API rate limits; implement caching if needed
   - Consider pagination for large user bases

### Alternative Approaches

If Clerk Management API continues to have issues, you can:

1. **Use Database Lookup** - Store user info in your database
2. **Manual Entry** - Continue with the current manual approach
3. **Hybrid Solution** - Cache frequently searched users

## Current User Experience

Even without the search API, admins can still:

- ✅ Manually enter user ID, name, and email
- ✅ Ban users effectively
- ✅ Manage all existing bans
- ✅ Get helpful guidance messages

The core ban functionality works perfectly - the search is just a convenience feature!

## Next Steps

1. Configure Clerk environment variables
2. Test Clerk client access
3. Enable the full search functionality
4. Update the UI description text

Once configured, the search feature will provide a seamless admin experience for quickly finding and banning users.
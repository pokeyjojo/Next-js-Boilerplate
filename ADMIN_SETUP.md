# Admin Photo Management Setup Guide

This guide explains how to set up and use the photo management system for tennis court reviews.

## Overview

The photo management system allows administrators to delete inappropriate photos uploaded by users. Photos are displayed immediately by default, but admins have the power to remove them if needed.

## Setup Instructions

### 1. Configure Admin Users

Edit the `src/libs/AdminUtils.ts` file to define who has admin access:

```typescript
// Admin user IDs - add your admin user IDs here
const ADMIN_USER_IDS: string[] = [
  'user_2abc123def456', // Replace with actual user IDs from Clerk
  'user_3xyz789ghi012',
];

// Admin email domains - users with these email domains will be considered admins
const ADMIN_EMAIL_DOMAINS: string[] = [
  'yourcompany.com', // Replace with your company domain
  'admin.com',
];
```

### 2. Get User IDs from Clerk

To find your user ID:
1. Sign in to your application
2. Open browser developer tools
3. Check the network tab or console for user information
4. Or use the test endpoint: `/api/test` to see your user data

### 3. Alternative: Use Clerk Roles (Recommended)

For better security, set up custom roles in Clerk:

1. Go to your Clerk Dashboard
2. Navigate to "Users" → "Roles"
3. Create a new role called "admin"
4. Assign the role to admin users
5. The system will automatically detect users with the "admin" role

## Using the Admin Dashboard

### Accessing the Dashboard

1. Sign in as an admin user
2. Navigate to the dashboard
3. Click on "Photo Management" in the left navigation (only visible to admins)

### Managing Photos

1. **View All Photos**: The dashboard shows all photos uploaded by users
2. **Filter Photos**: Use the tabs to filter by status (All, Active, Deleted)
3. **Delete Photos**: Click "Delete Photo" to remove inappropriate photos and optionally provide a reason

### Photo Status

- **Active**: Photos currently displayed on the website
- **Deleted**: Photos that have been removed by an admin

## How It Works

### Photo Upload Flow

1. User uploads photos with a review
2. Photos are immediately displayed on the website
3. Photos are tracked in the database for admin management
4. Admin can delete inappropriate photos if needed
5. Deleted photos are removed from Cloudinary and hidden from the website

### Database Schema

The system uses a `photo_moderation` table to track:

- Photo URL
- Review ID
- Court ID
- Uploader information
- Deletion status
- Admin who deleted
- Deletion reason
- Timestamps

### API Endpoints

- `GET /api/admin/photos` - Get all photos for management (admin only)
- `POST /api/admin/photos` - Delete photos (admin only)
- `GET /api/tennis-courts/[id]/reviews-with-approved-photos` - Get reviews with non-deleted photos

## Security Features

- Admin-only access to management endpoints
- Multiple ways to define admin users (user IDs, email domains, Clerk roles)
- Automatic photo deletion from Cloudinary when removed
- Audit trail of deletion actions

## Troubleshooting

### Admin Access Not Working

1. Check that your user ID is in the `ADMIN_USER_IDS` array
2. Verify your email domain is in `ADMIN_EMAIL_DOMAINS`
3. Ensure you have the "admin" role in Clerk (if using roles)
4. Check browser console for any errors

### Photos Not Appearing

1. Verify photos haven't been deleted by an admin
2. Check the photo management dashboard for deleted photos
3. Ensure the database migration has been run

### Database Migration

If you haven't run the migration yet:

```bash
npm run db:migrate-local
```

## Customization

You can customize the photo management system by:

- Adding more admin roles or permissions
- Implementing email notifications for new photos
- Adding bulk deletion actions
- Creating custom management workflows
- Adding photo quality checks or AI moderation

## Support

For issues or questions about the photo management system, check the application logs or contact your development team.

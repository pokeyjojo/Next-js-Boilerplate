import { currentUser } from '@clerk/nextjs/server';

// Admin user IDs - you can add more admin user IDs here
const ADMIN_USER_IDS: string[] = [
  // Add your admin user IDs here
  // You can get these from your Clerk dashboard or by checking the user ID in your app
  'user_2z6iXo450oCxAddzoUnmcC229Xf',
];

// Admin email domains - users with these email domains will be considered admins
const ADMIN_EMAIL_DOMAINS: string[] = [
  'admin.com', // Replace with your admin domain
  'yourcompany.com', // Replace with your company domain
];

export async function isAdmin(): Promise<boolean> {
  try {
    const user = await currentUser();

    if (!user) {
      return false;
    }

    // Check if user ID is in admin list
    if (ADMIN_USER_IDS.includes(user.id)) {
      return true;
    }

    // Check if user's email domain is in admin domains
    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (userEmail) {
      const domain = userEmail.split('@')[1];
      if (domain && ADMIN_EMAIL_DOMAINS.includes(domain)) {
        return true;
      }
    }

    // Check if user has admin role in Clerk (if you set up custom roles)
    const userRoles = user.publicMetadata?.roles as string[] || [];
    if (userRoles.includes('admin')) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await currentUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const user = await currentUser();
    return user?.primaryEmailAddress?.emailAddress || null;
  } catch (error) {
    console.error('Error getting current user email:', error);
    return null;
  }
}

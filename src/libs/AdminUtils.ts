import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq, gt, or, isNull } from 'drizzle-orm';
import { getDb } from '@/libs/DB';
import { userBanSchema } from '@/models/Schema';

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
    // First try to get userId from auth() which is more reliable in server components
    const { userId } = await auth();
    
    if (!userId) {
      return false;
    }

    // Check if user ID is in admin list
    if (ADMIN_USER_IDS.includes(userId)) {
      return true;
    }

    // If we need more user info, try to get the full user object
    try {
      const user = await currentUser();
      if (user) {
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
      }
    } catch (userDetailsError) {
      // If getting user details fails, continue with just the ID check
      console.warn('Could not get user details for admin check, relying on user ID only:', userDetailsError);
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

export async function getCurrentUserName(): Promise<string | null> {
  try {
    const user = await currentUser();
    return user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || null;
  } catch (error) {
    console.error('Error getting current user name:', error);
    return null;
  }
}

export type BanType = 'full' | 'reviews' | 'suggestions' | 'photos';

export async function isUserBanned(userId: string, banType?: BanType): Promise<boolean> {
  try {
    const db = await getDb();
    const now = new Date();
    
    let query = db
      .select()
      .from(userBanSchema)
      .where(
        and(
          eq(userBanSchema.userId, userId),
          eq(userBanSchema.isActive, true),
          or(
            isNull(userBanSchema.expiresAt), // Permanent ban
            gt(userBanSchema.expiresAt, now) // Not expired
          )
        )
      );

    const bans = await query;
    
    if (bans.length === 0) {
      return false;
    }

    // If no specific ban type requested, check for any active ban
    if (!banType) {
      return true;
    }

    // Check for specific ban type or full ban
    return bans.some((ban: any) => ban.banType === banType || ban.banType === 'full');
  } catch (error) {
    console.error('Error checking user ban status:', error);
    return false;
  }
}

export async function banUser(
  userId: string,
  userName: string,
  userEmail: string | null,
  banReason: string | null,
  banType: BanType = 'full',
  expiresAt?: Date
): Promise<boolean> {
  try {
    const admin = await currentUser();
    if (!admin || !(await isAdmin())) {
      throw new Error('Unauthorized: Only admins can ban users');
    }

    const adminName = admin.fullName || admin.username || admin.primaryEmailAddress?.emailAddress || 'Admin';
    
    const db = await getDb();
    
    // Check if user already has an active ban of this type
    const existingBan = await db
      .select()
      .from(userBanSchema)
      .where(
        and(
          eq(userBanSchema.userId, userId),
          eq(userBanSchema.banType, banType),
          eq(userBanSchema.isActive, true)
        )
      )
      .limit(1);

    if (existingBan.length > 0) {
      // Update existing ban
      await db
        .update(userBanSchema)
        .set({
          banReason,
          bannedBy: admin.id,
          bannedByUserName: adminName,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(userBanSchema.id, existingBan[0].id));
    } else {
      // Create new ban
      await db.insert(userBanSchema).values({
        userId,
        userName,
        userEmail,
        bannedBy: admin.id,
        bannedByUserName: adminName,
        banReason,
        banType,
        expiresAt,
      });
    }

    return true;
  } catch (error) {
    console.error('Error banning user:', error);
    return false;
  }
}

export async function unbanUser(userId: string, banType?: BanType): Promise<boolean> {
  try {
    const admin = await currentUser();
    if (!admin || !(await isAdmin())) {
      throw new Error('Unauthorized: Only admins can unban users');
    }

    const db = await getDb();
    
    let whereCondition = and(
      eq(userBanSchema.userId, userId),
      eq(userBanSchema.isActive, true)
    );

    if (banType) {
      whereCondition = and(whereCondition, eq(userBanSchema.banType, banType));
    }

    await db
      .update(userBanSchema)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(whereCondition);

    return true;
  } catch (error) {
    console.error('Error unbanning user:', error);
    return false;
  }
}

export async function getUserBans(userId?: string) {
  try {
    const db = await getDb();
    
    let query = db
      .select()
      .from(userBanSchema)
      .orderBy(userBanSchema.createdAt);

    if (userId) {
      query = query.where(eq(userBanSchema.userId, userId));
    }

    return await query;
  } catch (error) {
    console.error('Error getting user bans:', error);
    return [];
  }
}

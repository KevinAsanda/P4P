'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { OpsRole } from './rbac';

export interface AuthContext {
  activeRole: OpsRole;   // The role currently in effect (may be a preview role for admins)
  realRole: OpsRole;     // The user's actual role from the JWT app_metadata
  isActualAdmin: boolean; // True when the JWT role is 'admin', regardless of preview
  userId: string;        // Authenticated user UUID (for audit logs)
  userEmail: string;     // Authenticated user email (for display)
}

const VALID_ROLES: OpsRole[] = ['admin', 'finance', 'warehouse'];

/**
 * Main auth context helper. Call once per server component to get all auth data.
 * Uses a single Supabase getUser() call for efficiency.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const realRole = (user?.app_metadata?.role as OpsRole) || 'warehouse';
  const isActualAdmin = realRole === 'admin';

  // Admins can preview other roles via a cookie (Preview Mode)
  let activeRole: OpsRole = realRole;
  if (isActualAdmin) {
    const cookieStore = await cookies();
    const previewRole = cookieStore.get('p4p_preview_role')?.value as OpsRole | undefined;
    if (previewRole && (previewRole === 'finance' || previewRole === 'warehouse')) {
      activeRole = previewRole;
    }
  }

  return {
    activeRole,
    realRole,
    isActualAdmin,
    userId: user?.id || 'unauthenticated',
    userEmail: user?.email || '',
  };
}

/**
 * Convenience wrapper — returns only the active role.
 * For server actions that just need to check permissions.
 */
export async function getActiveRole(): Promise<OpsRole> {
  const { activeRole } = await getAuthContext();
  return activeRole;
}

/**
 * Returns only the real JWT role, ignoring preview mode.
 * Use this for security-critical authorization checks.
 */
export async function getRealRole(): Promise<OpsRole> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (user?.app_metadata?.role as OpsRole) || 'warehouse';
}

/**
 * Returns the authenticated user's UUID.
 * Use this for audit log entries.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || 'unauthenticated';
}

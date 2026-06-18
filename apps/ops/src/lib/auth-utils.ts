'use server';

import { cookies } from 'next/headers';
import { OpsRole } from './rbac';

/**
 * Switch the active staff role in the cookie session.
 */
export async function switchRole(role: string) {
  const cookieStore = await cookies();
  cookieStore.set('p4p_ops_role', role, { path: '/' });
}

/**
 * Get the current active staff role from the cookie store.
 * Defaults to 'admin' if not set.
 */
export async function getActiveRole(): Promise<OpsRole> {
  const cookieStore = await cookies();
  const role = cookieStore.get('p4p_ops_role')?.value;
  return (role as OpsRole) || 'admin';
}

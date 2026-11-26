'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRealRole } from '@/lib/auth-utils';
import { writeAuditLog } from '@/lib/audit';

// ── Sign In ────────────────────────────────────────────────────────────────────

export async function opsLogin(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Verify the logged-in user has a valid ops role in their JWT app_metadata
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role;

  if (!role || !['admin', 'finance', 'warehouse'].includes(role)) {
    await supabase.auth.signOut();
    return {
      error:
        'Your account does not have Operations Portal access. Contact your administrator.',
    };
  }

  redirect('/');
}

// ── Sign Out ───────────────────────────────────────────────────────────────────

export async function opsSignout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear preview role cookie
  const cookieStore = await cookies();
  cookieStore.delete('p4p_preview_role');

  redirect('/login');
}

// ── Preview Mode (Admin Only) ──────────────────────────────────────────────────

/**
 * Sets or clears the preview role cookie. Only respected for authenticated admins.
 * Passing null clears the preview and returns to the real admin role.
 */
export async function setPreviewRole(previewRole: string | null) {
  const realRole = await getRealRole();
  if (realRole !== 'admin') return; // Silent no-op for non-admins

  const cookieStore = await cookies();
  if (previewRole && ['finance', 'warehouse'].includes(previewRole)) {
    cookieStore.set('p4p_preview_role', previewRole, { path: '/', httpOnly: true });
  } else {
    cookieStore.delete('p4p_preview_role');
  }
}

// ── Staff Invite (Admin Only) ──────────────────────────────────────────────────

export async function inviteStaffMember(state: any, formData: FormData) {
  const realRole = await getRealRole();
  if (realRole !== 'admin') {
    return { error: 'Only administrators can invite staff members.' };
  }

  const email = formData.get('email') as string;
  const staffRole = formData.get('role') as string;

  if (!email || !staffRole) {
    return { error: 'Email and role are required.' };
  }

  if (!['admin', 'finance', 'warehouse'].includes(staffRole)) {
    return { error: 'Invalid role selected.' };
  }

  // Determine public site URL (uses request headers, env vars, or Render production domain)
  let siteUrl = 'https://p4p-ops.onrender.com';
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
    siteUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  } else if (process.env.RENDER_EXTERNAL_URL) {
    siteUrl = process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  } else {
    try {
      const headerList = await cookies(); // Ensure async context access
      const reqHeaders = await headers();
      const host = reqHeaders.get('x-forwarded-host') || reqHeaders.get('host');
      if (host && !host.includes('localhost')) {
        const proto = reqHeaders.get('x-forwarded-proto') || 'https';
        siteUrl = `${proto}://${host}`;
      } else if (process.env.NODE_ENV === 'development' && host) {
        siteUrl = `http://${host}`;
      }
    } catch {
      // Fallback stays as Render production domain
    }
  }

  const adminClient = createAdminClient();

  // Step 1: Send the invite email (sets user_metadata.role)
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
    data: { role: staffRole },
  });

  if (error) {
    return { error: error.message };
  }

  // Step 2: Immediately promote the role to app_metadata (not user-modifiable)
  if (data.user?.id) {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      data.user.id,
      { app_metadata: { role: staffRole } }
    );
    if (updateError) {
      console.error('[Invite] Failed to set app_metadata role:', updateError);
    }
  }

  await writeAuditLog('INVITE_STAFF_MEMBER', data.user?.id || email, `Email: ${email}, Assigned Role: ${staffRole}`);

  return { success: true, email };
}

// ── Update Staff Role (Admin Only) ────────────────────────────────────────────

export async function updateStaffRole(
  state: any,
  formData: FormData
) {
  const realRole = await getRealRole();
  if (realRole !== 'admin') {
    return { error: 'Only administrators can change staff roles.' };
  }

  const userId = formData.get('userId') as string;
  const newRole = formData.get('role') as string;

  if (!userId || !newRole) {
    return { error: 'User ID and role are required.' };
  }

  if (!['admin', 'finance', 'warehouse'].includes(newRole)) {
    return { error: 'Invalid role selected.' };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { role: newRole },
  });

  if (error) {
    return { error: error.message };
  }

  await writeAuditLog('UPDATE_STAFF_ROLE', userId, `New Role: ${newRole}`);

  return { success: true };
}

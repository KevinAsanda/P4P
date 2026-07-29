import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-utils';
import DashboardLayout from '@/components/DashboardLayout';
import { createAdminClient } from '@/lib/supabase/admin';
import InviteStaffForm from './InviteStaffForm';
import { ShieldAlert, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-papaya/10 text-caramel border-papaya/20' },
  finance: { label: 'Finance', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  warehouse: { label: 'Warehouse', color: 'bg-green-50 text-green-700 border-green-200' },
};

export default async function StaffPage() {
  const { activeRole, isActualAdmin, userEmail } = await getAuthContext();

  // Only real admins can access this page
  if (!isActualAdmin) {
    return (
      <DashboardLayout activeRole={activeRole} isActualAdmin={false} userEmail={userEmail}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center py-12 max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-vermillion mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            Only administrators can manage staff accounts.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch all ops users via admin API
  let staffList: any[] = [];
  try {
    const adminClient = createAdminClient();
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 100 });
    if (!error && users) {
      // Filter to only ops staff (those with a role in app_metadata)
      staffList = users
        .filter((u) => u.app_metadata?.role && ['admin', 'finance', 'warehouse'].includes(u.app_metadata.role))
        .sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''));
    }
  } catch (err) {
    console.error('[StaffPage] Failed to list users:', err);
  }

  return (
    <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-caramel" />
            Staff Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Invite new staff by email. They'll receive a link to set their own password.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Invite Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50/50">
                <h2 className="font-black text-sm text-gray-900">Invite New Staff Member</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  An invite email will be sent with a one-time sign-in link.
                </p>
              </div>
              <div className="p-6">
                <InviteStaffForm />
              </div>
            </div>
          </div>

          {/* Current Staff List */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
                <h2 className="font-black text-sm text-gray-900">Current Staff</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">
                  {staffList.length} accounts
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {staffList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No staff accounts found. Invite your first team member.
                  </div>
                ) : (
                  staffList.map((user) => {
                    const role = user.app_metadata?.role as string;
                    const roleMeta = ROLE_LABELS[role] ?? { label: role, color: 'bg-gray-100 text-gray-600 border-gray-200' };
                    const isInvitePending = !user.email_confirmed_at;

                    return (
                      <div key={user.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{user.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {isInvitePending ? (
                              <span className="text-amber-600 font-bold">⏳ Invite pending</span>
                            ) : (
                              `Last sign in: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-ZA') : 'Never'}`
                            )}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

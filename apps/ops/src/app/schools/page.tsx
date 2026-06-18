import { prisma } from '@p4p/db';
import { getActiveRole } from '@/lib/auth-utils';
import { createSchool, toggleSchoolActive } from '@/app/crud-actions';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert, Plus, Power, Landmark } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SchoolsPage() {
  const activeRole = await getActiveRole();

  if (activeRole !== 'admin') {
    return (
      <DashboardLayout activeRole={activeRole}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center py-12 max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-vermillion mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            You do not have the required permissions to view or edit school templates. Admin clearance is required.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch all schools
  const schools = await prisma.school.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <DashboardLayout activeRole={activeRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Schools Manager</h1>
          <p className="text-sm text-gray-500">
            Register new schools and activate or deactivate list configurations for Durban schools.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* List of schools */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                    <th className="px-6 py-4">School Details</th>
                    <th className="px-6 py-4">Region</th>
                    <th className="px-6 py-4">Contact Person</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schools.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No schools registered yet. Use the registration form to add your first school.
                      </td>
                    </tr>
                  ) : (
                    schools.map((school) => (
                      <tr key={school.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-gray-400" />
                          {school.name}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{school.region}</td>
                        <td className="px-6 py-4 text-gray-500">{school.contactPerson || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                              school.isActive
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            {school.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={toggleSchoolActive.bind(null, school.id, school.isActive)}>
                            <button
                              type="submit"
                              className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                                school.isActive
                                  ? 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
                                  : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100/50'
                              }`}
                            >
                              <Power className="h-3 w-3" />
                              <span>{school.isActive ? 'Deactivate' : 'Activate'}</span>
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Creation Form */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
              <Plus className="text-papaya h-5 w-5" />
              Register School
            </h3>
            
            <form action={createSchool} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  School Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Durban Boys High"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="region" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Region
                </label>
                <input
                  type="text"
                  id="region"
                  name="region"
                  required
                  placeholder="e.g. Berea"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="contactPerson" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Contact Person / Principal
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  placeholder="e.g. Dr. Jameson"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-jetblack py-3 px-4 text-xs font-black text-white hover:bg-caramel hover:shadow-md transition-all"
              >
                Register School
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

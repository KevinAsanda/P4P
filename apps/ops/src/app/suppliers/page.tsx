import { prisma } from '@p4p/db';
import { getAuthContext } from '@/lib/auth-utils';
import { createSupplier } from '@/app/crud-actions';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert, Plus, Mail, Phone, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const { activeRole, isActualAdmin, userEmail } = await getAuthContext();

  // Permitted roles: admin & finance
  if (activeRole !== 'admin' && activeRole !== 'finance') {
    return (
      <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center py-12 max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-vermillion mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            You do not have the required permissions to view or edit supplier details. Staff clearance required.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch all suppliers
  const suppliers = await prisma.supplier.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <DashboardLayout activeRole={activeRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Supplier Directory</h1>
          <p className="text-sm text-gray-500">
            Manage stationery wholesalers, view representative details, and monitor average logistics lead times.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Suppliers Table */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                    <th className="px-6 py-4">Supplier Name</th>
                    <th className="px-6 py-4">Contact Person</th>
                    <th className="px-6 py-4">Phone / Email</th>
                    <th className="px-6 py-4 text-center">Avg Lead Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        No suppliers registered yet. Use the registration form to add your first vendor.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supp: any) => (
                      <tr key={supp.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{supp.name}</td>
                        <td className="px-6 py-4 text-gray-500 font-medium flex items-center gap-1.5 py-5">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {supp.contactName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-xs space-y-1">
                          {supp.phone && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {supp.phone}
                            </span>
                          )}
                          {supp.email && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Mail className="h-3 w-3" />
                              {supp.email}
                            </span>
                          )}
                          {!supp.phone && !supp.email && <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-gray-700">
                          {supp.averageLeadTimeDays ? `${supp.averageLeadTimeDays} days` : 'N/A'}
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
              Enroll Supplier
            </h3>
            
            <form action={createSupplier} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Supplier Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Croxley Wholesalers"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="contactName" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  placeholder="e.g. Sarah Connor"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="phone" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="e.g. 031..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="averageLeadTimeDays" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    id="averageLeadTimeDays"
                    name="averageLeadTimeDays"
                    min={1}
                    placeholder="e.g. 5"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="e.g. sales@..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-jetblack py-3 px-4 text-xs font-black text-white hover:bg-caramel hover:shadow-md transition-all"
              >
                Enroll Supplier
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

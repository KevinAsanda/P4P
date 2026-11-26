import { prisma } from '@p4p/db';
import { getAuthContext } from '@/lib/auth-utils';
import { createSchoolTemplate } from '@/app/crud-actions';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert, Plus, BookOpen, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const { activeRole, isActualAdmin, userEmail } = await getAuthContext();

  if (activeRole !== 'admin') {
    return (
      <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
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

  // Fetch templates and schools
  const templates = await prisma.schoolTemplate.findMany({
    include: {
      school: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  const schools = await prisma.school.findMany({
    where: { isActive: true },
    orderBy: {
      name: 'asc',
    },
  });

  // Action wrapper to redirect to editor page after creation
  const handleCreateTemplate = async (formData: FormData) => {
    'use server';
    const newId = await createSchoolTemplate(formData);
    if (newId) {
      redirect(`/templates/${newId}`);
    }
  };

  return (
    <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Stationery Templates</h1>
          <p className="text-sm text-gray-500">
            Manage grade-level stationery list templates. Assign products automatically via AI scan or add items individually.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Templates Table */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                    <th className="px-6 py-4">Template Name</th>
                    <th className="px-6 py-4">School</th>
                    <th className="px-6 py-4">Grade / Year</th>
                    <th className="px-6 py-4 text-center">Items</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No stationery templates configured yet. Use the form to create your first template list.
                      </td>
                    </tr>
                  ) : (
                    templates.map((tpl: any) => (
                      <tr key={tpl.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2 py-5">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <Link href={`/templates/${tpl.id}`} className="hover:text-caramel transition-colors">
                            {tpl.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{tpl.school.name}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                          Grade {tpl.gradeLevel} ({tpl.academicYear})
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-gray-700">
                          {tpl.lines.length} items
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/templates/${tpl.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-papaya hover:text-jetblack text-gray-700 border border-gray-200 text-xs font-bold transition-all shadow-xs"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Manage Lines</span>
                          </Link>
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
              Create Template
            </h3>

            <form action={handleCreateTemplate} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="schoolId" className="block text-xs font-semibold text-gray-600">
                  School Selection
                </label>
                <select
                  id="schoolId"
                  name="schoolId"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                >
                  <option value="">-- Choose active school --</option>
                  {schools.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-semibold text-gray-600">
                  Template Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Berea Grade 3 Pack"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="gradeLevel" className="block text-xs font-semibold text-gray-600">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    id="gradeLevel"
                    name="gradeLevel"
                    required
                    placeholder="3"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="academicYear" className="block text-xs font-semibold text-gray-600">
                    Academic Year
                  </label>
                  <input
                    type="number"
                    id="academicYear"
                    name="academicYear"
                    required
                    defaultValue={new Date().getFullYear()}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-jetblack text-white hover:bg-caramel text-xs font-black rounded-xl transition-all"
              >
                Create &amp; Populate Template Lines
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

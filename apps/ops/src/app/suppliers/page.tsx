import { prisma } from '@p4p/db';
import { getAuthContext } from '@/lib/auth-utils';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert } from 'lucide-react';
import SuppliersClient from './SuppliersClient';

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

  // Fetch low stock products
  const products = await prisma.product.findMany({
    include: {
      supplier: true,
    },
  });

  const lowStockProducts = products.filter((p) => p.qtyOnHand <= p.reorderThreshold);

  return (
    <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Supplier Directory</h1>
          <p className="text-sm text-gray-500">
            Manage stationery wholesalers, view representative details, and auto-generate supplier Purchase Orders.
          </p>
        </div>

        <SuppliersClient suppliers={suppliers as any} lowStockProducts={lowStockProducts as any} />
      </div>
    </DashboardLayout>
  );
}

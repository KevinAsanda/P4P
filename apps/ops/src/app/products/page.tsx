import { prisma } from '@p4p/db';
import { getAuthContext } from '@/lib/auth-utils';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert } from 'lucide-react';
import ProductsClient from './ProductsClient';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { activeRole, isActualAdmin, userEmail } = await getAuthContext();

  if (activeRole !== 'admin') {
    return (
      <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center py-12 max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-vermillion mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            You do not have the required permissions to view or edit the product catalog. Admin clearance is required.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch products and suppliers
  const products = await prisma.product.findMany({
    include: {
      supplier: true,
    },
    orderBy: {
      itemName: 'asc',
    },
  });

  const suppliers = await prisma.supplier.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Product Catalog</h1>
          <p className="text-sm text-gray-500">
            Monitor inventory, adjust current stock counts, and register or edit stationery items &amp; fulfillment services.
          </p>
        </div>

        <ProductsClient products={products as any} suppliers={suppliers} />
      </div>
    </DashboardLayout>
  );
}

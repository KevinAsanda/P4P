import { prisma } from '@p4p/db';
import { getAuthContext } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/rbac';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert } from 'lucide-react';
import PackingQueueClient from './PackingQueueClient';
import { decryptValue } from '@p4p/shared';

export const dynamic = 'force-dynamic';

export default async function PackingPage() {
  const { activeRole, isActualAdmin, userEmail } = await getAuthContext();
  const permissions = PERMISSIONS[activeRole];

  if (activeRole !== 'admin' && activeRole !== 'warehouse') {
    return (
      <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center py-12 max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-vermillion mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            You do not have the required permissions to view the warehouse packing queue. Warehouse or Admin clearance is required.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const fetchedOrders = await prisma.salesOrder.findMany({
    where: {
      paymentStatus: 'paid',
    },
    include: {
      customer: true,
      student: {
        include: {
          school: true,
        },
      },
      orderLines: {
        include: {
          product: true,
        },
      },
      delivery: true,
    },
    orderBy: {
      orderDate: 'desc',
    },
  });

  // Server-side RBAC enforcement: never serialize decrypted customer PII or pricing
  // into the client component payload for roles that are not permitted to see them.
  const orders = fetchedOrders.map((ord: any) => ({
    ...ord,
    totalAmount: permissions.canSeePrices ? ord.totalAmount : 0,
    customer: {
      firstName: ord.customer.firstName,
      lastName: ord.customer.lastName,
      email: permissions.canSeeAddresses ? ord.customer.email : '',
      phone: permissions.canSeeAddresses ? decryptValue(ord.customer.phone) : null,
      deliveryAddress: permissions.canSeeAddresses ? decryptValue(ord.customer.deliveryAddress) : null,
    },
    orderLines: ord.orderLines.map((line: any) => ({
      ...line,
      unitPriceAtSale: permissions.canSeePrices ? line.unitPriceAtSale : 0,
      lineSubTotal: permissions.canSeePrices ? line.lineSubTotal : 0,
      product: {
        ...line.product,
        unitPrice: permissions.canSeePrices ? line.product.unitPrice : 0,
      },
    })),
  }));

  return (
    <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
      <PackingQueueClient initialOrders={JSON.parse(JSON.stringify(orders))} activeRole={activeRole} />
    </DashboardLayout>
  );
}

import { prisma } from '@p4p/db';
import { getAuthContext } from '@/lib/auth-utils';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert } from 'lucide-react';
import PackingQueueClient from './PackingQueueClient';
import { decryptValue } from '@p4p/shared';

export const dynamic = 'force-dynamic';

export default async function PackingPage() {
  const { activeRole, isActualAdmin, userEmail } = await getAuthContext();

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

  const orders = fetchedOrders.map((ord: any) => ({
    ...ord,
    customer: {
      ...ord.customer,
      phone: decryptValue(ord.customer.phone),
      deliveryAddress: decryptValue(ord.customer.deliveryAddress),
    },
  }));

  return (
    <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
      <PackingQueueClient initialOrders={JSON.parse(JSON.stringify(orders))} activeRole={activeRole} />
    </DashboardLayout>
  );
}

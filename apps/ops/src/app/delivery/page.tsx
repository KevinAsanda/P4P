import { prisma } from '@p4p/db';
import { getActiveRole } from '@/lib/auth-utils';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert } from 'lucide-react';
import DeliveryClient from './DeliveryClient';
import { decryptValue } from '@p4p/shared';

export const dynamic = 'force-dynamic';

export default async function DeliveryPage() {
  const activeRole = await getActiveRole();

  if (activeRole !== 'admin' && activeRole !== 'warehouse') {
    return (
      <DashboardLayout activeRole={activeRole}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center py-12 max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-vermillion mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            You do not have the required permissions to view the driver delivery dashboard. Warehouse or Admin clearance is required.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const fetchedOrders = await prisma.salesOrder.findMany({
    where: {
      paymentStatus: 'paid',
      fulfillmentStatus: {
        in: ['packed', 'dispatched', 'delivered'],
      },
    },
    include: {
      customer: true,
      student: {
        include: {
          school: true,
        },
      },
      delivery: true,
    },
    orderBy: {
      orderDate: 'desc',
    },
  });

  const orders = fetchedOrders.map((ord) => ({
    ...ord,
    customer: {
      ...ord.customer,
      phone: decryptValue(ord.customer.phone),
      deliveryAddress: decryptValue(ord.customer.deliveryAddress),
    },
  }));

  return (
    <DashboardLayout activeRole={activeRole}>
      <DeliveryClient initialOrders={JSON.parse(JSON.stringify(orders))} activeRole={activeRole} />
    </DashboardLayout>
  );
}

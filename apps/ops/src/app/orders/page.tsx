import { prisma } from '@p4p/db';
import { getActiveRole } from '@/lib/auth-utils';
import { PERMISSIONS, formatAddressForRole, formatPriceForRole } from '@/lib/rbac';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import QbSyncControl from '@/components/QbSyncControl';
import { decryptValue } from '@p4p/shared';

interface PageProps {
  searchParams: Promise<{
    paymentStatus?: string;
    fulfillmentStatus?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function OrdersPage({ searchParams }: PageProps) {
  const activeRole = await getActiveRole();
  const permissions = PERMISSIONS[activeRole];
  
  const { paymentStatus, fulfillmentStatus } = await searchParams;

  // 1. Construct Prisma where filters
  const whereFilter: any = {};
  if (paymentStatus) {
    whereFilter.paymentStatus = paymentStatus;
  }
  if (fulfillmentStatus) {
    whereFilter.fulfillmentStatus = fulfillmentStatus;
  }

  // 2. Fetch orders matching criteria
  const fetchedOrders = await prisma.salesOrder.findMany({
    where: whereFilter,
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

  const orders = fetchedOrders.map((ord: any) => ({
    ...ord,
    customer: {
      ...ord.customer,
      phone: decryptValue(ord.customer.phone),
      deliveryAddress: decryptValue(ord.customer.deliveryAddress),
    },
  }));

  return (
    <DashboardLayout activeRole={activeRole}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Orders List</h1>
            <p className="text-sm text-gray-500">
              View parent transaction orders, check payment status, and verify warehouse packing queues.
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-wrap gap-4 items-center">
          <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Quick Filters:</span>
          
          {/* Payment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Payment:</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-bold">
              <Link
                href="/orders"
                className={`px-3 py-1 rounded-md ${!paymentStatus ? 'bg-white shadow-xs text-jetblack' : 'text-gray-500 hover:text-jetblack'}`}
              >
                All
              </Link>
              <Link
                href="/orders?paymentStatus=pending"
                className={`px-3 py-1 rounded-md ${paymentStatus === 'pending' ? 'bg-white shadow-xs text-jetblack' : 'text-gray-500 hover:text-jetblack'}`}
              >
                Pending
              </Link>
              <Link
                href="/orders?paymentStatus=paid"
                className={`px-3 py-1 rounded-md ${paymentStatus === 'paid' ? 'bg-white shadow-xs text-jetblack' : 'text-gray-500 hover:text-jetblack'}`}
              >
                Paid
              </Link>
            </div>
          </div>

          {/* Fulfillment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Fulfillment:</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-bold">
              <Link
                href="/orders"
                className={`px-3 py-1 rounded-md ${!fulfillmentStatus ? 'bg-white shadow-xs text-jetblack' : 'text-gray-500 hover:text-jetblack'}`}
              >
                All
              </Link>
              <Link
                href="/orders?fulfillmentStatus=pending"
                className={`px-3 py-1 rounded-md ${fulfillmentStatus === 'pending' ? 'bg-white shadow-xs text-jetblack' : 'text-gray-500 hover:text-jetblack'}`}
              >
                Pending
              </Link>
              <Link
                href="/orders?fulfillmentStatus=packing"
                className={`px-3 py-1 rounded-md ${fulfillmentStatus === 'packing' ? 'bg-white shadow-xs text-jetblack' : 'text-gray-500 hover:text-jetblack'}`}
              >
                Packing
              </Link>
              <Link
                href="/orders?fulfillmentStatus=delivered"
                className={`px-3 py-1 rounded-md ${fulfillmentStatus === 'delivered' ? 'bg-white shadow-xs text-jetblack' : 'text-gray-500 hover:text-jetblack'}`}
              >
                Delivered
              </Link>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                  <th className="px-6 py-4">Order Ref / Date</th>
                  <th className="px-6 py-4">Student & School</th>
                  <th className="px-6 py-4">Parent / Phone</th>
                  <th className="px-6 py-4">Delivery Address</th>
                  <th className="px-6 py-4">Payment</th>
                  {permissions.canSeePrices && <th className="px-6 py-4">Total Amount</th>}
                  <th className="px-6 py-4">Fulfillment</th>
                  {activeRole !== 'warehouse' && <th className="px-6 py-4">QuickBooks Sync</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={(permissions.canSeePrices ? 7 : 6) + (activeRole !== 'warehouse' ? 1 : 0)} className="px-6 py-12 text-center text-gray-400">
                      No orders matching selection criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <span className="font-mono text-xs block text-gray-500 leading-tight">
                          {ord.id.slice(0, 8)}...
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-1 font-semibold">
                          {new Date(ord.orderDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-bold text-gray-900">
                          {ord.student?.firstName} {ord.student?.lastName}
                        </p>
                        <p className="text-gray-400 mt-0.5">
                          {ord.student?.school.name} ({ord.student?.gradeLevel})
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-bold text-gray-900">
                          {ord.customer.firstName} {ord.customer.lastName}
                        </p>
                        <p className="text-gray-400 mt-0.5">
                          {permissions.canSeeAddresses ? ord.customer.phone || 'N/A' : 'Redacted'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-500 max-w-xs truncate">
                        {formatAddressForRole(ord.customer.deliveryAddress, activeRole)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      {permissions.canSeePrices && (
                        <td className="px-6 py-4 font-bold text-gray-900 text-xs">
                          {formatPriceForRole(ord.totalAmount.toString(), activeRole)}
                        </td>
                      )}
                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            ord.fulfillmentStatus === 'delivered'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : ord.fulfillmentStatus === 'packing'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {ord.fulfillmentStatus}
                        </span>
                      </td>
                      {activeRole !== 'warehouse' && (
                        <td className="px-6 py-4 text-xs">
                          <QbSyncControl
                            orderId={ord.id}
                            initialSyncStatus={ord.quickbooksSyncStatus}
                            invoiceId={ord.quickbooksInvoiceId}
                            paymentStatus={ord.paymentStatus}
                            activeRole={activeRole}
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

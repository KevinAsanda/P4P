import { prisma } from '@p4p/db';
import { getAuthContext } from '@/lib/auth-utils';
import { PERMISSIONS, formatPriceForRole } from '@/lib/rbac';
import DashboardLayout from '@/components/DashboardLayout';
import { DollarSign, ShoppingBag, Box, AlertTriangle, GraduationCap, Building } from 'lucide-react';
import Link from 'next/link';
import { isQbConnected, getQbTokens } from '@/lib/quickbooks';
import QbConnectionManager from '@/components/QbConnectionManager';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const { activeRole, isActualAdmin, userEmail } = await getAuthContext();
  const permissions = PERMISSIONS[activeRole];

  // Initialize analytics variables
  let totalRevenue = 0;
  let orderCount = 0;
  let productCount = 0;
  let lowStockList: any[] = [];
  let topSchools: any[] = [];

  const qbConnected = await isQbConnected();
  const qbTokens = await getQbTokens();
  const qbRealmId = qbTokens?.realmId || '';

  try {
    // 1. Low stock alerts — compare two columns using raw SQL
    const lowStockProducts = await prisma.$queryRaw<any[]>`
      SELECT p.*, s.name AS "supplierName"
      FROM "Product" p
      LEFT JOIN "Supplier" s ON s.id = p."supplierId"
      WHERE p."qtyOnHand" <= p."reorderThreshold"
      ORDER BY p."qtyOnHand" ASC
    `;
    lowStockList = lowStockProducts.map((p: any) => ({
      ...p,
      supplier: p.supplierName ? { name: p.supplierName } : null,
    }));

    // 2. BI Metrics (Authorized roles only)
    if (permissions.canSeeBI) {
      const revenueAggregate = await prisma.salesOrder.aggregate({
        where: { paymentStatus: 'paid' },
        _sum: {
          totalAmount: true,
        },
      });
      totalRevenue = revenueAggregate._sum.totalAmount?.toNumber() || 0;
      orderCount = await prisma.salesOrder.count();
      productCount = await prisma.product.count();

      // Aggregate top schools
      const schools = await prisma.school.findMany({
        include: {
          students: {
            include: {
              orders: true,
            },
          },
        },
      });

      topSchools = schools
        .map((school: any) => {
          const studentCount = school.students.length;
          const orderCount = school.students.reduce((sum: number, st: any) => sum + st.orders.length, 0);
          return {
            name: school.name,
            region: school.region,
            students: studentCount,
            orders: orderCount,
          };
        })
        .sort((a: any, b: any) => b.orders - a.orders)
        .slice(0, 5);
    }
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
  }

  return (
    <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 capitalize">
            {activeRole} Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Real-time overview of Prepped 4 Prep school packages, warehouse stock, and finances.
          </p>
        </div>

        {/* QuickBooks Connection Status (Visible to Admin & Finance) */}
        {(activeRole === 'admin' || activeRole === 'finance') && (
          <QbConnectionManager
            isConnected={qbConnected}
            realmId={qbRealmId}
            activeRole={activeRole}
          />
        )}

        {/* BI Analytics Metrics (Hidden for Warehouse) */}
        {permissions.canSeeBI ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* Total Revenue */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Total Revenue</span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">
                  {formatPriceForRole(totalRevenue, activeRole)}
                </span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Orders Placed</span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">{orderCount}</span>
              </div>
            </div>

            {/* Catalog Items */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-papaya/10 text-caramel rounded-xl">
                <Box className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Catalog Products</span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">{productCount}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Redacted warning panel for warehouse role */
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center py-8">
            <Shield className="h-8 w-8 text-gray-400 mx-auto" />
            <h4 className="font-bold text-gray-800 mt-2">Financial BI Redacted</h4>
            <p className="text-xs text-gray-500 mt-1">
              Your Warehouse clearance level restricts visibility of sales revenue, pricing details, and BI reports.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Low Stock Alerts (All Roles see this, but prices hidden based on role) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-vermillion h-4.5 w-4.5" />
                Low Stock Warning
              </h3>
              <span className="text-xs bg-vermillion/10 text-vermillion px-2.5 py-1 rounded-full font-bold border border-vermillion/20">
                {lowStockList.length} items low
              </span>
            </div>
            
            <div className="flex-1 divide-y divide-gray-150 max-h-96 overflow-y-auto">
              {lowStockList.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  All catalog products have sufficient stock levels.
                </div>
              ) : (
                lowStockList.map((prod) => (
                  <div key={prod.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{prod.itemName}</p>
                      <div className="flex gap-x-2 text-xs text-gray-400 mt-0.5">
                        <span>SKU: {prod.sku}</span>
                        <span>•</span>
                        <span>Supplier: {prod.supplier?.name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-vermillion block">
                        Stock: {prod.qtyOnHand}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Limit: {prod.reorderThreshold}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Schools (Admin/Finance only) */}
          {permissions.canSeeBI && (
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50/50">
                <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                  <GraduationCap className="text-caramel h-4.5 w-4.5" />
                  Top Schools Ranking
                </h3>
              </div>
              
              <div className="flex-1 divide-y divide-gray-150 max-h-96 overflow-y-auto">
                {topSchools.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">No school rankings available yet.</div>
                ) : (
                  topSchools.map((sch, idx) => (
                    <div key={sch.name} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{sch.name}</p>
                          <p className="text-xs text-gray-400">{sch.region}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-jetblack block">
                          {sch.orders} orders
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {sch.students} students
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Icon helper wrapper
function Shield(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8.24-2a1 1 0 0 1 .48 0l8.24 2A1 1 0 0 1 20 6z" />
    </svg>
  );
}

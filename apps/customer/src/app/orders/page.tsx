import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@p4p/db';
import { signout } from '@/app/auth-actions';
import { ShoppingBag, Calendar, ArrowRight, Package, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomerOrdersHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/orders');
  }

  const orders = await prisma.salesOrder.findMany({
    where: { customerId: user.id },
    include: {
      student: {
        include: {
          school: true,
        },
      },
      orderLines: true,
      delivery: true,
    },
    orderBy: {
      orderDate: 'desc',
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-jetblack">
      {/* Header */}
      <header className="border-b border-gray-150 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="relative h-10 w-40 block">
            <Image
              src="/brand/logo-wordmark.svg"
              alt="PREPPED 4 PREP Logo"
              fill
              className="object-contain object-left"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-gray-600 hover:text-jetblack px-3 py-1.5 rounded-lg transition-colors"
            >
              Home
            </Link>
            <form action={signout}>
              <button
                type="submit"
                className="text-xs font-bold text-gray-500 hover:text-jetblack bg-gray-100 hover:bg-gray-200/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-jetblack">My Stationery Orders</h1>
            <p className="text-sm text-gray-500">
              View your past orders, track warehouse packing status, and download invoices.
            </p>
          </div>
          <Link
            href="/#school-picker"
            className="inline-flex items-center gap-2 rounded-xl bg-papaya px-4 py-2.5 text-xs font-bold text-jetblack shadow-xs hover:bg-caramel transition-all self-start"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>New Stationery Pack</span>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-10 text-center space-y-4 shadow-xs">
            <Package className="h-10 w-10 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-jetblack">No Orders Yet</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You haven&apos;t placed a stationery order yet. Pick your child&apos;s school list or upload a list for Preppi to scan!
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/#school-picker"
                className="inline-flex items-center gap-2 rounded-xl bg-jetblack px-5 py-2.5 text-xs font-bold text-white hover:bg-caramel transition-all"
              >
                <span>Find My School List</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-jetblack">
                      P4P-{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {order.fulfillmentStatus}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-jetblack flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-caramel" />
                    <span>
                      {order.student?.firstName} {order.student?.lastName} — {order.student?.school?.name} ({order.student?.gradeLevel})
                    </span>
                  </p>

                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(order.orderDate).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{order.orderLines.length} line items</span>
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                  <span className="text-lg font-black text-caramel">
                    R {Number(order.totalAmount).toFixed(2)}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-jetblack hover:text-white px-3.5 py-2 text-xs font-bold text-jetblack transition-colors"
                  >
                    <span>View Order</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

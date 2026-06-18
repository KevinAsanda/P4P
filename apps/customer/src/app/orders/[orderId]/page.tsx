import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@p4p/db';
import { ShoppingBag, Calendar, Truck, User, ArrowRight } from 'lucide-react';
import { signout } from '@/app/auth-actions';
import { decryptValue } from '@p4p/shared';

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: PageProps) {
  const { orderId } = await params;

  // 1. Authenticate user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch order details with relations
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
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
  });

  if (!order) {
    notFound();
  }

  // 3. Authorization check: Confirm order belongs to the authenticated customer
  if (order.customerId !== user.id) {
    // Prevent cross-user data exposure
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-jetblack">
      {/* Header */}
      <header className="border-b border-gray-150 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="relative h-10 w-40">
            <Image
              src="/brand/logo-wordmark.svg"
              alt="PREPPED 4 PREP Logo"
              fill
              className="object-contain"
            />
          </div>
          <form action={signout}>
            <button
              type="submit"
              className="text-xs font-bold text-gray-500 hover:text-jetblack bg-gray-100 hover:bg-gray-200/50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-6">
        {/* Success Alert */}
        <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-500">
            ✓
          </div>
          <h2 className="text-xl font-extrabold text-jetblack">Order Placed Successfully!</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Thank you! Your child's stationery pack order is registered. We are preparing the school templates and custom tags.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-papaya/10 px-3 py-1 text-xs font-bold text-caramel">
            Payment Status: Pending (Phase 3 PayFast)
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 bg-gray-50 flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Order Reference</span>
              <span className="text-xs font-mono text-gray-600 font-bold">{order.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Order Date</span>
              <span className="text-xs text-gray-600 font-bold flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(order.orderDate).toLocaleDateString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Delivery & Student Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100 pb-6">
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Student & Parent
                </h4>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-jetblack">
                    Student: {order.student?.firstName} {order.student?.lastName}
                  </p>
                  <p className="text-gray-500">School: {order.student?.school.name}</p>
                  <p className="text-gray-500">Grade: {order.student?.gradeLevel}</p>
                  <p className="text-gray-500 mt-2 font-bold">
                    Parent: {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p className="text-gray-400">Email: {order.customer.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  Fulfillment Location
                </h4>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-jetblack">
                    Method: {order.delivery?.deliveryMethod === 'delivery' ? 'Home Courier' : 'Self Collection'}
                  </p>
                  {order.delivery?.deliveryMethod === 'delivery' && (
                    <p className="text-gray-500 leading-relaxed max-w-xs">{decryptValue(order.customer.deliveryAddress)}</p>
                  )}
                  <p className="text-gray-500">Fulfillment Status: {order.fulfillmentStatus}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                Line Items Invoice
              </h4>
              <div className="divide-y divide-gray-100">
                {order.orderLines.map((line) => (
                  <div key={line.id} className="py-3 flex justify-between text-xs items-center">
                    <div>
                      <p className="font-bold text-jetblack">{line.product.itemName}</p>
                      <p className="text-gray-400 mt-0.5">
                        Qty: {line.quantityOrdered} × R {Number(line.unitPriceAtSale).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold">R {Number(line.lineSubTotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Banner */}
            <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
              <div>
                <span className="text-xs text-gray-400 block font-bold">Total Pack Price</span>
                <span className="text-[10px] text-gray-400">VAT Included</span>
              </div>
              <span className="font-black text-2xl text-caramel">R {Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-jetblack px-6 py-3 text-xs font-bold text-white transition-all hover:bg-caramel hover:shadow-md"
          >
            <span>Order Another Stationery Pack</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { prisma } from '@p4p/db';
import { sendOrderReceivedEmail } from '@/lib/notifications';
import { isQbConnected, syncOrderToQuickBooks } from '@/lib/quickbooks';

interface PageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;

  if (orderId) {
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.salesOrder.findUnique({
          where: { id: orderId },
          include: { orderLines: true },
        });

        if (order && order.paymentStatus === 'pending') {
          // Mark order as paid
          await tx.salesOrder.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'paid',
              fulfillmentStatus: 'pending',
            },
          });

          // Deduct product stock
          for (const line of order.orderLines) {
            await tx.product.update({
              where: { id: line.productId },
              data: {
                qtyOnHand: {
                  decrement: line.quantityOrdered,
                },
              },
            });
          }

          // Trigger email receipt
          sendOrderReceivedEmail(orderId).catch((err) =>
            console.error('Failed to send order received email:', err)
          );

          // Automatically attempt QuickBooks sync in background if QuickBooks is connected
          isQbConnected()
            .then((connected) => {
              if (connected) {
                return syncOrderToQuickBooks(orderId);
              }
            })
            .catch((err) =>
              console.error('[AutoSync] Background QB sync failed for order:', orderId, err)
            );
        }
      });
    } catch (err) {
      console.error('[CheckoutSuccess] Error completing order payment status:', err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-jetblack">
      {/* Header */}
      <header className="border-b border-gray-150 bg-white">
        <div className="mx-auto flex max-w-7xl justify-center px-6 py-4">
          <div className="relative h-12 w-48">
            <Image
              src="/brand/logo-wordmark.svg"
              alt="PREPPED 4 PREP Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl max-w-md w-full space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-black text-gray-900">Payment Received!</h1>
          <p className="text-sm text-gray-500">
            Thank you! Your transaction has been successfully processed by PayFast.
          </p>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            {orderId && (
              <Link
                href={`/orders/${orderId}`}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-jetblack py-3.5 px-4 font-bold text-white transition-all hover:bg-caramel hover:shadow-md"
              >
                <span>View Order Details & Invoice</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/"
              className="text-xs font-bold text-gray-400 hover:text-jetblack transition-colors"
            >
              Go back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-150 py-6 bg-white">
        <div className="text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Prepped 4 Prep. Avoid the fuss, trust us.</p>
        </div>
      </footer>
    </div>
  );
}

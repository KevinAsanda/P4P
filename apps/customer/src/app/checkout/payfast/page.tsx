import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@p4p/db';
import { generatePayfastSignature } from '@/lib/payfast';
import { PayFastRedirectForm } from './PayFastRedirectForm';

interface PageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function PayFastRedirectPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;

  if (!orderId) {
    notFound();
  }

  // 1. Verify user is authenticated
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
      student: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Confirm ownership
  if (order.customerId !== user.id) {
    notFound();
  }

  // If already paid, go straight to order details
  if (order.paymentStatus === 'paid') {
    redirect(`/orders/${order.id}`);
  }

  // 3. Compile PayFast transaction payload
  const isLive = process.env.PAYFAST_MODE === 'live';
  const payfastUrl = isLive
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const returnUrl = `${siteUrl}/checkout/success?orderId=${order.id}`;
  const cancelUrl = `${siteUrl}/checkout/cancel?orderId=${order.id}`;
  const notifyUrl = `${siteUrl}/api/payments/payfast-itn`;

  const payload: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: order.customer.firstName,
    name_last: order.customer.lastName,
    email_address: isLive ? order.customer.email : 'sandbox-buyer@prepped4prep.co.za',
    m_payment_id: order.id,
    amount: Number(order.totalAmount).toFixed(2),
    item_name: `P4P Stationery Pack - ${order.student?.firstName || 'Pack'}`,
  };

  // Generate signature using passphrase
  const signature = generatePayfastSignature(payload, process.env.PAYFAST_PASSPHRASE);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 font-sans text-jetblack p-6">
      <PayFastRedirectForm action={payfastUrl} payload={payload} signature={signature} />
    </div>
  );
}


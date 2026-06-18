import { PrismaClient } from '@prisma/client';
import { generatePayfastSignature } from '../../apps/customer/src/lib/payfast';

const prisma = new PrismaClient();

async function main() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('Error: Please provide a SalesOrder ID as an argument.');
    console.log('Usage: pnpm --filter @p4p/db exec tsx simulate-itn.ts <order-id>');
    process.exit(1);
  }

  // Set default sandbox credentials if environment is empty
  process.env.PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '10050325';
  process.env.PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '1iffjh9cf54v4';
  process.env.PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || 'kevinasandamanzini';

  console.log(`\n🔍 Fetching order details for order: ${orderId}...`);
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    console.error(`Error: Order with ID ${orderId} not found in database.`);
    process.exit(1);
  }

  console.log(`Order found: Amount R${Number(order.totalAmount).toFixed(2)}, current status: ${order.paymentStatus}`);

  const itnPayload: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,
    m_payment_id: order.id,
    amount_gross: Number(order.totalAmount).toFixed(2),
    payment_status: 'COMPLETE',
    pf_payment_id: 'pf-ref-local-simulated-' + Date.now(),
  };

  console.log('🔑 Generating PayFast signature using local passphrase...');
  const signature = generatePayfastSignature(itnPayload, process.env.PAYFAST_PASSPHRASE);
  itnPayload.signature = signature;

  const url = 'http://localhost:3000/api/payments/payfast-itn';
  console.log(`📤 Sending simulated ITN webhook POST request to: ${url}...`);

  const formBody = new URLSearchParams();
  for (const [key, val] of Object.entries(itnPayload)) {
    formBody.append(key, val);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formBody.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const responseText = await response.text();
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Response Body: ${responseText}`);

    if (response.ok && responseText.trim() === 'OK') {
      console.log('\n🎉 SUCCESS: Local ITN webhook accepted and processed successfully! Check your order list now.');
    } else {
      console.log('\n⚠️ Failed: Local server rejected the simulated webhook.');
    }
  } catch (err: any) {
    console.error('\n❌ Connection error to local server:', err.message || err);
    console.log('Please ensure that your customer development server is running on http://localhost:3000');
  } finally {
    await prisma.$disconnect();
  }
}

main();

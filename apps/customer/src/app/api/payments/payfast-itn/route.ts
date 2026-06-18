import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@p4p/db';
import { generatePayfastSignature } from '@/lib/payfast';
import { sendOrderReceivedEmail } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    
    // Parse the form urlencoded parameters
    const params = new URLSearchParams(rawBody);
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });

    const signature = data.signature;
    if (!signature) {
      console.error('PayFast ITN failed: Missing signature parameter.');
      return new NextResponse('Missing signature', { status: 400 });
    }

    // 1. Strip signature parameter for verification
    const { signature: _, ...paramsWithoutSig } = data;

    // 2. Validate local signature matches
    const localSig = generatePayfastSignature(paramsWithoutSig, process.env.PAYFAST_PASSPHRASE);
    if (localSig !== signature) {
      console.error('PayFast ITN failed: Signature validation mismatch.', { localSig, receivedSig: signature });
      return new NextResponse('Signature mismatch', { status: 400 });
    }

    // 3. Verify transaction source directly with PayFast
    const isLive = process.env.PAYFAST_MODE === 'live';
    const validateUrl = isLive
      ? 'https://www.payfast.co.za/eng/query/validate'
      : 'https://sandbox.payfast.co.za/eng/query/validate';

    const verificationResponse = await fetch(validateUrl, {
      method: 'POST',
      body: rawBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const verificationResult = await verificationResponse.text();
    if (verificationResult !== 'VALID') {
      console.error('PayFast ITN failed: Origin validation request returned:', verificationResult);
      return new NextResponse('ITN origin verification failed', { status: 400 });
    }

    // 4. Verify correct merchant account
    const receiverId = data.merchant_id;
    if (receiverId !== process.env.PAYFAST_MERCHANT_ID) {
      console.error('PayFast ITN failed: Merchant ID mismatch.', { expected: process.env.PAYFAST_MERCHANT_ID, received: receiverId });
      return new NextResponse('Merchant mismatch', { status: 400 });
    }

    // 5. Update order details in database
    const orderId = data.m_payment_id;
    const paymentStatus = data.payment_status;

    if (paymentStatus === 'COMPLETE') {
      // Execute transactionally
      await prisma.$transaction(async (tx: any) => {
        const order = await tx.salesOrder.findUnique({
          where: { id: orderId },
          include: { orderLines: true },
        });

        if (!order) {
          throw new Error(`Order ${orderId} not found in database.`);
        }

        if (order.paymentStatus === 'paid') {
          // Already processed
          console.log(`PayFast ITN: Order ${orderId} was already marked as paid.`);
          return;
        }

        // Update order status to paid
        await tx.salesOrder.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'paid',
            fulfillmentStatus: 'pending',
          },
        });

        // Deduct inventory for each product line item
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
      });
      
      console.log(`PayFast ITN Success: Order ${orderId} is paid. QtyOnHand decremented.`);
      
      // Fire customer email receipt asynchronously
      sendOrderReceivedEmail(orderId).catch((err) => {
        console.error('Failed to send order received email:', err);
      });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('PayFast ITN Handler Error:', error);
    return new NextResponse(`Internal Server Error: ${error?.message || error}`, { status: 500 });
  }
}

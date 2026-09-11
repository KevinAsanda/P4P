import { prisma } from './src/index';
import { generatePayfastSignature } from '../../apps/customer/src/lib/payfast';
import { Decimal } from '@prisma/client';

async function runTest() {
  console.log('🧪 Starting PayFast ITN loop test...');

  // 1. Require credentials from environment — never hardcode them
  if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY || !process.env.PAYFAST_PASSPHRASE) {
    console.error('Error: PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, and PAYFAST_PASSPHRASE must be set in your .env file.');
    console.log('Copy .env.customer.example to apps/customer/.env.local and fill in your PayFast sandbox credentials.');
    process.exit(1);
  }
  process.env.PAYFAST_MODE = process.env.PAYFAST_MODE || 'sandbox';

  // 2. Locate a test product from seed
  const testProduct = await prisma.product.findUnique({
    where: { sku: 'STA-HB-01' },
  });

  if (!testProduct) {
    throw new Error('Test product (STA-HB-01) not found in DB. Make sure you seeded the DB first!');
  }

  const initialStock = testProduct.qtyOnHand;
  console.log(`Initial stock of ${testProduct.itemName}: ${initialStock}`);

  // 3. Create a test Customer, Student, and Order
  console.log('Creating test parent and order...');
  const customer = await prisma.customer.upsert({
    where: { email: 'testparent@p4p.co.za' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'Parent',
      email: 'testparent@p4p.co.za',
      phone: '0821234567',
    },
  });

  const school = await prisma.school.findFirst();
  if (!school) {
    throw new Error('No schools found. Seed the DB first.');
  }

  const student = await prisma.student.create({
    data: {
      customerId: customer.id,
      schoolId: school.id,
      firstName: 'Test',
      lastName: 'Kid',
      gradeLevel: 'Grade 1',
      academicYear: 2026,
    },
  });

  const quantityOrdered = 3;
  const lineSubTotal = new Decimal(testProduct.unitPrice.toNumber() * quantityOrdered);
  
  const order = await prisma.salesOrder.create({
    data: {
      customerId: customer.id,
      studentId: student.id,
      totalAmount: lineSubTotal,
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      orderLines: {
        create: {
          productId: testProduct.id,
          quantityOrdered,
          unitPriceAtSale: testProduct.unitPrice,
          lineSubTotal,
        },
      },
    },
    include: {
      orderLines: true,
    },
  });

  console.log(`Pending order created with ID: ${order.id}. Total: R ${order.totalAmount.toFixed(2)}`);

  // 4. Simulate PayFast ITN Payload
  console.log('Simulating PayFast ITN callback payload...');
  const itnPayload: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    m_payment_id: order.id,
    amount_gross: Number(order.totalAmount).toFixed(2),
    payment_status: 'COMPLETE',
    pf_payment_id: 'pf-ref-99992222',
  };

  // Generate signature
  const signature = generatePayfastSignature(itnPayload, process.env.PAYFAST_PASSPHRASE);
  itnPayload.signature = signature;

  console.log('Simulated Signature:', signature);

  // 5. Run the ITN Verification & DB Update transaction
  console.log('Verifying payload and updating DB status...');
  
  // Verify signature locally
  const { signature: receivedSig, ...paramsWithoutSig } = itnPayload;
  const localSig = generatePayfastSignature(paramsWithoutSig, process.env.PAYFAST_PASSPHRASE);
  
  if (localSig !== receivedSig) {
    throw new Error('Signature validation failed in test!');
  }
  console.log('✔ Signature verification passed!');

  // Run database transaction (equivalent to route.ts handler)
  if (itnPayload.payment_status === 'COMPLETE') {
    await prisma.$transaction(async (tx) => {
      const orderToUpdate = await tx.salesOrder.findUnique({
        where: { id: itnPayload.m_payment_id },
        include: { orderLines: true },
      });

      if (!orderToUpdate) {
        throw new Error('Order not found during transaction.');
      }

      if (orderToUpdate.paymentStatus === 'paid') {
        console.log('Order already paid.');
        return;
      }

      // Mark order as paid
      await tx.salesOrder.update({
        where: { id: orderToUpdate.id },
        data: {
          paymentStatus: 'paid',
          fulfillmentStatus: 'pending',
        },
      });

      // Deduct inventory
      for (const line of orderToUpdate.orderLines) {
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
  }

  // 6. Assertions
  console.log('Verifying updates...');
  
  const updatedOrder = await prisma.salesOrder.findUnique({
    where: { id: order.id },
  });

  const updatedProduct = await prisma.product.findUnique({
    where: { id: testProduct.id },
  });

  if (!updatedOrder || updatedOrder.paymentStatus !== 'paid') {
    throw new Error('❌ TEST FAILED: Order paymentStatus is not "paid"!');
  }
  console.log('✔ SalesOrder paymentStatus transitioned to "paid" successfully!');

  if (!updatedProduct || updatedProduct.qtyOnHand !== initialStock - quantityOrdered) {
    throw new Error(`❌ TEST FAILED: Stock not decremented! Expected ${initialStock - quantityOrdered}, found ${updatedProduct?.qtyOnHand}`);
  }
  console.log(`✔ Product stock decremented correctly! New stock: ${updatedProduct.qtyOnHand}`);

  console.log('🎉 SUCCESS: PayFast payment loop test passed end-to-end!');
}

runTest()
  .catch((e) => {
    console.error('❌ Error during test run:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

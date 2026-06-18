'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@p4p/db';
import { encryptValue, isAllowedRateLimit } from '@p4p/shared';
import { headers } from 'next/headers';

export async function createCheckoutOrder(
  cartData: any,
  customerData: any,
  studentData: any,
  consentChecked: boolean
) {
  // 1. Rate limiting (IP-based, max 5 checkout requests per 10 minutes)
  const headersList = await headers();
  const xForwardedFor = headersList.get('x-forwarded-for');
  const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : '127.0.0.1';

  if (!isAllowedRateLimit(`checkout:${ip}`, 5, 10 * 60 * 1000)) {
    throw new Error('Too many checkout attempts. Please try again in 10 minutes.');
  }

  // 2. Check Authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to check out.');
  }

  // 3. POPIA Consent Enforcer
  if (!consentChecked) {
    throw new Error('You must accept the POPIA privacy notice and consent terms to checkout.');
  }

  // 4. Input Validations
  if (!customerData.firstName || customerData.firstName.trim().length === 0) {
    throw new Error('Parent First Name is required.');
  }
  if (!customerData.lastName || customerData.lastName.trim().length === 0) {
    throw new Error('Parent Last Name is required.');
  }
  if (!customerData.phone || customerData.phone.trim().length === 0) {
    throw new Error('Parent Phone Number is required.');
  }

  // Regex matches 9 to 15 characters, allowing digits, spaces, parentheses, dashes
  const phoneRegex = /^\+?[0-9\s\-()]{9,15}$/;
  if (!phoneRegex.test(customerData.phone.trim())) {
    throw new Error('Invalid phone number format. Please provide a valid contact number.');
  }

  const deliveryMethod = customerData.deliveryMethod || 'delivery';
  if (deliveryMethod === 'delivery' && (!customerData.deliveryAddress || customerData.deliveryAddress.trim().length === 0)) {
    throw new Error('Delivery address is required for the delivery fulfillment option.');
  }

  if (!studentData.firstName || studentData.firstName.trim().length === 0) {
    throw new Error('Student First Name is required.');
  }
  if (!studentData.lastName || studentData.lastName.trim().length === 0) {
    throw new Error('Student Last Name is required.');
  }

  // 5. Encrypt Sensitive Customer Columns
  const encryptedPhone = encryptValue(customerData.phone.trim());
  const encryptedAddress = deliveryMethod === 'delivery' ? encryptValue(customerData.deliveryAddress.trim()) : null;

  // 6. Upsert Customer details
  const customer = await prisma.customer.upsert({
    where: { email: user.email! },
    update: {
      id: user.id,
      firstName: customerData.firstName.trim(),
      lastName: customerData.lastName.trim(),
      phone: encryptedPhone,
      deliveryAddress: encryptedAddress,
      consentFlag: new Date(), // timestamped POPIA consent
    },
    create: {
      id: user.id,
      email: user.email!,
      firstName: customerData.firstName.trim(),
      lastName: customerData.lastName.trim(),
      phone: encryptedPhone,
      deliveryAddress: encryptedAddress,
      consentFlag: new Date(),
    },
  });

  // 2. Lookup school id by name
  let school = await prisma.school.findFirst({
    where: { name: cartData.schoolName },
  });

  if (!school) {
    // Self-heal: If school is not found (e.g. "Custom List" or user typed a new school name),
    // register it on the fly to avoid crashing checkout.
    school = await prisma.school.create({
      data: {
        name: cartData.schoolName,
        region: 'Durban Central',
        contactPerson: 'Ad-hoc Customer Import',
        isActive: true,
      },
    });
  }

  // 3. Create Student
  const student = await prisma.student.create({
    data: {
      customerId: customer.id,
      schoolId: school.id,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      gradeLevel: cartData.gradeLevel,
      academicYear: Number(cartData.academicYear),
    },
  });

  // 4. Create Sales Order
  const order = await prisma.salesOrder.create({
    data: {
      customerId: customer.id,
      studentId: student.id,
      totalAmount: cartData.grandTotal,
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      quickbooksSyncStatus: 'pending',
    },
  });

  // 5. Create Order Lines
  const allLines = [...cartData.items, ...cartData.services];
  for (const item of allLines) {
    await prisma.orderLine.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        quantityOrdered: item.quantity,
        unitPriceAtSale: item.price,
        lineSubTotal: item.subtotal,
        isPacked: false,
      },
    });
  }

  // 6. Create Delivery record
  await prisma.delivery.create({
    data: {
      orderId: order.id,
      deliveryMethod: customerData.deliveryMethod || 'delivery',
      scheduledDate: null,
      actualDate: null,
      proofOfDeliveryUrl: null,
    },
  });

  return { orderId: order.id };
}

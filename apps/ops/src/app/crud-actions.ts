'use server';

import { prisma } from '@p4p/db';
import { getActiveRole } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { sendOrderPackedEmail, sendOrderDispatchedEmail, sendOrderDeliveredEmail } from '@/lib/notifications';
import { writeAuditLog } from '@/lib/audit';

// Helper to assert admin role
async function assertAdmin() {
  const role = await getActiveRole();
  if (role !== 'admin') {
    throw new Error('Unauthorized: Admin security clearance required.');
  }
}

// Helper to assert finance or admin role
async function assertStaff() {
  const role = await getActiveRole();
  if (role !== 'admin' && role !== 'finance') {
    throw new Error('Unauthorized: Staff security clearance required.');
  }
}

/* --- School CRUD Actions --- */
export async function createSchool(formData: FormData) {
  await assertAdmin();

  const name = formData.get('name') as string;
  const region = formData.get('region') as string;
  const contactPerson = formData.get('contactPerson') as string;

  if (!name || !region) {
    throw new Error('Name and Region are required.');
  }

  const school = await prisma.school.create({
    data: {
      name,
      region,
      contactPerson,
      isActive: true,
    },
  });

  await writeAuditLog('CREATE_SCHOOL', school.id, `Name: ${name}, Region: ${region}`);

  revalidatePath('/schools');
}

export async function toggleSchoolActive(schoolId: string, currentState: boolean) {
  await assertAdmin();

  await prisma.school.update({
    where: { id: schoolId },
    data: { isActive: !currentState },
  });

  await writeAuditLog('TOGGLE_SCHOOL_ACTIVE', schoolId, `New active state: ${!currentState}`);

  revalidatePath('/schools');
}

/* --- Supplier CRUD Actions --- */
export async function createSupplier(formData: FormData) {
  await assertStaff();

  const name = formData.get('name') as string;
  const contactName = formData.get('contactName') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const leadTime = formData.get('averageLeadTimeDays') as string;

  if (!name) {
    throw new Error('Supplier name is required.');
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      contactName,
      phone,
      email,
      averageLeadTimeDays: leadTime ? Number(leadTime) : null,
    },
  });

  await writeAuditLog('CREATE_SUPPLIER', supplier.id, `Name: ${name}, Email: ${email}`);

  revalidatePath('/suppliers');
}

/* --- Product CRUD Actions --- */
export async function createProduct(formData: FormData) {
  await assertAdmin();

  const itemName = formData.get('itemName') as string;
  const sku = formData.get('sku') as string;
  const brand = formData.get('brand') as string;
  const price = formData.get('unitPrice') as string;
  const qty = formData.get('qtyOnHand') as string;
  const threshold = formData.get('reorderThreshold') as string;
  const category = formData.get('category') as string;
  const supplierId = formData.get('supplierId') as string;

  if (!itemName || !sku || !price || !category) {
    throw new Error('Required fields: Item Name, SKU, Price, Category');
  }

  const product = await prisma.product.create({
    data: {
      itemName,
      sku,
      brand,
      unitPrice: parseFloat(price) || 0,
      qtyOnHand: qty ? Number(qty) : 0,
      reorderThreshold: threshold ? Number(threshold) : 0,
      category,
      supplierId: supplierId || null,
    },
  });

  await writeAuditLog('CREATE_PRODUCT', product.id, `SKU: ${sku}, Category: ${category}, Price: ${price}`);

  revalidatePath('/products');
}

export async function updateProductStock(productId: string, qty: number) {
  await assertAdmin();

  await prisma.product.update({
    where: { id: productId },
    data: { qtyOnHand: qty },
  });

  await writeAuditLog('UPDATE_PRODUCT_STOCK', productId, `New quantity: ${qty}`);

  revalidatePath('/products');
  revalidatePath('/');
}

/* --- Template CRUD Actions --- */
export async function createSchoolTemplate(formData: FormData) {
  await assertAdmin();

  const schoolId = formData.get('schoolId') as string;
  const name = formData.get('name') as string;
  const gradeLevel = formData.get('gradeLevel') as string;
  const academicYear = formData.get('academicYear') as string;

  if (!schoolId || !name || !gradeLevel || !academicYear) {
    throw new Error('All template fields are required.');
  }

  const template = await prisma.schoolTemplate.create({
    data: {
      schoolId,
      name,
      gradeLevel,
      academicYear: Number(academicYear),
      isActive: true,
    },
  });

  await writeAuditLog('CREATE_SCHOOL_TEMPLATE', template.id, `Name: ${name}, Grade: ${gradeLevel}`);

  revalidatePath('/templates');
}

/* --- Warehouse Packing Actions --- */
export async function assertPackingStaff() {
  const role = await getActiveRole();
  if (role !== 'admin' && role !== 'warehouse') {
    throw new Error('Unauthorized: Warehouse or Admin security clearance required.');
  }
}

export async function updateOrderFulfillmentStatus(orderId: string, status: string) {
  await assertPackingStaff();

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: { fulfillmentStatus: status },
  });

  await writeAuditLog('UPDATE_ORDER_FULFILLMENT_STATUS', orderId, `New status: ${status}`);

  // Trigger emails asynchronously (do not block database callback / path revalidation)
  if (status === 'packed') {
    sendOrderPackedEmail(orderId).catch((err) => console.error('Error sending packed email:', err));
  } else if (status === 'dispatched') {
    sendOrderDispatchedEmail(orderId).catch((err) => console.error('Error sending dispatched email:', err));
  } else if (status === 'delivered') {
    sendOrderDeliveredEmail(orderId).catch((err) => console.error('Error sending delivered email:', err));
  }

  revalidatePath('/packing');
  revalidatePath('/orders');
  revalidatePath('/');
}

export async function updateOrderLinePacked(orderLineId: string, isPacked: boolean) {
  await assertPackingStaff();

  const line = await prisma.orderLine.update({
    where: { id: orderLineId },
    data: { isPacked },
    include: {
      order: {
        include: {
          orderLines: true,
        },
      },
    },
  });

  await writeAuditLog('UPDATE_ORDER_LINE_PACKED', orderLineId, `isPacked: ${isPacked}, OrderId: ${line.orderId}`);

  // Check if all lines are now packed
  const allPacked = line.order.orderLines.every((l: any) => l.isPacked);
  if (allPacked && line.order.fulfillmentStatus !== 'packed') {
    await prisma.salesOrder.update({
      where: { id: line.order.id },
      data: { fulfillmentStatus: 'packed' },
    });

    // Trigger email notification for full verification check
    sendOrderPackedEmail(line.order.id).catch((err) =>
      console.error('Error sending packed email from checklist update:', err)
    );
  } else if (!allPacked && line.order.fulfillmentStatus === 'packed') {
    // If we unmarked one, revert back to packing
    await prisma.salesOrder.update({
      where: { id: line.order.id },
      data: { fulfillmentStatus: 'packing' },
    });
  }

  revalidatePath('/packing');
  revalidatePath('/orders');
  revalidatePath('/');
}

export async function resetOrderPacking(orderId: string) {
  await assertPackingStaff();

  await prisma.$transaction([
    prisma.orderLine.updateMany({
      where: { orderId },
      data: { isPacked: false },
    }),
    prisma.salesOrder.update({
      where: { id: orderId },
      data: { fulfillmentStatus: 'pending' },
    }),
  ]);

  await writeAuditLog('RESET_ORDER_PACKING', orderId, 'Reset fulfillment and packing state');

  revalidatePath('/packing');
  revalidatePath('/orders');
  revalidatePath('/');
}

export async function confirmDelivery(
  orderId: string,
  proofOfDeliveryDataUrl: string,
  latitude: number | null,
  longitude: number | null
) {
  await assertPackingStaff();

  const now = new Date();

  // 1. Update the delivery record
  await prisma.delivery.update({
    where: { orderId },
    data: {
      actualDate: now,
      proofOfDeliveryUrl: proofOfDeliveryDataUrl,
    },
  });

  // 2. Fetch existing sales order notes and append GPS/timestamp
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
  });

  const gpsString = latitude ? `Lat: ${latitude}, Lng: ${longitude}` : 'Denied/Not available';
  const updatedNotes = order?.notes
    ? `${order.notes}\n[Fulfillment] Delivered at ${now.toLocaleString()} (GPS: ${gpsString})`
    : `Delivered at ${now.toLocaleString()} (GPS: ${gpsString})`;

  // 3. Update the SalesOrder status to delivered and write logs to notes
  await prisma.salesOrder.update({
    where: { id: orderId },
    data: {
      fulfillmentStatus: 'delivered',
      notes: updatedNotes,
    },
  });

  await writeAuditLog('CONFIRM_DELIVERY', orderId, `Delivery confirmed. GPS: Lat ${latitude}, Lng ${longitude}`);

  // 4. Trigger Delivered Email Notification
  await sendOrderDeliveredEmail(orderId);

  revalidatePath('/delivery');
  revalidatePath('/orders');
  revalidatePath('/');
}



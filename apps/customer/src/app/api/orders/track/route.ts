import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@p4p/db';
import { isAllowedRateLimit } from '@p4p/shared';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (!(await isAllowedRateLimit(`track:${ip}`, 15, 10 * 60 * 1000))) {
    return NextResponse.json(
      { found: false, error: 'Too many tracking requests. Please try again in a few minutes.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q')?.trim();

  if (!rawQuery || rawQuery.length < 6) {
    return NextResponse.json(
      { found: false, error: 'Please enter at least 6 characters of your order reference or your full email address.' },
      { status: 400 }
    );
  }

  // Strip optional "P4P-" prefix if customer pasted the formatted reference
  const normalizedOrderQuery = rawQuery.replace(/^P4P-/i, '').toLowerCase();

  try {
    // 1. Search DB for order by ID prefix (min 6 chars), ID exact, or exact customer email
    const order = await prisma.salesOrder.findFirst({
      where: {
        OR: [
          { id: { startsWith: normalizedOrderQuery, mode: 'insensitive' } },
          { customer: { email: { equals: rawQuery, mode: 'insensitive' } } },
        ],
      },
      include: {
        customer: true,
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

    if (order) {
      const maskedLastName = order.customer.lastName
        ? `${order.customer.lastName.charAt(0).toUpperCase()}.`
        : '';
      return NextResponse.json({
        found: true,
        orderId: `P4P-${order.id.slice(0, 8).toUpperCase()}`,
        customerName: `${order.customer.firstName} ${maskedLastName}`.trim(),
        schoolName: order.student?.school?.name || 'Durban Primary School',
        gradeLevel: order.student?.gradeLevel || 'Grade 1',
        orderDate: new Date(order.orderDate).toLocaleDateString('en-ZA'),
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        itemCount: order.orderLines.length,
        deliveryMethod: order.delivery?.deliveryMethod || 'Delivery',
      });
    }

    // 2. Return not found
    return NextResponse.json({ found: false, error: 'No order matching that reference or email was found.' }, { status: 404 });
  } catch (error) {
    console.error('[Track Order API] Error:', error);
    return NextResponse.json({ found: false, error: 'Server error retrieving order status.' }, { status: 500 });
  }
}

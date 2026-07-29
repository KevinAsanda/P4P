import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@p4p/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json({ found: false, error: 'Query parameter is required.' }, { status: 400 });
  }

  try {
    // 1. Search DB for order by ID prefix, ID exact, or customer email
    const order = await prisma.salesOrder.findFirst({
      where: {
        OR: [
          { id: { startsWith: query } },
          { customer: { email: { equals: query, mode: 'insensitive' } } },
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
      return NextResponse.json({
        found: true,
        orderId: `P4P-${order.id.slice(0, 8).toUpperCase()}`,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
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

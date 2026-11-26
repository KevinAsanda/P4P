import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@p4p/db';
import { getActiveRole, getAuthenticatedUserId } from '@/lib/auth-utils';
import { writeAuditLog } from '@/lib/audit';
import { sendOrderPackedEmail } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const [role, userId] = await Promise.all([getActiveRole(), getAuthenticatedUserId()]);
    if (userId === 'unauthenticated' || (role !== 'admin' && role !== 'warehouse')) {
      return NextResponse.json({ error: 'Unauthorized: Warehouse or Admin clearance required' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, sku } = body;

    if (!orderId || !sku) {
      return NextResponse.json({ error: 'Order ID and SKU are required' }, { status: 400 });
    }

    const cleanSku = String(sku).trim().toUpperCase();

    // 1. Fetch order lines for this order
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        orderLines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Find matching line item by product SKU
    const matchingLine = order.orderLines.find(
      (line) => line.product.sku.toUpperCase() === cleanSku
    );

    if (!matchingLine) {
      return NextResponse.json(
        {
          error: `SKU Mismatch! "${cleanSku}" is not on this packing list.`,
          code: 'SKU_MISMATCH',
        },
        { status: 400 }
      );
    }

    if (matchingLine.isPacked) {
      return NextResponse.json({
        alreadyPacked: true,
        message: `"${matchingLine.product.itemName}" is already packed.`,
        itemName: matchingLine.product.itemName,
        orderLineId: matchingLine.id,
      });
    }

    // 3. Mark order line as packed
    await prisma.orderLine.update({
      where: { id: matchingLine.id },
      data: { isPacked: true },
    });

    await writeAuditLog('SCAN_PACK_ITEM', matchingLine.id, `SKU: ${cleanSku}, OrderId: ${orderId}`);

    // 4. Check if order status needs to transition to 'packing' or 'packed'
    const updatedLines = await prisma.orderLine.findMany({
      where: { orderId },
    });

    const allPacked = updatedLines.every((l) => l.isPacked);
    const newStatus = allPacked ? 'packed' : 'packing';

    if (order.fulfillmentStatus !== newStatus) {
      await prisma.salesOrder.update({
        where: { id: orderId },
        data: {
          fulfillmentStatus: newStatus,
          packedByStaffId: userId,
        },
      });

      if (allPacked) {
        sendOrderPackedEmail(orderId).catch((err) =>
          console.error('[Packing Scan API] Error sending packed email:', err)
        );
      }
    }

    return NextResponse.json({
      success: true,
      orderLineId: matchingLine.id,
      itemName: matchingLine.product.itemName,
      sku: matchingLine.product.sku,
      orderFullyPacked: allPacked,
    });
  } catch (error: any) {
    console.error('[Packing Scan API Error]:', error);
    return NextResponse.json({ error: error.message || 'Scan verification failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const [role, userId] = await Promise.all([getActiveRole(), getAuthenticatedUserId()]);
    if (userId === 'unauthenticated' || (role !== 'admin' && role !== 'warehouse')) {
      return NextResponse.json({ error: 'Unauthorized: Warehouse or Admin clearance required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });
    }

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        orderLines: {
          select: {
            id: true,
            productId: true,
            isPacked: true,
            product: {
              select: {
                sku: true,
                itemName: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const packedLineIds = order.orderLines.filter((l) => l.isPacked).map((l) => l.id);
    const totalLines = order.orderLines.length;

    return NextResponse.json({
      orderId: order.id,
      fulfillmentStatus: order.fulfillmentStatus,
      packedLineIds,
      packedCount: packedLineIds.length,
      totalLines,
      isFullyPacked: packedLineIds.length === totalLines,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch session status' }, { status: 500 });
  }
}

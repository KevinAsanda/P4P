'use server';

import { getActiveRole } from '@/lib/auth-utils';
import {
  isQbConnected,
  syncOrderToQuickBooks,
  pullInvoiceStatus,
} from '@/lib/quickbooks';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { writeAuditLog } from '@/lib/audit';

const TOKEN_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'qb-tokens.json');

// Assert that the user is Admin or Finance staff
async function assertFinanceOrAdmin() {
  const role = await getActiveRole();
  if (role !== 'admin' && role !== 'finance') {
    throw new Error('Unauthorized: Admin or Finance clearance required for QuickBooks sync.');
  }
}

export async function checkQuickBooksConnection() {
  // Available to admin & finance in UI
  return isQbConnected();
}

export async function syncOrderToQuickBooksAction(orderId: string) {
  await assertFinanceOrAdmin();
  try {
    const result = await syncOrderToQuickBooks(orderId);
    await writeAuditLog('SYNC_ORDER_TO_QUICKBOOKS', orderId, `Success: ${result.success}`);
    revalidatePath('/orders');
    revalidatePath('/');
    return result;
  } catch (error: any) {
    await writeAuditLog('SYNC_ORDER_TO_QUICKBOOKS_FAILED', orderId, `Error: ${error.message || error}`);
    return { success: false, error: error.message || error };
  }
}

export async function verifyInvoiceStatusAction(orderId: string) {
  await assertFinanceOrAdmin();
  try {
    const result = await pullInvoiceStatus(orderId);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message || error };
  }
}

export async function disconnectQuickBooksAction() {
  await assertFinanceOrAdmin();
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      fs.unlinkSync(TOKEN_FILE_PATH);
    }
    await writeAuditLog('DISCONNECT_QUICKBOOKS', null, 'QuickBooks integration disconnected');
    revalidatePath('/');
    revalidatePath('/orders');
    return { success: true };
  } catch (error: any) {
    await writeAuditLog('DISCONNECT_QUICKBOOKS_FAILED', null, `Error: ${error.message || error}`);
    return { success: false, error: error.message || error };
  }
}

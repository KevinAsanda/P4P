import { prisma } from '@p4p/db';
import { getActiveRole } from './auth-utils';

/**
 * Write an append-only audit log entry into the database.
 */
export async function writeAuditLog(
  action: string,
  targetId?: string | null,
  details?: string | null
) {
  try {
    const role = await getActiveRole();
    const staffId = `staff-${role}`; // Mock staff ID since role-based cookie is used for auth in MVP

    await prisma.auditLog.create({
      data: {
        staffId,
        role,
        action,
        targetId: targetId || null,
        details: details || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

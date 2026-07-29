import { prisma } from '@p4p/db';
import { getActiveRole, getAuthenticatedUserId } from './auth-utils';

/**
 * Write an append-only audit log entry.
 * Records the real authenticated user's UUID as staffId — never a synthetic string.
 */
export async function writeAuditLog(
  action: string,
  targetId?: string | null,
  details?: string | null
) {
  try {
    // Fetch role and real user ID in parallel
    const [role, staffId] = await Promise.all([
      getActiveRole(),
      getAuthenticatedUserId(),
    ]);

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
    // Audit log failures must never crash the primary operation
    console.error('Failed to write audit log:', err);
  }
}

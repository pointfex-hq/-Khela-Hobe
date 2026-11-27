import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export interface AuditInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  request?: NextRequest;
}

/**
 * Safely writes an AuditLog entry without blocking primary mutations on telemetry failures.
 */
export async function recordAuditLog({
  userId = null,
  action,
  entityType,
  entityId = null,
  notes = null,
  metadata = null,
  request,
}: AuditInput): Promise<void> {
  try {
    const ipAddress = request
      ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null
      : null;
    const userAgent = request ? request.headers.get('user-agent')?.slice(0, 300) || null : null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        ipAddress,
        userAgent,
        notes,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  } catch (err) {
    console.warn('[AuditLog] Write failed:', err instanceof Error ? err.message : err);
  }
}

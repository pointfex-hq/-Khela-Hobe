import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toEpoch, toPageResponse } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { page, size, skip, searchParams } = parsePagination(request.url, 30);
    const actionFilter = searchParams.get('action')?.trim();
    const entityTypeFilter = searchParams.get('entityType')?.trim();
    const q = searchParams.get('q')?.trim();

    const where: Prisma.AuditLogWhereInput = {};
    if (actionFilter && actionFilter !== 'ALL') {
      where.action = actionFilter;
    }
    if (entityTypeFilter && entityTypeFilter !== 'ALL') {
      where.entityType = entityTypeFilter;
    }
    if (q) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 30,
      });
      const userIds = matchingUsers.map((u) => u.id);
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { entityType: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
      ];
    }

    const [logs, total, actionGroups] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: size,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
      }),
    ]);

    const actorIds = Array.from(new Set(logs.map((l) => l.userId).filter(Boolean) as string[]));
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: {
            id: true,
            fullName: true,
            email: true,
            roles: { select: { role: true } },
          },
        })
      : [];
    const actorMap = new Map(actors.map((a) => [a.id, a]));

    const content = logs.map((l) => {
      const actor = l.userId ? actorMap.get(l.userId) : null;
      return {
        id: l.id,
        userId: l.userId,
        actorName: actor?.fullName || (l.userId ? l.userId : 'System'),
        actorEmail: actor?.email || null,
        actorRoles: actor?.roles?.map((r) => r.role) || [],
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        ipAddress: l.ipAddress,
        notes: l.notes,
        metadata: l.metadata ?? null,
        createdAt: toEpoch(l.createdAt),
      };
    });

    return ok({
      ...toPageResponse(content, page, size, total),
      availableActions: actionGroups.map((g) => g.action).sort(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

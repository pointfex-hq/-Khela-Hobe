import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const links = await prisma.guardianLinkRequest.findMany({
      where: {
        guardianId: session.userId,
        status: { not: 'REVOKED' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (links.length === 0) {
      return ok([]);
    }

    const childIds = Array.from(new Set(links.map((l) => l.childId)));
    const [children, relationships] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: childIds } },
        include: {
          playerProfile: {
            include: { safetyProfile: true },
          },
        },
      }),
      prisma.guardianRelationship.findMany({
        where: { guardianId: session.userId, childId: { in: childIds }, active: true },
      }),
    ]);

    const childMap = new Map(children.map((c) => [c.id, c]));
    const relMap = new Map(relationships.map((r) => [r.childId, r]));

    const result = links.map((link) => {
      const child = childMap.get(link.childId);
      const rel = relMap.get(link.childId);
      const isVerified = link.status === 'VERIFIED';
      return {
        id: link.id,
        childId: link.childId,
        childDisplayName: child?.fullName ?? 'Linked Player',
        childProfileImageUrl: child?.profileImageUrl ?? null,
        childSafetyId: child?.playerProfile?.safetyProfile?.safetyId ?? null,
        relationship: rel?.relationship ?? 'Guardian',
        status: isVerified ? 'ACTIVE' : link.status,
        isVerified,
        createdAt: toEpoch(link.createdAt),
      };
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

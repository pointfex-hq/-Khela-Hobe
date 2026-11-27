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
        childId: session.userId,
        status: { in: ['PENDING', 'PENDING_CONSENT', 'VERIFIED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (links.length === 0) {
      return ok([]);
    }

    const guardianIds = Array.from(new Set(links.map((l) => l.guardianId)));
    const [guardians, relationships] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: guardianIds } },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          profileImageUrl: true,
          city: true,
          area: true,
        },
      }),
      prisma.guardianRelationship.findMany({
        where: { childId: session.userId, guardianId: { in: guardianIds } },
      }),
    ]);

    const guardianMap = new Map(guardians.map((g) => [g.id, g]));
    const relMap = new Map(relationships.map((r) => [r.guardianId, r]));

    const result = links.map((link) => {
      const guardian = guardianMap.get(link.guardianId);
      const rel = relMap.get(link.guardianId);
      return {
        id: link.id,
        requestId: link.requestId,
        guardianId: link.guardianId,
        guardianName: guardian?.fullName || 'Guardian',
        guardianEmail: guardian?.email || null,
        guardianPhone: guardian?.phoneNumber || null,
        guardianProfileImageUrl: guardian?.profileImageUrl || null,
        relationship: rel?.relationship || 'Guardian',
        status: link.status,
        verifiedAt: toEpoch(link.verifiedAt),
        createdAt: toEpoch(link.createdAt),
      };
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

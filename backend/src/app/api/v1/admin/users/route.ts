import { NextRequest } from 'next/server';
import { OrganizerApprovalStatus, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { toUserDto, verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { page, size, skip, searchParams } = parsePagination(request.url, 20);
    const q = searchParams.get('q')?.trim();
    const approvalStatusParam = searchParams.get('approvalStatus')?.trim()?.toUpperCase();

    const where: Prisma.UserWhereInput = {
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phoneNumber: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(approvalStatusParam &&
      ['NONE', 'PENDING', 'APPROVED', 'REJECTED'].includes(approvalStatusParam)
        ? { organizerApprovalStatus: approvalStatusParam as OrganizerApprovalStatus }
        : {}),
    };

    const [users, total, pendingOrganizerCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: true,
          playerProfile: {
            include: { safetyProfile: true },
          },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { organizerApprovalStatus: OrganizerApprovalStatus.PENDING } }),
    ]);

    return ok({
      ...toPageResponse(users.map(toUserDto), page, size, total),
      pendingOrganizerCount,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

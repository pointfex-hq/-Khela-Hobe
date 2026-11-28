import { NextRequest } from 'next/server';
import { ApplicationStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toApplicationDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { page, size, skip, searchParams } = parsePagination(request.url, 12);
    const paginate = searchParams.has('page') || searchParams.has('size');
    const statusParam = searchParams.get('status')?.trim().toUpperCase();
    const matchId = searchParams.get('matchId')?.trim();

    const isAdmin = session.roles.includes('ADMIN');

    const where: Record<string, unknown> = isAdmin && matchId
      ? { matchId }
      : {
          match: {
            ...(isAdmin ? {} : { organizerId: session.userId }),
          },
          ...(matchId ? { matchId } : {}),
        };

    if (statusParam && statusParam !== 'ALL' && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusParam)) {
      where.status = statusParam as ApplicationStatus;
    }

    const [applications, total] = await Promise.all([
      prisma.matchApplication.findMany({
        where,
        ...(paginate ? { skip, take: size } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          match: { select: { title: true } },
          user: { select: { fullName: true, profileImageUrl: true } },
        },
      }),
      paginate ? prisma.matchApplication.count({ where }) : Promise.resolve(0),
    ]);

    const dtos = applications.map(toApplicationDto);
    return ok(paginate ? toPageResponse(dtos, page, size, total) : dtos);
  } catch (error) {
    return handleRouteError(error);
  }
}

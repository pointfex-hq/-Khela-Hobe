import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, parsePagination, toPageResponse } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toReportDto } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { page, size, skip } = parsePagination(request.url, 20);
    const where = { reporterId: session.userId };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { reporter: { select: { fullName: true } } },
      }),
      prisma.report.count({ where }),
    ]);

    return ok(toPageResponse(reports.map(toReportDto), page, size, total));
  } catch (error) {
    return handleRouteError(error);
  }
}

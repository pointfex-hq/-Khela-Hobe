import { NextRequest } from 'next/server';
import { Prisma, ReportStatus } from '@prisma/client';
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
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { page, size, skip, searchParams } = parsePagination(request.url, 20);
    const statusParam = searchParams.get('status')?.trim().toUpperCase();

    const where: Prisma.ReportWhereInput =
      statusParam && Object.values(ReportStatus).includes(statusParam as ReportStatus)
        ? { status: statusParam as ReportStatus }
        : {};

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

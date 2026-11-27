import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toReportDto } from '@/lib/mappers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;
    const report = await prisma.report.findUnique({
      where: { id },
      include: { reporter: { select: { fullName: true } } },
    });

    if (!report) {
      return fail('RESOURCE_NOT_FOUND', 'Report not found', 404);
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (report.reporterId !== session.userId && !isAdmin) {
      return fail('ACCESS_DENIED', 'Not authorized to view this report', 403);
    }

    return ok(toReportDto(report));
  } catch (error) {
    return handleRouteError(error);
  }
}

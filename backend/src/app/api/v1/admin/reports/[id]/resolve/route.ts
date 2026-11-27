import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ReportStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toReportDto } from '@/lib/mappers';

const resolveSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = resolveSchema.parse(body);

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return fail('RESOURCE_NOT_FOUND', 'Report not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const report = await tx.report.update({
        where: { id },
        data: {
          status:
            parsed.status === 'RESOLVED' ? ReportStatus.RESOLVED : ReportStatus.DISMISSED,
          resolvedBy: session.userId,
          resolvedAt: new Date(),
          resolutionNote: parsed.resolutionNote ?? null,
          rejectionReason:
            parsed.status === 'DISMISSED' ? parsed.resolutionNote ?? null : null,
        },
        include: { reporter: { select: { fullName: true } } },
      });

      await tx.moderationAction.create({
        data: {
          reporterId: session.userId,
          targetId: existing.targetId,
          action: parsed.status,
          reason: parsed.resolutionNote || `Report ${id} marked ${parsed.status}`,
        },
      });

      return report;
    });

    return ok(toReportDto(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ReportTopic, TargetType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok } from '@/lib/http';
import { verifySession } from '@/lib/auth';
import { toReportDto } from '@/lib/mappers';

const createReportSchema = z.object({
  targetType: z.enum(['USER', 'MATCH', 'VENUE', 'COMMENT', 'MESSAGE']).optional(),
  targetId: z.string().trim().min(1, 'targetId is required'),
  targetName: z.string().trim().max(200).optional(),
  topic: z
    .enum([
      'INCORRECT_LOCATION',
      'INAPPROPRIATE_CONTENT',
      'HATE_SPEECH',
      'SPAM',
      'HARASSMENT',
      'MISCELLANEOUS',
    ])
    .optional(),
  reason: z.string().trim().max(500).optional(),
  description: z.string().trim().max(2000).optional(),
  evidenceUrl: z.string().url().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required to submit a report', 401);
    }

    const body = await request.json();
    const parsed = createReportSchema.parse(body);

    const descriptionText = parsed.description || parsed.reason || '';
    if (descriptionText.length < 3) {
      return fail('VALIDATION_ERROR', 'Report reason or description is required', 422, [
        { field: 'description', message: 'Provide at least 3 characters describing the issue' },
      ]);
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.userId,
        targetType: (parsed.targetType as TargetType) ?? TargetType.MATCH,
        targetId: parsed.targetId,
        targetName: parsed.targetName ?? null,
        topic: (parsed.topic as ReportTopic) ?? ReportTopic.MISCELLANEOUS,
        reason: parsed.reason ?? parsed.description ?? null,
        description: descriptionText,
        evidenceUrl: parsed.evidenceUrl ?? null,
      },
      include: {
        reporter: { select: { fullName: true } },
      },
    });

    return ok(toReportDto(report), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

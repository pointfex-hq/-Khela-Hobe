import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifySession } from '@/lib/auth';
import { fail, handleRouteError, ok } from '@/lib/http';
import { createPresignedUploadUrl, isS3Configured } from '@/lib/s3';

const presignSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  folder: z.string().trim().max(50).optional(),
  fileName: z.string().trim().max(120).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!isS3Configured()) {
      return fail(
        'S3_NOT_CONFIGURED',
        'Image upload storage (Supabase Storage S3 / AWS S3) is not configured on the server yet.',
        503
      );
    }

    const body = await request.json();
    const parsed = presignSchema.parse(body);

    const result = await createPresignedUploadUrl({
      contentType: parsed.contentType,
      folder: parsed.folder,
      fileName: parsed.fileName,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

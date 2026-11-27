import { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';
import { fail, handleRouteError, ok } from '@/lib/http';
import { isS3Configured, uploadBufferToS3 } from '@/lib/s3';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required to upload files', 401);
    }

    if (!isS3Configured()) {
      return fail(
        'S3_NOT_CONFIGURED',
        'Image upload storage (Supabase Storage S3 / AWS S3) is not configured on the server yet.',
        503
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const folderEntry = formData.get('folder');
    const folder = typeof folderEntry === 'string' && folderEntry.trim() ? folderEntry.trim() : 'general';

    if (!fileEntry || typeof fileEntry === 'string') {
      return fail('BAD_REQUEST', 'Image file is required in "file" form field', 400);
    }

    const contentType = fileEntry.type || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      return fail(
        'VALIDATION_ERROR',
        'Unsupported file format. Allowed: JPEG, PNG, WebP, GIF.',
        422,
        [{ field: 'file', message: 'Unsupported image type' }]
      );
    }

    if (fileEntry.size > MAX_UPLOAD_BYTES) {
      return fail(
        'VALIDATION_ERROR',
        'Image must be 5 MB or smaller.',
        422,
        [{ field: 'file', message: 'File exceeds 5 MB limit' }]
      );
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBufferToS3({
      buffer,
      contentType,
      folder,
      originalName: fileEntry.name,
    });

    return ok(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

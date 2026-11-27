import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function nowEpoch(): number {
  return Date.now() / 1000;
}

export function toEpoch(value: Date | string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime() / 1000;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: nowEpoch(),
    },
    { status }
  );
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: Array<{ field: string; message: string }>
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      timestamp: nowEpoch(),
    },
    { status }
  );
}

export function parsePagination(requestUrl: string, defaultSize = 20) {
  const { searchParams } = new URL(requestUrl);
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0);
  const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || String(defaultSize), 10) || defaultSize));
  return { page, size, skip: page * size, searchParams };
}

export function toPageResponse<T>(
  content: T[],
  page: number,
  size: number,
  totalElements: number
) {
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    last: page + 1 >= totalPages,
  };
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    return fail('VALIDATION_ERROR', details[0]?.message || 'Validation failed', 422, details);
  }

  const prismaErr = error as { code?: string; message?: string };
  if (prismaErr?.code === 'P2002') {
    return fail('CONFLICT', 'A record with this value already exists', 409);
  }
  if (prismaErr?.code === 'P2025') {
    return fail('RESOURCE_NOT_FOUND', 'Requested record was not found', 404);
  }

  console.error('[API Error]', error);
  return fail('INTERNAL_ERROR', 'Unexpected server error', 500);
}

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';

function getS3Config() {
  const endpoint = (process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT || '').trim();
  const region = (process.env.S3_REGION || process.env.AWS_REGION || 'ap-southeast-1').trim();
  const bucket = (process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || '').trim();
  const accessKeyId = (process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    ''
  ).trim();
  const publicUrlBase = (process.env.S3_PUBLIC_URL || process.env.AWS_S3_PUBLIC_URL || '').trim();
  const forcePathStyleEnv = (
    process.env.S3_FORCE_PATH_STYLE ||
    process.env.AWS_S3_FORCE_PATH_STYLE ||
    ''
  )
    .trim()
    .toLowerCase();

  const forcePathStyle =
    forcePathStyleEnv === 'true' ||
    (forcePathStyleEnv !== 'false' && endpoint.includes('supabase.co'));

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicUrlBase,
    forcePathStyle,
  };
}

export function isS3Configured(): boolean {
  const { bucket, accessKeyId, secretAccessKey } = getS3Config();
  return Boolean(bucket && accessKeyId && secretAccessKey);
}

function createS3Client() {
  const { endpoint, region, accessKeyId, secretAccessKey, forcePathStyle } = getS3Config();
  return new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function buildPublicUrl(key: string): string {
  const { endpoint, region, bucket, publicUrlBase } = getS3Config();
  if (publicUrlBase) {
    return `${publicUrlBase.replace(/\/+$/, '')}/${key}`;
  }
  if (endpoint && endpoint.includes('supabase.co')) {
    const projectBase = endpoint
      .replace('.storage.supabase.co', '.supabase.co')
      .replace(/\/storage\/v1\/s3.*$/, '')
      .replace(/\/+$/, '');
    return `${projectBase}/storage/v1/object/public/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function sanitizeExt(fileName: string, contentType: string): string {
  const extFromName = fileName?.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (extFromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extFromName)) {
    return extFromName;
  }
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg';
}

export async function uploadBufferToS3(params: {
  buffer: Buffer;
  contentType: string;
  folder?: string;
  originalName?: string;
}) {
  const { bucket } = getS3Config();
  if (!isS3Configured()) {
    throw new Error(
      'S3 storage is not configured. Set S3_ACCESS_KEY_ID/AWS_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY/AWS_SECRET_ACCESS_KEY, and S3_BUCKET/AWS_S3_BUCKET in backend/.env.'
    );
  }

  const safeFolder = (params.folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '');
  const ext = sanitizeExt(params.originalName || '', params.contentType);
  const key = `${safeFolder}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;

  const client = createS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType,
    })
  );

  return {
    key,
    url: buildPublicUrl(key),
  };
}

export async function createPresignedUploadUrl(params: {
  contentType: string;
  folder?: string;
  fileName?: string;
}) {
  const { bucket } = getS3Config();
  if (!isS3Configured()) {
    throw new Error(
      'S3 storage is not configured. Set S3_ACCESS_KEY_ID/AWS_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY/AWS_SECRET_ACCESS_KEY, and S3_BUCKET/AWS_S3_BUCKET in backend/.env.'
    );
  }

  const safeFolder = (params.folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '');
  const ext = sanitizeExt(params.fileName || '', params.contentType);
  const key = `${safeFolder}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;

  const client = createS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  return {
    uploadUrl,
    key,
    publicUrl: buildPublicUrl(key),
  };
}

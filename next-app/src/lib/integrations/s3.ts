// VBridgeConnect — AWS S3 Integration
// architecture.md §3 & rules.md §6: File bytes never enter the database.
// Presigned URLs only (PUT for upload with 15m expiry, GET for download).

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

export function getS3Config() {
  return {
    region: process.env.AWS_REGION || 'ap-south-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'v-bridgecertificate',
  };
}

// S3 Client Singleton
let _client: S3Client | null = null;
export function getS3Client(): S3Client {
  if (!_client) {
    const { region } = getS3Config();
    _client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _client;
}

export const s3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    return (getS3Client() as any)[prop];
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit for certificates

/**
 * Generate a presigned S3 upload URL for certificates (FR-112).
 * Direct browser-to-S3 upload: raw bytes never hit the Next.js server.
 */
export async function getCertificateUploadUrl(params: {
  fileName: string;
  contentType: string;
  userId: string;
  fileSizeBytes?: number;
}) {
  const { fileName, contentType, userId, fileSizeBytes } = params;

  // 1. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(
      `Unsupported file type: ${contentType}. Allowed types: PDF, PNG, JPEG, WebP`
    );
  }

  // 2. Validate file size limit
  if (fileSizeBytes && fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File exceeds maximum limit of 10MB (got ${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB)`
    );
  }

  // 3. Construct unique, sanitized S3 key
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueId = crypto.randomUUID();
  const s3Key = `certificates/${userId}/${uniqueId}-${sanitizedName}`;

  // 4. Generate presigned PUT command
  const { bucketName, region } = getS3Config();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 900, // 15 minutes (rules.md §6)
  });

  const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

  return {
    uploadUrl,
    s3Key,
    publicUrl,
    expiresInSeconds: 900,
  };
}

/**
 * Generate a short-lived presigned GET URL for viewing/downloading certificates.
 */
export async function getCertificateDownloadUrl(
  s3Key: string,
  expiresInSeconds = 900
) {
  const { bucketName } = getS3Config();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
}

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

async function ensureUploadDir() {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ storedName: string; storagePath: string }> {
  const ext = path.extname(originalName);
  const storedName = `${randomUUID()}${ext}`;

  if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID) {
    // S3アップロード（本番環境）
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({ region: process.env.AWS_S3_REGION ?? "ap-northeast-1" });
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: storedName,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return { storedName, storagePath: `s3://${process.env.AWS_S3_BUCKET_NAME}/${storedName}` };
  }

  // ローカルストレージ（開発環境）
  await ensureUploadDir();
  const filePath = path.join(LOCAL_UPLOAD_DIR, storedName);
  await fs.writeFile(filePath, buffer);
  return { storedName, storagePath: filePath };
}

export async function getFileBuffer(storagePath: string): Promise<Buffer> {
  if (storagePath.startsWith("s3://")) {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({ region: process.env.AWS_S3_REGION ?? "ap-northeast-1" });
    const url = new URL(storagePath.replace("s3://", "https://"));
    const bucket = url.hostname;
    const key = url.pathname.slice(1);
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  return fs.readFile(storagePath);
}

export async function deleteFile(storagePath: string): Promise<void> {
  if (storagePath.startsWith("s3://")) {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({ region: process.env.AWS_S3_REGION ?? "ap-northeast-1" });
    const url = new URL(storagePath.replace("s3://", "https://"));
    await s3.send(
      new DeleteObjectCommand({ Bucket: url.hostname, Key: url.pathname.slice(1) })
    );
    return;
  }
  await fs.unlink(storagePath).catch(() => {});
}

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB ?? "20") * 1024 * 1024;

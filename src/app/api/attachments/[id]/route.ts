import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFileBuffer, deleteFile } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id, isDeleted: false } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await getFileBuffer(attachment.storagePath);
  const safeName = encodeURIComponent(attachment.originalName.replace(/"/g, ""));

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
      "Content-Length": buffer.length.toString(),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id, isDeleted: false } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isUploader = attachment.uploadedBy === session.user.id;
  if (!isAdmin && !isUploader) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.attachment.update({ where: { id }, data: { isDeleted: true } });
  await deleteFile(attachment.storagePath);

  return NextResponse.json({ success: true });
}

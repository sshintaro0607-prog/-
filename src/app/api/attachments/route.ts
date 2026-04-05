import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const handoverId = formData.get("handoverId") as string | null;

  if (!file || !handoverId) {
    return NextResponse.json({ error: "file and handoverId are required" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const handover = await prisma.handoverRecord.findUnique({ where: { id: handoverId, isDeleted: false } });
  if (!handover) return NextResponse.json({ error: "Handover not found" }, { status: 404 });

  const existingCount = await prisma.attachment.count({
    where: { handoverId, isDeleted: false },
  });
  if (existingCount >= 10) {
    return NextResponse.json({ error: "Maximum 10 files per handover" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._\-\u3000-\u9fff\u30a0-\u30ff\u3040-\u309f]/g, "_");
  const { storedName, storagePath } = await saveFile(buffer, sanitizedName, file.type);

  const attachment = await prisma.attachment.create({
    data: {
      handoverId,
      uploadedBy: session.user.id,
      originalName: sanitizedName,
      storedName,
      storagePath,
      mimeType: file.type,
      fileSize: BigInt(file.size),
    },
  });

  return NextResponse.json({ ...attachment, fileSize: attachment.fileSize.toString() }, { status: 201 });
}

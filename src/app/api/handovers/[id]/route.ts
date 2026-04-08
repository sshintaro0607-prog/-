import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  subject: z.enum(["JAPANESE", "MATH", "ENGLISH", "SCIENCE", "SOCIAL", "OTHER"]).optional(),
  lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  todaysContent: z.string().optional(),
  achieved: z.string().optional(),
  notAchieved: z.string().optional(),
  improvement: z.string().optional(),
  checkTestResult: z.string().optional(),
  nextCheckTest: z.string().optional(),
  nextPlan: z.string().optional(),
  specialNotes: z.string().optional(),
  isDraft: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await prisma.handoverRecord.findUnique({
    where: { id, isDeleted: false },
    include: {
      student: {
        select: {
          id: true, name: true, grade: true,
          standingNotes: { orderBy: { sortOrder: "asc" } },
        },
      },
      author: { select: { id: true, name: true } },
      lastUpdater: { select: { id: true, name: true } },
      attachments: {
        where: { isDeleted: false },
        select: { id: true, originalName: true, mimeType: true, fileSize: true, createdAt: true, uploadedBy: true },
      },
    },
  });

  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await prisma.handoverRecord.findUnique({ where: { id, isDeleted: false } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = record.authorId === session.user.id;
  if (!isAdmin && !isAuthor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { lessonDate, ...rest } = parsed.data;
  const updated = await prisma.handoverRecord.update({
    where: { id },
    data: {
      ...rest,
      ...(lessonDate ? { lessonDate: new Date(lessonDate) } : {}),
      lastUpdatedBy: session.user.id,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const record = await prisma.handoverRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.handoverRecord.update({ where: { id }, data: { isDeleted: true } });
  return NextResponse.json({ success: true });
}

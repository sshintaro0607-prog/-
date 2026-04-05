import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const standingNoteItemSchema = z.object({
  id: z.string().optional(), // 既存の場合
  content: z.string().min(1, "内容は必須です"),
  sortOrder: z.number().int().default(0),
});

const putStandingNotesSchema = z.object({
  notes: z.array(standingNoteItemSchema),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !student.isActive) {
    return NextResponse.json({ error: "生徒が見つかりません" }, { status: 404 });
  }

  const notes = await prisma.studentStandingNote.findMany({
    where: { studentId: id },
    orderBy: { sortOrder: "asc" },
    include: {
      editor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(notes);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !student.isActive) {
    return NextResponse.json({ error: "生徒が見つかりません" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = putStandingNotesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { notes } = parsed.data;

  // Replace all standing notes for this student in a transaction
  const result = await prisma.$transaction(async (tx) => {
    await tx.studentStandingNote.deleteMany({ where: { studentId: id } });

    if (notes.length > 0) {
      await tx.studentStandingNote.createMany({
        data: notes.map((note, index) => ({
          studentId: id,
          content: note.content,
          sortOrder: note.sortOrder ?? index,
          updatedBy: session.user.id,
        })),
      });
    }

    return tx.studentStandingNote.findMany({
      where: { studentId: id },
      orderBy: { sortOrder: "asc" },
      include: {
        editor: { select: { id: true, name: true } },
      },
    });
  });

  return NextResponse.json(result);
}

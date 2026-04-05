import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GRADES } from "@/types/index";

const updateStudentSchema = z.object({
  studentNumber: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  nameKana: z.string().min(1).max(100).optional(),
  grade: z.enum(GRADES).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      standingNotes: {
        orderBy: { sortOrder: "asc" },
        include: {
          editor: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!student || !student.isActive) {
    return NextResponse.json({ error: "生徒が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.studentNumber && parsed.data.studentNumber !== student.studentNumber) {
    const existing = await prisma.student.findUnique({
      where: { studentNumber: parsed.data.studentNumber },
    });
    if (existing) {
      return NextResponse.json(
        { error: "この生徒番号はすでに使用されています" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.student.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !student.isActive) {
    return NextResponse.json({ error: "生徒が見つかりません" }, { status: 404 });
  }

  await prisma.student.update({
    where: { id },
    data: { isActive: false },
  });

  return new NextResponse(null, { status: 204 });
}

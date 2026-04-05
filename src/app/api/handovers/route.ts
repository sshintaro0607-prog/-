import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  studentId: z.string().uuid(),
  subject: z.enum(["JAPANESE", "MATH", "ENGLISH", "SCIENCE", "SOCIAL", "OTHER"]),
  lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  todaysContent: z.string().optional(),
  achieved: z.string().optional(),
  notAchieved: z.string().optional(),
  improvement: z.string().optional(),
  specialNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const studentId = sp.get("studentId") ?? undefined;
  const subject = sp.get("subject") ?? undefined;
  const authorId = sp.get("authorId") ?? undefined;
  const from = sp.get("from") ?? undefined;
  const to = sp.get("to") ?? undefined;
  const q = sp.get("q") ?? undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const pageSize = 20;

  const where = {
    isDeleted: false,
    ...(studentId ? { studentId } : {}),
    ...(subject ? { subject: subject as never } : {}),
    ...(authorId ? { authorId } : {}),
    ...(from || to
      ? {
          lessonDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { todaysContent: { contains: q, mode: "insensitive" as const } },
            { achieved: { contains: q, mode: "insensitive" as const } },
            { notAchieved: { contains: q, mode: "insensitive" as const } },
            { improvement: { contains: q, mode: "insensitive" as const } },
            { specialNotes: { contains: q, mode: "insensitive" as const } },
            { student: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.handoverRecord.findMany({
      where,
      orderBy: { lessonDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        student: { select: { id: true, name: true, grade: true } },
        author: { select: { id: true, name: true } },
        attachments: { where: { isDeleted: false }, select: { id: true } },
      },
    }),
    prisma.handoverRecord.count({ where }),
  ]);

  return NextResponse.json({ records, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { studentId, subject, lessonDate, ...rest } = parsed.data;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || !student.isActive) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const record = await prisma.handoverRecord.create({
    data: {
      studentId,
      authorId: session.user.id,
      subject,
      lessonDate: new Date(lessonDate),
      ...rest,
    },
  });

  return NextResponse.json(record, { status: 201 });
}

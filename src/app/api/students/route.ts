import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GRADES } from "@/types/index";

const createStudentSchema = z.object({
  studentNumber: z.string().min(1, "生徒番号は必須です").max(20),
  name: z.string().min(1, "氏名は必須です").max(100),
  nameKana: z.string().min(1, "氏名かなは必須です").max(100),
  grade: z.enum(GRADES, { error: "学年が不正です" }),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";
  const grade = searchParams.get("grade") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const sort = searchParams.get("sort") ?? "kana"; // 'kana' | 'number'
  const pageSize = 20;

  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { studentNumber: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            { nameKana: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(grade ? { grade } : {}),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: sort === "number" ? { studentNumber: "asc" } : { nameKana: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({
    students,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { studentNumber, name, nameKana, grade } = parsed.data;

  const existing = await prisma.student.findUnique({ where: { studentNumber } });
  if (existing) {
    return NextResponse.json(
      { error: "この生徒番号はすでに使用されています" },
      { status: 409 }
    );
  }

  const student = await prisma.student.create({
    data: { studentNumber, name, nameKana, grade },
  });

  return NextResponse.json(student, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateStudentReport, generateOverallReport } from "@/lib/claude";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["STUDENT", "OVERALL"]),
  studentId: z.string().uuid().optional(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, studentId, year, month } = parsed.data;

  if (type === "STUDENT" && !studentId) {
    return NextResponse.json({ error: "studentId required for STUDENT type" }, { status: 400 });
  }

  const content =
    type === "STUDENT"
      ? await generateStudentReport(studentId!, year, month)
      : await generateOverallReport(year, month);

  const resolvedStudentId = type === "OVERALL" ? null : studentId!;
  const report = await prisma.aiReport.upsert({
    where: {
      studentId_targetYear_targetMonth: {
        studentId: resolvedStudentId as string,
        targetYear: year,
        targetMonth: month,
      },
    },
    create: {
      studentId: resolvedStudentId,
      reportType: type,
      targetYear: year,
      targetMonth: month,
      content,
      generatedBy: session.user.id,
      modelUsed: "claude-sonnet-4-5",
    },
    update: {
      content,
      generatedBy: session.user.id,
      modelUsed: "claude-sonnet-4-5",
    },
  });

  return NextResponse.json(report, { status: 201 });
}

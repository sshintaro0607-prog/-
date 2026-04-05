import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await prisma.aiReport.findMany({
    orderBy: [{ targetYear: "desc" }, { targetMonth: "desc" }],
    include: {
      student: { select: { id: true, name: true, grade: true } },
      generator: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(reports);
}

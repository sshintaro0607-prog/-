import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import HandoverForm from "@/components/handover/HandoverForm";
import type { Subject } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export default async function EditHandoverPage({ params }: Params) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const record = await prisma.handoverRecord.findUnique({
    where: { id, isDeleted: false },
    include: { student: { select: { id: true, name: true, grade: true } } },
  });

  if (!record) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = record.authorId === session.user.id;
  if (!isAdmin && !isAuthor) redirect(`/handovers/${id}`);

  const students = await prisma.student.findMany({
    where: { isActive: true },
    select: { id: true, name: true, grade: true },
    orderBy: { nameKana: "asc" },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/handovers/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">← 引継書詳細</Link>
        <h1 className="text-2xl font-bold text-gray-900">引継書編集</h1>
      </div>
      <HandoverForm
        students={students}
        defaultValues={{
          id,
          studentId: record.studentId,
          subject: record.subject as Subject,
          lessonDate: record.lessonDate.toISOString().split("T")[0],
          todaysContent: record.todaysContent ?? "",
          achieved: record.achieved ?? "",
          notAchieved: record.notAchieved ?? "",
          improvement: record.improvement ?? "",
          specialNotes: record.specialNotes ?? "",
        }}
      />
    </div>
  );
}

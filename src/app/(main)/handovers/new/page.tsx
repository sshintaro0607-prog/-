import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import HandoverForm from "@/components/handover/HandoverForm";

export default async function NewHandoverPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const students = await prisma.student.findMany({
    where: { isActive: true },
    select: { id: true, name: true, grade: true },
    orderBy: { nameKana: "asc" },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/handovers" className="text-gray-400 hover:text-gray-600 text-sm">← 引継書一覧</Link>
        <h1 className="text-2xl font-bold text-gray-900">引継書作成</h1>
      </div>
      <HandoverForm students={students} defaultStudentId={sp.studentId} />
    </div>
  );
}

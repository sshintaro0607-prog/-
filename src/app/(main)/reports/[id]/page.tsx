import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

type Params = { params: Promise<{ id: string }> };

export default async function ReportDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const report = await prisma.aiReport.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, grade: true } },
      generator: { select: { name: true } },
    },
  });

  if (!report) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/reports" className="text-gray-400 hover:text-gray-600 text-sm">← AIレポート一覧</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          {report.targetYear}年{report.targetMonth}月 AIレポート
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {report.student ? `${report.student.name}（${report.student.grade}）` : "塾全体"} ／ 生成日: {report.createdAt.toLocaleDateString("ja-JP")}
          {report.generator && ` ／ 生成者: ${report.generator.name}`}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
            {report.content}
          </pre>
        </div>
      </div>
    </div>
  );
}

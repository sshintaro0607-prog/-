import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const reports = await prisma.aiReport.findMany({
    orderBy: [{ targetYear: "desc" }, { targetMonth: "desc" }],
    include: {
      student: { select: { id: true, name: true, grade: true } },
    },
  });

  const students = isAdmin
    ? await prisma.student.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { nameKana: "asc" } })
    : [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AIレポート</h1>
        {isAdmin && (
          <Link href="/reports/generate" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
            レポートを生成
          </Link>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>AIレポートはまだありません</p>
          {isAdmin && <p className="text-sm mt-2">「レポートを生成」から手動生成できます</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {r.targetYear}年{r.targetMonth}月
                  {r.student ? ` — ${r.student.name}（${r.student.grade}）` : " — 塾全体"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">生成日: {r.createdAt.toLocaleDateString("ja-JP")}</p>
              </div>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {r.reportType === "OVERALL" ? "全体" : "個別"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SUBJECT_LABELS } from "@/types/index";
import type { Subject } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [recentHandovers, recentReports, totalStudents, totalHandovers] = await Promise.all([
    prisma.handoverRecord.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        student: { select: { id: true, name: true } },
        author: { select: { name: true } },
      },
    }),
    prisma.aiReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { student: { select: { name: true } } },
    }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.handoverRecord.count({ where: { isDeleted: false } }),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">登録生徒数</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">引継書件数</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalHandovers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">AIレポート件数</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{recentReports.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最新引継書 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">最新の引継書</h2>
            <Link href="/handovers" className="text-sm text-blue-600 hover:underline">すべて見る</Link>
          </div>
          {recentHandovers.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">引継書はまだありません</p>
          ) : (
            <div className="space-y-2">
              {recentHandovers.map((h) => (
                <Link
                  key={h.id}
                  href={`/handovers/${h.id}`}
                  className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{h.student.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.lessonDate.toLocaleDateString("ja-JP")} ／ {SUBJECT_LABELS[h.subject as Subject]}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{h.author.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 最新AIレポート */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">最新のAIレポート</h2>
            <Link href="/reports" className="text-sm text-blue-600 hover:underline">すべて見る</Link>
          </div>
          {recentReports.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">AIレポートはまだありません</p>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r) => (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.targetYear}年{r.targetMonth}月
                      {r.student ? ` — ${r.student.name}` : " — 塾全体"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.createdAt.toLocaleDateString("ja-JP")}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {r.reportType === "OVERALL" ? "全体" : "個別"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

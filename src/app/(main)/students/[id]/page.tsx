import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SUBJECT_LABELS } from "@/types/index";
import StandingNotesEditor from "@/components/student/StandingNotesEditor";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function StudentDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { tab = "info" } = await searchParams;
  const isAdmin = session.user.role === "ADMIN";

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      standingNotes: {
        orderBy: { sortOrder: "asc" },
        include: { editor: { select: { id: true, name: true } } },
      },
    },
  });

  if (!student || !student.isActive) notFound();

  const handovers =
    tab === "handovers"
      ? await prisma.handoverRecord.findMany({
          where: { studentId: id, isDeleted: false },
          orderBy: { lessonDate: "desc" },
          take: 20,
          include: {
            author: { select: { id: true, name: true } },
          },
        })
      : [];

  const aiReports =
    tab === "reports"
      ? await prisma.aiReport.findMany({
          where: { studentId: id },
          orderBy: [{ targetYear: "desc" }, { targetMonth: "desc" }],
        })
      : [];

  const tabs = [
    { key: "info", label: "基本情報" },
    { key: "notes", label: "固定引継事項" },
    { key: "handovers", label: "引継書一覧" },
    { key: "reports", label: "AIレポート" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/students" className="text-gray-400 hover:text-gray-600 text-sm">
            ← 生徒一覧
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {student.name}
            <span className="ml-2 text-base font-normal text-gray-500">{student.nameKana}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            生徒番号: {student.studentNumber} ／ {student.grade}
          </p>
        </div>
        {isAdmin && (
          <Link
            href={`/students/${id}/edit`}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            編集
          </Link>
        )}
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(({ key, label }) => (
            <Link
              key={key}
              href={`/students/${id}?tab=${key}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      {tab === "info" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">生徒番号</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.studentNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">学年</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.grade}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">氏名</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">氏名かな</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.nameKana}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">登録日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {student.createdAt.toLocaleDateString("ja-JP")}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {tab === "notes" && (
        <StandingNotesEditor
          studentId={id}
          initialNotes={student.standingNotes.map((n) => ({
            id: n.id,
            content: n.content,
            sortOrder: n.sortOrder,
            updatedAt: n.updatedAt.toISOString(),
            editor: n.editor,
          }))}
        />
      )}

      {tab === "handovers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{handovers.length} 件</p>
            <Link
              href={`/handovers/new?studentId=${id}`}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              引継書を作成
            </Link>
          </div>
          {handovers.length === 0 ? (
            <p className="text-center py-12 text-gray-500">引継書はまだありません</p>
          ) : (
            handovers.map((h) => (
              <Link
                key={h.id}
                href={`/handovers/${h.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {h.lessonDate.toLocaleDateString("ja-JP")}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {SUBJECT_LABELS[h.subject]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{h.author.name}</span>
                </div>
                {h.todaysContent && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{h.todaysContent}</p>
                )}
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {aiReports.length === 0 ? (
            <p className="text-center py-12 text-gray-500">AIレポートはまだありません</p>
          ) : (
            aiReports.map((r) => (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">
                  {r.targetYear}年{r.targetMonth}月 AIレポート
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  生成日: {r.createdAt.toLocaleDateString("ja-JP")}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SUBJECT_LABELS } from "@/types/index";
import StandingNotesDisplay from "@/components/handover/StandingNotesDisplay";

type Params = { params: Promise<{ id: string }> };

export default async function HandoverDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const record = await prisma.handoverRecord.findUnique({
    where: { id, isDeleted: false },
    include: {
      student: { select: { id: true, name: true, grade: true, standingNotes: { orderBy: { sortOrder: "asc" } } } },
      author: { select: { id: true, name: true } },
      lastUpdater: { select: { id: true, name: true } },
      attachments: { where: { isDeleted: false }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!record) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = record.authorId === session.user.id;
  const canEdit = isAdmin || isAuthor;

  const fields = [
    { label: "今日の内容", value: record.todaysContent },
    { label: "できたこと", value: record.achieved },
    { label: "できなかったこと", value: record.notAchieved },
    { label: "改善策", value: record.improvement },
    { label: "今回の確認テスト結果", value: record.checkTestResult },
    { label: "次回確認テスト", value: record.nextCheckTest },
    { label: "次回予定", value: record.nextPlan },
    { label: "特記事項", value: record.specialNotes },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/handovers" className="text-gray-400 hover:text-gray-600 text-sm">← 引継書一覧</Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {record.student.name} の引継書
            </h1>
            {record.isDraft && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">下書き</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {record.lessonDate.toLocaleDateString("ja-JP")} ／ {SUBJECT_LABELS[record.subject]}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/handovers/${id}/edit`} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              編集
            </Link>
          )}
          {isAdmin && (
            <form action={async () => {
              "use server";
              await prisma.handoverRecord.update({ where: { id }, data: { isDeleted: true } });
              redirect("/handovers");
            }}>
              <button type="submit" className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors">
                削除
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 固定引継事項 */}
      <StandingNotesDisplay notes={record.student.standingNotes} />

      {/* 記録フィールド */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5 mb-4">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
            <dd className="text-sm text-gray-900 whitespace-pre-wrap">
              {value || <span className="text-gray-300">—</span>}
            </dd>
          </div>
        ))}
      </div>

      {/* 添付ファイル */}
      {record.attachments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">添付ファイル</h3>
          <ul className="space-y-2">
            {record.attachments.map((a) => (
              <li key={a.id}>
                <a href={`/api/attachments/${a.id}`} download className="text-sm text-blue-600 hover:underline">
                  📎 {a.originalName}
                </a>
                <span className="text-xs text-gray-400 ml-2">
                  {(Number(a.fileSize) / 1024).toFixed(0)} KB
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* メタ情報 */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>作成者: {record.author.name} / {record.createdAt.toLocaleString("ja-JP")}</p>
        {record.lastUpdater && (
          <p>最終更新: {record.lastUpdater.name} / {record.updatedAt.toLocaleString("ja-JP")}</p>
        )}
      </div>
    </div>
  );
}

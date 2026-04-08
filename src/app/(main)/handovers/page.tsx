import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import HandoverCard from "@/components/handover/HandoverCard";
import { SUBJECT_LABELS } from "@/types/index";
import type { Subject } from "@/generated/prisma/client";

type SearchParams = {
  studentId?: string; subject?: string; authorId?: string;
  from?: string; to?: string; q?: string; page?: string;
};

export default async function HandoversPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const pageSize = 20;

  const where = {
    isDeleted: false,
    isDraft: false,
    ...(sp.studentId ? { studentId: sp.studentId } : {}),
    ...(sp.subject ? { subject: sp.subject as Subject } : {}),
    ...(sp.authorId ? { authorId: sp.authorId } : {}),
    ...(sp.from || sp.to ? { lessonDate: { ...(sp.from ? { gte: new Date(sp.from) } : {}), ...(sp.to ? { lte: new Date(sp.to) } : {}) } } : {}),
    ...(sp.q ? {
      OR: [
        { todaysContent: { contains: sp.q, mode: "insensitive" as const } },
        { achieved: { contains: sp.q, mode: "insensitive" as const } },
        { notAchieved: { contains: sp.q, mode: "insensitive" as const } },
        { specialNotes: { contains: sp.q, mode: "insensitive" as const } },
        { student: { name: { contains: sp.q, mode: "insensitive" as const } } },
      ],
    } : {}),
  };

  const [records, total, students, teachers, myDrafts] = await Promise.all([
    prisma.handoverRecord.findMany({
      where, orderBy: { lessonDate: "desc" },
      skip: (page - 1) * pageSize, take: pageSize,
      include: {
        student: { select: { id: true, name: true, grade: true } },
        author: { select: { id: true, name: true } },
        attachments: { where: { isDeleted: false }, select: { id: true } },
      },
    }),
    prisma.handoverRecord.count({ where }),
    prisma.student.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { nameKana: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.handoverRecord.findMany({
      where: { isDeleted: false, isDraft: true, authorId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        student: { select: { id: true, name: true, grade: true } },
        author: { select: { id: true, name: true } },
        attachments: { where: { isDeleted: false }, select: { id: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">引継書一覧</h1>
        <Link href="/handovers/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
          新規作成
        </Link>
      </div>

      {/* フィルタ */}
      <form method="GET" action="/handovers" className="mb-6 bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3">
        <input type="text" name="q" defaultValue={sp.q} placeholder="キーワード検索" className="flex-1 min-w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select name="studentId" defaultValue={sp.studentId} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">すべての生徒</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="subject" defaultValue={sp.subject} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">すべての科目</option>
          {(Object.entries(SUBJECT_LABELS) as [Subject, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="authorId" defaultValue={sp.authorId} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">すべての講師</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <span className="self-center text-gray-400 text-sm">〜</span>
        <input type="date" name="to" defaultValue={sp.to} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200">検索</button>
        <Link href="/handovers" className="px-4 py-2 text-gray-400 text-sm hover:text-gray-600">クリア</Link>
      </form>

      {/* 下書きセクション */}
      {myDrafts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full" />
            下書き（{myDrafts.length}件）
          </h2>
          <div className="space-y-2">
            {myDrafts.map((r) => (
              <div key={r.id} className="relative">
                <span className="absolute top-3 right-3 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full z-10">下書き</span>
                <HandoverCard key={r.id} id={r.id} lessonDate={r.lessonDate.toISOString()} subject={r.subject} student={r.student} author={r.author} todaysContent={r.todaysContent} attachmentCount={r.attachments.length} />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">{total} 件</p>

      {records.length === 0 ? (
        <div className="text-center py-16 text-gray-500">引継書が見つかりませんでした</div>
      ) : (
        <div className="space-y-3 mb-6">
          {records.map((r) => (
            <HandoverCard key={r.id} id={r.id} lessonDate={r.lessonDate.toISOString()} subject={r.subject} student={r.student} author={r.author} todaysContent={r.todaysContent} attachmentCount={r.attachments.length} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && <Link href={`/handovers?${new URLSearchParams({ ...sp, page: String(page - 1) })}`} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">前へ</Link>}
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`/handovers?${new URLSearchParams({ ...sp, page: String(page + 1) })}`} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">次へ</Link>}
        </div>
      )}
    </div>
  );
}

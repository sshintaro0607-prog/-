import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import StudentCard from "@/components/student/StudentCard";
import { GRADES } from "@/types/index";

type SearchParams = {
  search?: string;
  grade?: string;
  page?: string;
  sort?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function StudentsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const search = sp.search ?? "";
  const grade = sp.grade ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const sort = sp.sort ?? "kana";
  const pageSize = 20;

  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { studentNumber: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            { nameKana: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(grade ? { grade } : {}),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: sort === "number" ? { studentNumber: "asc" } : { nameKana: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const isAdmin = session.user.role === "ADMIN";

  function buildQuery(overrides: SearchParams) {
    const params = new URLSearchParams();
    const merged = { search, grade, page: String(page), sort, ...overrides };
    if (merged.search) params.set("search", merged.search);
    if (merged.grade) params.set("grade", merged.grade);
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    if (merged.sort && merged.sort !== "kana") params.set("sort", merged.sort);
    const qs = params.toString();
    return qs ? `?${qs}` : "/students";
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">生徒一覧</h1>
        {isAdmin && (
          <Link
            href="/students/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            生徒を登録
          </Link>
        )}
      </div>

      {/* 検索・フィルタ */}
      <form method="GET" action="/students" className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="生徒番号・氏名で検索"
          className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="grade"
          defaultValue={grade}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">すべての学年</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="kana">氏名かな順</option>
          <option value="number">生徒番号順</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          検索
        </button>
        {(search || grade) && (
          <Link
            href="/students"
            className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            クリア
          </Link>
        )}
      </form>

      {/* 件数表示 */}
      <p className="text-sm text-gray-500 mb-4">
        {total} 件中 {(page - 1) * pageSize + 1}〜{Math.min(page * pageSize, total)} 件表示
      </p>

      {/* 生徒一覧 */}
      {students.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">生徒が見つかりませんでした</p>
          {(search || grade) && (
            <p className="text-sm mt-2">検索条件を変更してお試しください</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={buildQuery({ page: String(page - 1) })}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              前へ
            </Link>
          )}
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildQuery({ page: String(page + 1) })}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              次へ
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ToggleActiveButton from "./_components/ToggleActiveButton";

export default async function UsersAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: { id: true, name: true, birthDate: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">講師管理</h1>
        <Link href="/admin/users/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
          講師を追加
        </Link>
      </div>

      {teachers.length === 0 ? (
        <p className="text-center py-16 text-gray-500">講師が登録されていません</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">氏名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">生年月日</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">登録日</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状態</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map((t) => (
                <tr key={t.id} className={!t.isActive ? "bg-gray-50 opacity-60" : ""}>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.birthDate ? new Date(t.birthDate).toLocaleDateString("ja-JP") : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.createdAt.toLocaleDateString("ja-JP")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ToggleActiveButton id={t.id} isActive={t.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

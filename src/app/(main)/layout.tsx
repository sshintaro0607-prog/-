import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@/generated/prisma/client";

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      {label}
    </Link>
  );
}

function NavSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {title && (
        <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = (session.user.role as Role) === "ADMIN";
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "授業引継書システム";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドバー */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* ロゴ・塾名 */}
        <div className="px-4 py-4 border-b border-gray-200">
          <span className="text-base font-bold text-gray-900 leading-tight line-clamp-2">
            {appName}
          </span>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <NavSection>
            <NavItem href="/dashboard" label="ダッシュボード" />
          </NavSection>

          <NavSection title="引継書">
            <NavItem href="/handovers" label="一覧" />
            <NavItem href="/handovers/new" label="新規作成" />
          </NavSection>

          <NavSection>
            <NavItem href="/students" label="生徒一覧" />
          </NavSection>

          <NavSection>
            <NavItem href="/reports" label="AIレポート" />
          </NavSection>

          {isAdmin && (
            <NavSection title="管理">
              <NavItem href="/admin/users" label="講師管理" />
              <NavItem href="/admin/settings" label="システム設定" />
            </NavSection>
          )}
        </nav>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ヘッダー */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.user.name}
              {isAdmin && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  室長
                </span>
              )}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ログアウト
              </button>
            </form>
          </div>
        </header>

        {/* ページコンテンツ */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
